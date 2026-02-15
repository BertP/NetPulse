
import { UniFiService } from './unifi';
import { NetworkScanner } from './scanner';
import { DatabaseService, Device } from './database';
import { config } from '../config';

export class DeviceManager {
    private unifi: UniFiService;
    private scanner: NetworkScanner;
    private db: DatabaseService;

    constructor(db: DatabaseService) {
        this.unifi = new UniFiService();
        this.scanner = new NetworkScanner();
        this.db = db;
    }

    async sync() {
        console.log('🔄 Starting Device Sync...');
        const now = Date.now();
        const seenMacsInThisLoop = new Set<string>();

        // 1. Fetch UniFi Clients
        const unifiClients = await this.unifi.getClients();
        console.log(`📥 UniFi: Found ${unifiClients.length} clients`);

        for (const client of unifiClients) {
            const mac = client.mac.toLowerCase();
            seenMacsInThisLoop.add(mac);

            const device: Device = {
                mac: mac,
                ip: client.ip,
                hostname: client.name || client.hostname || '',
                vendor: client.oui,
                status: 'ONLINE',
                source: 'UNIFI',
                last_seen: client.last_seen * 1000,
                is_fixed_ip: client.use_fixedip ? 1 : 0,
                is_wired: client.is_wired ? 1 : 0,
                updated_at: now
            };

            this.mergeAndSave(device);
        }

        // 2. Active Scan
        const subnet = config.scanner.subnet;
        const scanStart = Date.now();
        const scanResults = await this.scanner.scanSubnet(subnet);
        const scanDuration = Date.now() - scanStart;
        console.log(`📡 Scan: Found ${scanResults.length} ARP entries in ${scanDuration}ms`);

        for (const scanned of scanResults) {
            const mac = scanned.mac.toLowerCase();
            seenMacsInThisLoop.add(mac);

            const device: Device = {
                mac: mac,
                ip: scanned.ip,
                hostname: '',
                vendor: '',
                status: 'ONLINE',
                source: 'SCAN',
                last_seen: now,
                is_fixed_ip: 0,
                is_wired: 0, // Default to wireless for scans; UniFi will refine this if known
                updated_at: now
            };

            this.mergeAndSave(device);
        }

        // 3. Mark Offline / Unstable
        const allDevices = this.db.getAllDevices();
        const THRESHOLD_MS = config.alerts.thresholdMin * 60 * 1000;

        for (const dbDevice of allDevices) {
            if (!seenMacsInThisLoop.has(dbDevice.mac)) {
                const timeSinceSeen = now - dbDevice.last_seen;
                let newStatus: 'ONLINE' | 'UNSTABLE' | 'OFFLINE' = dbDevice.status;

                if (timeSinceSeen >= THRESHOLD_MS) {
                    newStatus = 'OFFLINE';
                } else if (timeSinceSeen >= (THRESHOLD_MS / 2)) {
                    newStatus = 'UNSTABLE';
                } else {
                    // It just missed a scan, but it's still relatively fresh
                    newStatus = 'ONLINE';
                }

                if (newStatus !== dbDevice.status) {
                    console.log(`📡 Status Change: ${dbDevice.hostname || dbDevice.mac} -> ${newStatus}`);
                    this.db.upsertDevice({
                        ...dbDevice,
                        status: newStatus,
                        updated_at: now
                    });
                }
            }
        }
    }

    private mergeAndSave(newDevice: Device) {
        const existing = this.db.getDevice(newDevice.mac);

        if (existing) {
            // Merging Logic

            // 1. Source: UNIFI + SCAN = BOTH
            let source = existing.source;
            if (existing.source !== 'BOTH' && existing.source !== newDevice.source) {
                source = 'BOTH';
            } else if (existing.source === 'BOTH') {
                source = 'BOTH';
            } else {
                source = newDevice.source;
            }

            // 2. Hostname: Prefer non-empty
            const hostname = newDevice.hostname || existing.hostname;
            // 3. Vendor: Prefer non-empty
            const vendor = newDevice.vendor || existing.vendor;

            // 4. Fixed IP: Only UniFi knows for sure
            let is_fixed_ip = existing.is_fixed_ip;
            let is_wired = existing.is_wired;
            if (newDevice.source === 'UNIFI') {
                is_fixed_ip = newDevice.is_fixed_ip;
                is_wired = newDevice.is_wired;
            }

            const merged: Device = {
                ...existing,
                ip: newDevice.ip, // IP might change, take latest
                hostname,
                vendor,
                status: 'ONLINE', // If we just saw it, it's ONLINE
                source,
                last_seen: Math.max(existing.last_seen, newDevice.last_seen),
                is_fixed_ip,
                is_wired,
                updated_at: Date.now()
            };

            this.db.upsertDevice(merged);

        } else {
            // New Device
            this.db.upsertDevice(newDevice);
        }
    }

    getAllDevices() {
        return this.db.getAllDevices();
    }
}
