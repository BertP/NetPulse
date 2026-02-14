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
    is_wired: number;    // 0 or 1
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
            INSERT INTO devices (mac, ip, hostname, vendor, status, source, last_seen, is_fixed_ip, is_wired, updated_at)
            VALUES (@mac, @ip, @hostname, @vendor, @status, @source, @last_seen, @is_fixed_ip, @is_wired, @updated_at)
            ON CONFLICT(mac) DO UPDATE SET
                ip = excluded.ip,
                hostname = excluded.hostname,
                vendor = excluded.vendor,
                status = excluded.status,
                source = excluded.source,
                last_seen = excluded.last_seen,
                is_fixed_ip = excluded.is_fixed_ip,
                is_wired = excluded.is_wired,
                updated_at = excluded.updated_at
        `);
        stmt.run(device);
    }

    getAllDevices(): Device[] {
        return this.db.prepare('SELECT * FROM devices').all() as Device[];
    }

    getDevice(mac: string): Device | undefined {
        return this.db.prepare('SELECT * FROM devices WHERE mac = ?').get(mac) as Device | undefined;
    }
}
