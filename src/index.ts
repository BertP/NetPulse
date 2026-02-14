import Fastify from 'fastify';
import cors from '@fastify/cors';
import staticPlugin from '@fastify/static';
import path from 'path';
import { config } from './config';
import { DeviceManager } from './services/device-manager';
import { ReportService } from './services/reporter';
import { AlertManager } from './services/alert-manager';

const fastify = Fastify({
    logger: true,
});

fastify.register(cors, {
    origin: '*', // Allow all for dev, refine for prod
});

fastify.register(staticPlugin, {
    root: path.join(__dirname, '../reports'),
    prefix: '/reports/',
});

const deviceManager = new DeviceManager();
const reporter = new ReportService();
const alertManager = new AlertManager();

fastify.get('/', async (request, reply) => {
    return { hello: 'NetPulse Backend v0.4' };
});

fastify.get('/devices', async (request, reply) => {
    return deviceManager.getAllDevices();
});

fastify.post('/scan', async (request, reply) => {
    // Trigger manual scan
    deviceManager.sync();
    return { message: 'Scan started' };
});

fastify.post('/report', async (request, reply) => {
    const filename = reporter.generateMarkdown();
    const url = `http://localhost:${config.port}/reports/${filename}`;
    return { message: 'Report generated', filename, url };
});

const start = async () => {
    try {
        await fastify.listen({ port: config.port, host: '0.0.0.0' });
        console.log(`🚀 Server running on port ${config.port}`);

        // Initial Sync
        try {
            await deviceManager.sync();
        } catch (e) {
            console.error("Initial sync failed", e);
        }

        // Polling Loop
        setInterval(async () => {
            await deviceManager.sync();
            await alertManager.checkThresholds();
        }, 60000); // Every 60s

    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();
