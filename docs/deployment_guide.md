# Production Deployment Guide

This guide details steps to deploy **StadiumIQ AI** to secure, production-grade servers.

---

## 1. Environment Secrets Configuration

In production, avoid committing configuration parameters. Use a secure vault or server-level env variables:

- **`PORT`**: Set the HTTP server port (e.g. `5001`).
- **`NODE_ENV`**: Set to `'production'`.
- **`JWT_SECRET`**: Set a high-entropy cryptographically secure secret (e.g. using `openssl rand -base64 32`).
- **`DB_STORAGE`**: Absolute path to write the SQLite database file (e.g. `/var/lib/stadiumiq/stadiumiq.sqlite`).
- **`GEMINI_API_KEY`**: Official Google Gemini access API key.

---

## 2. Backend Deployment

### Node PM2 Process Daemon Setup

Deploy the backend to an Ubuntu/Linux instance, build it, and launch it using PM2 to guarantee zero-downtime restarts:

```bash
# 1. Clone & install
cd backend
npm ci --only=production

# 2. Build TypeScript
npm run build

# 3. Initialize SQLite Schema
NODE_ENV=production DB_STORAGE=/var/lib/stadiumiq/stadiumiq.sqlite npm run seed

# 4. Start Process using PM2
pm2 start dist/server.js --name "stadiumiq-backend" --update-env

# 5. Configure Startup Daemon
pm2 startup
pm2 save
```

---

## 3. Frontend CDN Hosting

Vite packages the React client into a static `dist/` bundle:

```bash
cd frontend
npm ci
npm run build
```
Upload the compiled `/dist` directory to an optimized CDN or static hosting platform:
- AWS S3 + CloudFront
- Cloudflare Pages
- Vercel / Netlify

### Routing Configurations
Since the frontend uses React Router, configure your static server or CDN to redirect all non-file asset requests back to `/index.html` (Single Page Routing rule).

---

## 4. Reverse Proxy & SSL (Nginx Example)

To handle client traffic securely, route requests through Nginx, binding SSL termination:

```nginx
server {
    listen 80;
    server_name stadiumiq.example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name stadiumiq.example.com;

    ssl_certificate /etc/letsencrypt/live/stadiumiq.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/stadiumiq.example.com/privkey.pem;

    # Static Frontend
    location / {
        root /var/www/stadiumiq/frontend;
        try_files $uri $uri/ /index.html;
        index index.html;
    }

    # REST APIs Proxy
    location /api/ {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```
---

## 5. Security & Rate Limiting Guardrails

- **IP Firewalls**: Restrict port `5001` access. Only allow incoming connections from local reverse proxies (e.g. Nginx `127.0.0.1`).
- **Fail2Ban**: Monitor logs for auth brute-force attempts and block IPs.
- **SSL**: Enforce TLS 1.3 only, HSTS headers, and secure SSL ciphers.
