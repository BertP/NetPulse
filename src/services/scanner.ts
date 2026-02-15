
import ping from 'ping';
import { exec } from 'child_process';
import util from 'util';
import os from 'os';

import bonjour from 'bonjour-service';

const execAsync = util.promisify(exec);

export interface ScannedDevice {
    mac: string;
    ip: string;
    hostname?: string;
    services?: ScannedService[];
}

export interface ScannedService {
    name: string;
    type: string;
    protocol: string;
    port: number;
    txt: Record<string, any>;
}

export class NetworkScanner {
    // Helper to get local IP and Subnet
    // For now, assuming standard /24 C class network based on interface
    // But scan range can be passed.

    async scanSubnet(subnetConfig: string): Promise<ScannedDevice[]> {
        // subnetConfig e.g., '192.168.1, 192.168.2' OR '192.168.1-10'
        const rawTokens = subnetConfig.split(',').map(s => s.trim()).filter(s => s.length > 0);
        const bases: string[] = [];

        for (const token of rawTokens) {
            if (token.includes('-')) {
                // Range support: 192.168.1-10
                const parts = token.split('.');
                const lastPart = parts.pop() || '';
                const base = parts.join('.');
                const [start, end] = lastPart.split('-').map(Number);

                if (!isNaN(start) && !isNaN(end)) {
                    for (let i = start; i <= end; i++) {
                        bases.push(`${base}.${i}`);
                    }
                } else {
                    bases.push(token); // Fallback
                }
            } else {
                bases.push(token);
            }
        }

        const devices: ScannedDevice[] = [];
        const seenIps = new Set<string>();

        // 1. mDNS Discovery (Background - wait 5 seconds)
        const mdnsDevices: (ScannedDevice & { services: ScannedService[] })[] = [];
        const bj = new bonjour();
        const browser = bj.find(null, (service) => {
            if (service.referer && service.referer.address) {
                const ip = service.referer.address;
                const hostname = service.host || service.name;

                let dev = mdnsDevices.find(d => d.ip === ip);
                if (!dev) {
                    dev = { ip, mac: 'unknown', hostname, services: [] };
                    mdnsDevices.push(dev);
                }

                dev.services.push({
                    name: service.name,
                    type: service.type,
                    protocol: service.protocol,
                    port: service.port,
                    txt: service.txt || {}
                });
            }
        });

        console.log('🔍 mDNS: Starting discovery (5s)...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        browser.stop();
        bj.destroy();
        console.log(`🔍 mDNS: Found ${mdnsDevices.length} devices with services via mDNS`);

        for (const subnetBase of bases) {
            console.log(`📡 Scanning subnet ${subnetBase}.0/24...`);

            // Try NMAP first (Fast and reliable)
            let nmapSuccess = false;
            try {
                // -sn: Ping Scan - disable port scan
                // -PR: ARP scan (very fast on local network)
                const { stdout } = await execAsync(`nmap -sn -PR ${subnetBase}.0/24`);
                const lines = stdout.split('\n');
                let currentIp = '';

                for (const line of lines) {
                    const ipMatch = line.match(/Nmap scan report for ([^ ]+)/);
                    if (ipMatch) {
                        // Extract IP from "Nmap scan report for 192.168.1.1" or "Nmap scan report for my-host (192.168.1.1)"
                        const raw = ipMatch[1];
                        if (raw.includes('(')) {
                            currentIp = raw.match(/\(([^)]+)\)/)?.[1] || '';
                        } else {
                            currentIp = raw;
                        }
                    }

                    const macMatch = line.match(/MAC Address: ([0-9a-fA-F:]{17})/);
                    if (macMatch && currentIp) {
                        const mac = macMatch[1].toLowerCase();
                        if (!seenIps.has(currentIp)) {
                            devices.push({ ip: currentIp, mac });
                            seenIps.add(currentIp);
                        }
                        currentIp = '';
                    }
                }
                nmapSuccess = true;
                console.log(`✅ Nmap: Subnet ${subnetBase} finished`);
            } catch (e) {
                console.log(`⚠️ Nmap failed for ${subnetBase}, falling back to manual ping/arp...`);
            }

            if (!nmapSuccess) {
                // 2. Fallback: Batch Ping (Active Reachability)
                const BATCH_SIZE = 32;
                for (let i = 1; i < 255; i += BATCH_SIZE) {
                    const batch = [];
                    for (let j = 0; j < BATCH_SIZE && (i + j) < 255; j++) {
                        const ip = `${subnetBase}.${i + j}`;
                        batch.push(ping.promise.probe(ip, { timeout: 1 }));
                    }
                    await Promise.all(batch);
                }
            }
        }

        // 3. Read ARP Table (Layer 2 Discovery - mandatory for non-nmap or partially successful scans)
        try {
            const { stdout } = await execAsync('arp -a');
            const lines = stdout.split(os.EOL);

            for (const line of lines) {
                const ipMatch = line.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/);
                const macMatch = line.match(/([0-9a-fA-F]{2}[:-]){5}([0-9a-fA-F]{2})/);

                if (ipMatch && macMatch) {
                    const ip = ipMatch[0];
                    let mac = macMatch[0].replace(/-/g, ':').toLowerCase();

                    if (!seenIps.has(ip)) {
                        const isTarget = bases.some(base => ip.startsWith(base + '.'));
                        if (isTarget) {
                            devices.push({ ip, mac });
                            seenIps.add(ip);
                        }
                    }
                }
            }
        } catch (e) {
            console.error('❌ ARP Scan failed:', e);
        }

        // Merge mDNS data into found devices
        for (const md of mdnsDevices) {
            const existing = devices.find(d => d.ip === md.ip);
            if (existing) {
                if (md.hostname && !existing.hostname) {
                    existing.hostname = md.hostname.replace(/\.local\.?$/, '');
                }
                existing.services = md.services;
            } else {
                // If device wasn't found via ARP/Nmap but exists in mDNS
                // We add it anyway even if MAC is unknown (for service visibility)
                devices.push(md);
            }
        }

        return devices;
    }
}
