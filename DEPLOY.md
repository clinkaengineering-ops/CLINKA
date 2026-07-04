# CLINKA deployment guide

CLINKA is a monorepo: **Next.js frontend** + **Express/Socket.IO backend** + **PostgreSQL**.

Recommended split:

| Component | Platform | Why |
|-----------|----------|-----|
| Frontend | [Vercel](https://vercel.com) | Native Next.js hosting |
| API + WebSockets | [Render](https://render.com) (Docker) | Persistent WebSocket connections |
| Database | Neon, Supabase, or Render Postgres | Managed PostgreSQL |
| Redis (optional) | Upstash or Render Redis | OAuth state + payout token cache |
| Files | Cloudinary | Already integrated |

## 1. Database

1. Create a PostgreSQL database and copy the connection string.
2. Run migrations once (or let the API run them on boot via `start:prod`):

```bash
cd backend
DATABASE_URL="postgresql://..." npm run db:migrate
```

## 2. Backend API

### Option A — Render (recommended)

1. Push this repo to GitHub.
2. In Render: **New → Blueprint** and select `render.yaml`, or create a **Web Service** with:
   - **Root directory:** `backend`
   - **Runtime:** Docker (uses `backend/Dockerfile`)
   - **Health check path:** `/api/health`
3. Set environment variables from `backend/.env.example`.
4. Set `API_URL` to your Render service URL (e.g. `https://clinka-api.onrender.com`).
5. Set `CLIENT_URL` to your frontend URL (e.g. `https://clinka.vercel.app`).

### Option B — Docker (any VPS)

```bash
cd backend
docker build -t clinka-api .
docker run -p 5000:5000 --env-file .env clinka-api
```

## 3. Frontend (Vercel)

1. Import the repo in Vercel.
2. Set **Root Directory** to `frontend`.
3. Add environment variables from `frontend/.env.example`:
   - `NEXT_PUBLIC_API_URL` = `https://YOUR-API-URL/api`
   - `NEXT_PUBLIC_PAYMENT_CURRENCY` = `EGP` (or your currency)
4. Deploy.

## 4. Third-party setup checklist

### Google OAuth
- Authorized JavaScript origins: `CLIENT_URL`
- Authorized redirect URI: `{API_URL}/api/auth/google/callback`
- Set `GOOGLE_REDIRECT_URI` to match exactly.

### Paymob
In the Paymob dashboard (per integration):
- **Redirect URL:** `{CLIENT_URL}/checkout`
- **Webhook URL:** `{API_URL}/api/payments/webhook/paymob`
- Set `PAYMOB_DEV_FALLBACK=false` in production.

### Cloudinary
- Create an upload preset if needed; credentials go in backend env vars.

### Email (SMTP)
- Configure `EMAIL_HOST`, `EMAIL_USER`, `EMAIL_PASS`.
- Commit or mount `backend/assets/clinka-logo.png` for branded emails.

## 5. Production env summary

**Backend (`backend/.env`):**

```
NODE_ENV=production
DATABASE_URL=...
JWT_SECRET=...
CLIENT_URL=https://your-frontend.com
API_URL=https://your-api.com
... (see backend/.env.example)
```

**Frontend (Vercel env vars):**

```
NEXT_PUBLIC_API_URL=https://your-api.com/api
NEXT_PUBLIC_PAYMENT_CURRENCY=EGP
```

## 6. Verify

```bash
# Health check
curl https://your-api.com/api/health

# Build locally
npm run build
```

Open the frontend, sign in, send a message (WebSocket), and run a test checkout in Paymob sandbox before going live.

## Local development

```bash
npm run dev              # both services
cd backend && npm run db:setup   # Postgres via Docker + migrations
```

Copy `backend/.env.example` → `backend/.env` and `frontend/.env.example` → `frontend/.env.local`.
