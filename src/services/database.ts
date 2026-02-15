import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { config } from '../config';

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

const SCHEMA = `
CREATE TABLE IF NOT EXISTS devices (
  mac TEXT PRIMARY KEY,
  ip TEXT,
  hostname TEXT,
  vendor TEXT,
  status TEXT CHECK(status IN ('ONLINE', 'UNSTABLE', 'OFFLINE')),
  source TEXT CHECK(source IN ('UNIFI', 'SCAN', 'BOTH')),
  last_seen INTEGER,
  is_fixed_ip INTEGER DEFAULT 0,
  is_wired INTEGER DEFAULT 0,
  updated_at INTEGER
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);
`

export class DatabaseService {
    private db: Database.Database;

    constructor() {
        this.db = new Database(config.databasePath);
        this.init();
    }

    private init() {
        this.db.exec(SCHEMA);
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

    // Settings
    getSetting(key: string): string | undefined {
        const row = this.db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined;
        return row?.value;
    }

    getAllSettings(): Record<string, string> {
        const rows = this.db.prepare('SELECT * FROM settings').all() as { key: string, value: string }[];
        const settings: Record<string, string> = {};
        for (const row of rows) {
            settings[row.key] = row.value;
        }
        return settings;
    }

    upsertSetting(key: string, value: string) {
        this.db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(key, value);
    }
}
