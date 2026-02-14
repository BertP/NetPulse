
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

        // Naming convention: network_report_YYYY-MM-DD_HH-MM-SS.md
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const filename = `network_report_${year}-${month}-${day}_${hours}-${minutes}-${seconds}.md`;

        let md = `# NetPulse Network Report\n\n`;
        md += `**Generated:** ${now.toLocaleString()}\n\n`;

        // Calculate Stats
        const onlineCount = devices.filter(d => d.status === 'ONLINE').length;
        const unstableCount = devices.filter(d => d.status === 'UNSTABLE').length;
        const offlineCount = devices.filter(d => d.status === 'OFFLINE').length;

        md += `## Network Summary\n\n`;
        md += `| Metric | Count |\n`;
        md += `| :--- | :--- |\n`;
        md += `| **Total Devices** | ${devices.length} |\n`;
        md += `| **Online** | ${onlineCount} |\n`;
        md += `| **Unstable** | ${unstableCount} |\n`;
        md += `| **Offline** | ${offlineCount} |\n\n`;

        md += `## Device List\n\n`;
        md += `| Device Name | IP Address | MAC Address | Vendor | Last Seen | Status |\n`;
        md += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;

        // Sort by Status (Online > Unstable > Offline), then IP
        const statusWeight = { 'ONLINE': 0, 'UNSTABLE': 1, 'OFFLINE': 2 };
        devices.sort((a, b) => {
            if (a.status !== b.status) return statusWeight[a.status] - statusWeight[b.status];
            return this.ipDotValue(a.ip) - this.ipDotValue(b.ip);
        });

        for (const d of devices) {
            const lastSeen = new Date(d.last_seen).toLocaleString();
            const ipDisplay = d.ip || '---';
            const ipInfo = d.is_fixed_ip ? `${ipDisplay} (Fixed)` : `${ipDisplay} (DHCP)`;
            md += `| ${d.hostname || 'Unknown'} | ${ipInfo} | \`${d.mac}\` | ${d.vendor || 'Unknown'} | ${lastSeen} | ${d.status} |\n`;
        }

        // Ensure reports directory exists
        const reportDir = path.resolve(__dirname, '../../reports');
        if (!fs.existsSync(reportDir)) {
            fs.mkdirSync(reportDir);
        }

        const filePath = path.join(reportDir, filename);
        fs.writeFileSync(filePath, md);
        console.log(`📝 Report generated: ${filePath}`);

        return filename;
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
