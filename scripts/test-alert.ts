import { AlertManager } from '../src/services/alert-manager';
import { DatabaseService } from '../src/services/database';

const run = async () => {
    console.log('Testing Alert Manager...');
    const db = new DatabaseService();
    const alertManager = new AlertManager();

    // Insert a stale device manually for testing
    const mac = 'aa:bb:cc:dd:ee:ff';
    db.upsertDevice({
        mac,
        ip: '10.0.0.123',
        hostname: 'Stale-Test-Device',
        vendor: 'Mock Vendor',
        status: 'OFFLINE',
        source: 'SCAN',
        last_seen: Date.now() - (15 * 60 * 1000), // 15 mins ago
        is_fixed_ip: 0,
        is_wired: 0,
        updated_at: Date.now()
    });

    console.log(`Inserted mock stale device: ${mac}`);

    await alertManager.checkThresholds();
    console.log('Alert check complete.');
};

run();
