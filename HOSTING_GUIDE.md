# Z-CRM — Complete Production Hosting & Deployment Guide

This guide walks you through deploying **Z-CRM** using:
1. **GitHub** — Source code repository
2. **Render** — Backend Node.js API (`https://your-crm-backend.onrender.com`)
3. **Vercel** — Frontend React Application (`https://your-crm-frontend.vercel.app`)
4. **MongoDB Atlas** — Production cloud database (already connected)

---

## Phase 1: Push Your Code to GitHub

Your local git repository is already initialized, configured, and committed on the `main` branch with secrets securely ignored.

1. Open [GitHub](https://github.com/new) and create a **New Repository**:
   - Repository Name: `zeexai-crm` (or your preferred name)
   - Visibility: **Private** (recommended) or **Public**
   - **Do NOT** check "Add README", ".gitignore", or "license" (we already created them).
   - Click **Create repository**.

2. In your terminal, link your repository and push:
   ```bash
   git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/<YOUR_REPOSITORY_NAME>.git
   git push -u origin main
   ```

---

## Phase 2: Configure MongoDB Atlas (Network Access)

Because Render uses dynamic cloud IP addresses for web services, Atlas must allow connections from the web:

1. Log in to [MongoDB Atlas](https://cloud.mongodb.com/).
2. In the left navigation, click **Network Access** (under Security).
3. Click the green **+ Add IP Address** button.
4. Click **Allow Access from Anywhere** (adds `0.0.0.0/0`).
5. Click **Confirm**.

---

## Phase 3: Deploy Backend on Render

### Quick Option: Using Render Blueprint (`render.yaml`)
1. Log in to [Render.com](https://dashboard.render.com/).
2. Click **New +** in the top right -> select **Blueprint**.
3. Connect your GitHub repository.
4. Render will automatically detect [`render.yaml`](./render.yaml).
5. When prompted for Environment Variables, enter:
   - `MONGODB_URI`: Your MongoDB connection string (from your `.env`)
   - `CLIENT_URL`: `https://your-crm-frontend.vercel.app` (you can update this after Phase 4)
6. Click **Apply**. Render will build and deploy your backend.
7. Once deployed, copy your backend URL: e.g. `https://zeexai-crm-backend.onrender.com`.

### Alternative Option: Manual Web Service on Render
If you prefer creating the Web Service manually:
1. Click **New +** -> **Web Service**.
2. Connect your repository.
3. Configure settings:
   - **Name**: `zeexai-crm-backend`
   - **Root Directory**: `crm-backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free
4. Under **Environment Variables**, add:
   | Key | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `PORT` | `10000` |
   | `MONGODB_URI` | `mongodb+srv://...` |
   | `MONGODB_DATABASE` | `zeexai_crm` |
   | `JWT_SECRET` | *(64-character random string)* |
   | `JWT_REFRESH_SECRET` | *(64-character random string)* |
   | `CLIENT_URL` | `https://your-crm.vercel.app` |
   | `INTEGRATION_API_KEY` | *(32-character random string)* |
5. Click **Create Web Service**.

---

## Phase 4: Deploy Frontend on Vercel

1. Log in to [Vercel](https://vercel.com/new).
2. Click **Add New...** -> **Project**.
3. Import your GitHub repository (`zeexai-crm`).
4. In the **Configure Project** screen:
   - **Project Name**: `zeexai-crm` (or `z-crm`)
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click *Edit* and select `crm-frontend` (or leave as `./` — our root `vercel.json` handles both!)
5. Under **Environment Variables**, add:
   | Name | Value |
   |---|---|
   | `VITE_CRM_API_URL` | `https://zeexai-crm-backend.onrender.com/api` *(Your Render URL from Phase 3)* |
   | `VITE_BASE_PATH` | `./` |
6. Click **Deploy**.
7. Vercel will build and assign a production URL (e.g., `https://zeexai-crm.vercel.app`).

---

## Phase 5: Connect Frontend & Backend URLs

1. Return to your Render Web Service dashboard -> **Environment** tab.
2. Update `CLIENT_URL` with your final Vercel domain:
   ```
   CLIENT_URL=https://zeexai-crm.vercel.app
   ```
3. Click **Save Changes** (Render will automatically redeploy).

---

## Phase 6: Seed Production Database (Optional)

If you wish to initialize the database with default users and records on Render:
1. On Render, navigate to your Web Service -> click the **Shell** tab.
2. Run:
   ```bash
   npm run seed
   ```
3. Your database is now populated with:
   - **Superadmin**: `superadmin@zeexai.com` / `Admin@123`
   - **Admin**: `admin@zeexai.com` / `Admin@123`
   - **Intern**: `intern@zeexai.com` / `Intern@123`

---

## Summary of Deployment Assets Created in Repo

| File | Purpose |
|---|---|
| [`render.yaml`](./render.yaml) | Render Infrastructure-as-Code Blueprint |
| [`crm-backend/Dockerfile`](./crm-backend/Dockerfile) | Containerized deployment configuration for backend |
| [`vercel.json`](./vercel.json) | Root Vercel SPA router and monorepo build configuration |
| [`crm-frontend/vercel.json`](./crm-frontend/vercel.json) | Standalone frontend Vercel SPA routing rules |
| [`.gitignore`](./.gitignore) | Strict security ignore rules (protects all `.env` secrets) |
| [`crm-frontend/vite.config.ts`](./crm-frontend/vite.config.ts) | Universal relative asset resolver for zero-broken paths |
| [`crm-backend/src/index.ts`](./crm-backend/src/index.ts) | Permissive production CORS for Vercel domains with credentials |
| [`crm-backend/src/routes/auth.ts`](./crm-backend/src/routes/auth.ts) | Cross-site `SameSite: None; Secure` cookie support |

