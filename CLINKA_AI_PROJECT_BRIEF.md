# CLINKA — Full Project Context for AI Document Generation

> **Purpose of this file:** Hand this document to an AI assistant to generate reports, technical specs, proposals, user manuals, pitch decks, or academic documentation about the CLINKA project. It reflects the repository state as of **May 19, 2026**.

---

## 1. Executive Summary

**CLINKA** is a full-stack **engineering marketplace** (MVP) that connects:

- **Clients** — post construction/engineering projects, hire engineers, manage bids, and (planned) escrow payments.
- **Engineers** — verified civil/architectural professionals who browse projects, submit bids, and deliver work.
- **Admins** — verify engineer credentials and manage the platform (UI exists; backend admin APIs are not implemented yet).

The product is branded **CLINKA** with a modern dark/light UI, bilingual i18n support (English + Arabic keys in codebase), and a **feature-based folder structure** on both frontend and backend.

**Repository layout:**

```
CLINKA/
├── backend/          # Express 5 + Prisma + PostgreSQL API
├── frontend/         # Next.js 16 App Router + React 19 + Tailwind 4
├── engineering-marketplace-frontend-development/  # Original UI template/reference
├── breif  for programer.pdf                        # Original Arabic MVP brief (PDF)
├── PROJECT_ARCHITECTURE_REVIEW.md                  # Internal architecture notes
└── CLINKA_AI_PROJECT_BRIEF.md                      # This file
```

---

## 2. Original Product Vision (from MVP Brief)

The PDF brief (`breif  for programer.pdf`) defines an **Engineering Platform MVP** with:

### Core idea
A trusted marketplace where **clients** find **verified engineers** for design, supervision, and review work, with **milestone escrow** and credential verification.

### User roles

| Role | Responsibilities (MVP) |
|------|------------------------|
| **Client** | Register, post projects, review bids, hire engineer, fund escrow, release payments, leave reviews |
| **Engineer** | Register with documents (college ID / certificate / syndicate card), build portfolio, bid on projects, deliver work, receive payment |
| **Admin** | Verify engineers, manage disputes, platform oversight |

### MVP feature areas (from brief)

1. **Authentication** — Register, login, email verification, password reset  
2. **Profiles** — Photo, specialty (civil/architectural), portfolio, ratings, verified badge  
3. **Projects** — Client posts project (title, description, budget, service type)  
4. **Bidding** — Engineers bid; client accepts one bid  
5. **Escrow / payments** — Stripe-based milestone payments (schema exists; not fully wired in UI/API)  
6. **Messaging** — Client–engineer chat per project (schema exists; UI is mock only)  
7. **Reviews** — Post-project ratings (schema exists; limited UI)  
8. **Admin verification** — Approve/reject engineer documents  

---

## 3. Technology Stack

### Frontend (`frontend/`)

| Technology | Version / notes |
|------------|-----------------|
| Next.js | 16.2.6 (App Router) |
| React | 19.2.4 |
| TypeScript | 5.x |
| Tailwind CSS | 4.x |
| Axios | HTTP client, `withCredentials: true` for cookies |
| Zustand | Auth user persisted in `auth-storage` |
| Custom i18n | `frontend/i18n/index.tsx` — EN/AR translation keys |

**Scripts:** `npm run dev` (port 3000), `npm run build`, `npm run start`

### Backend (`backend/`)

| Technology | Version / notes |
|------------|-----------------|
| Node.js + Express | 5.2.1 |
| TypeScript | 6.x |
| Prisma | 7.8.0 → PostgreSQL |
| Redis (ioredis) | OTP storage (`otp:{userId}`, 10 min TTL) |
| bcryptjs | Password hashing |
| jsonwebtoken | JWT in httpOnly cookie `token` |
| Nodemailer | Login OTP + verification + reset emails |
| Cloudinary + Multer | Engineer document upload on registration |
| Stripe SDK | Dependency present; payment flow not implemented in routes |
| Socket.io | Dependency present; real-time messaging not implemented |
| Zod | Request validation |

**Scripts:** `npm run dev` (port 5000), `npm run build`, `npm run start`

### Infrastructure (development)

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000/api`
- CORS: `CLIENT_URL` must match frontend origin
- Auth cookie: `sameSite: lax` in dev, `strict` in production

---

## 4. Architecture

### High-level diagram

```
┌─────────────────────────────────────────────────────────────┐
│  Browser — Next.js (localhost:3000)                         │
│  • Route groups: (marketing), (auth), (app)                 │
│  • features/* — domain modules (auth, projects, engineers…) │
│  • lib/axios.ts — single API client + credentials           │
│  • store/authStore.ts — Zustand user snapshot               │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTPS / HTTP
                            │ REST JSON + Cookie: token=JWT
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Express API (localhost:5000)                               │
│  • /api/auth, /api/users, /api/projects                     │
│  • authenticate middleware — reads req.cookies.token        │
│  • ApiResponse { success, message, data }                   │
└───────────────────────────┬─────────────────────────────────┘
                            │ Prisma
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  PostgreSQL          │  Redis (OTP)  │  Cloudinary (files)  │
└─────────────────────────────────────────────────────────────┘
```

### Authentication flow (implemented)

1. **Register** — `POST /api/auth/register/client` or `register/engineer` (multipart + document).
2. **Email verification** — link with JWT query `GET /api/auth/verify-email?token=...` → sets `isVerified: true`.
3. **Login step 1** — `POST /api/auth/login` → 6-digit OTP stored in Redis, emailed (or logged if SMTP fails).
4. **Login step 2** — `POST /api/auth/verify-otp` → validates OTP, sets **httpOnly cookie** `token`, returns user JSON.
5. **Session** — Frontend calls `GET /api/users/me` with cookie; `AuthProvider` syncs Zustand store.
6. **Logout** — `POST /api/auth/logout` clears cookie.

**Dev tip:** Set `FIXED_OTP=123456` in backend `.env` to skip email OTP during testing.

### Frontend route groups

| Group | Path prefix | Layout | Purpose |
|-------|-------------|--------|---------|
| `(marketing)` | `/` | Navbar + Footer | Landing page |
| `(auth)` | `/login`, `/register`, `/verify-otp`, etc. | Auth shell | Login/register flows |
| `(app)` | `/dashboard`, `/projects`, `/engineers`, … | Sidebar app shell + `AuthProvider` | Main application |

### Protected routes (frontend)

`AuthProvider` redirects unauthenticated users to login for:

- `/dashboard`
- `/settings`
- `/admin` (and `/admin/verification`)

Public within app shell: `/projects`, `/engineers`, `/engineers/[id]`, `/messages`, `/escrow` (UI only for latter two).

---

## 5. Database Schema (Prisma — actual models)

**File:** `backend/prisma/schema.prisma`

### Enums

- `Role`: CLIENT, ENGINEER, ADMIN  
- `EngineerSpecialty`: CIVIL, ARCHITECTURAL  
- `ServiceType`: DESIGN, SUPERVISION, REVIEW  
- `ProjectStatus`: OPEN, IN_PROGRESS, COMPLETED, CANCELLED  
- `BidStatus`: PENDING, ACCEPTED, REJECTED  
- `PaymentStatus`: PENDING, RELEASED, REFUNDED  
- `VerificationStatus`: PENDING, APPROVED, REJECTED  

### Models (summary)

| Model | Purpose |
|-------|---------|
| `User` | Account: name, email, password, role, isVerified |
| `EngineerProfile` | 1:1 with ENGINEER user — specialty, bio, verification docs URLs, ratings |
| `PortfolioItem` | Engineer portfolio images |
| `Project` | Client-owned project listing |
| `Bid` | Engineer bid on project (price, duration, description, status) |
| `Payment` | Stripe payment record (not exposed via API yet) |
| `Conversation` / `Message` | Per-project messaging (not exposed via API yet) |
| `Review` | Post-project review (not exposed via API yet) |

---

## 6. Backend API Reference (implemented routes)

Base URL: `{NEXT_PUBLIC_API_URL}` e.g. `http://localhost:5000/api`

### Auth — `/api/auth`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register/client` | No | Create client account + send verification email |
| POST | `/register/engineer` | No | Multipart: name, email, password, specialty, bio, documentType, document file |
| POST | `/login` | No | Returns `{ userId }`; sends OTP |
| POST | `/verify-otp` | No | Body: `{ userId, otp }`; sets cookie; returns user |
| POST | `/logout` | Yes | Clears cookie |
| GET | `/verify-email` | No | Query: `token` |
| POST | `/forgot-password` | No | Sends reset link |
| POST | `/reset-password` | No | Body: `{ token, newPassword }` |
| POST | `/change-password` | Yes | Body: `{ oldPassword, newPassword }` |
| POST | `/resend-verification` | Yes | Resend verification email |

### Users — `/api/users`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/me` | Yes | Current user + engineer profile (portfolio, reviews) |
| PUT | `/me` | Yes | Update `name`, `bio` |
| GET | `/engineers` | No | List engineers with `verificationStatus: APPROVED` only |
| GET | `/engineers/:id` | No | Single engineer profile |
| POST | `/portfolio` | Yes | Add portfolio item `{ imageUrl, description }` |
| DELETE | `/portfolio/:id` | Yes | Delete own portfolio item |

### Projects — `/api/projects`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | No | All OPEN projects (with client + bid count) |
| GET | `/:id` | No | Project detail + bids |
| GET | `/my` | Yes | Client's own projects |
| POST | `/` | Yes (CLIENT) | Create project |
| PUT | `/:id` | Yes | Update own OPEN project |
| DELETE | `/:id` | Yes | Delete own OPEN project |

### Bids — mounted on `/api/projects`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/:projectId/bids` | Yes (ENGINEER) | Create bid `{ price, duration, description }` |
| GET | `/:projectId/bids` | No | List bids for project |
| PUT | `/approve/:bidId` | Yes (project owner) | Accept bid → project IN_PROGRESS, reject other bids |

### Health

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | `{ message, success }` |

### Response envelope

```json
{
  "success": true,
  "message": "Human readable message",
  "data": { }
}
```

Errors handled by `errorHandler.middleware.ts` with appropriate HTTP status codes.

---

## 7. Frontend Features — Implementation Status

### Legend

- ✅ **Wired to backend** — functional end-to-end  
- 🎨 **UI only / mock data** — page exists, no API  
- ⏳ **Backend exists, frontend not wired** — schema or deps only  

### 7.1 Authentication ✅

| Page / component | Route | Status |
|------------------|-------|--------|
| Login | `/login` | ✅ Email/password → OTP page |
| Verify OTP | `/verify-otp` | ✅ Sets session cookie |
| Register | `/register` | ✅ Client multi-step + engineer with document upload |
| Verify email | `/verify-email` | ✅ Reads `?token=` from URL |
| Forgot password | `/forgot-password` | ✅ |
| `AuthProvider` | App layout | ✅ Bootstraps `/users/me`, guards protected routes |
| `authStore` (Zustand) | Global | ✅ Persists user; logout clears + redirects |

**Files:** `frontend/features/auth/*`, `frontend/store/authStore.ts`, `frontend/lib/axios.ts`

### 7.2 Marketing / landing 🎨✅

| Page | Route | Status |
|------|-------|--------|
| Landing | `/` | ✅ Static/marketing content via `useLandingContent` (local data, not API) |

**Files:** `frontend/features/marketing/*`, `frontend/app/(marketing)/`

### 7.3 Projects marketplace ✅

| Page / feature | Route | Status |
|----------------|-------|--------|
| Project marketplace | `/projects` | ✅ List, filter, detail panel, bids list |
| Post project modal | `/projects?create=1` | ✅ Opens modal for CLIENT role |
| Bid form | Detail panel | ✅ Engineers submit bids via API |
| Accept bid | Detail panel | ✅ Project owner accepts bid |
| Sidebar "New project" | App shell | ✅ Navigates to `/projects?create=1` |
| Dashboard "New project" | `/dashboard` | ✅ Same query param flow |

**Files:**

- `frontend/features/projects/api/project.api.ts` — axios wrappers  
- `frontend/features/projects/hooks/useProjects.ts`  
- `frontend/features/projects/components/ProjectMarketplace.tsx`  
- `frontend/features/projects/components/PostProjectModal.tsx`  
- `frontend/features/projects/components/ProjectDetailPanel.tsx`  
- `frontend/features/projects/components/ProjectBidsList.tsx`  
- `frontend/features/bids/api/bids.api.ts`  
- `frontend/features/bids/components/BidForm.tsx`  

### 7.4 Engineers directory ✅

| Page | Route | Status |
|------|-------|--------|
| Engineers list | `/engineers` | ✅ Fetches APPROVED engineers only |
| Engineer profile | `/engineers/[id]` | ✅ Full profile, portfolio, reviews |

**Note:** Engineers in `PENDING` verification **do not appear** in the public list until an admin approves them (backend filter). For testing, set `verificationStatus` to `APPROVED` in the database or add admin approval UI.

**Files:** `frontend/features/engineers/*`

### 7.5 Client dashboard ✅ (partial)

| Page | Route | Status |
|------|-------|--------|
| Client dashboard | `/dashboard` | ✅ Profile card + header; uses `useMe` for real data |
| Dashboard stats/spend APIs | — | ⏳ `client-dashboard.api.ts` calls non-existent `/client/dashboard/*` routes — **not used by current dashboard page** |

**Files:** `frontend/features/dashboard/Client/*`

### 7.6 Settings ✅ (partial)

| Tab | Status |
|-----|--------|
| Account (name) | ✅ `PUT /users/me` |
| Security (password) | ✅ `POST /auth/change-password` |
| Notifications | 🎨 Toggle UI only |
| Billing | 🎨 Static “Pro plan” card |

**Files:** `frontend/features/settings/components/SettingsPage.tsx`

### 7.7 Messages 🎨

| Page | Route | Status |
|------|-------|--------|
| Messaging | `/messages` | 🎨 Mock conversations; **no messaging API** |

### 7.8 Escrow 🎨

| Page | Route | Status |
|------|-------|--------|
| Escrow | `/escrow` | 🎨 Mock milestones; **no escrow API** (Payment model in DB only) |

### 7.9 Admin 🎨

| Page | Route | Status |
|------|-------|--------|
| Admin console | `/admin` | 🎨 Mock stats and verification queue |
| Verification | `/admin/verification` | 🎨 Mock data; **no admin API** |

---

## 8. Recent Integration Work (May 2026)

The following was completed to connect the existing UI template to the backend:

1. **Unified HTTP client** — All authenticated calls use `frontend/lib/axios.ts` with `credentials: 'include'`.
2. **Project API refactor** — Replaced raw `fetch` + Bearer token with axios cookie auth.
3. **Auth bootstrap** — `AuthProvider` loads user on app start; protects dashboard/settings/admin.
4. **Bid system wired** — `bids.api.ts`, `BidForm`, `ProjectBidsList` with approve flow.
5. **Post project flow** — `PostProjectModal` + URL flag `?create=1` from dashboard/sidebar buttons.
6. **Layout split** — Marketing gets Navbar/Footer; app routes use sidebar layout without duplicate marketing chrome.
7. **Navbar auth state** — Shows sign in vs user name + sign out when logged in.
8. **Engineer filters** — Discipline filter aligned to backend enums (CIVIL, ARCHITECTURAL only).
9. **Cookie sameSite** — `lax` in development for cross-port localhost.
10. **Frontend build** — `npm run build` passes (16 static routes + dynamic engineer profile).

---

## 9. Frontend Structure (feature-based)

```
frontend/
├── app/
│   ├── layout.tsx                 # Root: Theme + i18n only
│   ├── (marketing)/               # Landing + Navbar/Footer
│   ├── (auth)/                    # Login, register, OTP, etc.
│   └── (app)/                     # Sidebar app + AuthProvider
│       ├── dashboard/
│       ├── projects/
│       ├── engineers/[id]/
│       ├── settings/
│       ├── messages/
│       ├── escrow/
│       └── admin/
├── features/
│   ├── auth/          # api, hooks, components, pages, AuthProvider
│   ├── projects/      # api, hooks, marketplace UI, PostProjectModal
│   ├── engineers/     # api (getMe, getEngineers), list + profile
│   ├── bids/          # api, BidForm
│   ├── dashboard/     # Client dashboard (profile-focused)
│   ├── settings/
│   ├── marketing/
│   ├── messages/      # mock
│   ├── escrow/        # mock
│   └── admin/         # mock
├── components/        # Navbar, Footer, UI, Icons, theme
├── lib/axios.ts
├── store/authStore.ts
├── types/index.ts     # Shared TS types
└── i18n/index.tsx
```

**Reference template:** `engineering-marketplace-frontend-development/` — original UI design source used to build `frontend/`.

---

## 10. Backend Structure

```
backend/src/
├── app.ts                    # Express + CORS + cookie-parser + routes
├── server.ts                 # HTTP server start
├── routes/index.ts           # Mounts auth, users, projects, bids
├── modules/
│   ├── auth/                 # register, login, OTP, email, password
│   ├── users/                # me, engineers, portfolio
│   ├── projects/             # CRUD projects
│   └── bids/                 # create, list, approve
├── middlewares/
│   ├── auth.middleware.ts    # JWT from cookie
│   ├── errorHandler.middleware.ts
│   └── upload.middleware.ts  # Cloudinary for engineer docs
├── config/                   # db, redis, mailer, cloudinary
└── utils/                    # ApiResponse, ApiError, generateToken, emails
```

---

## 11. Environment Variables

### Backend (`backend/.env`)

```env
PORT=5000
DATABASE_URL=postgresql://...
JWT_SECRET=...
JWT_EXPIRES_IN=1d
CLIENT_URL=http://localhost:3000

# Email (Nodemailer)
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=
EMAIL_PASS=

# Redis — required for OTP login
# (configured in config/redis.ts)

# Cloudinary — engineer document upload
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Optional testing
FIXED_OTP=123456

# Future — not wired in routes yet
STRIPE_SECRET_KEY=
```

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

See also `frontend/.env.example`.

---

## 12. How to Run Locally

```bash
# Terminal 1 — Backend
cd backend
npm install
npx prisma migrate dev
npm run dev
# → http://localhost:5000

# Terminal 2 — Frontend
cd frontend
npm install
cp .env.example .env.local   # set NEXT_PUBLIC_API_URL
npm run dev
# → http://localhost:3000
```

### Suggested test flow

1. Register as **client** → verify email (check server logs for link if no SMTP).  
2. Login with OTP (`FIXED_OTP` if set).  
3. Click **New project** → modal opens → submit project.  
4. Register **engineer** with document → verify email → admin must set `APPROVED` in DB to appear in directory (until admin API exists).  
5. Login as engineer → `/projects` → submit bid.  
6. Login as client → open project → **Accept bid**.

---

## 13. Known Limitations & Gaps

| Area | Gap |
|------|-----|
| Admin verification | UI mock only; no `POST /admin/verify` endpoints |
| Messaging | DB schema exists; no REST/Socket routes; UI mock |
| Escrow / Stripe | `Payment` model + Stripe dep; no payment routes or real escrow UI |
| Reviews API | `Review` model; no create/list endpoints wired to frontend |
| Client dashboard analytics | API stubs in `client-dashboard.api.ts` point to missing routes |
| Engineer visibility | Only `APPROVED` engineers listed publicly |
| Reset password page | Backend supports reset; frontend may lack `/reset-password` page route |
| Real-time | Socket.io installed but unused |
| Root README | No top-level onboarding README (docs in this file + architecture review) |
| Duplicate `ProjectsPage.tsx` | Simple list component exists alongside `ProjectMarketplace` (route uses marketplace) |

---

## 14. User Journeys (for documentation / UX writing)

### Client journey (implemented)

1. Land on homepage → Register as client.  
2. Verify email → Login (OTP).  
3. Dashboard or Projects → Post project (title, description, budget, service type).  
4. Review bids on project detail → Accept bid.  
5. Project status becomes IN_PROGRESS.

### Engineer journey (implemented)

1. Register as engineer → Upload verification document.  
2. Verify email → (Wait for approval or manual DB approval).  
3. Browse `/projects` → Submit bid with price, duration, cover letter.  
4. Wait for client acceptance.

### Admin journey (not implemented)

- Intended: review pending verifications, approve/reject, view platform metrics.  
- Current: static mock UI at `/admin`.

---

## 15. Design & UX Notes

- **Brand:** CLINKA — engineering marketplace tagline in i18n.  
- **Colors:** Electric blue (`electric-500`), navy gradients — Tailwind custom theme in `globals.css`.  
- **Components:** Shared `Button`, `Card`, `Badge`, `Avatar`, `VerifiedBadge`, etc. in `components/UI.tsx`.  
- **Icons:** Custom SVG icon set in `components/Icons.tsx`.  
- **Dark mode:** Toggle in app sidebar (local state).  
- **RTL/i18n:** Translation keys for Arabic and English; structure supports bilingual UI.

---

## 16. Git / Project Status Snapshot

- **Structure:** Monorepo-style folder split (`backend/`, `frontend/`) — not necessarily a single npm workspace.  
- **Migrations:** Prisma migrations under `backend/prisma/migrations/`.  
- **Build status:** Frontend production build succeeds.  
- **Active development focus:** Wire existing pages to backend; defer messaging, escrow, admin APIs.

---

## 17. Prompts for AI Document Generation

Use sections above to generate:

| Document type | Suggested sections to use |
|---------------|---------------------------|
| **Technical specification** | §3–6, §10, §11, §13 |
| **Product requirements (PRD)** | §2, §7, §14 |
| **Status report / progress deck** | §1, §7, §8, §13, §16 |
| **Developer onboarding guide** | §4, §9–12 |
| **API documentation** | §6 |
| **Test plan** | §12, §14 |
| **Investor / pitch summary** | §1–2, §7 (roadmap gaps as future work) |
| **Arabic product brief alignment** | §2 + compare to PDF original |

### Example prompt for another AI

```
Using the attached CLINKA_AI_PROJECT_BRIEF.md, write a [TYPE] document that:
- Describes CLINKA as an engineering marketplace MVP
- Separates completed features from planned/mock features
- Includes architecture, tech stack, and API summary
- Targets [audience: developers / stakeholders / end users]
- Tone: [formal / academic / marketing]
- Length: [pages / words]
```

---

## 18. File Index (key files to cite)

| Path | Role |
|------|------|
| `backend/prisma/schema.prisma` | Source of truth for data model |
| `backend/src/routes/index.ts` | API mount points |
| `frontend/lib/axios.ts` | API client |
| `frontend/features/auth/components/AuthProvider.tsx` | Session + route guard |
| `frontend/features/projects/components/ProjectMarketplace.tsx` | Main projects UX |
| `frontend/features/projects/components/PostProjectModal.tsx` | Create project |
| `frontend/features/bids/api/bids.api.ts` | Bid + approve API |
| `frontend/types/index.ts` | Shared TypeScript types |
| `breif  for programer.pdf` | Original Arabic MVP requirements |

---

**Document version:** 1.0  
**Last updated:** May 19, 2026  
**Maintainer context:** Built for Mohamed Talal — CLINKA engineering marketplace MVP.
