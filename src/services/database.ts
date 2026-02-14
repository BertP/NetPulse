import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

export interface Device {
    mac: string;
    ip: string;
    hostname: string;
    vendor: string;
    status: 'ONLINE' | 'UNSTABLE' | 'OFFLINE';
    source: 'UNIFI' | 'SCAN' | 'BOTH';
    last_seen: number;
    is_fixed_ip: number; // 0 or 1
    updated_at: number;
}

export class DatabaseService {
    private db: Database.Database;

    constructor() {
        const dbPath = path.resolve(__dirname, '../../netpulse.db');
        this.db = new Database(dbPath);
        this.init();
    }

    private init() {
        const schemaPath = path.resolve(__dirname, '../db/schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf-8');
        this.db.exec(schema);
        console.log('✅ Database initialized');
    }

    upsertDevice(device: Device) {
        const stmt = this.db.prepare(`
      INSERT INTO devices (mac, ip, hostname, vendor, status, source, last_seen, is_fixed_ip, updated_at)
      VALUES (@mac, @ip, @hostname, @vendor, @status, @source, @last_seen, @is_fixed_ip, @updated_at)
      ON CONFLICT(mac) DO UPDATE SET
        ip = excluded.ip,
        hostname = COALESCE(excluded.hostname, devices.hostname),
        vendor = COALESCE(excluded.vendor, devices.vendor),
        status = excluded.status,
        source = CASE 
          WHEN devices.source != excluded.source THEN 'BOTH' 
          ELSE excluded.source 
        END,
        last_seen = MAX(devices.last_seen, excluded.last_seen),
        is_fixed_ip = excluded.is_fixed_ip,
        updated_at = excluded.updated_at
    `);

        // Logic refinement for Source:
        // If existing is UNIFI and new is SCAN -> BOTH
        // If existing is SCAN and new is UNIFI -> BOTH
        // Simplified SQL logic above might need a check, let's refine in code if complex logic needed, 
        // but specific "Source" field handling in SQL is tricky for "BOTH".
        // Let's do a meaningful update. 
        // Actually, "BOTH" logic is better handled in application layer or improved SQL.
        // For now, let's trust the application layer to pass the correct "source" or handle it here?
        // Let's stick to simple upsert for specific fields, and maybe read-modify-write in manager for complex merging.
        // But for performance, SQL is better. 

        // Adjusted merge logic in SQL:
        // If the new source is different from the old source, and old source acts as a 'flag', we might want 'BOTH'.
        // Let's keep it simple: The Source reflects the LATEST source that observed it, OR we calculate 'BOTH' if we see it from both.
        // Better strategy: The DeviceManager determines the final state (Status, Source) and pushes it.
        // So this upsert just saves what it is told.

        const simpleStmt = this.db.prepare(`
        INSERT INTO devices (mac, ip, hostname, vendor, status, source, last_seen, is_fixed_ip, updated_at)
        VALUES (@mac, @ip, @hostname, @vendor, @status, @source, @last_seen, @is_fixed_ip, @updated_at)
        ON CONFLICT(mac) DO UPDATE SET
            ip = excluded.ip,
            hostname = excluded.hostname,
            vendor = excluded.vendor,
            status = excluded.status,
            source = excluded.source,
            last_seen = excluded.last_seen,
            is_fixed_ip = excluded.is_fixed_ip,
            updated_at = excluded.updated_at
    `);

        simpleStmt.run(device);
    }

    getAllDevices(): Device[] {
        return this.db.prepare('SELECT * FROM devices').all() as Device[];
    }

    getDevice(mac: string): Device | undefined {
        return this.db.prepare('SELECT * FROM devices WHERE mac = ?').get(mac) as Device | undefined;
    }
}
