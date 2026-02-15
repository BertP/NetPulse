# Ubuntu Deployment Guide

This guide provides step-by-step instructions for deploying NetPulse on an Ubuntu Server.

## 📋 Prerequisites

- Ubuntu Server (20.04 LTS or newer recommended).
- Docker and Docker Compose installed.
- Access to the internet for pulling images and dependencies.

## 🛠 Step 1: Install Docker (if not present)

```bash
# Update packages
sudo apt update
sudo apt upgrade -y

# Install Docker
sudo apt install -y docker.io docker-compose

# Start and enable Docker
sudo systemctl enable --now docker

# Optional: Add user to docker group
sudo usermod -aG docker $USER
# (Logout and login again for changes to take effect)
```

## 📂 Step 2: Prepare the Application

1. **Clone the project**:
   ```bash
   git clone https://github.com/BertP/NetPulse.git
   cd NetPulse
   ```

2. **Configure Environment Variables**:
   ```bash
   cp .env.example .env
   nano .env
   ```
   Fill in the following:
   - `UNIFI_URL`: Internal IP/URL of your controller.
   - `UNIFI_USER` / `UNIFI_PASSWORD`: Controller credentials.
   - `SERVER_IP`: The IP address of this machine (e.g., `192.168.1.252`). Required for frontend connectivity.
   - `SMTP_*`: Your email provider settings (optional).
   - `ALERT_THRESHOLD_MIN`: Time in minutes before alerting.

3. **Configure Frontend**:
   ```bash
   cd frontend
   cp .env.example .env
   nano .env
   ```
   Set `VITE_API_URL` to the public IP/DNS of your server (e.g., `http://192.168.1.100:3000`).

## 🚀 Step 3: Launch with Docker Compose

Return to the root directory and run:

```bash
cd ..
docker-compose up -d --build
```

## 🔍 Step 4: Verification

- **Dashboard**: Access via `http://<YOUR_SERVER_IP>`.
- **Backend API**: Verify at `http://<YOUR_SERVER_IP>:3001/`.
- **Reports**: Stored in `./reports` and accessible via the UI.

## 🛠 Troubleshooting

- **Permissions**: Ensure `docker-compose` is run with `sudo` if you haven't added your user to the `docker` group.
- **Network Scanning**: The backend uses `network_mode: host` to allow ARP scanning. Ensure no other service is blocking port 3001.
- **Firewall**: If using `ufw`, allow ports 80 and 3001:
  ```bash
  sudo ufw allow 80/tcp
  sudo ufw allow 3001/tcp
  ```
