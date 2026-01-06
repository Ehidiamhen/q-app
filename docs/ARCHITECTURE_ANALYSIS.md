# QApp: Architecture Analysis & System Design

**Document Version:** 1.0  
**Date:** January 1, 2026  
**Author:** System Architecture Analysis  
**Status:** Final - MVP Approach Selected

---

## Table of Contents

- [Executive Summary](#executive-summary)
- [Project Context](#project-context)
- [Core Requirements Analysis](#core-requirements-analysis)
  - [Functional Requirements](#functional-requirements)
  - [Non-Functional Requirements](#non-functional-requirements)
- [Architectural Approaches](#architectural-approaches)
  - [Approach 1: Monolithic Next.js (API Routes)](#approach-1-monolithic-nextjs-api-routes)
  - [Approach 2: Separate Backend Service](#approach-2-separate-backend-service)
  - [Approach 3: Serverless Functions](#approach-3-serverless-functions)
- [Backend Framework Comparison](#backend-framework-comparison)
- [Database Selection](#database-selection)
- [ORM and Query Builder Options](#orm-and-query-builder-options)
- [Monorepo Structure](#monorepo-structure)
- [API Design](#api-design)
- [Technology Stack Summary](#technology-stack-summary)
- [Final Recommendation: MVP Architecture](#final-recommendation-mvp-architecture)
- [Alternative Approaches (For Future Reference)](#alternative-approaches-for-future-reference)
- [References](#references)

---

## Executive Summary

This document presents the architectural analysis for QApp, a crowdsourced question paper sharing platform for educational institutions. After evaluating multiple approaches against project constraints (single developer, ~1 week timeline, free-tier priority, dozens-hundreds of users), the recommended architecture is:

**Selected Stack:**
- **Architecture**: Monolithic Next.js with API Routes (simplest for MVP)
- **Database**: PostgreSQL via Supabase (generous free tier, built-in auth option)
- **ORM**: Drizzle ORM (lightweight, type-safe, fast)
- **Monorepo**: pnpm workspaces (already set up, sufficient for MVP)
- **Hosting**: Vercel (frontend) + Supabase (database)

**Key Rationale**: Single deployment target, minimal operational complexity, fastest path to MVP while maintaining code quality and upgrade paths.

---

## Project Context

### Problem Statement

Students and lecturers currently share past exam question papers through unorganized channels like WhatsApp groups and Google Drive folders. This leads to:
- Difficulty finding specific question papers
- Duplicate uploads across multiple channels
- No standardized metadata (course codes, years, etc.)
- No searchability by course, level, or topic

### Proposed Solution

QApp provides a centralized, searchable platform where users can:
- Upload images of question papers with structured metadata
- Browse a feed of uploaded question papers
- Search by course name, code, level, and hashtags
- (Future) Bookmark, like, and follow contributors

### Project Constraints

| Constraint | Value | Impact on Architecture |
|------------|-------|----------------------|
| Team Size | 1 developer + AI assistance | Favor simplicity over scalability |
| Timeline | ~1 week | Build vs buy decisions favor "buy" |
| Budget | Free tier priority | Limits service choices |
| Initial Users | Dozens to hundreds | No need for horizontal scaling |
| Institution | Single university | No multi-tenancy complexity |

---

## Core Requirements Analysis

### Functional Requirements

#### MVP (Must Have)
1. **Question Paper Upload**: Users can upload images with metadata (course name, code, level, hashtags)
2. **Feed Display**: Users see a chronological feed of uploaded question papers
3. **Search**: Users can search by course name, code, level, or hashtags
4. **View Details**: Users can view individual question paper details and images
5. **User Identity**: Some form of user identification (even if anonymous)

#### Post-MVP (Deferred)
- PDF upload support
- Image download functionality
- Likes/upvotes on posts
- User profiles and followership
- Comments on posts
- Bookmarking/saving posts

### Non-Functional Requirements

| Requirement | Target | Rationale |
|-------------|--------|-----------|
| Response Time | < 500ms for API calls | Good UX for search/browse |
| Availability | 99% (acceptable downtime) | MVP doesn't need enterprise SLA |
| Image Load Time | < 2s | CDN-backed storage |
| Concurrent Users | 50-100 | Single university scale |
| Data Retention | Indefinite | Question papers remain valuable |
| Security | Basic auth + input validation | Protect against common attacks |

---

## Architectural Approaches

### Approach 1: Monolithic Next.js (API Routes)

#### Architecture Overview

```
┌─────────────────────────────────────────────┐
│                   Vercel                     │
│  ┌─────────────────────────────────────┐    │
│  │           Next.js App               │    │
│  │  ┌─────────────┬─────────────────┐  │    │
│  │  │   Pages/    │   API Routes    │  │    │
│  │  │   React     │   /api/*        │  │    │
│  │  │   Components│   (Backend)     │  │    │
│  │  └─────────────┴─────────────────┘  │    │
│  └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
                      │
                      ▼
         ┌────────────────────────┐
         │   Supabase/PostgreSQL  │
         │   + Storage (R2/S3)    │
         └────────────────────────┘
```

#### How It Works

- Frontend and backend live in the same Next.js application
- API routes (`/app/api/*`) handle all backend logic
- Single deployment to Vercel
- Database and storage are external services

#### Pros

- ✅ **Simplest deployment**: One `git push` deploys everything
- ✅ **Shared types**: TypeScript types shared between frontend/backend
- ✅ **Fast development**: No context switching between repos
- ✅ **Free hosting**: Vercel free tier is generous
- ✅ **Built-in optimizations**: Image optimization, edge caching
- ✅ **Zero DevOps**: No server management

#### Cons

- ❌ **Coupled scaling**: Frontend and API scale together
- ❌ **Cold starts**: Serverless functions can have latency spikes
- ❌ **Limited long-running tasks**: 10s timeout on Vercel (hobby)
- ❌ **No WebSocket support**: Real-time features harder
- ❌ **API versioning harder**: Mixed with frontend routes

#### Tradeoffs

- **Simplicity vs Flexibility**: Maximum simplicity, but harder to evolve
- **Speed vs Scalability**: Fastest MVP, but refactoring needed later

#### Best For

- ✅ **MVP with <1000 users**
- ✅ **Single developer**
- ✅ **Tight timeline**
- ✅ **Prototype/validation phase**

---

### Approach 2: Separate Backend Service

#### Architecture Overview

```
┌──────────────┐         ┌──────────────────┐
│   Vercel     │         │  Railway/Render  │
│  ┌────────┐  │  HTTP   │  ┌────────────┐  │
│  │Next.js │──┼────────►│  │ Express.js │  │
│  │Frontend│  │         │  │  Backend   │  │
│  └────────┘  │         │  └────────────┘  │
└──────────────┘         └────────┬─────────┘
                                  │
                                  ▼
                      ┌────────────────────┐
                      │      Database      │
                      │      + Storage     │
                      └────────────────────┘
```

#### How It Works

- Next.js frontend deployed to Vercel
- Express.js/Fastify backend deployed to Railway/Render
- Backend exposes REST API consumed by frontend
- Two separate deployments

#### Pros

- ✅ **Independent scaling**: Frontend and backend scale separately
- ✅ **Clear separation**: API can serve multiple clients
- ✅ **No cold starts**: Persistent server (on paid tiers)
- ✅ **Long-running tasks**: No timeout limitations
- ✅ **Future API layer**: Easy to add API keys, rate limiting per client

#### Cons

- ❌ **Two deployments**: More operational overhead
- ❌ **CORS configuration**: Need to handle cross-origin requests
- ❌ **Network latency**: Extra hop between frontend and backend
- ❌ **Cost**: Railway/Render free tiers are limited
- ❌ **Type sharing**: Need shared package or OpenAPI generation

#### Tradeoffs

- **Flexibility vs Complexity**: More options, but more to manage
- **Scalability vs Cost**: Better scaling path, but higher baseline cost

#### Best For

- ✅ **Apps expecting growth beyond MVP**
- ✅ **Need for public API**
- ✅ **Multiple frontend clients (web, mobile)**
- ✅ **Team development**

---

### Approach 3: Serverless Functions

#### Architecture Overview

```
┌─────────────────────────────────────────────┐
│                   Vercel                     │
│  ┌─────────────────────────────────────┐    │
│  │           Next.js App               │    │
│  └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
                      │
          ┌───────────┼───────────┐
          ▼           ▼           ▼
    ┌──────────┐ ┌──────────┐ ┌──────────┐
    │ Lambda/  │ │ Lambda/  │ │ Lambda/  │
    │ upload   │ │ search   │ │ getPost  │
    └──────────┘ └──────────┘ └──────────┘
                      │
                      ▼
         ┌────────────────────────┐
         │   Database + Storage   │
         └────────────────────────┘
```

#### How It Works

- Frontend on Vercel
- Individual serverless functions for each API operation
- Functions on AWS Lambda, Vercel Functions, or Cloudflare Workers
- Pay-per-invocation model

#### Pros

- ✅ **Auto-scaling**: Handles traffic spikes automatically
- ✅ **Pay-per-use**: Cost-effective for variable traffic
- ✅ **No server management**: Fully managed
- ✅ **Edge deployment**: Low latency globally (Workers)

#### Cons

- ❌ **Cold starts**: Latency on first request after idle
- ❌ **Timeout limits**: AWS Lambda 15min, Vercel 10s-60s
- ❌ **Debugging harder**: Distributed logs
- ❌ **Vendor lock-in**: Platform-specific patterns
- ❌ **Database connections**: Connection pooling challenges

#### Tradeoffs

- **Scalability vs Latency**: Infinite scale, but cold start penalty
- **Cost at low traffic vs high traffic**: Cheap when quiet, expensive when busy

#### Best For

- ✅ **Variable/unpredictable traffic**
- ✅ **Event-driven workloads**
- ✅ **Globally distributed users**

---

### Architecture Comparison Table

| Aspect | Monolithic Next.js | Separate Backend | Serverless |
|--------|-------------------|------------------|------------|
| **Deployment Complexity** | ⭐⭐⭐⭐⭐ Easiest | ⭐⭐⭐ Medium | ⭐⭐⭐⭐ Easy |
| **Development Speed** | ⭐⭐⭐⭐⭐ Fastest | ⭐⭐⭐ Medium | ⭐⭐⭐⭐ Fast |
| **Scaling** | ⭐⭐ Limited | ⭐⭐⭐⭐ Good | ⭐⭐⭐⭐⭐ Best |
| **Cost (MVP)** | ⭐⭐⭐⭐⭐ Free | ⭐⭐⭐ Some cost | ⭐⭐⭐⭐ Free |
| **Future Flexibility** | ⭐⭐ Limited | ⭐⭐⭐⭐⭐ Best | ⭐⭐⭐ Medium |
| **Type Safety** | ⭐⭐⭐⭐⭐ Native | ⭐⭐⭐ Extra work | ⭐⭐⭐ Extra work |

**Recommendation for QApp MVP**: **Approach 1 - Monolithic Next.js**

---

## Backend Framework Comparison

Even with Monolithic Next.js selected, understanding backend frameworks helps for:
1. Future migration if needed
2. Shared backend logic patterns
3. Understanding alternatives

### Express.js

**Overview**: The most popular Node.js framework, minimal and unopinionated.

```typescript
// Example Express.js route
app.post('/api/questions', async (req, res) => {
  const { title, courseCode, images } = req.body;
  const question = await db.questions.create({ title, courseCode, images });
  res.json(question);
});
```

#### Pros
- ✅ Massive ecosystem and community
- ✅ Extensive middleware library
- ✅ Well-documented, tons of tutorials
- ✅ Familiar to most Node.js developers

#### Cons
- ❌ No built-in TypeScript support
- ❌ Callback-based (though async/await works)
- ❌ No built-in validation
- ❌ Performance not optimal

---

### Fastify

**Overview**: Performance-focused Express alternative with built-in validation.

```typescript
// Example Fastify route
fastify.post('/api/questions', {
  schema: {
    body: questionSchema,
    response: { 200: questionResponseSchema }
  }
}, async (request, reply) => {
  const question = await db.questions.create(request.body);
  return question;
});
```

#### Pros
- ✅ 2-3x faster than Express
- ✅ Built-in JSON schema validation
- ✅ TypeScript support
- ✅ Excellent plugin system

#### Cons
- ❌ Smaller ecosystem than Express
- ❌ Learning curve for schema system
- ❌ Some Express middleware incompatible

---

### Hono

**Overview**: Ultrafast, edge-first framework. Works on Cloudflare Workers, Deno, Bun, Node.

```typescript
// Example Hono route
app.post('/api/questions', async (c) => {
  const body = await c.req.json();
  const question = await db.questions.create(body);
  return c.json(question);
});
```

#### Pros
- ✅ Extremely fast (optimized for edge)
- ✅ Works everywhere (Workers, Node, Bun, Deno)
- ✅ Tiny bundle size
- ✅ Modern API design

#### Cons
- ❌ Newer, smaller community
- ❌ Fewer middleware options
- ❌ Less documentation

---

### tRPC

**Overview**: End-to-end typesafe APIs without REST. Works seamlessly with Next.js.

```typescript
// Example tRPC router
export const questionRouter = router({
  create: publicProcedure
    .input(z.object({ title: z.string(), courseCode: z.string() }))
    .mutation(async ({ input }) => {
      return db.questions.create(input);
    }),
  
  list: publicProcedure
    .query(async () => {
      return db.questions.findMany();
    }),
});
```

```typescript
// Client usage - fully typed!
const question = await trpc.question.create.mutate({
  title: 'CS101 Final 2024',
  courseCode: 'CS101'
});
```

#### Pros
- ✅ Full type safety frontend to backend
- ✅ No API schema to maintain
- ✅ Auto-completion everywhere
- ✅ Perfect for Next.js monoliths

#### Cons
- ❌ Tied to TypeScript ecosystem
- ❌ Can't serve non-TypeScript clients easily
- ❌ Learning curve for concepts
- ❌ Harder to document for external users

---

### Framework Comparison Table

| Framework | Performance | TypeScript | Ecosystem | Learning Curve | Best For |
|-----------|-------------|------------|-----------|----------------|----------|
| Express.js | ⭐⭐⭐ | ⭐⭐ (manual) | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ Easy | General purpose |
| Fastify | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Performance-critical |
| Hono | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | Edge/Serverless |
| tRPC | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | Next.js monoliths |

**Recommendation for QApp MVP**: **tRPC** (if staying monolithic) or **Express.js** (if separating later)

For the monolithic Next.js approach, tRPC provides the best developer experience with zero runtime overhead for API contracts.

---

## Database Selection

### PostgreSQL (via Supabase)

**Overview**: World's most advanced open-source relational database, hosted on Supabase with generous free tier.

#### Supabase Free Tier
- 500 MB database storage
- 1 GB file storage
- 50,000 monthly active users
- Unlimited API requests

```typescript
// Example with Drizzle ORM
const questions = await db.select()
  .from(questionsTable)
  .where(eq(questionsTable.courseCode, 'CS101'))
  .limit(20);
```

#### Pros
- ✅ Relational data model (perfect for structured metadata)
- ✅ Full-text search built-in
- ✅ ACID transactions
- ✅ Supabase adds: Auth, Storage, Realtime
- ✅ Generous free tier
- ✅ SQL is well-known

#### Cons
- ❌ Schema migrations required for changes
- ❌ Less flexible than NoSQL for varying data shapes
- ❌ Supabase vendor lock-in (though Postgres is portable)

---

### MongoDB Atlas

**Overview**: Document database with flexible schema, good for rapidly evolving data models.

#### Free Tier
- 512 MB storage
- Shared cluster

```typescript
// Example with MongoDB
const questions = await db.collection('questions')
  .find({ courseCode: 'CS101' })
  .limit(20)
  .toArray();
```

#### Pros
- ✅ Flexible schema (no migrations for shape changes)
- ✅ JSON-like documents
- ✅ Good for nested data
- ✅ Atlas Search for full-text

#### Cons
- ❌ No true relations (joins are expensive)
- ❌ Less free storage than Supabase
- ❌ Consistency model can be confusing
- ❌ Separate services for auth, storage

---

### PlanetScale

**Overview**: Serverless MySQL with branching and non-blocking schema changes.

#### Free Tier
- 5 GB storage
- 1 billion row reads/month
- 10 million row writes/month

#### Pros
- ✅ Generous free tier
- ✅ Branching for schema changes
- ✅ Serverless (auto-scales)
- ✅ MySQL compatibility

#### Cons
- ❌ No foreign keys (by design)
- ❌ MySQL, not PostgreSQL
- ❌ No built-in auth or storage

---

### Turso (libSQL)

**Overview**: SQLite at the edge, globally distributed.

#### Free Tier
- 9 GB storage
- 500 databases
- 25 million row reads/month

#### Pros
- ✅ Very generous free tier
- ✅ Edge deployment (low latency)
- ✅ SQLite compatibility
- ✅ Embedded replicas option

#### Cons
- ❌ Newer, less proven at scale
- ❌ SQLite limitations (single writer)
- ❌ No built-in auth or storage

---

### Database Comparison Table

| Database | Free Storage | Auth Built-in | Storage Built-in | Full-Text Search | Best For |
|----------|-------------|---------------|------------------|------------------|----------|
| Supabase (Postgres) | 500 MB | ✅ Yes | ✅ Yes | ✅ Built-in | All-in-one solution |
| MongoDB Atlas | 512 MB | ❌ No | ❌ No | ⚠️ Atlas Search | Flexible schemas |
| PlanetScale | 5 GB | ❌ No | ❌ No | ⚠️ Limited | Scaling MySQL |
| Turso | 9 GB | ❌ No | ❌ No | ⚠️ Limited | Edge deployment |

**Recommendation for QApp MVP**: **Supabase (PostgreSQL)**

Rationale:
1. All-in-one: Database + Auth + Storage in one service
2. Generous free tier sufficient for MVP
3. PostgreSQL is the right model for structured question paper metadata
4. Built-in full-text search covers MVP search requirements
5. Easy migration path (Postgres is standard)

---

## ORM and Query Builder Options

### Prisma

**Overview**: Most popular TypeScript ORM with excellent developer experience.

```typescript
// Schema definition
model Question {
  id        String   @id @default(cuid())
  title     String
  courseCode String
  images    String[]
  createdAt DateTime @default(now())
  author    User     @relation(fields: [authorId], references: [id])
  authorId  String
}

// Usage
const question = await prisma.question.create({
  data: { title: 'CS101 Final', courseCode: 'CS101', images: ['url1'] }
});
```

#### Pros
- ✅ Best-in-class TypeScript types
- ✅ Great migration system
- ✅ Prisma Studio (GUI)
- ✅ Excellent documentation

#### Cons
- ❌ Large bundle size (~2MB)
- ❌ Cold start issues in serverless
- ❌ Query engine can be slow
- ❌ Limited raw SQL flexibility

---

### Drizzle ORM

**Overview**: Lightweight, SQL-like TypeScript ORM. Rising star.

```typescript
// Schema definition
export const questions = pgTable('questions', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  title: text('title').notNull(),
  courseCode: text('course_code').notNull(),
  images: text('images').array(),
  createdAt: timestamp('created_at').defaultNow(),
  authorId: text('author_id').references(() => users.id),
});

// Usage - SQL-like syntax
const result = await db.select()
  .from(questions)
  .where(eq(questions.courseCode, 'CS101'))
  .limit(20);
```

#### Pros
- ✅ Tiny bundle (~7KB)
- ✅ No cold start issues
- ✅ SQL-like syntax (familiar)
- ✅ Excellent performance
- ✅ Works with any SQL database

#### Cons
- ❌ Younger ecosystem
- ❌ Less documentation than Prisma
- ❌ Migration tooling still maturing

---

### Kysely

**Overview**: Type-safe SQL query builder (not a full ORM).

```typescript
const questions = await db
  .selectFrom('questions')
  .where('courseCode', '=', 'CS101')
  .selectAll()
  .limit(20)
  .execute();
```

#### Pros
- ✅ Maximum SQL control
- ✅ Tiny bundle
- ✅ Very fast
- ✅ Great for complex queries

#### Cons
- ❌ Not an ORM (no relations, migrations)
- ❌ More boilerplate
- ❌ Manual type definitions

---

### ORM Comparison Table

| ORM | Bundle Size | Performance | DX | Migrations | Serverless-Ready |
|-----|-------------|-------------|-----|------------|------------------|
| Prisma | ~2MB | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ (cold starts) |
| Drizzle | ~7KB | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Kysely | ~10KB | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ❌ None | ⭐⭐⭐⭐⭐ |

**Recommendation for QApp MVP**: **Drizzle ORM**

Rationale:
1. Best performance for serverless (Vercel)
2. No cold start penalty
3. SQL-like syntax is intuitive
4. Growing ecosystem and community
5. Works perfectly with Supabase PostgreSQL

---

## Monorepo Structure

### Recommended Structure (pnpm Workspaces)

```
q-app/
├── apps/
│   ├── frontend/          # Next.js application
│   │   ├── app/           # App Router pages
│   │   ├── components/    # React components
│   │   ├── lib/           # Utilities, hooks
│   │   └── package.json
│   │
│   └── backend/           # (Future) Separate backend if needed
│       └── package.json
│
├── packages/
│   ├── database/          # Drizzle schema + migrations
│   │   ├── src/
│   │   │   ├── schema.ts  # Table definitions
│   │   │   ├── index.ts   # DB client export
│   │   │   └── migrate.ts # Migration runner
│   │   ├── drizzle/       # Migration files
│   │   └── package.json
│   │
│   ├── shared/            # Shared types, utilities
│   │   ├── src/
│   │   │   ├── types.ts   # Shared TypeScript types
│   │   │   └── utils.ts   # Shared utilities
│   │   └── package.json
│   │
│   └── ui/                # (Optional) Shared UI components
│       └── package.json
│
├── pnpm-workspace.yaml    # Workspace configuration
├── package.json           # Root package.json
├── tsconfig.json          # Base TypeScript config
└── .env.example           # Environment variables template
```

### pnpm-workspace.yaml

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

### Root package.json Scripts

```json
{
  "name": "qapp",
  "private": true,
  "scripts": {
    "dev": "pnpm --filter frontend dev",
    "build": "pnpm --filter frontend build",
    "db:generate": "pnpm --filter database generate",
    "db:migrate": "pnpm --filter database migrate",
    "db:studio": "pnpm --filter database studio"
  }
}
```

### Package References

```json
// apps/frontend/package.json
{
  "dependencies": {
    "@qapp/database": "workspace:*",
    "@qapp/shared": "workspace:*"
  }
}
```

---

## API Design

### MVP Endpoints

For the monolithic Next.js approach, these are implemented as API routes:

```
POST   /api/questions          Create a new question paper
GET    /api/questions          List questions (with pagination)
GET    /api/questions/:id      Get single question details
GET    /api/questions/search   Search questions
POST   /api/upload             Get presigned URL for image upload
```

### Data Models

```typescript
// Question Paper
interface QuestionPaper {
  id: string;
  title: string;
  courseCode: string;
  courseName: string;
  level: number;          // e.g., 100, 200, 300, 400
  year: number;           // e.g., 2024
  semester: string;       // e.g., "First", "Second"
  hashtags: string[];
  images: string[];       // Array of image URLs
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
}

// User (minimal for MVP)
interface User {
  id: string;
  deviceId: string;       // Anonymous device identifier
  displayName?: string;   // Optional display name
  createdAt: Date;
}
```

### Request/Response Examples

```typescript
// POST /api/questions
// Request
{
  "title": "CS101 Introduction to Programming - Final Exam 2024",
  "courseCode": "CS101",
  "courseName": "Introduction to Programming",
  "level": 100,
  "year": 2024,
  "semester": "First",
  "hashtags": ["programming", "java", "final"],
  "images": ["https://storage.../image1.jpg", "https://storage.../image2.jpg"]
}

// Response
{
  "id": "clx1234567890",
  "title": "CS101 Introduction to Programming - Final Exam 2024",
  "courseCode": "CS101",
  // ... full question object
  "createdAt": "2026-01-01T12:00:00Z"
}
```

```typescript
// GET /api/questions?page=1&limit=20
// Response
{
  "questions": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "hasMore": true
  }
}
```

```typescript
// GET /api/questions/search?q=programming&level=100
// Response
{
  "questions": [...],
  "query": "programming",
  "filters": { "level": 100 },
  "total": 12
}
```

---

## Technology Stack Summary

### Final MVP Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Frontend** | Next.js 14+ (App Router) | Already set up, excellent DX |
| **Styling** | Tailwind CSS | Fast, utility-first |
| **Backend** | Next.js API Routes + tRPC | Type-safe, no extra deployment |
| **Database** | PostgreSQL (Supabase) | All-in-one, generous free tier |
| **ORM** | Drizzle ORM | Fast, small bundle, serverless-ready |
| **Storage** | Cloudflare R2 | Zero egress, cost-effective |
| **Auth** | Anonymous tokens + Supabase Auth | Frictionless with upgrade path |
| **Hosting** | Vercel | Free, optimized for Next.js |
| **Monorepo** | pnpm workspaces | Simple, already working |

### Development Tools

| Tool | Purpose |
|------|---------|
| TypeScript | Type safety across stack |
| ESLint | Code quality |
| Prettier | Code formatting |
| pnpm | Fast package management |

---

## Final Recommendation: MVP Architecture

### Selected Approach: Monolithic Next.js

```
┌─────────────────────────────────────────────────────────────┐
│                        Vercel                                │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                    Next.js App                          │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │  App Router (React Server Components)            │  │ │
│  │  │  - pages, layouts, components                    │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │  API Routes (/api/*) or tRPC                     │  │ │
│  │  │  - question CRUD                                 │  │ │
│  │  │  - search                                        │  │ │
│  │  │  - upload URLs                                   │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │  @qapp/database (Drizzle + Supabase)             │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
   ┌─────────────────────┐         ┌─────────────────────┐
   │     Supabase        │         │   Cloudflare R2     │
   │  ┌───────────────┐  │         │   (Image Storage)   │
   │  │  PostgreSQL   │  │         │                     │
   │  └───────────────┘  │         │   Zero egress fees  │
   │  ┌───────────────┐  │         │   CDN included      │
   │  │  Auth         │  │         └─────────────────────┘
   │  │  (optional)   │  │
   │  └───────────────┘  │
   └─────────────────────┘
```

### Why This Architecture Wins for MVP

1. **Single Deployment**: One `git push` deploys everything
2. **Zero Server Management**: Vercel + Supabase are fully managed
3. **Free Tier Sufficient**: All services have generous free tiers
4. **Type Safety**: TypeScript + Drizzle + tRPC = end-to-end types
5. **Fast Development**: ~1 week timeline is achievable
6. **Upgrade Path**: Can extract backend later if needed

### Key Simplifications for MVP

1. ✅ No separate backend service (API routes only)
2. ✅ No container orchestration (serverless only)
3. ✅ No Redis/caching layer (database is sufficient)
4. ✅ No CDN configuration (Vercel provides this)
5. ✅ No CI/CD setup beyond Vercel auto-deploy

---

## Alternative Approaches (For Future Reference)

### Alternative 1: Separate Express Backend

**When to consider:**
- Need public API for third-party integrations
- Mobile app client in addition to web
- Outgrow Vercel function limits

**Migration path:**
1. Extract API routes to Express.js service
2. Deploy to Railway or Render
3. Update frontend to call external API

---

### Alternative 2: Serverless with AWS

**When to consider:**
- Need fine-grained control over infrastructure
- Multi-region deployment required
- Very high scale (millions of requests)

**Components:**
- AWS Lambda for functions
- API Gateway for routing
- RDS for PostgreSQL
- S3 for storage
- CloudFront for CDN

---

### Alternative 3: Full Supabase Stack

**When to consider:**
- Want even faster MVP
- Okay with more vendor lock-in
- Need realtime features (comments, notifications)

**Stack:**
- Next.js frontend
- Supabase Edge Functions (instead of API routes)
- Supabase Database, Auth, Storage, Realtime

---

## References

1. [Next.js Documentation](https://nextjs.org/docs)
2. [Vercel Limits and Pricing](https://vercel.com/docs/limits/overview)
3. [Supabase Documentation](https://supabase.com/docs)
4. [Drizzle ORM Documentation](https://orm.drizzle.team/)
5. [tRPC Documentation](https://trpc.io/docs)
6. [pnpm Workspaces](https://pnpm.io/workspaces)
7. [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)

---

**Document Status**: Complete - MVP Approach Selected  
**Selected Approach**: Monolithic Next.js with API Routes/tRPC  
**Database**: PostgreSQL via Supabase  
**Storage**: Cloudflare R2  
**Next Action**: Review STORAGE_AND_UPLOAD_ANALYSIS.md for storage implementation details

