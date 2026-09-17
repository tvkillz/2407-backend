# 2407 Email Service

Internal SMTP relay for [2407.services](https://2407.services). Node + Express + nodemailer, talking to Office 365 on `smtp.office365.com:587` (STARTTLS).

This folder is a **copy** meant to be dropped into the 2407 backend stack as `sendmail/`. It has no public port in production — only `2407_backend` should call it over `2407_network`.

## API

| Method | Path | Notes |
|--------|------|--------|
| `POST` | `/api/email/send` | Send HTML mail |
| `GET` | `/api/email/health` | SMTP `verify()` against Office 365 |
| `GET` | `/health` | Process liveness (no SMTP) |
| `GET` | `/api-docs` | Swagger UI |

```json
{
  "recipients": ["kontakt@2407.services"],
  "replyTo": "visitor@example.com",
  "subject": "New contact submission",
  "body": "<p>Hello</p>"
}
```

`From` is always `SMTP_FROM` (must match the Office 365 mailbox). Use `replyTo` for the visitor address so replies go to them.

## Environment

Copy `.env.example` to `.env`. Never commit the password.

| Variable | Example |
|----------|---------|
| `SMTP_HOST` | `smtp.office365.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | `kontakt@2407.services` |
| `SMTP_PASSWORD` | mailbox password or app password |
| `SMTP_FROM` | `kontakt@2407.services` |
| `SMTP_FROM_NAME` | `2407` |
| `PORT` | `6001` |

Office 365 requires SMTP AUTH on that mailbox. If MFA / security defaults are on, use an app password. `From` must equal the authenticated user.

## Local test (this folder only)

```bash
cd /home/am/Desktop/sendmail_service
cp .env.example .env   # then set SMTP_PASSWORD
docker compose up --build
curl -s http://127.0.0.1:6001/api/email/health
```

Or without Docker:

```bash
npm install
npm run dev
npm run test:smtp -- you@example.com
```

Standalone compose **does** bind `127.0.0.1:6001` so you can curl it. Production compose must **not** publish that port.

## Integrate into 2407 backend

Do this **on the server** (`/var/www/magento/2407-backend`), not through the local rclone mount.

### 1. Copy the service

```bash
rsync -a --exclude node_modules --exclude .env \
  /home/am/Desktop/sendmail_service/ \
  /var/www/magento/2407-backend/sendmail/
```

### 2. Add the compose service

Paste `compose.snippet.yml` into `docker-compose.yml` next to `2407_file_storage`.

On `2407_backend.environment` add:

```yaml
      - SENDMAIL_URL=${SENDMAIL_URL}
      - CONTACT_NOTIFY_TO=${CONTACT_NOTIFY_TO}
```

On `2407_backend.depends_on` add:

```yaml
      2407_sendmail:
        condition: service_started
```

Under `volumes:` add:

```yaml
  2407_sendmail_node_modules:
```

### 3. Add env vars

In `/var/www/magento/2407-backend/.env` (and `.env.example`):

```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=kontakt@2407.services
SMTP_PASSWORD=change-me
SMTP_FROM=kontakt@2407.services
SMTP_FROM_NAME=2407
SENDMAIL_URL=http://2407_sendmail:6001
CONTACT_NOTIFY_TO=kontakt@2407.services
```

### 4. Call it from the API

Add `backend/src/services/email.service.ts` (same pattern as `file-storage.service.ts`):

```ts
import axios from 'axios';
import logger from '../config/logger';

const SENDMAIL_URL = process.env.SENDMAIL_URL || 'http://2407_sendmail:6001';

export class EmailService {
	static async send(input: {
		recipients: string[];
		subject: string;
		body: string;
		replyTo?: string;
		cc?: string[];
	}): Promise<void> {
		try {
			await axios.post(`${SENDMAIL_URL}/api/email/send`, input, { timeout: 20000 });
		} catch (error) {
			logger.error('Email send failed', { error });
			if (axios.isAxiosError(error)) {
				throw new Error(error.response?.data?.message || 'Email send failed');
			}
			throw error;
		}
	}
}
```

In `ContactService.create`, **after** the contact is saved (and files uploaded), notify without failing the form:

```ts
const notifyTo = process.env.CONTACT_NOTIFY_TO;
if (notifyTo) {
	EmailService.send({
		recipients: [notifyTo],
		replyTo: contact.email,
		subject: `New ${contact.formType} submission`,
		body: `<p><strong>${contact.name || 'Unknown'}</strong> &lt;${contact.email}&gt;</p>
<p>${contact.message || contact.beschreibung || ''}</p>`,
	}).catch((error) => {
		logger.error('Contact notification email failed', { error, id: contact.id });
	});
}
```

Do not roll back the Mongo document if mail fails.

### 5. Recreate containers

```bash
cd /var/www/magento/2407-backend
docker compose up -d --build 2407_sendmail
docker compose up -d 2407_backend
docker exec 2407_sendmail wget -qO- http://127.0.0.1:6001/api/email/health
# alpine may lack wget — then:
docker exec 2407_sendmail node -e "require('http').get('http://127.0.0.1:6001/health',r=>{r.resume();})"
```

Then submit a contact form and confirm mail arrives at `kontakt@2407.services`.
