# CLINKA Project Documentation

## Project Overview

**CLINKA** is a full-stack freelance engineering marketplace platform that connects clients with qualified engineers for construction, design, and engineering projects. The platform facilitates project posting, bidding, engineer verification, escrow management, and secure payments.

**Project Status**: Active Development (Core features functional, ongoing feature refinement)

---

## Technology Stack

### Frontend
- **Framework**: Next.js 16.2.6 (App Router)
- **Language**: TypeScript 5
- **React**: 19.2.4
- **Styling**: Tailwind CSS 4
- **State Management**: Zustand
- **HTTP Client**: Axios (configured with credentials: include for cookie-based auth)
- **Internationalization**: Custom i18n system (support for multiple languages)
- **UI Components**: Custom component library (Button, Card, etc.)

### Backend
- **Runtime**: Node.js with Express 5.2.1
- **Language**: TypeScript 6.0.3
- **ORM**: Prisma 7.8.0
- **Database**: PostgreSQL
- **Cache**: Redis
- **Email**: Nodemailer (SMTP configuration)
- **Image Storage**: Cloudinary
- **Payments**: Stripe SDK
- **Authentication**: JWT tokens stored in HTTP-only cookies

### Infrastructure
- **Frontend Server**: localhost:3000
- **Backend API Server**: localhost:5000
- **Database**: PostgreSQL (hosted/local)
- **Cache**: Redis (for OTP storage, session management)

---

## Architecture Overview

### Authentication Flow
1. **User Registration**: Email + password → verification email sent
2. **Login (2-Step Process)**:
   - Step 1: Submit email + password
   - Step 2: Backend generates 6-digit OTP → stored in Redis with 10-minute TTL (`otp:${userId}`)
   - Backend sends OTP via Nodemailer (SMTP) or logs to console (fallback)
   - User submits OTP for verification
3. **Token Generation**: After OTP verification → JWT token created → stored in HTTP-only cookie
4. **API Requests**: Frontend sends requests with `credentials: include` to transmit cookie automatically
5. **Testing Support**: `FIXED_OTP` environment variable allows fixed OTP for development (e.g., `FIXED_OTP=123456`)

### User Roles
- **CLIENT**: Registers projects, hires engineers, approves work
- **ENGINEER**: Bids on projects, completes work, submits deliverables
- **ADMIN**: Verifies engineers, manages platform

### Data Flow
```
Frontend (Next.js) 
  ↓ (REST API + Cookies)
Backend API (Express)
  ↓ (TypeScript, Prisma ORM)
PostgreSQL Database
  ↑ (Redis for caching)
```

---

## Completed Features

### 1. Authentication System ✅
- User registration with email verification
- 2-step login with OTP (email-based)
- JWT token generation and HTTP-only cookie storage
- Password hashing (bcrypt)
- Role-based access control (CLIENT, ENGINEER, ADMIN)
- **Status**: Fully functional, tested with FIXED_OTP support

### 2. Project Management ✅
- **Create Project**: Authenticated clients post projects
- **List Projects**: Public endpoint, searchable with filters
- **Project Details**: View individual project information
- **My Projects**: Clients view their own projects
- **Update/Delete**: Project owners can modify or remove projects
- **Filtering**: By service type (DESIGN, SUPERVISION, REVIEW)
- **Status**: Fully functional, tested with UI integration

### 3. Project Creation UI ✅
- **PostProjectModal**: Modal form for creating projects
- **Form Fields**: Title, Description, Budget, ServiceType
- **Validation**: All fields required, budget > 0
- **Integration**: "Post a project" button on ProjectsPage
- **Callback**: Automatic page refresh after project creation
- **Status**: Fully functional and tested

### 4. Engineers Directory ✅
- **EngineersList**: Displays all engineers with filtering
- **Search**: Filter engineers by name
- **Discipline Filter**: Filter by specialty (All, CIVIL, ARCHITECTURAL)
- **Engineer Cards**: Display profile info, specialty, rating
- **Status**: Component functional (see issue: engineers not displaying)

### 5. Responsive UI Components ✅
- Custom Button component (variants: primary, secondary; sizes: sm, lg)
- Card component with styling
- Icons system (IconFilter, IconSearch, etc.)
- Theme system (dark mode support)
- Tailwind CSS integration with custom colors (electric-500)

### 6. Internationalization (i18n) ✅
- Custom i18n system with translation keys
- Supported: Multiple languages (architecture in place)
- Keys used: `em.title`, `em.subtitle`, `em.searchByName`, `disc.all`, `disc.civil`, `disc.architecture`, `common.filters`

---

## Features In Progress / Partially Implemented

### 1. Bid System ⚠️
- **Status**: BROKEN - import error blocking functionality
- **Issue**: [BidForm.tsx](frontend/features/bids/components/BidForm.tsx#L8) imports `@/lib/api` which doesn't exist
- **Fix Needed**: Change to `import api from "@/lib/axios"`
- **Blocked**: Cannot test bid creation functionality until fixed

### 2. Engineers Display Issue ⚠️
- **Status**: Investigation in progress
- **Issue**: Backend filters engineers by `verificationStatus: "APPROVED"` only
- **Problem**: Test engineer "Mohamed Talal" is PENDING, doesn't appear in list
- **Solution Options**:
  1. Remove APPROVED filter (show all engineers)
  2. Mark test engineers as APPROVED in database
  3. Add frontend filtering by verification status

### 3. Landing Page JSX Errors ⚠️
- **Status**: Syntax errors, page returning errors
- **Issue**: [LandingPage.tsx](frontend/features/marketing/pages/LandingPage.tsx#L232) has malformed JSX around line 232
- **Error**: "Unexpected token. Did you mean `{'>'}` or `&gt;`?"
- **Issue**: Button/Link tag nesting issue
- **Fix Needed**: Review and correct JSX syntax

---

## Database Schema

### Core Models

#### User
```prisma
model User {
  id              Int              @id @default(autoincrement())
  email           String           @unique
  password        String           (hashed)
  firstName       String
  lastName        String
  name            String           (computed: firstName + lastName)
  role            Role             @default(CLIENT)  // CLIENT, ENGINEER, ADMIN
  profile         Profile?         (one-to-one)
  projects        Project[]        (one-to-many)
  bids            Bid[]            (one-to-many)
  reviews         Review[]         (one-to-many)
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
}

enum Role {
  CLIENT
  ENGINEER
  ADMIN
}
```

#### Profile
```prisma
model Profile {
  id                    Int              @id @default(autoincrement())
  userId                Int              @unique
  user                  User
  bio                   String?
  phone                 String?
  profilePicture        String?          (Cloudinary URL)
  specialty             String?          // CIVIL, ARCHITECTURAL, etc.
  verificationStatus    VerificationStatus @default(PENDING)
  verificationDocument  String?          (Cloudinary URL)
  portfolio             Portfolio[]
  reviews               Review[]
  createdAt             DateTime         @default(now())
  updatedAt             DateTime         @updatedAt
}

enum VerificationStatus {
  PENDING
  APPROVED
  REJECTED
}
```

#### Project
```prisma
model Project {
  id              Int              @id @default(autoincrement())
  title           String
  description     String
  budget          Float
  serviceType     ServiceType      // DESIGN, SUPERVISION, REVIEW
  clientId        Int
  client          User
  bids            Bid[]
  status          ProjectStatus    @default(OPEN)
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
}

enum ServiceType {
  DESIGN
  SUPERVISION
  REVIEW
}

enum ProjectStatus {
  OPEN
  IN_PROGRESS
  COMPLETED
  CANCELLED
}
```

#### Bid
```prisma
model Bid {
  id              Int              @id @default(autoincrement())
  projectId       Int
  project         Project
  engineerId      Int
  engineer        User
  amount          Float
  description     String?
  status          BidStatus        @default(PENDING)
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
}

enum BidStatus {
  PENDING
  ACCEPTED
  REJECTED
  COMPLETED
}
```

#### Review
```prisma
model Review {
  id              Int              @id @default(autoincrement())
  rating          Int              // 1-5 stars
  comment         String?
  engineerId      Int
  engineer        User
  profileId       Int
  profile         Profile
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
}
```

#### Portfolio
```prisma
model Portfolio {
  id              Int              @id @default(autoincrement())
  profileId       Int
  profile         Profile
  title           String
  description     String?
  imageUrl        String?          (Cloudinary)
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
}
```

---

## API Endpoints

### Authentication Routes (`/api/auth`)
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - 2-step login initiation (generates OTP)
- `POST /api/auth/verify-otp` - OTP verification & JWT token generation
- `POST /api/auth/logout` - User logout

### User Routes (`/api/users`)
- `GET /api/users/engineers` - Get all engineers
  - **Issue**: Currently filters by `verificationStatus: "APPROVED"` only
  - **Response**: Array of user objects with profile data
- `GET /api/users/:id` - Get specific user profile
- `PUT /api/users/:id` - Update user profile (authenticated)
- `GET /api/users/me` - Get current authenticated user

### Project Routes (`/api/projects`)
- `GET /api/projects` - List all projects (public, searchable)
- `POST /api/projects` - Create project (authenticated, CLIENT only)
- `GET /api/projects/:id` - Get project details
- `GET /api/projects/my` - Get user's own projects (authenticated)
- `PUT /api/projects/:id` - Update project (authenticated, owner only)
- `DELETE /api/projects/:id` - Delete project (authenticated, owner only)

### Bid Routes (`/api/bids`)
- `GET /api/bids/project/:projectId` - Get bids for project
- `POST /api/bids` - Create bid (authenticated, ENGINEER only)
- `PUT /api/bids/:id` - Update bid (authenticated)
- `DELETE /api/bids/:id` - Delete bid (authenticated)

### Admin Routes (`/api/admin`)
- `GET /api/admin/verification` - Get pending verification requests
- `POST /api/admin/verify-engineer/:userId` - Approve engineer
- `POST /api/admin/reject-engineer/:userId` - Reject engineer

### Response Format (All Endpoints)
```typescript
{
  success: boolean
  message: string
  data: T | null
}
```

---

## Frontend Structure

### Directory Layout
```
frontend/
├── app/
│   ├── (auth)/              // Auth routes (login, register, OTP)
│   ├── (dashboard)/         // User dashboard routes
│   ├── (marketing)/         // Marketing/landing page
│   └── (app)/               // Main app routes
├── features/
│   ├── auth/                // Auth logic, hooks, components
│   ├── projects/            // Project marketplace
│   ├── engineers/           // Engineers directory
│   ├── bids/                // Bid system (BROKEN - import error)
│   ├── dashboard/           // User dashboard
│   ├── escrow/              // Escrow management
│   ├── messages/            // Messaging system
│   ├── settings/            // User settings
│   └── admin/               // Admin panel
├── components/              // Shared UI components
├── lib/
│   ├── axios.ts             // Configured Axios client
└── types/
    └── index.ts             // TypeScript type definitions
```

### Key Frontend Files

#### [lib/axios.ts](frontend/lib/axios.ts)
- Axios instance configured for API calls
- `baseURL`: Backend API endpoint
- `credentials: 'include'`: Enables HTTP-only cookie transmission
- Used by all API calls

#### [features/projects/components/ProjectsPage.tsx](frontend/features/projects/components/ProjectsPage.tsx)
- Main projects marketplace view
- "Post a project" button with PostProjectModal
- Project search and filtering by service type
- Project card display with bid count

#### [features/projects/components/PostProjectModal.tsx](frontend/features/projects/components/PostProjectModal.tsx)
- Modal form for creating projects
- Fields: Title (text), Description (textarea), Budget (number), ServiceType (select)
- Validation: All fields required, budget > 0
- Success callback: Refreshes project list

#### [features/engineers/components/EngineersList.tsx](frontend/features/engineers/components/EngineersList.tsx)
- Engineers directory with search and filtering
- Filters: By name (search), by specialty (All, CIVIL, ARCHITECTURAL)
- Shows loading skeleton while fetching
- Error handling and empty state

#### [features/bids/components/BidForm.tsx](frontend/features/bids/components/BidForm.tsx)
- **STATUS: BROKEN**
- Line 8: `import api from "@/lib/api"` ❌ Should be `@/lib/axios`
- Blocks entire bid functionality

---

## Backend Structure

### Directory Layout
```
backend/
├── src/
│   ├── app.ts               // Express app setup
│   ├── server.ts            // Server startup
│   ├── config/              // Configuration files
│   │   ├── db.ts            // Prisma client
│   │   ├── redis.ts         // Redis client
│   │   ├── mailer.ts        // Nodemailer setup
│   │   └── cloudinary.ts    // Cloudinary config
│   ├── middlewares/         // Express middlewares
│   │   ├── auth.middleware.ts
│   │   ├── errorHandler.middleware.ts
│   │   └── upload.middleware.ts
│   ├── modules/             // Feature modules
│   │   ├── auth/            // Auth logic
│   │   ├── users/           // User management
│   │   ├── projects/        // Project management
│   │   └── bids/            // Bid management
│   ├── routes/              // API route assembly
│   ├── utils/               // Utility functions
│   │   ├── ApiError.ts
│   │   ├── ApiResponse.ts
│   │   ├── generateToken.ts
│   │   └── sendVerificationEmail.ts
│   └── generated/prisma/    // Prisma generated types
└── prisma/
    ├── schema.prisma        // Database schema
    └── migrations/          // Database migrations
```

### Key Backend Files

#### [src/modules/auth/auth.service.ts](backend/src/modules/auth/auth.service.ts)
- Core authentication logic
- `login()`: Generates 6-digit OTP
  - Uses `FIXED_OTP` env var if set (for testing)
  - Stores in Redis: `otp:${userId}` with 600s TTL
  - Sends via Nodemailer or console.log
- `verifyOtp()`: Validates OTP and generates JWT token
- OTP Format: 6-digit random number or fixed value

#### [src/modules/users/user.service.ts](backend/src/modules/users/user.service.ts)
- `getEngineers()`: **ISSUE - Returns APPROVED engineers only**
  - Current filter: `role: "ENGINEER", profile: { verificationStatus: "APPROVED" }`
  - **Problem**: Test engineer "Mohamed Talal" is PENDING
  - **Solution**: Remove APPROVED filter or mark as APPROVED

#### [src/modules/projects/project.service.ts](backend/src/modules/projects/project.service.ts)
- Full CRUD operations for projects
- Filtering by service type, search text
- Client-specific project queries

#### [src/config/mailer.ts](backend/src/config/mailer.ts)
- Nodemailer SMTP transporter setup
- **Environment Variables**:
  - `SMTP_HOST`
  - `SMTP_PORT`
  - `SMTP_USER`
  - `SMTP_PASSWORD`
- Fallback: Logs OTP to console if SMTP not configured

#### [src/utils/generateToken.ts](backend/src/utils/generateToken.ts)
- JWT token generation
- Signs user ID and role
- Uses `JWT_SECRET` environment variable

---

## Environment Configuration

### Backend (.env file)
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/clinka

# JWT
JWT_SECRET=your-secret-key

# Redis
REDIS_URL=redis://localhost:6379

# Email (Nodemailer/SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Cloudinary (Image uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Stripe
STRIPE_SECRET_KEY=sk_test_...

# Client URL
CLIENT_URL=http://localhost:3000

# Testing Support
FIXED_OTP=123456  # Optional - use for testing without email
```

### Frontend (.env.local file)
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
```

---

## Current Development Status

### ✅ Completed & Tested
- Backend server starts successfully
- PostgreSQL database connected
- Redis cache connected
- SMTP transporter ready
- User registration workflow
- 2-step OTP login process
- JWT token generation and storage
- Project creation and listing
- Project filtering and search
- Engineers directory UI
- Responsive UI components
- Internationalization system
- Frontend build succeeds (0 errors)

### ⚠️ Issues Requiring Fix
1. **Landing Page (LandingPage.tsx, line 232)**
   - JSX syntax errors
   - Export not found error
   - Needs JSX correction

2. **BidForm Import Error (BidForm.tsx, line 8)**
   - Import statement: `@/lib/api` doesn't exist
   - Should be: `@/lib/axios`
   - Blocks entire bid functionality

3. **Engineers Not Displaying**
   - Backend filters by `verificationStatus: "APPROVED"`
   - Test engineer "Mohamed Talal" is PENDING
   - Need to either remove filter or mark engineer as APPROVED

### 🔧 Testing Setup
- **Fixed OTP**: Set `FIXED_OTP=123456` in backend `.env` for testing login without email
- **Dev Servers**: 
  - Frontend: `npm run dev` (localhost:3000)
  - Backend: `npm run dev` (localhost:5000)
- **Database**: Prisma migrations auto-apply on first run

---

## Code Quality & Build Status

### Frontend Build
```
✓ Compiled successfully in 2.7s
✓ Finished TypeScript in 3.7s
✓ Routes generated: 16 total
- 15 static pages
- 1 dynamic page (/engineers/[id])
```

### Backend Status
```
🚀 Server is running on port 5000
✅ Database connected successfully
✅ Redis connected
✅ SMTP transporter is ready
```

---

## Key Lessons Learned

1. **Backend Filtering Impact**: Backend filters on `verificationStatus: "APPROVED"` blocks test users from appearing in frontend lists. Solution: Remove filter or change status in database.

2. **OTP Email Dependency**: Email-based OTP can block testing. Solution: Added `FIXED_OTP` environment variable support for development.

3. **Import Path Aliases**: Using `@/` alias requires careful path references. BidForm used non-existent `@/lib/api` instead of `@/lib/axios`.

4. **Cookie-Based Auth**: Frontend must include `credentials: 'include'` in Axios config to transmit HTTP-only cookies with API requests.

5. **Type Safety**: Prisma-generated types ensure frontend/backend type compatibility across API boundaries.

---

## Testing Workflow

### Manual Testing Steps
1. **Start Backend**: `cd backend && npm run dev`
2. **Start Frontend**: `cd frontend && npm run dev`
3. **Test Registration**: Create new account
4. **Test Login**: Use `FIXED_OTP=123456` for quick testing
5. **Test Project Creation**: Post a project from dashboard
6. **Test Project Listing**: View projects on marketplace
7. **View Engineers**: Check engineers directory (currently showing only APPROVED)

### Browser DevTools
- Check `Application > Cookies` for JWT token storage
- Check `Network` tab for API requests and responses
- Check `Console` for any errors

---

## Next Steps / Roadmap

1. **Fix Critical Issues** (Blocking functionality)
   - [ ] Fix BidForm import error (@/lib/api → @/lib/axios)
   - [ ] Fix LandingPage JSX syntax errors
   - [ ] Fix engineers display (remove APPROVED filter or mark test user)

2. **Complete Bid System**
   - [ ] Fix import error
   - [ ] Test bid creation flow
   - [ ] Test bid approval/rejection
   - [ ] Integrate with escrow system

3. **Enhance Engineer Verification**
   - [ ] Create admin verification UI
   - [ ] Add document upload validation
   - [ ] Implement verification status display

4. **Messaging System**
   - [ ] Implement real-time messaging
   - [ ] Add notification system
   - [ ] Integrate with Socket.io

5. **Escrow & Payments**
   - [ ] Integrate Stripe payment gateway
   - [ ] Implement escrow hold logic
   - [ ] Add payment tracking dashboard

6. **Admin Dashboard**
   - [ ] Engineer verification queue
   - [ ] Platform analytics
   - [ ] User management
   - [ ] Dispute resolution

---

## Team & Maintenance

- **Project Owner**: Mohamed Talal
- **Development Focus**: Full-stack feature implementation
- **Current Phase**: Core feature debugging and testing
- **Language**: TypeScript (100% type-safe)

---

## Additional Resources

### Running Commands

**Backend**:
```bash
cd backend
npm install              # Install dependencies
npm run dev             # Start with nodemon
npm run build           # Build TypeScript
npx prisma generate    # Generate Prisma client
npx prisma migrate dev # Run migrations
```

**Frontend**:
```bash
cd frontend
npm install              # Install dependencies
npm run dev             # Start Next.js dev server
npm run build           # Production build
npm run lint            # ESLint check
```

### Database Management
```bash
# Reset database
npx prisma migrate reset

# View database UI
npx prisma studio

# Create migration
npx prisma migrate dev --name migration_name
```

---

## Notes for AI Documentation Generation

This document provides:
- Complete technology overview
- Full architecture description
- Database schema with all models
- API endpoint listing with current issues
- Frontend and backend structure
- Environment setup requirements
- Current development status
- Critical issues blocking features
- Testing procedures
- Lessons learned
- Implementation progress tracking

Use this information to generate professional project documentation, technical specifications, developer guides, or project status reports.

---

**Last Updated**: May 19, 2026
**Document Version**: 1.0
