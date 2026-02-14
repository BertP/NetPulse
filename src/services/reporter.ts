
import fs from 'fs';
import path from 'path';
import { DatabaseService, Device } from './database';

export class ReportService {
    private db: DatabaseService;

    constructor() {
        this.db = new DatabaseService();
    }

    generateMarkdown(): string {
        const devices = this.db.getAllDevices();
        const now = new Date();
        const timestamp = now.toLocaleString();

        const total = devices.length;
        const online = devices.filter(d => d.status === 'ONLINE').length;
        const offline = total - online;

        let md = `# NetPulse Network Report\n\n`;
        md += `**Generated:** ${timestamp}\n\n`;

        md += `## Summary\n`;
        md += `- **Total Devices:** ${total}\n`;
        md += `- **Online:** 🟢 ${online}\n`;
        md += `- **Offline:** 🔴 ${offline}\n\n`;

        md += `## Device List\n\n`;
        md += `| MAC Address | IP Address | Hostname | Vendor | Status | Source | Last Seen |\n`;
        md += `| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;

        // Sort by Status (Online first), then IP
        devices.sort((a, b) => {
            if (a.status !== b.status) return a.status === 'ONLINE' ? -1 : 1;
            return this.ipDotValue(a.ip) - this.ipDotValue(b.ip);
        });

        for (const d of devices) {
            const statusIcon = d.status === 'ONLINE' ? '🟢' : '🔴';
            const lastSeen = new Date(d.last_seen).toLocaleString();
            md += `| \`${d.mac}\` | ${d.ip} | ${d.hostname} | ${d.vendor} | ${statusIcon} ${d.status} | ${d.source} | ${lastSeen} |\n`;
        }

        // Ensure reports directory exists
        const reportDir = path.resolve(__dirname, '../../reports');
        if (!fs.existsSync(reportDir)) {
            fs.mkdirSync(reportDir);
        }

        const filename = `NetPulse_Report_${now.toISOString().replace(/[:.]/g, '-')}.md`;
        const filePath = path.join(reportDir, filename);

        fs.writeFileSync(filePath, md);
        console.log(`📝 Report generated: ${filePath}`);

        return md;
    }

    private ipDotValue(ip: string): number {
        // Simple helper to sort IPs numerically
        // 192.168.1.1 -> 192168001001 (simplified logic or just splitting)
        if (!ip) return 0;
        const parts = ip.split('.').map(Number);
        if (parts.length !== 4) return 0;
        return (parts[0] * 16777216) + (parts[1] * 65536) + (parts[2] * 256) + parts[3];
    }
}
