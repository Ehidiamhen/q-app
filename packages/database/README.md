# @qapp/database

Drizzle ORM schemas and database utilities for QApp.

## Database Schema

### Tables

**users** - User profiles from Google OAuth
- `id` (text, PK) - UUID from Supabase auth.users.id
- `email` (text, unique) - Email from Google
- `displayName` (text) - Editable display name
- `avatarUrl` (text, nullable) - Google profile picture
- `provider` (text) - Auth provider ('google')
- `createdAt`, `updatedAt` (timestamp)

**questions** - Question papers with metadata
- `id` (text, PK) - CUID2
- `title` (text) - Question paper title
- `courseCode`, `courseName` (text) - Course information
- `level` (integer) - 100, 200, 300, etc.
- `year`, `semester` (integer, text) - Academic period
- `hashtags` (text[]) - Optional tags
- `images` (text[]) - R2 URLs (1-10 images)
- `authorId` (text, FK → users.id) - Author
- `createdAt`, `updatedAt` (timestamp)
- **Indexes**: courseCode, level, createdAt, authorId

**reports** - Content moderation reports
- `id` (text, PK) - CUID2
- `questionId` (text, FK → questions.id)
- `reporterId` (text, FK → users.id)
- `reason` (text) - Report reason
- `status` (text) - 'pending', 'reviewed', 'resolved'
- `createdAt` (timestamp)

## Commands

### Generate Migrations

```bash
pnpm db:generate
```

Creates SQL migration files from TypeScript schemas in `src/migrations/`.

### Apply Migrations

```bash
pnpm db:migrate
```

Applies pending migrations to Supabase database.

**Prerequisites:**
- `DATABASE_URL` environment variable set
- Supabase project created

### Drizzle Studio

```bash
pnpm db:studio
```

Opens visual database editor at `https://local.drizzle.studio`.

### Seed Development Data

```bash
pnpm db:seed
```

Creates test users and questions for development.

## Usage

### In API Routes

```typescript
import { db, questions, users } from '@qapp/database';
import { eq, desc } from 'drizzle-orm';

// Query with joins
const questionsWithAuthors = await db
  .select({
    id: questions.id,
    title: questions.title,
    author: {
      id: users.id,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
    },
  })
  .from(questions)
  .innerJoin(users, eq(questions.authorId, users.id))
  .orderBy(desc(questions.createdAt))
  .limit(20);
```

### Schema Changes Workflow

1. **Modify schema** in `src/schema/*.ts`
2. **Generate migration**: `pnpm db:generate`
3. **Review SQL** in `src/migrations/`
4. **Apply migration**: `pnpm db:migrate`
5. **Commit** schema + migration files

## Row Level Security (RLS)

RLS policies are configured in Supabase SQL Editor (not Drizzle):

**Users:**
- SELECT: Everyone
- UPDATE: Own profile only

**Questions:**
- SELECT: Everyone (anonymous browsing)
- INSERT: Authenticated users only
- UPDATE/DELETE: Author only

See `docs/AUTHENTICATION_ANALYSIS.md` lines 709-737 for complete policies.

## References

- Drizzle ORM: https://orm.drizzle.team/
- Schema reference: ENGAGEMENT_AND_FEATURES.md lines 536-589
- RLS policies: AUTHENTICATION_ANALYSIS.md lines 709-737

