
import { UniFiService } from '../src/services/unifi';

const run = async () => {
    console.log('Testing UniFi Connection...');
    const service = new UniFiService();
    const success = await service.login();

    if (success) {
        console.log('Login successful!');
        const clients = await service.getClients();
        console.log(`Fetched ${clients.length} clients.`);
        process.exit(0);
    } else {
        console.error('Login failed.');
        process.exit(1);
    }
};

run();
