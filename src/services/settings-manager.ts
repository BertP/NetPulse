
import { DatabaseService } from './database';
import { config } from '../config';

export class SettingsManager {
    private db: DatabaseService;

    constructor(db: DatabaseService) {
        this.db = db;
        this.bootstrap();
    }

    private bootstrap() {
        // Only bootstrap if settings are empty
        const currentSettings = this.db.getAllSettings();
        if (Object.keys(currentSettings).length === 0) {
            console.log('🌱 Bootstrapping settings from environment variables...');
            this.db.upsertSetting('UNIFI_URL', config.unifi.url);
            this.db.upsertSetting('UNIFI_USER', config.unifi.user);
            this.db.upsertSetting('UNIFI_PASSWORD', config.unifi.password);
            this.db.upsertSetting('UNIFI_SITE', config.unifi.site);
            this.db.upsertSetting('SCAN_SUBNET', config.scanner.subnet);
            this.db.upsertSetting('SMTP_HOST', config.email.host);
            this.db.upsertSetting('SMTP_PORT', config.email.port.toString());
            this.db.upsertSetting('SMTP_USER', config.email.user);
            this.db.upsertSetting('SMTP_PASS', config.email.pass);
            this.db.upsertSetting('SMTP_FROM', config.email.from);
            this.db.upsertSetting('SMTP_TO', config.email.to);
            this.db.upsertSetting('ALERT_THRESHOLD_MIN', config.alerts.thresholdMin.toString());
            this.db.upsertSetting('SERVER_IP', config.serverIp);
            this.db.upsertSetting('GATEWAY_TYPE', 'UNIFI');
            console.log('✅ Settings bootstrapped');
        }
    }

    getSettings() {
        return this.db.getAllSettings();
    }

    updateSettings(settings: Record<string, string>) {
        for (const [key, value] of Object.entries(settings)) {
            this.db.upsertSetting(key, value);
        }
        console.log('⚙️ Settings updated');
    }
}
