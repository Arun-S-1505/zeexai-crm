# ZEE X AI CRM — Frontend Application

## Overview
Standalone React 18 + Vite + TypeScript application for the ZEE X AI CRM.

Designed to operate independently from the primary corporate website while adhering to the `/crm` path-based routing structure.

---

## Local Development
```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Set VITE_CRM_API_URL=http://localhost:4000/api
# Set VITE_BASE_URL=/crm

# 3. Start development server
npm run dev
```

The app will be accessible at `http://localhost:3001/crm/`.

---

## Production Build
```bash
npm run build
```
Build assets are placed in `./dist/` configured with base path `/crm/`.

