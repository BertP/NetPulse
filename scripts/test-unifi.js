"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const unifi_1 = require("../src/services/unifi");
const run = async () => {
    console.log('Testing UniFi Connection...');
    const service = new unifi_1.UniFiService();
    const success = await service.login();
    if (success) {
        console.log('Login successful!');
        const clients = await service.getClients();
        console.log(`Fetched ${clients.length} clients.`);
        process.exit(0);
    }
    else {
        console.error('Login failed.');
        process.exit(1);
    }
};
run();
