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
};
