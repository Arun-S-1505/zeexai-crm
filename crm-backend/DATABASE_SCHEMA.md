# ZEE X AI CRM — Database Schema & Data Models

## Technology
- **Database Engine**: MongoDB Atlas
- **Driver / ODM**: Mongoose v8
- **Primary Database Name**: `zeexai_crm`

---

## Collections & Schema Specifications

### 1. `users`
Stores CRM team members, access roles, and authentication hashes.

| Field | Type | Index / Constraints | Description |
|---|---|---|---|
| `_id` | ObjectId | Primary Key | Unique user identifier |
| `name` | String | Required | Full name of staff member |
| `email` | String | Unique, Indexed, Lowercase | Work email address |
| `password` | String | Required | bcrypt salt-hashed password (cost factor 12) |
| `role` | String | Enum: `SUPERADMIN`, `ADMIN`, `SALES_REP` | Authorization role |
| `isActive` | Boolean | Default: `true` | Active status toggle |
| `lastLogin` | Date | Optional | Timestamp of last successful authentication |
| `createdAt` | Date | Timestamp | Creation timestamp |
| `updatedAt` | Date | Timestamp | Last update timestamp |

### 2. `leads`
Stores all inbound prospective clients, demo requests, and customer pipeline stages.

| Field | Type | Index / Constraints | Description |
|---|---|---|---|
| `_id` | ObjectId | Primary Key | Unique lead database ID |
| `leadId` | String | Unique, Indexed | Auto-increment identifier (e.g. `LD-1048`) |
| `firstName` | String | Required, Text Index | First name |
| `lastName` | String | Required, Text Index | Last name |
| `company` | String | Required, Text Index | Business / Organization name |
| `email` | String | Required, Indexed | Contact email address |
| `phone` | String | Optional | Contact phone number |
| `interestedProduct` | String | Enum: `Z-Factory`, `Z-Tracs`, `Z-Market`, `Z-Drone`, `Z-Consultancy` | Associated solution product |
| `source` | String | Enum: `Website enquiry`, `Brochure download`, `Marketing campaign`, `Referral`, `Direct outreach`, `Contact form` | Origin attribution |
| `status` | String | Indexed, Enum: `New`, `Contacted`, `Qualified`, `Demo Scheduled`, `Proposal Sent`, `Negotiation`, `Won`, `Lost` | Pipeline stage |
| `priority` | String | Enum: `Low`, `Medium`, `High`, `Urgent` | Urgency tier |
| `requirements` | String | Optional | Notes on customer needs |
| `assignedTo` | ObjectId (Ref `User`) | Optional, Indexed | Designated account executive |
| `isDuplicate` | Boolean | Default: `false` | Duplicate detection indicator |
| `createdAt` | Date | Compound Index (`status`, `createdAt`) | Timestamp |

### 3. `brochuredownloads`
Audit logs of visitors downloading technical brochures and whitepapers.

| Field | Type | Index / Constraints | Description |
|---|---|---|---|
| `_id` | ObjectId | Primary Key | Download record ID |
| `name` | String | Required | Name of requester |
| `email` | String | Required, Indexed | Requester email |
| `company` | String | Optional | Organization |
| `phone` | String | Optional | Contact number |
| `productInterest`| String | Optional | Associated product |
| `createdAt` | Date | Timestamp | Download timestamp |

### 4. `scheduleevents`
Calendar appointments, product walkthroughs, and client meetings.

| Field | Type | Index / Constraints | Description |
|---|---|---|---|
| `_id` | ObjectId | Primary Key | Event ID |
| `title` | String | Required | Meeting summary |
| `company` | String | Optional | Client organization |
| `type` | String | Required | `Discovery call`, `Demo`, `Follow-up`, etc. |
| `date` | Date | Indexed | Meeting date |
| `time` | String | Optional | Scheduled time string (e.g. `11:00 AM`) |
| `relatedLead` | ObjectId (Ref `Lead`) | Optional | Associated lead |
| `color` | String | Enum: `purple`, `blue`, `green`, `amber`, `red` | UI tag color |

### 5. `messages`, `campaigns`, `quotations`, `acknowledgements`
Standard collections linking to `User` and `Lead` models via Mongoose `ObjectId` references.

