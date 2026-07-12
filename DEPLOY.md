# CLINKA deployment guide

CLINKA is a monorepo: **Next.js frontend** + **Express/Socket.IO backend** + **PostgreSQL**.

Recommended stack:

| Component | Platform | Why |
|-----------|----------|-----|
| Frontend | [Vercel](https://vercel.com) or Coolify/Dokploy | Native Next.js hosting |
| API + WebSockets | [Coolify](https://coolify.io) or [Dokploy](https://dokploy.com) on your VPS | Full control, WebSocket support |
| Database | Coolify/Dokploy Postgres, Neon, or Supabase | Managed PostgreSQL |
| Redis (optional) | Coolify/Dokploy Redis or Upstash | OAuth state + payout token cache |
| Files | Cloudinary | Already integrated |

## 1. Database

1. Create a PostgreSQL database and copy the connection string.
2. Run migrations once (or let the API run them on boot via `start:prod`):

```bash
cd backend
DATABASE_URL="postgresql://..." npm run db:migrate
```

## 2. Backend API (Coolify or Dokploy)

Both platforms deploy Node.js apps on your VPS **without you writing a Dockerfile**. They handle builds internally (Nixpacks/buildpacks).

### Coolify

1. Add your Git repo as a new **Application**.
2. Set **Base directory** to `backend`.
3. Set **Build command:** `npm ci && npm run build`
4. Set **Start command:** `npm run start:prod`
5. Set **Port:** `5000`
6. Add env vars from `backend/.env.example` (`NODE_ENV=production`, etc.).
7. Set `API_URL` to your API domain (e.g. `https://api.clinka.com`).
8. Set `CLIENT_URL` to your frontend domain.
9. Enable **WebSocket** support in the proxy settings (required for messaging).

### Dokploy

1. Create a new **Application** from your Git repo.
2. Set **Root path** to `backend`.
3. **Build:** `npm ci && npm run build`
4. **Start:** `npm run start:prod`
5. **Port:** `5000`
6. Add the same environment variables as above.
7. Ensure the reverse proxy forwards WebSocket upgrades.

### Health check

Point your platform health check to `/api/health`.

## 3. Frontend

### Vercel (simplest for Next.js)

1. Import the repo; set **Root Directory** to `frontend`.
2. Add env vars from `frontend/.env.example`:
   - `NEXT_PUBLIC_API_URL` = `https://YOUR-API-URL/api`
   - `NEXT_PUBLIC_PAYMENT_CURRENCY` = `USD`

### Coolify / Dokploy

1. New application, **Base directory:** `frontend`.
2. **Build:** `npm ci && npm run build`
3. **Start:** `npm run start`
4. **Port:** `3000` (or whatever `PORT` is set to)
5. Set `NEXT_PUBLIC_API_URL` at build time.

## 4. Third-party setup

### Google OAuth
- Authorized JavaScript origins: `CLIENT_URL`
- Authorized redirect URI: `{API_URL}/api/auth/google/callback`

### Paymob
- **Redirect URL:** `{CLIENT_URL}/checkout`
- **Webhook URL:** `{API_URL}/api/payments/webhook/paymob`
- Set `PAYMOB_*` credentials from your Paymob dashboard.

### Email (SMTP)
- `backend/assets/email-logo.png` is bundled with the API for branded emails.

## 5. Verify

```bash
curl https://your-api.com/api/health
npm run build
```

## Local development

```bash
npm run dev
cd backend && npm run db:setup   # Postgres via Docker Compose + migrations
```

Copy `backend/.env.example` → `backend/.env` and `frontend/.env.example` → `frontend/.env.local`.

**Note:** `backend/docker-compose.yml` is only for local Postgres — not used in production deployment.
