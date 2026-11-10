# ZEE X AI CRM — REST API Documentation

## Base URL
- **Local Dev**: `http://localhost:4000/api`
- **Production**: `https://api.crm.zeexai.com/api` (or reverse-proxied via `/crm/api`)

---

## 1. Authentication (`/auth`)

### `POST /auth/login`
- **Description**: Authenticate staff member, issue short-lived JWT access token and set HttpOnly refresh token cookie.
- **Request Body**:
```json
{
  "email": "admin@zeexai.com",
  "password": "Admin@123"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "accessToken": "eyJhbGciOi...",
  "user": {
    "id": "664c1...",
    "name": "Arun Saravanan",
    "email": "admin@zeexai.com",
    "role": "SUPERADMIN"
  }
}
```

### `POST /auth/refresh`
- **Description**: Rotates access token using `crm_refresh_token` HttpOnly cookie.
- **Response `200 OK`**:
```json
{
  "success": true,
  "accessToken": "eyJhbGciOi..."
}
```

### `POST /auth/logout`
- **Description**: Clears refresh token cookie and invalidates session.

---

## 2. Dashboard Intelligence (`/dashboard`)
*Requires `Authorization: Bearer <accessToken>`*

- `GET /dashboard/stats` — Overall KPI metrics (Total leads, New leads, Qualified, Pending).
- `GET /dashboard/pipeline-funnel` — Funnel stage counts & conversion rate.
- `GET /dashboard/todays-schedule` — Today's meetings and demonstrations.
- `GET /dashboard/recent-activity` — Recent activity feed.

---

## 3. Leads Management (`/leads`)
*Requires `Authorization: Bearer <accessToken>`*

### `GET /leads`
- **Query Params**:
  - `page` (number, default: 1)
  - `limit` (number, default: 20)
  - `search` (string)
  - `product` (string)
  - `status` (string)
  - `priority` (string)
- **Response**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "664c2...",
      "leadId": "LD-1048",
      "firstName": "Aarav",
      "lastName": "Mehta",
      "company": "Vertex Manufacturing",
      "email": "aarav.mehta@vertexmfg.com",
      "interestedProduct": "Z-Factory",
      "status": "New",
      "priority": "High"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 248,
    "totalPages": 13
  }
}
```

### `POST /leads`
- **Request Body**:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "company": "Acme Corp",
  "email": "john@acme.com",
  "phone": "+1 555-0199",
  "interestedProduct": "Z-Tracs",
  "priority": "Urgent",
  "requirements": "Need perimeter AI surveillance"
}
```

### `PATCH /leads/:id`
- Updates lead status, priority, or notes.

### `DELETE /leads/:id`
- *(SUPERADMIN or ADMIN only)* Deletes a lead record.

---

## 4. Website Server-to-Server Intake (`/intake`)
*Requires `X-Integration-Key: <INTEGRATION_API_KEY>` header*

### `POST /intake/website-contact`
- **Description**: Receives public contact form submissions from the main website backend without exposing database credentials.
- **Headers**:
  - `Content-Type: application/json`
  - `X-Integration-Key: <INTEGRATION_API_KEY>`
- **Request Body**:
```json
{
  "name": "Jane Smith",
  "email": "jane@smithlogistics.com",
  "phone": "+91 98765 00000",
  "message": "Interested in Z-Drone autonomous security demonstration."
}
```
- **Response `201 Created`**:
```json
{
  "success": true,
  "message": "Lead created successfully from website contact form",
  "leadId": "LD-1049",
  "id": "664c3...",
  "isDuplicate": false
}
```

