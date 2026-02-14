
import { AlertManager } from '../src/services/alert-manager';

const run = async () => {
    console.log('Testing Alert Manager...');
    const alertManager = new AlertManager();

    // This test relies on existing DB data. 
    // If no devices are old enough, it won't trigger.
    // Real test would mock DB, but for now we just run it to ensure no crashes.
    await alertManager.checkThresholds();
    console.log('Alert check complete.');
};

run();
