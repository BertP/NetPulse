
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

    async scanSubnet(subnetBase: string): Promise<ScannedDevice[]> {
        // subnetBase e.g., '192.168.1'
        const devices: ScannedDevice[] = [];
        const promises = [];

        console.log(`📡 Scanning subnet ${subnetBase}.0/24...`);

        // 1. Flood Ping (Active Reachability)
        // We ping all 254 hosts to confirm reachability and populate ARP table
        for (let i = 1; i < 255; i++) {
            const ip = `${subnetBase}.${i}`;
            promises.push(ping.promise.probe(ip, {
                timeout: 1, // fast timeout
            }));
        }

        await Promise.all(promises);

        // 2. Read ARP Table (Layer 2 Discovery)
        // This gives us MAC addresses for the IPs we just pinged (if they exist)
        try {
            const { stdout } = await execAsync('arp -a');
            const lines = stdout.split(os.EOL);

            // Parse ARP table (Windows format vs Linux format differs)
            // Windows:  Interface: 192.168.1.50 --- 0x10
            //           Internet Address      Physical Address      Type
            //           192.168.1.1           xx-xx-xx-xx-xx-xx     dynamic

            // Linux:    ? (192.168.1.1) at xx:xx:xx:xx:xx:xx [ether] on eth0

            for (const line of lines) {
                // Heuristic regex for IPv4 and MAC
                const ipMatch = line.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/);
                // Windows uses dashes, Linux colons. Let's normalize to colons.
                const macMatch = line.match(/([0-9a-fA-F]{2}[:-]){5}([0-9a-fA-F]{2})/);

                if (ipMatch && macMatch) {

                    const ip = ipMatch[0];
                    let mac = macMatch[0].replace(/-/g, ':').toLowerCase();

                    // Filter out multicast/broadcast if needed, but basic checks:
                    if (ip.startsWith(subnetBase)) {
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
