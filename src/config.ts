import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const config = {
    port: parseInt(process.env.PORT || '3000', 10),
    unifi: {
        url: process.env.UNIFI_URL || '',
        user: process.env.UNIFI_USER || '',
        password: process.env.UNIFI_PASSWORD || '',
        site: process.env.UNIFI_SITE || 'default',
        ignoreSsl: true, // Common for local controllers
    },
    scanner: {
        subnet: process.env.SCAN_SUBNET || '192.168.1',
    },
    email: {
        host: process.env.SMTP_HOST || '',
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
        from: process.env.SMTP_FROM || 'NetPulse <alerts@netpulse.local>',
        to: process.env.SMTP_TO || '',
    },
    alerts: {
        thresholdMin: parseInt(process.env.ALERT_THRESHOLD_MIN || '10', 10),
    },
    databasePath: process.env.DB_PATH || path.resolve(__dirname, '../../netpulse.db')
};
