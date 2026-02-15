import nodemailer from 'nodemailer';
import { config } from '../config';
import { DatabaseService } from './database';

export class MailerService {
    private db: DatabaseService;

    constructor(db: DatabaseService) {
        this.db = db;
    }

    private getTransporter() {
        const host = this.db.getSetting('SMTP_HOST') || config.email.host;
        const port = parseInt(this.db.getSetting('SMTP_PORT') || config.email.port.toString(), 10);
        const user = this.db.getSetting('SMTP_USER') || config.email.user;
        const pass = this.db.getSetting('SMTP_PASS') || config.email.pass;

        return nodemailer.createTransport({
            host,
            port,
            secure: port === 465, // true for 465, false for other ports
            auth: { user, pass },
        });
    }

    async sendAlert(subject: string, message: string) {
        const host = this.db.getSetting('SMTP_HOST') || config.email.host;
        const to = this.db.getSetting('SMTP_TO') || config.email.to;
        const from = this.db.getSetting('SMTP_FROM') || config.email.from;

        if (!host || !to) {
            console.log(`📧 [MOCK EMAIL ALERT] Subject: ${subject}`);
            console.log(`   Message: ${message}`);
            return true;
        }

        try {
            const transporter = this.getTransporter();
            await transporter.sendMail({
                from,
                to,
                subject: subject,
                text: message,
            });
            console.log(`✅ Email alert sent: ${subject}`);
            return true;
        } catch (error: any) {
            console.error('❌ Failed to send email alert:', error.message);
            return false;
        }
    }
}
