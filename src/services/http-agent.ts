import https from 'https';

export const httpsAgent = new https.Agent({
    rejectUnauthorized: false, // For self-signed certs
});
