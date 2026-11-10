# ZEE X AI CRM — Full Stack Platform Documentation

## Overview
The **ZEE X AI CRM** is a dedicated, enterprise-grade Customer Relationship Management system custom-tailored for ZEE X AI. It powers lead intake, pipeline management, client demonstrations, marketing attribution, and quotation management.

### Key Architectural Highlights
- **Separate Application Architecture**: Runs as an independent Node.js / Express backend with its own MongoDB Atlas database, and a standalone Vite / React frontend.
- **Path-Based Routing**: Configured to be served seamlessly at `https://zeexai.com/crm` via reverse proxy or rewrites without interfering with the primary website codebase.
- **Secure Authentication**: JWT token-based auth with HttpOnly refresh cookies, bcrypt password hashing, and role-based access control (`SUPERADMIN`, `ADMIN`, `SALES_REP`).
- **Website Integration API**: Provides a protected server-to-server intake endpoint (`/api/intake/website-contact`) secured with `X-Integration-Key` to capture leads from `https://zeexai.com/contact`.

---

## Getting Started (Local Development)

### Prerequisites
- Node.js >= 18.x
- MongoDB Atlas cluster URI (or local MongoDB 6.0+)
- npm or pnpm

### 1. Backend Setup
```bash
cd crm-backend
cp .env.example .env
# Edit .env and supply your MONGODB_URI and JWT_SECRET
npm install
npm run seed     # Seeds default SUPERADMIN (admin@zeexai.com / Admin@123) and sample leads
npm run dev      # Runs API server on http://localhost:4000
```

### 2. Frontend Setup
```bash
cd crm-frontend
npm install
npm run dev      # Starts Vite dev server on http://localhost:3001/crm/
```

Access the CRM portal at:
```
http://localhost:3001/crm/login
```
Sign in with:
- **Email**: `admin@zeexai.com`
- **Password**: `Admin@123`

