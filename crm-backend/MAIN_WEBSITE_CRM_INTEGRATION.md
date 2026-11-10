# Main Website to CRM Integration Guide

## Executive Summary
This document provides exact instructions for the developer maintaining the **ZEE X AI main website** (`https://zeexai.com`, codebase in `zeex-web/backend/app.py`).

The main website does **not** connect directly to the CRM's MongoDB Atlas database. Instead, whenever a user submits the public contact form or requests a demo, the main website's Python backend will securely forward the lead to the CRM REST API via a server-to-server integration endpoint.

---

## The Integration Endpoint
- **URL**: `https://api.crm.zeexai.com/api/intake/website-contact` *(or `http://localhost:4000/api/intake/website-contact` in development)*
- **HTTP Method**: `POST`
- **Security**: Authenticated using header `X-Integration-Key`

---

## Exact Changes Required in `zeex-web/backend/app.py`

In `zeex-web/backend/app.py`, locate the `@app.route('/api/contact', methods=['POST'])` function.

### Step 1: Add Environment Variable in `zeex-web/backend/.env`
```env
CRM_API_URL=http://localhost:4000/api/intake/website-contact
CRM_INTEGRATION_KEY=your_integration_api_key_here
```

### Step 2: Update the Python Code in `app.py`
Add this helper function:
```python
def forward_to_crm(name, email, phone, message):
    crm_url = os.getenv('CRM_API_URL', 'http://localhost:4000/api/intake/website-contact')
    crm_key = os.getenv('CRM_INTEGRATION_KEY', '')

    if not crm_key:
        print("Warning: CRM_INTEGRATION_KEY not configured. Skipping CRM sync.")
        return

    payload = {
        "name": name,
        "email": email,
        "phone": phone,
        "message": message,
        "source": "Contact form"
    }
    headers = {
        "Content-Type": "application/json",
        "X-Integration-Key": crm_key
    }
    try:
        resp = requests.post(crm_url, json=payload, headers=headers, timeout=5)
        if resp.status_code == 201:
            print(f"Lead successfully forwarded to CRM: {resp.json().get('leadId')}")
        else:
            print(f"CRM sync returned status {resp.status_code}: {resp.text}")
    except Exception as e:
        # Non-blocking error handling: Ensure user still receives success confirmation even if CRM is down
        print(f"Non-critical error syncing with CRM: {e}")
```

Call `forward_to_crm(name, email, phone, message)` immediately before returning `jsonify({"success": True, ...})` in the `/api/contact` endpoint handler.

---

## Verification Test with `curl`
```bash
curl -X POST http://localhost:4000/api/intake/website-contact \
  -H "Content-Type: application/json" \
  -H "X-Integration-Key: your_integration_api_key_here" \
  -d '{
    "name": "Integration Test Lead",
    "email": "test@lead.com",
    "phone": "+91 99999 88888",
    "message": "Testing automated website lead intake pipeline."
  }'
```
Expected response:
```json
{
  "success": true,
  "message": "Lead created successfully from website contact form",
  "leadId": "LD-1049",
  "isDuplicate": false
}
```
The new lead will instantly appear in the CRM **Leads & Requests** dashboard table.

