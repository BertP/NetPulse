
import { UniFiService } from './unifi';
import { NetworkScanner } from './scanner';
import { DatabaseService, Device } from './database';
import { config } from '../config';

export class DeviceManager {
    private unifi: UniFiService;
    private scanner: NetworkScanner;
    private db: DatabaseService;

    constructor() {
        this.unifi = new UniFiService();
        this.scanner = new NetworkScanner();
        this.db = new DatabaseService();
    }

    async sync() {
        console.log('🔄 Starting Device Sync...');
        const now = Date.now();

        // 1. Fetch UniFi Clients
        const unifiClients = await this.unifi.getClients();
        console.log(`📥 UniFi: Found ${unifiClients.length} clients`);

        for (const client of unifiClients) {
            // Upsert UniFi data
            // We assume UniFi is source of truth for Hostname/Vendor often

            // Normalize MAC
            const mac = client.mac.toLowerCase();

            const device: Device = {
                mac: mac,
                ip: client.ip,
                hostname: client.name || client.hostname || '',
                vendor: client.oui,
                status: 'ONLINE', // UniFi reports them as connected
                source: 'UNIFI',
                last_seen: client.last_seen * 1000, // UniFi uses seconds
                updated_at: now
            };

            this.mergeAndSave(device);
        }

        // 2. Active Scan
        // Extract subnet from Config or just guess from local IP logic.
        // For MVP, taking the subnet from the first UniFi client or config default?
        // Let's use a config default or 192.168.1
        // Better: parse it from env if possible, or simplified '192.168.1'
        const subnet = '192.168.1';
        const scanResults = await this.scanner.scanSubnet(subnet);
        console.log(`📡 Scan: Found ${scanResults.length} ARP entries`);

        for (const scanned of scanResults) {
            const mac = scanned.mac.toLowerCase();

            const device: Device = {
                mac: mac,
                ip: scanned.ip,
                hostname: '', // Scanner doesn't easily get hostname without reverse DNS
                vendor: '',
                status: 'ONLINE',
                source: 'SCAN',
                last_seen: now,
                updated_at: now
            };

            this.mergeAndSave(device);
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

            const merged: Device = {
                ...existing,
                ip: newDevice.ip, // IP might change, take latest
                hostname,
                vendor,
                status: 'ONLINE', // If we just saw it, it's ONLINE
                source,
                last_seen: Math.max(existing.last_seen, newDevice.last_seen),
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
