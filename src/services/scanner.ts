
import ping from 'ping';
import { exec } from 'child_process';
import util from 'util';
import os from 'os';

const execAsync = util.promisify(exec);

export interface ScannedDevice {
    mac: string;
    ip: string;
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

        for (const subnetBase of bases) {
            console.log(`📡 Scanning subnet ${subnetBase}.0/24...`);

            // 1. Batch Ping (Active Reachability)
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

        // 2. Read ARP Table (Layer 2 Discovery)
        try {
            const { stdout } = await execAsync('arp -a');
            const lines = stdout.split(os.EOL);

            for (const line of lines) {
                const ipMatch = line.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/);
                const macMatch = line.match(/([0-9a-fA-F]{2}[:-]){5}([0-9a-fA-F]{2})/);

                if (ipMatch && macMatch) {
                    const ip = ipMatch[0];
                    let mac = macMatch[0].replace(/-/g, ':').toLowerCase();

                    // Verify if this IP belongs to any of our target subnets
                    const isTarget = bases.some(base => ip.startsWith(base + '.'));
                    if (isTarget) {
                        devices.push({ ip, mac });
                    }
                }
            }
        } catch (e) {
            console.error('❌ ARP Scan failed:', e);
        }

        return devices;
    }
}
