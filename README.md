# NetPulse

NetPulse is a mobile-first network monitoring dashboard designed for real-time visualization of network devices. It consolidates data from UniFi controllers and active network probing to provide a comprehensive, redundant view of your infrastructure.
(made with Antigravity) 

## 🚀 Key Features

- **Redundant Discovery Engine**: Combined data from UniFi API and active ARP/ICMP scanning.
- **Real-Time Monitoring**: Interactive dashboard with a traffic-light status system (Online, Unstable, Offline).
- **Proactive Alerting**: Email notifications when devices go offline or return online, with configurable thresholds.
- **On-Demand Reporting**: Generate detailed Markdown reports with naming conventions and automatic browser preview.
- **Redundant Source Merging**: Seamlessly tracks both fixed IP and DHCP devices.
- **Dockerized Architecture**: Easy deployment via Docker Compose for Ubuntu and other platforms.

## 📱 Dashboard Interface

The NetPulse dashboard provides a high-density, real-time view of your network. Each **Device Card** contains the following information:

- **Topology Icon**: 
  - **Network** icon: Wired (Ethernet) connection.
  - **Wifi** icon: Wireless connection.
  - **Blue Badge**: Indicates a **Fixed IP** reservation.
- **Primary Info**: Device hostname (or "Unknown"), current IP address, MAC address, and hardware vendor.
- **Status Indicator**: 
  - **Online** (Emerald): Device is active and reachable.
  - **Unstable** (Orange): Device missed a check but is not yet considered offline.
  - **Offline** (Rose): Device has been unreachable beyond the configured threshold.
- **Source Attribution**:
  - `UniFi Cloud`: Data synchronized from the UniFi Controller.
  - `Local Scan`: Discovered via active ARP/ICMP probing.
  - `Redundant`: Device successfully tracked by both discovery engines.
- **Timeline**: Real-time "Last Seen" timestamp for every participant.

## 🛠 Tech Stack

- **Backend**: Node.js, Fastify, TypeScript, SQLite.
- **Frontend**: React, Vite, Tailwind CSS, Lucide React.
- **Tools**: Axios, Nodemailer, UniFi API integration, Ping/ARP probing.

## 📦 Getting Started

### Prerequisites

- Node.js (v20+) or Docker & Docker Compose.
- Access to a UniFi Controller (Cloud Gateway Ultra, etc.).

### Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/BertP/NetPulse.git
   cd NetPulse
   ```

2. **Configure Environment**:
   Copy `.env.example` to `.env` in the root and fill in your credentials.

3. **Install & Run**:
   ```bash
   # In root (Backend)
   npm install && npm run dev

   # In /frontend
   cd frontend
   npm install && npm run dev
   ```

### Docker Deployment

```bash
docker-compose up -d --build
```

## 📜 Documentation

- [Deployment Guide (Ubuntu)](DEPLOYMENT.md)
- [Mission Prompt](MISSIONPROMPT.md)

## 🤝 License

Distributed under the MIT License. See `LICENSE` for more information.
