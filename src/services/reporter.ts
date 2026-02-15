
import fs from 'fs';
import path from 'path';
import { DatabaseService, Device } from './database';

export class ReportService {
    private db: DatabaseService;

    constructor(db: DatabaseService) {
        this.db = db;
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
        const fixedIpCount = devices.filter(d => d.is_fixed_ip === 1).length;
        const dhcpCount = devices.length - fixedIpCount;
        const wiredCount = devices.filter(d => d.is_wired === 1).length;
        const wirelessCount = devices.length - wiredCount;

        // Manufacturer Breakdown
        const manufacturers: Record<string, number> = {};
        devices.forEach(d => {
            const vendor = d.vendor || 'Unknown';
            manufacturers[vendor] = (manufacturers[vendor] || 0) + 1;
        });
        const sortedManufacturers = Object.entries(manufacturers)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10); // Top 10

        md += `## Network Summary\n\n`;
        md += `| Metric | Count |\n`;
        md += `| :--- | :--- |\n`;
        md += `| **Total Devices** | ${devices.length} |\n`;
        md += `| **Online** | ${onlineCount} |\n`;
        md += `| **Unstable** | ${unstableCount} |\n`;
        md += `| **Offline** | ${offlineCount} |\n`;
        md += `| **Fixed IP Clients** | ${fixedIpCount} |\n`;
        md += `| **DHCP Clients** | ${dhcpCount} |\n`;
        md += `| **Wired Connections** | ${wiredCount} |\n`;
        md += `| **Wireless Connections** | ${wirelessCount} |\n\n`;

        md += `### Top Manufacturers\n\n`;
        md += `| Manufacturer | Count |\n`;
        md += `| :--- | :--- |\n`;
        for (const [name, count] of sortedManufacturers) {
            md += `| ${name} | ${count} |\n`;
        }
        md += `\n`;

        md += `## Device List\n\n`;
        md += `| Device Name | Connection | IP Address | IP Type | MAC Address | Vendor | Last Seen | Status |\n`;
        md += `| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;

        // Sort by:
        // 1. Connection (Wired first: is_wired = 1)
        // 2. IP Type (Fixed first: is_fixed_ip = 1)
        // 3. IP Address (Numeric)
        devices.sort((a, b) => {
            if (a.is_wired !== b.is_wired) return b.is_wired - a.is_wired;
            if (a.is_fixed_ip !== b.is_fixed_ip) return b.is_fixed_ip - a.is_fixed_ip;
            return this.ipDotValue(a.ip) - this.ipDotValue(b.ip);
        });

        for (const d of devices) {
            const lastSeen = new Date(d.last_seen).toLocaleString();
            const ipDisplay = d.ip || '---';
            const connection = d.is_wired ? 'Wired' : 'Wireless';
            const ipType = d.is_fixed_ip ? 'Fixed' : 'DHCP';

            md += `| ${d.hostname || 'Unknown'} | ${connection} | ${ipDisplay} | ${ipType} | \`${d.mac}\` | ${d.vendor || 'Unknown'} | ${lastSeen} | ${d.status} |\n`;
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
