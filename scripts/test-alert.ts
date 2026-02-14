import { AlertManager } from '../src/services/alert-manager';
import { DatabaseService } from '../src/services/database';

const run = async () => {
    console.log('Testing Alert Manager...');
    const db = new DatabaseService();
    const alertManager = new AlertManager();

    // V2: Fix for build failure with is_wired
    db.upsertDevice({
        mac,
        ip: '10.0.0.123',
        hostname: 'Stale-Test-Device',
        vendor: 'Mock Vendor',
        status: 'OFFLINE',
        source: 'SCAN',
        is_wired: 0, // Explicitly added to match interface
        is_fixed_ip: 0,
        last_seen: Date.now() - (15 * 60 * 1000), // 15 mins ago
        updated_at: Date.now()
    });

    console.log(`Inserted mock stale device: ${mac}`);

    await alertManager.checkThresholds();
    console.log('Alert check complete.');
};

run();
