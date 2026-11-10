# ZEE X AI CRM — Deployment & Domain Routing Guide

## Architecture Overview
```
           +-----------------------------+
           |     https://zeexai.com      |
           +--------------+--------------+
                          |
              Path-based reverse proxy
                          |
            +-------------+-------------+
            |                           |
  Path: / (All other routes)       Path: /crm/*
            |                           |
            v                           v
  [Main Website SPA]            [CRM Independent SPA]
  zeex-web build               crm-frontend build
  Host: Vercel / Cloudflare    Host: Vercel / S3 / Nginx
                                        |
                                        v
                               [CRM Node.js API]
                               crm-backend (Port 4000)
                               Host: Render / Railway / ECS
                                        |
                                        v
                               [MongoDB Atlas CRM DB]
                               zeexai_crm
```

---

## 1. Hosting the CRM Frontend at `/crm`

### Method A: Vercel (Path Rewrites)
In your main domain root or top-level Vercel project, add a rewrite rule in `vercel.json`:
```json
{
  "rewrites": [
    {
      "source": "/crm/:path*",
      "destination": "https://zeexai-crm-frontend.vercel.app/crm/:path*"
    }
  ]
}
```

### Method B: Nginx Reverse Proxy
If hosting via Nginx on a VPS:
```nginx
server {
    server_name zeexai.com;

    # Main Website
    location / {
        root /var/www/zeex-web/dist;
        try_files $uri $uri/ /index.html;
    }

    # Independent CRM Application
    location /crm {
        alias /var/www/crm-frontend/dist;
        try_files $uri $uri/ /crm/index.html;
    }

    # CRM Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:4000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 2. Deploying the Node.js Backend

### Option A: Render.com
1. Create a **New Web Service** connected to your repo.
2. Root Directory: `crm-backend`
3. Environment: `Node`
4. Build Command: `npm install && npm run build`
5. Start Command: `npm start`
6. Add Environment Variables:
   - `NODE_ENV=production`
   - `PORT=10000`
   - `MONGODB_URI=mongodb+srv://...`
   - `MONGODB_DATABASE=zeexai_crm`
   - `JWT_SECRET=<secure_random_string>`
   - `JWT_REFRESH_SECRET=<secure_random_string>`
   - `CLIENT_URL=https://zeexai.com`
   - `INTEGRATION_API_KEY=<secure_random_string>`

---

## 3. MongoDB Atlas Configuration
1. Log in to [MongoDB Atlas](https://cloud.mongodb.com).
2. Create a dedicated database user (e.g. `zeex_crm_admin`).
3. Under **Network Access**, whitelist your backend IP or use `0.0.0.0/0` with secure credentials.
4. Obtain the connection string:
   `mongodb+srv://<user>:<password>@cluster0.mongodb.net/?retryWrites=true&w=majority`
5. Set `MONGODB_DATABASE=zeexai_crm` to isolate CRM collections from any other application databases.

