# QApp - All Your Question Papers in One Place

A crowdsourced platform for students to share and discover past exam question papers.

## 🏗️ Architecture

**Monorepo Structure:**
- `apps/frontend` - Next.js 16 application (App Router)
- `packages/database` - Drizzle ORM schemas and migrations
- `packages/shared` - Shared TypeScript types and Zod validation schemas

**Tech Stack:**
- **Framework:** Next.js 16 with App Router
- **Database:** PostgreSQL via Supabase
- **ORM:** Drizzle ORM (lightweight, type-safe)
- **Storage:** Cloudflare R2 (zero egress fees)
- **Auth:** Supabase Auth with Google OAuth
- **Validation:** Zod (shared client/server schemas)
- **Styling:** Tailwind CSS + shadcn/ui

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- pnpm 10+
- Supabase account (free tier)
- Cloudflare account (free tier)
- Google Cloud Console project (for OAuth)

### Setup Instructions

**1. Clone and Install Dependencies**

```bash
pnpm install
```

**2. Configure Environment Variables**

```bash
cp .env.example .env.local
# Fill in your Supabase and Cloudflare R2 credentials
```

**3. Run Database Migrations**

```bash
# Generate migration files from schema
pnpm db:generate

# Apply migrations to Supabase
pnpm db:migrate
```

**4. Verify Setup**

```bash
# Test Supabase connection
pnpm test:supabase

# Test R2 connection
pnpm test:r2
```

**5. Seed Development Data (Optional)**

```bash
pnpm db:seed
```

**6. Start Development Server**

```bash
pnpm dev
# Open http://localhost:3000
```

## 📦 Package Structure

### `@qapp/database`

Drizzle ORM schemas and database utilities.

**Key Files:**
- `src/schema/users.ts` - Users table (Google OAuth profiles)
- `src/schema/questions.ts` - Question papers with metadata
- `src/schema/reports.ts` - Content moderation reports

**Commands:**
- `pnpm db:generate` - Generate migrations from schemas
- `pnpm db:migrate` - Apply migrations to database
- `pnpm db:studio` - Open Drizzle Studio (visual DB editor)

### `@qapp/shared`

Shared TypeScript types and Zod validation schemas.

**Key Files:**
- `src/types/api.types.ts` - API request/response types
- `src/schemas/question.schema.ts` - Question validation (client + server)
- `src/constants/index.ts` - Shared constants (semesters, levels)

### `apps/frontend`

Next.js 16 application with React Server Components.

**Structure:**
- `app/` - Next.js App Router pages and API routes
- `components/` - React components (UI + business logic)
- `lib/` - Utilities (Supabase client, API helpers)

## 🔐 Environment Variables

See `.env.example` for complete list and descriptions.

**Critical Security Notes:**
- Never commit `.env.local` or any file containing real credentials
- `NEXT_PUBLIC_*` variables are safe for frontend (publicly visible)
- Service role keys must NEVER be used in frontend code

## 📖 Documentation

Detailed architectural documentation in `docs/`:
- `ARCHITECTURE_ANALYSIS.md` - Tech stack decisions
- `AUTHENTICATION_ANALYSIS.md` - Google OAuth implementation
- `STORAGE_AND_UPLOAD_ANALYSIS.md` - R2 storage setup
- `ENGAGEMENT_AND_FEATURES.md` - MVP features and roadmap

## 🛠️ Development Workflow

**Day-to-Day Development:**

```bash
# Start dev server (auto-reloads)
pnpm dev

# Run linter
pnpm lint

# Format code
pnpm format

# Build for production
pnpm build
```

**Database Changes:**

1. Modify schemas in `packages/database/src/schema/`
2. Generate migration: `pnpm db:generate`
3. Review generated SQL in `packages/database/src/migrations/`
4. Apply migration: `pnpm db:migrate`

## 📝 MVP Features (Week 1)

- ✅ Day 1: Project setup, database schema, auth configuration
- 🔲 Day 2: Backend API routes + auth middleware
- 🔲 Day 3: Frontend UI components (auth, upload, feed)
- 🔲 Day 4: User profiles and search
- 🔲 Day 5: Image upload to R2
- 🔲 Day 6: Polish and testing
- 🔲 Day 7: Deployment to Vercel

## 🤝 Contributing

This is an MVP built for rapid iteration. See `docs/ENGAGEMENT_AND_FEATURES.md` for feature roadmap.

## 📄 License

Private project - All rights reserved.