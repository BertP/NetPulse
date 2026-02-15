import { config } from '../config';
import { DatabaseService } from './database';
import { MailerService } from './mailer';

export class AlertManager {
    private db: DatabaseService;
    private mailer: MailerService;
    private alertedDevices: Set<string> = new Set(); // Track devices we've already alerted for

    constructor(db: DatabaseService) {
        this.db = db;
        this.mailer = new MailerService();
    }

    async checkThresholds() {
        const devices = this.db.getAllDevices();
        const now = Date.now();
        const THRESHOLD_MS = config.alerts.thresholdMin * 60 * 1000;

        for (const device of devices) {
            // Check if device is marked OFFLINE or has very old last_seen
            // Status is the primary indicator updated by DeviceManager.sync()

            const timeSinceSeen = now - device.last_seen;
            const isStale = timeSinceSeen > THRESHOLD_MS;

            if (device.status === 'OFFLINE') {
                // Device is confirmed offline
                if (!this.alertedDevices.has(device.mac)) {
                    // Trigger Alert
                    const statusText = device.status === 'OFFLINE' ? 'marked as OFFLINE' : 'stale';
                    const msg = `⚠️ ALERT: Device ${device.hostname || 'Unknown'} (${device.mac}) is ${statusText}.\n` +
                        `IP: ${device.ip}\n` +
                        `Last Seen: ${new Date(device.last_seen).toLocaleString()}\n` +
                        `Time Since Seen: ${Math.floor(timeSinceSeen / 60000)} minutes.`;

                    await this.mailer.sendAlert(`NetPulse Alert: Device Offline - ${device.hostname || device.mac}`, msg);
                    this.alertedDevices.add(device.mac);
                }
            } else if (device.status === 'ONLINE' && !isStale) {
                // Device is back online
                if (this.alertedDevices.has(device.mac)) {
                    const msg = `✅ Device ${device.hostname || 'Unknown'} (${device.mac}) is back ONLINE.\n` +
                        `IP: ${device.ip}\n` +
                        `Timestamp: ${new Date().toLocaleString()}`;

                    await this.mailer.sendAlert(`NetPulse Info: Device Online - ${device.hostname || device.mac}`, msg);
                    this.alertedDevices.delete(device.mac);
                }
            }
        }
    }
}
