
import { DatabaseService } from './database';
import { MailerService } from './mailer';

export class AlertManager {
    private db: DatabaseService;
    private mailer: MailerService;
    private alertedDevices: Set<string> = new Set(); // Track devices we've already alerted for

    constructor() {
        this.db = new DatabaseService();
        this.mailer = new MailerService();
    }

    async checkThresholds() {
        const devices = this.db.getAllDevices();
        const now = Date.now();
        const THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes

        for (const device of devices) {
            // Check if device is effectively offline based on last_seen
            // Even if status says ONLINE, if last_seen is old, it's suspicious.
            // But usually the DeviceManager updates status to OFFLINE if it misses a scan?
            // Actually, my DeviceManager currently only upserts "ONLINE". 
            // It lacks logic to mark things "OFFLINE" if they vanish!
            // This is a logic gap I should address here or in DeviceManager.
            // For now, let's rely on 'last_seen'.

            const timeSinceSeen = now - device.last_seen;

            if (timeSinceSeen > THRESHOLD_MS) {
                // Device is logically offline
                if (!this.alertedDevices.has(device.mac)) {
                    // Trigger Alert
                    const msg = `Device ${device.hostname || device.mac} (${device.ip}) has been offline for ${Math.floor(timeSinceSeen / 60000)} minutes.`;
                    await this.mailer.sendAlert(`Device Offline: ${device.hostname || device.mac}`, msg);

                    this.alertedDevices.add(device.mac);
                }
            } else {
                // Device is back online or not yet threshold
                if (this.alertedDevices.has(device.mac)) {
                    // It came back!
                    await this.mailer.sendAlert(`Device Online: ${device.hostname || device.mac}`, `Device is back online.`);
                    this.alertedDevices.delete(device.mac);
                }
            }
        }
    }
}
