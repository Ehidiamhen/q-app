# QApp Setup Guide

Complete step-by-step setup instructions for Day 1 foundation.

## Prerequisites

- **Node.js**: 20.0.0 or higher
- **pnpm**: 9.0.0 or higher (install: `npm install -g pnpm`)
- **Supabase account**: https://supabase.com (free tier)
- **Cloudflare account**: https://cloudflare.com (free tier)
- **Google Cloud Console project**: For OAuth credentials

---

## Step 1: Install Dependencies

```bash
# From project root
pnpm install
```

This installs dependencies for all packages in the monorepo:
- `apps/frontend` - Next.js application
- `packages/database` - Drizzle ORM schemas
- `packages/shared` - Shared types and validation

---

## Step 2: Configure Environment Variables

### Create .env.local

```bash
# Copy template
cp .env.example .env.local
```

### Fill in Supabase Credentials

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Navigate to your project
3. Go to **Settings** → **API**
4. Copy the following values to `.env.local`:

```env
# Project URL
NEXT_PUBLIC_SUPABASE_URL=https://[your-project-id].supabase.co

# Anonymous Key (public - safe for frontend)
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Service Role Key (SECRET - server-side only)
SUPABASE_SECRET_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

5. Go to **Settings** → **Database** → **Connection string**
6. Copy **URI** format:

```env
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
```

### Fill in Cloudflare R2 Credentials

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **R2**
3. Note your Account ID from the URL (or R2 overview page)
4. Click **Manage R2 API Tokens**
5. Create new token with **Object Read & Write** permissions
6. Copy credentials to `.env.local`:

```env
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key-id
R2_SECRET_ACCESS_KEY=your-secret-access-key
R2_BUCKET_NAME=qapp-images
R2_PUBLIC_URL=https://pub-[hash].r2.dev
```

---

## Step 3: Build Shared Packages

```bash
# Build shared types package
pnpm --filter @qapp/shared build
```

This compiles TypeScript to JavaScript and generates type definitions.

**Expected output:**
```
packages/shared/dist/
├── index.js
├── index.d.ts
└── ...
```

---

## Step 4: Generate and Run Database Migrations

### Generate Migrations

```bash
pnpm db:generate
```

This creates SQL migration files from Drizzle schemas.

**Expected output:**
```
packages/database/src/migrations/
├── 0000_init.sql
└── meta/
```

### Apply Migrations to Supabase

```bash
pnpm db:migrate
```

**Expected output:**
```
🔄 Connecting to database...
🚀 Running migrations...
✅ Migrations completed successfully!
```

**Verification:**
1. Go to Supabase Dashboard → **Table Editor**
2. You should see 3 tables: `users`, `questions`, `reports`

---

## Step 5: Configure Row Level Security (RLS)

RLS policies control who can read/write data in Supabase.

1. Go to Supabase Dashboard → **SQL Editor**
2. Click **New query**
3. Copy the contents of `scripts/setup-rls-policies.sql`
4. Paste into SQL Editor
5. Click **Run**

**Expected output:**
```
Success. No rows returned.
```

**Verification:**
```sql
-- Run this query to verify policies are created:
SELECT tablename, policyname, permissive, cmd 
FROM pg_policies 
WHERE tablename IN ('users', 'questions', 'reports')
ORDER BY tablename, policyname;
```

You should see 6 policies total.

---

## Step 6: Verify Setup

### Test Supabase Connection

```bash
pnpm test:supabase
```

**Expected output:**
```
✅ All environment variables present
✅ Supabase Auth configured correctly
✅ Database connection successful
✅ All tables exist:
   ✓ questions
   ✓ reports
   ✓ users
```

### Test R2 Connection

```bash
pnpm test:r2
```

**Expected output:**
```
✅ All environment variables present
✅ Bucket "qapp-images" is accessible
✅ Presigned URL generated successfully
```

---

## Step 7: Seed Development Data (Optional)

Create test users and questions for development:

```bash
pnpm db:seed
```

**Expected output:**
```
✅ Created 2 test users
✅ Created 4 test questions
🎉 Seeding completed successfully!
```

**Verification:**
- View data in Supabase Dashboard → **Table Editor**
- Or run: `pnpm db:studio` (opens Drizzle Studio)

---

## Step 8: Configure Google OAuth (Supabase)

### Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project: "QApp MVP"
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Name: "QApp Production"
7. **Authorized redirect URIs**:
   ```
   https://[your-project-id].supabase.co/auth/v1/callback
   ```
8. Click **Create**
9. **Save Client ID and Client Secret**

### Configure OAuth in Supabase

1. Go to Supabase Dashboard → **Authentication** → **Providers**
2. Find **Google** in the list
3. Toggle **Enable**
4. Paste **Client ID**
5. Paste **Client Secret**
6. Click **Save**

### Configure OAuth Consent Screen

1. Go back to Google Cloud Console
2. **APIs & Services** → **OAuth consent screen**
3. User Type: **External**
4. Fill required fields:
   - App name: "QApp"
   - Support email: Your email
   - Developer contact: Your email
5. **Scopes**: Default (email, profile, openid)
6. Click **Save and Continue**

**Note:** For production, you'll need to verify the app with Google. For development/testing, "Testing" status is sufficient.

---

## Step 9: Configure R2 CORS

Allow frontend to upload directly to R2.

1. Go to Cloudflare Dashboard → **R2** → Your bucket
2. Click **Settings** tab
3. Scroll to **CORS Policy**
4. Click **Edit CORS Policy**
5. Paste:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://qapp.vercel.app"
    ],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

6. Click **Save**

---

## Step 10: Start Development Server

```bash
pnpm dev
```

**Expected output:**
```
▲ Next.js 16.1.1
- Local:        http://localhost:3000
- Network:      http://192.168.1.x:3000

✓ Ready in 2.1s
```

Open [http://localhost:3000](http://localhost:3000)

---

## Troubleshooting

### Issue: "DATABASE_URL environment variable is not set"

**Solution:** Ensure `.env.local` exists in project root with `DATABASE_URL` set.

```bash
# Verify file exists
cat .env.local | grep DATABASE_URL
```

### Issue: "Migration failed: relation already exists"

**Solution:** Tables already exist. Skip migrations or drop tables first.

```sql
-- In Supabase SQL Editor
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS users CASCADE;
```

Then run `pnpm db:migrate` again.

### Issue: "CORS error when uploading to R2"

**Solution:** Verify CORS policy includes your origin.

1. Check R2 bucket → Settings → CORS Policy
2. Ensure `http://localhost:3000` is in `AllowedOrigins`
3. Ensure `PUT` is in `AllowedMethods`

### Issue: "Google OAuth redirects to error page"

**Solution:** Verify redirect URI matches exactly.

```
Supabase: https://[project-id].supabase.co/auth/v1/callback
Google:   https://[project-id].supabase.co/auth/v1/callback
           ↑ Must match exactly ↑
```

### Issue: "Cannot find module '@qapp/shared'"

**Solution:** Build shared package first.

```bash
pnpm --filter @qapp/shared build
```

---

## Verification Checklist

Day 1 setup complete when:

- [ ] `pnpm install` runs without errors
- [ ] Shared package builds successfully
- [ ] `pnpm db:migrate` applies migrations
- [ ] `pnpm test:supabase` passes all checks
- [ ] `pnpm test:r2` passes all checks
- [ ] RLS policies created (6 policies)
- [ ] Google OAuth configured in Supabase
- [ ] R2 CORS policy configured
- [ ] `pnpm dev` starts without errors
- [ ] Can access http://localhost:3000

---

## Next Steps (Day 2)

- Implement API routes (create, list, search questions)
- Build auth components (signin, user menu)
- Create question components (card, feed)
- Set up R2 presigned URL uploads

See `docs/ENGAGEMENT_AND_FEATURES.md` lines 1022-1072 for complete roadmap.

---

## Getting Help

- **Documentation**: `docs/` folder
- **Architecture**: `docs/ARCHITECTURE_ANALYSIS.md`
- **Auth**: `docs/AUTHENTICATION_ANALYSIS.md`
- **Storage**: `docs/STORAGE_AND_UPLOAD_ANALYSIS.md`
- **Features**: `docs/ENGAGEMENT_AND_FEATURES.md`

