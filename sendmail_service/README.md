# 2407 Email Service

Internal mailer for [2407.services](https://2407.services). Express + Microsoft Graph `sendMail` as `kontakt@2407.services`.

No public port in production — only `2407_backend` should call it on `2407_network`. Security defaults stay on; SMTP AUTH is not used.

## API

| Method | Path | Notes |
|--------|------|--------|
| `POST` | `/api/email/send` | Send HTML mail |
| `GET` | `/api/email/health` | Graph token check |
| `GET` | `/health` | Process liveness |
| `GET` | `/api-docs` | Swagger UI |

```json
{
  "recipients": ["kontakt@2407.services"],
  "replyTo": "visitor@example.com",
  "subject": "New contact submission",
  "body": "<p>Hello</p>"
}
```

`From` is always `GRAPH_SENDER`. Use `replyTo` for the visitor.

## Environment

Compose reads these from `/var/www/magento/2407-backend/.env`:

| Variable | Example |
|----------|---------|
| `GRAPH_TENANT_ID` | Entra directory (tenant) ID |
| `GRAPH_CLIENT_ID` | App registration client ID |
| `GRAPH_CLIENT_SECRET` | App client secret **Value** |
| `GRAPH_SENDER` | `kontakt@2407.services` |
| `GRAPH_FROM_NAME` | `2407` |

App needs **Microsoft Graph → Application → Mail.Send** + admin consent.

## Deploy

```bash
cd /var/www/magento/2407-backend
docker compose up -d --force-recreate 2407_sendmail
docker compose logs -f 2407_sendmail
```

Health:

```bash
docker exec 2407_sendmail node -e "require('http').get('http://127.0.0.1:6001/api/email/health',r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>console.log(r.statusCode,d))})"
```
