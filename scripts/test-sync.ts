
import { DeviceManager } from '../src/services/device-manager';

const run = async () => {
    console.log('Testing Device Manager Sync...');
    const manager = new DeviceManager();

    await manager.sync();

    console.log('Sync Complete. Fetching devices from DB...');
    const devices = manager.getAllDevices();

    console.table(devices);
    console.log(`Total Devices: ${devices.length}`);
    process.exit(0);
};

run();
