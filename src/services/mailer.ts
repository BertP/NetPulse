import nodemailer from 'nodemailer';
import { config } from '../config';

export class MailerService {
    private transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: config.email.host,
            port: config.email.port,
            secure: config.email.port === 465, // true for 465, false for other ports
            auth: {
                user: config.email.user,
                pass: config.email.pass,
            },
        });
    }

    async sendAlert(subject: string, message: string) {
        if (!config.email.host || !config.email.to) {
            console.log(`📧 [MOCK EMAIL ALERT] Subject: ${subject}`);
            console.log(`   Message: ${message}`);
            return true;
        }

        try {
            await this.transporter.sendMail({
                from: config.email.from,
                to: config.email.to,
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
