# Adding Google Analytics to CLINKA

## What changed
- `frontend/app/layout.tsx`: loads GA4 via `@next/third-parties/google`, only when a measurement ID is set.
- `frontend/.env.example`: documents the new `NEXT_PUBLIC_GA_ID` variable.
- `frontend/package.json` / `package-lock.json`: added the `@next/third-parties` dependency.

No backend changes, no new pages, no new UI to maintain — GA's own dashboard is the "analytics page."

## How to apply
From your repo root:
```bash
git apply changes.patch
cd frontend && npm install
```
(or just copy `layout.tsx` and `.env.example` over the existing files and add the one line to `package.json`, then `npm install`.)

## One-time setup (you or the client can do this)
1. Go to https://analytics.google.com and create a GA4 property for the site (use the production domain, e.g. clinka.com).
2. In the property setup, create a **Web** data stream — this gives you a Measurement ID like `G-XXXXXXXXXX`.
3. Add it to your production environment (Vercel project settings → Environment Variables):
   `NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX`
4. Redeploy. Leave this variable unset in local/dev `.env.local` so local traffic isn't tracked.

## Giving the client access
In the GA4 property → **Admin → Property Access Management** → add the client's Google account email as a **Viewer**. He'll then see, in Google's own dashboard, with no custom UI to maintain:
- real-time and historical visitor counts
- traffic sources (Google, social, direct, referral)
- most-viewed pages
- device/browser/location breakdown
- (optional later) conversion events — e.g. "signed up," "posted a project" — if you want to track specific actions, which is a one-line `gtag` call per event, no extra infrastructure.

That last point is the "add more things without complexity" path: GA4 tracks pageviews automatically, and any specific action you later want counted is just one additional `sendGAEvent()` call from `@next/third-parties/google` at the point it happens in your code — no new dashboard, no new backend.
