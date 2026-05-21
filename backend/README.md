# CLINKA Backend

## Setup

```bash
cp .env.example .env
npm install
npx prisma migrate dev
npm run dev
```

`DATABASE_URL` is set in `prisma.config.ts` (Prisma 7), not in `schema.prisma`.

## Scripts

- `npm run dev` — API on port 5000 (default)
- `npm run build` / `npm start` — production

## Payments (Fawaterk)

- Live API base: `https://app.fawaterk.com/api/v2`
- Staging: `https://staging.fawaterk.com/api/v2`
- Webhook: `POST /api/payments/webhook_json`
