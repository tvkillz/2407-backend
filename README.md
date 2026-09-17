# 2407 Backend

API and supporting services for [2407.services](https://2407.services): contact form submissions, admin auth, and file storage.

This folder is the **production** Docker stack on the server (`/var/www/magento/2407-backend`). Do not edit it through the local rclone mount. Change locally, verify, then deploy.

Public API: `https://api.2407.services`

## Services

| Container | Role | Port (inside Docker) |
|-----------|------|----------------------|
| `2407_backend` | Express + TypeScript API | `3000` |
| `2407_mongodb` | MongoDB 7 (auth enabled) | `27017` |
| `2407_file_storage` | Internal upload store | `4000` (not published to the host) |
| `2407_mongoexpress` | MongoDB UI | `8081` |

All four share `2407_network`. The API also joins the external `magento_magento` network.

On start, MongoDB runs `mongo-init.js`: creates the app user and a `contacts` collection with indexes on `email`, `createdAt`, and `status`.

## Layout

```
2407-backend/
├── docker-compose.yml
├── mongo.conf
├── mongo-init.js
├── backend/          # public API (Node 20, TypeScript)
└── file_storage/     # internal file service (Node 18)
```

## Run

From this directory, with a `.env` next to `docker-compose.yml`:

```bash
docker compose up -d --build
docker compose ps
docker compose logs -f 2407_backend
```

Stop:

```bash
docker compose down
```

`docker compose down` does **not** delete named volumes (`2407_mongodb_data`, `2407_file_storage_uploads`). Data survives restarts.

Health checks:

- API: `GET /health` on port 3000
- File storage: `GET /health` on port 4000 (Docker network only)
- MongoDB: `mongosh` ping (compose healthcheck)

## Environment

Compose reads these from `.env` (never commit secrets):

| Variable | Used by |
|----------|---------|
| `MONGODB_ROOT_USERNAME` / `MONGODB_ROOT_PASSWORD` | MongoDB root + mongo-express |
| `MONGODB_USER` / `MONGODB_USER_PASSWORD` | App DB user |
| `MONGODB_DATABASE` | App database name |
| `MONGODB_PORT` | Host mapping for MongoDB |
| `MONGO_EXPRESS_USERNAME` / `MONGO_EXPRESS_PASSWORD` | mongo-express basic auth |
| `MONGO_EXPRESS_PORT` | Host mapping for mongo-express |
| `PORT` | Host mapping for the API (default `3000`) |
| `LOCALHOST_PREFIX` | Bind prefix for published ports (e.g. `127.0.0.1:`) |
| `NODE_ENV` | `development` or `production` |
| `CORS_ORIGIN` | Comma-separated allowed origins |
| `ADMIN_API_KEY` | `x-api-key` for register and some file/contact routes |
| `JWT_SECRET` / `JWT_EXPIRES_IN` | Admin login tokens (default expiry `7d`) |
| `FILE_STORAGE_URL` | URL the API uses to reach `2407_file_storage` |
| `MAX_FILE_SIZE` | Upload size limit |
| `FILE_STORAGE_UPLOAD_DIR` | Upload directory inside file storage (default `uploads`) |

The API connects to MongoDB as:

`mongodb://<user>:<pass>@2407_mongodb:27017/<database>?authSource=admin`

CORS must include the admin local origin (`http://localhost:5173`) if you develop the admin UI locally against this API.

## API (`2407_backend`)

| Method | Path | Auth |
|--------|------|------|
| `GET` | `/health` | none |
| `POST` | `/api/auth/register` | `x-api-key` |
| `POST` | `/api/auth/login` | none (rate limited) |
| `GET` | `/api/auth/me` | JWT |
| `POST` | `/api/contact` | none (public form; optional files) |
| `GET` | `/api/contact` | `x-api-key` |
| `GET` | `/api/contact/:id` | `x-api-key` |
| `GET` | `/api/contact/:id/files/:filename` | `x-api-key` |
| `GET` | `/api/submissions` | JWT |
| `GET` | `/api/submissions/:id` | JWT |
| `PUT` / `PATCH` | `/api/submissions/:id` | JWT |
| `DELETE` | `/api/submissions/:id` | JWT |
| `GET` | `/api/submissions/:id/files/:filename` | JWT |
| `POST` | `/api/files/:folder` | `x-api-key` |
| `GET` | `/api/files/:folder/:filename` | `x-api-key` |
| `DELETE` | `/api/files/:folder/:filename` | `x-api-key` |

JWT login is rate-limited (20 requests / 15 minutes). Uploads are capped (contact files: up to 10 per request; max size from `MAX_FILE_SIZE`, currently 25 MB in the API error message).

Dev command inside the container: `npm run dev` (TypeScript via `ts-node-dev`, source bind-mounted). `node_modules` come from the image / named volume — do not run `npm install` at container start (bind-mounted sources are root-owned).

## File storage (`2407_file_storage`)

Internal only — no host port in compose. The API talks to it over `2407_network`.

| Method | Path |
|--------|------|
| `GET` | `/health` |
| `POST` | `/upload/:folder?` |
| `GET` | `/files/:folder/:filename` |
| `DELETE` | `/files/:folder/:filename` |
| `POST` | `/create-folder/:folder` |

Uploads persist in the `2407_file_storage_uploads` volume.

## Admin UI

The Refine admin app is **not** in this folder. It lives in the local `2407-admin/` repo and deploys as static files at `https://2407.services/admin`.

See `2407-admin/README.md` for local run, first-user register, and production build.
