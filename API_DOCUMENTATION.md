# ZEE X AI CRM — REST API Documentation

Base API URL: `http://localhost:4000/api` (Production: `https://zeexai.com/api` or `/crm/api`)

All endpoints (except `/auth/login`, `/auth/refresh`, and `/intake/*`) require a Bearer token in the Authorization header:
```http
Authorization: Bearer <accessToken>
```

---

## 1. Authentication (`/api/auth`)
- `POST /login`: Authenticate with `email`, `password`, and optional `role`. Returns JWT `accessToken` and user object.
- `POST /refresh`: Refresh session token via HTTP-only cookie.
- `POST /logout`: Clear session cookies.
- `GET /me`: Get authenticated user profile.

---

## 2. Brochure Downloads (`/api/brochure-downloads`)
- `GET /`: List brochure downloads with search, `brochureType`, `status`, date filters, pagination, and KPI metrics.
- `GET /:id`: Detail view with repeat history.
- `POST /`: Manual creation with option to auto-generate a corresponding lead.
- `PUT /:id`: Update download record.
- `DELETE /:id`: Delete record.

---

## 3. Meeting Schedule (`/api/schedule`)
- `GET /`: List scheduled appointments with search, `type`, `status`, date range, and `assignedTo` filters.
- `POST /`: Book new appointment. **Includes Conflict Detection Engine**: returns HTTP 409 if assigned employee has an active meeting at the same date and time slot.
- `PUT /:id`: Edit or reschedule appointment.
- `DELETE /:id`: Cancel/delete meeting.

---

## 4. Marketing Campaigns (`/api/campaigns`)
- `GET /`: List campaigns with dynamic KPI calculations (**Conversion Rate %**, **Cost Per Lead**, **ROI %**).
- `GET /:id`: Campaign detail view with attributed leads.
- `POST /`: Create campaign.
- `POST /:id/duplicate`: Duplicate campaign with new sequence ID in Draft status.
- `PATCH /:id`: Toggle status (e.g. Active / Paused).
- `DELETE /:id`: Delete campaign.

---

## 5. Direct Mail (`/api/direct-mail`)
- `GET /`: List mail dispatch records with metrics (`pending`, `dispatched`, `delivered`, `returned`).
- `GET /:id`: Detail view with full status history.
- `POST /`: Create dispatch record (auto-generates `DM-XXXX`).
- `PUT /:id`: Update record.
- `PATCH /:id/status`: Update dispatch date, delivery date, carrier, and tracking number.
- `DELETE /:id`: Delete record.

---

## 6. Quotations (`/api/quotations`)
- `GET /`: List quotations with pipeline value, acceptance rate, and status filters.
- `GET /:id`: Detail view with line items.
- `POST /`: Create quotation. **Server calculates**:
  - `Line Total = (qty * unitPrice) * (1 - discount/100) * (1 + taxRate/100)`
  - Subtotal, Discount Total, GST Tax Total, Grand Total.
- `PUT /:id`: Update quotation and recompute totals.
- `POST /:id/duplicate`: Clone into new draft quote (`QT-2026-XXX`).
- `PATCH /:id/status`: Transition status (*Draft → Pending Approval → Approved → Sent → Accepted → Rejected*).
- `DELETE /:id`: Delete quotation.

---

## 7. Lead Assignment (`/api/assignments`)
- `GET /leads`: List leads with current assignment information and follow-up deadlines.
- `GET /metrics`: Dashboard summary metrics (total, assigned, unassigned, assigned today, overdue).
- `GET /workload`: Employee workload capacity breakdown (assigned, open, won, overdue).
- `POST /assign`: Assign single lead with reason, priority, and handoff notes.
- `POST /bulk-assign`: Assign array of lead IDs to a team member.
- `POST /round-robin`: Automatically distribute unassigned leads evenly among active staff.
- `GET /history/:leadId`: Full audit trail of assignments and reassignments.

---

## 8. Acknowledgements (`/api/acknowledgements`)
- `GET /`: List formal acknowledgements with search and type filters.
- `GET /:id`: Detail view.
- `POST /`: Create acknowledgement with automated template generation.
- `PUT /:id`: Update record.
- `PATCH /:id/status`: Update status (*Sent, Acknowledged, Rejected*).
- `DELETE /:id`: Delete record.

---

## 9. Client Messages & Dispatch (`/api/messages`)
- `GET /conversations`: List active message threads with channel and status filters.
- `GET /conversations/:id`: Full chat thread and linked lead details.
- `POST /conversations`: Initiate new client thread.
- `POST /conversations/:id/reply`: Send outbound reply.
- `POST /conversations/:id/note`: Add internal staff note (`isInternalNote: true`).
- `PATCH /conversations/:id/status`: Update conversation status.
- `PATCH /conversations/:id/assign`: Assign thread to a staff member.
- `POST /conversations/:id/convert-lead`: Convert inquiry into a new pipeline Lead (`LD-XXXX`).

---

## 10. Reports & Analytics (`/api/reports`)
- `GET /analytics`: Multi-module aggregation engine returning:
  - Lead conversion rate, won deals, pipeline breakdown.
  - Campaign spend, revenue, and ROI.
  - Quotation value and acceptance rate.
  - Meeting outcomes.
  - Employee conversion velocity.

---

## 11. Settings & Governance (`/api/settings`)
- `GET /general`: Fetch organization profile.
- `PUT /general`: Save organization profile.
- `GET /users`: List CRM staff members.
- `POST /users`: Add staff member.
- `PATCH /users/:id/role`: Change role.
- `PATCH /users/:id/status`: Activate / deactivate user account.
- `POST /users/:id/reset-password`: Reset password.
- `GET /integrations`: System integration status checks.
- `GET /audit-logs`: Audit trail of administrative actions.

---

## 12. Public Website Ingestion API (`/api/intake`)
Protected via `X-Integration-Key` header:
- `POST /website-contact`: Public website contact form ingestion.
- `POST /brochure-download`: Public website brochure download ingestion.

