# Watoto Deployment Guide  
**Host Nginx + Docker Frontend + Docker Backend**

This document describes how to deploy the Watoto application on a server that already hosts other websites using **host-level Nginx**, while keeping the Watoto frontend and backend fully containerized.

> **Key rule:**  
> Only the **host Nginx** listens on ports **80 and 443**.  
> Docker containers run behind it on internal ports and networks.

---

## Architecture Overview

```
Internet
   |
   v
Host Nginx (80 / 443, SSL termination)
   |
   v
Frontend Container (Nginx :80 → host :7080)
   |
   v
Backend Container (Django/API :8000, internal only)
```

---

## Prerequisites

- Linux server with Nginx, Docker, Certbot
- DNS records:
  - watoto.lightbeammedia.xyz
  - api.watoto.lightbeammedia.xyz

---

## 1. Create Docker Network

```bash
docker network create app-network
```

---

## 2. Run Backend Container

```bash
docker run -d \
  --name watoto-mbarara-admin \
  --network app-network \
  --restart unless-stopped \
  ghcr.io/musicmeetscode/watoto-mbarara-admin:latest
```

Backend listens on port 8000 internally.

---

## 3. Run Frontend Container

```bash
docker run -d \
  --name watoto-mbarara \
  --network app-network \
  -p 127.0.0.1:7080:80 \
  --restart unless-stopped \
  ghcr.io/musicmeetscode/watoto-mbarara:latest
```

---

## 4. Frontend Container Nginx Config

```nginx
server {
    listen 80;
    server_name watoto.lightbeammedia.xyz;

    root /usr/share/nginx/html/front;
    index index.html;

    location / {
        try_files $uri /index.html;
    }
}

server {
    listen 80;
    server_name api.watoto.lightbeammedia.xyz;

    location /ws/ {
        proxy_pass http://watoto-mbarara-admin:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    location / {
        proxy_pass http://watoto-mbarara-admin:8000;
    }
}
```

---

## 5. Host Nginx Config – Frontend

Create `/etc/nginx/sites-available/watoto.lightbeammedia.xyz`

```nginx
server {
    listen 80;
    server_name watoto.lightbeammedia.xyz;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name watoto.lightbeammedia.xyz;

    ssl_certificate /etc/letsencrypt/live/watoto.lightbeammedia.xyz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/watoto.lightbeammedia.xyz/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:7080;
    }
}
```

---

## 6. Host Nginx Config – API

Create `/etc/nginx/sites-available/api.watoto.lightbeammedia.xyz`

```nginx
server {
    listen 80;
    server_name api-bythefruit.oddshoesdev.xyz;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name api-bythefruit.oddshoesdev.xyz;

    ssl_certificate etc/letsencrypt/live/api-bythefruit.oddshoesdev.xyz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api-bythefruit.oddshoesdev.xyz/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:7080;
    }
}
```

---

## 7. SSL Certificates

```bash
sudo certbot --nginx -d api-bythefruit.oddshoesdev.xyz
```

---

## 8. Reload Nginx

```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## Summary

- Host Nginx owns ports 80/443
- Frontend container serves UI and proxies API
- Backend container is internal only
- Other host sites remain unaffected
