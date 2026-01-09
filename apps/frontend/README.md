# QApp Frontend

Next.js 16 application with App Router, React Server Components, and TanStack Query.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **React**: 19.2.3
- **State Management**: TanStack Query v5 (server state)
- **Database**: Drizzle ORM + Supabase PostgreSQL
- **Auth**: Supabase Auth (Google OAuth)
- **Storage**: Cloudflare R2 (presigned URLs)
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui (to be added)

## Directory Structure

```
apps/frontend/
├── app/
│   ├── layout.tsx           # Root layout with providers
│   ├── page.tsx             # Home/feed page
│   ├── providers.tsx        # React Query provider
│   └── api/                 # API routes (Day 2+)
├── lib/
│   └── supabase/
│       ├── client.ts        # Client-side Supabase
│       ├── server.ts        # Server-side Supabase
│       └── middleware.ts    # Auth middleware
├── components/              # React components (Day 2+)
├── hooks/                   # Custom React hooks (Day 2+)
└── middleware.ts            # Next.js middleware (auth refresh)
```

## Setup

### 1. Environment Variables

Copy `.env.example` from root and create `.env.local` in this directory:

```bash
# From project root
cp .env.example apps/frontend/.env.local
```

Fill in:
- `NEXT_PUBLIC_SUPABASE_URL` - From Supabase Dashboard → Settings → API
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` - Same location
- `SUPABASE_SECRET_KEY` - For API routes (server-side)
- R2 credentials - For image uploads

### 2. Install Dependencies

```bash
# From project root
pnpm install
```

### 3. Run Development Server

```bash
# From project root
pnpm dev

# Or from this directory
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## Key Files

### Authentication

**lib/supabase/client.ts**
- Client-side Supabase client
- Use in React components (browser)

**lib/supabase/server.ts**
- Server-side Supabase client
- Use in API routes and Server Components
- Includes `requireAuth()` for protected routes

**middleware.ts**
- Refreshes auth tokens automatically
- Runs on every request

### State Management

**app/providers.tsx**
- TanStack Query configuration
- 5-minute cache for queries
- Retry once on failure

## Development Workflow

### Day 1 (Current)
- ✅ Providers setup (React Query)
- ✅ Supabase auth clients
- ✅ Middleware for session refresh

### Day 2 (Next)
- API routes (create, list, search questions)
- Auth components (signin button, user menu)
- Question components (card, feed, detail)

### Day 3+
- Upload form with R2 integration
- User profiles
- Search functionality

## References

- **Architecture**: `docs/ARCHITECTURE_ANALYSIS.md`
- **Auth Flow**: `docs/AUTHENTICATION_ANALYSIS.md`
- **Storage**: `docs/STORAGE_AND_UPLOAD_ANALYSIS.md`
- **Features**: `docs/ENGAGEMENT_AND_FEATURES.md`
