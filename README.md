# ZEE X AI — Enterprise CRM Application

A high-performance, autonomous CRM platform engineered specifically for **ZEE X AI**, featuring real-time pipeline management, intelligent lead assignment, automated financial quotations, multi-channel marketing attribution, and governance security.

---

## 🛠️ Technology Stack
- **Frontend**: React 18, Vite, TypeScript, Lucide Icons, CSS Design System
- **Backend**: Node.js, Express, TypeScript, REST API Architecture
- **Database**: Dedicated MongoDB Atlas Cluster (`zeexai_crm`) with Mongoose ODM
- **Authentication**: JWT Access & Refresh Tokens, bcryptjs Password Hashing
- **Security**: Helmet, CORS origin validation, Rate Limiting, RBAC Enforcement

---

## 🚀 Quick Start & Local Execution

### 1. Prerequisites
- Node.js (v18+)
- npm or pnpm
- Valid MongoDB connection string (configured in `crm-backend/.env`)

### 2. Backend Server Setup
```bash
cd crm-backend
npm install
npm run seed     # Seeds demo users, initial leads, campaigns, quotes, and audit logs
npm run dev      # Starts API server on http://localhost:4000
```

### 3. Frontend Client Setup
```bash
cd crm-frontend
npm install
npm run dev      # Starts React client on http://localhost:3001/crm/
```

Access the CRM in your browser:
**`http://localhost:3001/crm/login`**

---

## 🔑 Demo Access Credentials

| Role | Email | Password |
|---|---|---|
| **SUPERADMIN** | `superadmin@zeexai.com` | `Admin@123` |
| **ADMIN** | `admin@zeexai.com` | `Admin@123` |
| **INTERN** | `intern@zeexai.com` | `Intern@123` |

Clicking any of the role pills on the redesigned login screen will automatically populate these credentials for testing.

---

## 📂 Architecture & Routing
The CRM is designed as an independent application deployable behind a reverse proxy or path router at `/crm`:
- Public Landing: `https://zeexai.com`
- CRM Portal: `https://zeexai.com/crm`
- Login URL: `https://zeexai.com/crm/login`

All API endpoints are prefixed with `/api` and proxied seamlessly during development.

