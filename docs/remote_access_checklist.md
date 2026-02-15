# Remote Access Checklist: Public Subdomain (Nginx Proxy Manager)

To make NetPulse accessible via a subdomain (e.g., `netpulse.yourdomain.com`) using Nginx Proxy Manager, follow these steps:

## 1. DNS Configuration
- [ ] Create an **A Record** (or CNAME) in your DNS provider (Cloudflare, Ionos, etc.) pointing your subdomain to your home router's public IP.
- [ ] Ensure port **80** and **443** are forwarded on your router to the internal IP of the server running Nginx Proxy Manager.

## 2. Nginx Proxy Manager (NPM) Setup
Configure a new **Proxy Host** in NPM:
- **Domain Names**: `netpulse.yourdomain.com`
- **Scheme**: `http`
- **Forward Name/IP**: [Server Internal IP]
- **Forward Port**: `80` (This targets the NetPulse Frontend container)
- [ ] **Custom Locations** (Required for API access):
  - Add a location `/` pointing to the frontend (Port 80).
  - Add routes for the backend:
    - `/devices` -> `http://[Internal_IP]:3001/devices`
    - `/scan` -> `http://[Internal_IP]:3001/scan`
    - `/report` -> `http://[Internal_IP]:3001/report`
    - `/settings` -> `http://[Internal_IP]:3001/settings`
    - `/reports` -> `http://[Internal_IP]:3001/reports`
- [ ] **SSL**: Enable "Force SSL" and request a New Let's Encrypt Certificate.

## 3. NetPulse Project Configuration
- [ ] **Configure in UI**:
  - Go to **Settings** ⚙️ and set the **Public Base URL** to `https://netpulse.yourdomain.com`.
  - (This ensures the system generates correct `https` links for your reports).
- [ ] **Update `.env`**:
  - Change `SERVER_IP` to your domain: `SERVER_IP=netpulse.yourdomain.com`
- [ ] **Rebuild & Restart**:
  - `docker compose build frontend`
  - `docker compose up -d`

## 4. Security Recommendations
> [!WARNING]
> NetPulse currently does not have a login screen. Exposing it to the public internet makes your network data visible to anyone with the link.
- [ ] **NPM Access List**: It is **highly recommended** to set an "Access List" in NPM (Basic Auth) to password-protect the subdomain until a native login is implemented.
