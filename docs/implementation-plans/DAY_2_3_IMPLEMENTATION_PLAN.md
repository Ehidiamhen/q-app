# Day 2-3 Implementation Plan: Backend API & Frontend Core UI

**Document Version:** 1.0  
**Date:** January 9, 2026  
**Status:** Planning Phase  
**Target Timeline:** Days 2-3 of MVP Development

---

## Table of Contents

- [Overview](#overview)
- [Day 2: Backend API Implementation](#day-2-backend-api-implementation)
  - [1. Google OAuth Callback Handler](#1-google-oauth-callback-handler)
  - [2. Questions API Endpoints](#2-questions-api-endpoints)
  - [3. Upload Presigned URL Endpoint](#3-upload-presigned-url-endpoint)
  - [4. Users API Endpoints](#4-users-api-endpoints)
  - [5. Authentication Middleware](#5-authentication-middleware)
  - [6. Error Handling Strategy](#6-error-handling-strategy)
- [Day 3: Frontend Core UI](#day-3-frontend-core-ui)
  - [1. shadcn/ui Setup](#1-shadcnui-setup)
  - [2. Auth Components](#2-auth-components)
  - [3. Question Components](#3-question-components)
  - [4. Feed Implementation](#4-feed-implementation)
  - [5. Loading States](#5-loading-states)
- [Cross-Cutting Concerns](#cross-cutting-concerns)
- [Testing Strategy](#testing-strategy)
- [Risk Analysis](#risk-analysis)
- [Success Criteria](#success-criteria)

---

## Overview

### Objectives

**Day 2 (Backend API):**
- Implement all API routes required for MVP functionality
- Set up authentication flow with Google OAuth
- Establish error handling and validation patterns
- Create R2 presigned URL generation for direct uploads

**Day 3 (Frontend Core UI):**
- Build authentication UI components
- Create question display components
- Implement feed page with infinite scroll/pagination
- Add loading and error states

### Key Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **API Pattern** | Next.js Route Handlers | Monolithic architecture, single deployment |
| **Auth Library** | @supabase/ssr | Official Supabase package for Next.js 16 SSR |
| **State Management** | TanStack Query v5 | Server state caching, automatic refetching |
| **UI Components** | shadcn/ui | Unstyled, customizable, no runtime cost |
| **Validation** | Zod v4 (shared package) | Type-safe validation, shared client/server |
| **Error Handling** | Standardized ApiResponse<T> | Consistent error structure across all endpoints |

---

## Day 2: Backend API Implementation

### 1. Google OAuth Callback Handler

#### Purpose
Handle OAuth callback from Google, create/update user record, establish session.

#### Implementation Location
`apps/frontend/app/(auth)/auth/callback/route.ts`

#### Approach: Supabase SSR Flow

**Reference:** AUTHENTICATION_ANALYSIS.md lines 807-920

```typescript
// app/(auth)/auth/callback/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { db, users } from '@qapp/database';
import { eq } from 'drizzle-orm';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;
  
  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && data.user) {
      // Sync user to our database
      await syncUser(data.user);
    }
  }
  
  return NextResponse.redirect(`${origin}/`);
}
```

#### Design Decisions & Tradeoffs

**Decision 1: Where to create user records?**

| Approach | Pros | Cons | Selected |
|----------|------|------|----------|
| **Database trigger** | Automatic, no app code needed | Hard to debug, requires SQL | ❌ No |
| **Callback handler** | Explicit control, easy debugging | Must handle race conditions | ✅ **Yes** |
| **Middleware** | Runs on every request | Performance overhead | ❌ No |

**Selected:** Callback handler with upsert pattern
- **Rationale**: Explicit control, easy to debug, handles race conditions with upsert
- **Trade-off**: Slightly more code, but much more maintainable

**Decision 2: User data syncing strategy**

```typescript
async function syncUser(supabaseUser: User) {
  const userData = {
    id: supabaseUser.id,
    email: supabaseUser.email!,
    displayName: supabaseUser.user_metadata.full_name || 
                 supabaseUser.email!.split('@')[0],
    avatarUrl: supabaseUser.user_metadata.avatar_url,
    provider: 'google',
  };
  
  // Upsert: Insert if new, update if exists
  await db.insert(users)
    .values(userData)
    .onConflictDoUpdate({
      target: users.id,
      set: {
        avatarUrl: userData.avatarUrl, // Update avatar if changed
        updatedAt: new Date(),
      },
    });
}
```

**Pros:**
- ✅ Always keeps avatar URL fresh (if user changes Google profile pic)
- ✅ Handles duplicate callback calls gracefully
- ✅ No manual intervention needed

**Cons:**
- ⚠️ Overwrites avatar even if user never logs in again (minor)
- ⚠️ Two database operations per login (acceptable for MVP)

---

### 2. Questions API Endpoints

#### 2.1 POST /api/questions - Create Question

**Purpose:** Create new question paper with images already uploaded to R2.

**File:** `apps/frontend/app/api/questions/route.ts`

#### Implementation Strategy

**Flow:**
1. Client uploads images to R2 (using presigned URLs)
2. Client calls this endpoint with image URLs + metadata
3. Server validates data with Zod
4. Server verifies auth (requireAuth)
5. Server inserts to database with author ID
6. Server returns created question

```typescript
// app/api/questions/route.ts
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/server';
import { db, questions, users } from '@qapp/database';
import { createQuestionSchema } from '@qapp/shared';
import { eq } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    // 1. Require authentication
    const { userId } = await requireAuth();
    
    // 2. Parse and validate request body
    const body = await request.json();
    const validated = createQuestionSchema.parse(body);
    
    // 3. Insert question
    const [question] = await db.insert(questions)
      .values({
        ...validated,
        authorId: userId,
      })
      .returning();
    
    // 4. Fetch with author info for response
    const [questionWithAuthor] = await db.select({
      id: questions.id,
      title: questions.title,
      courseCode: questions.courseCode,
      courseName: questions.courseName,
      level: questions.level,
      year: questions.year,
      semester: questions.semester,
      hashtags: questions.hashtags,
      images: questions.images,
      createdAt: questions.createdAt,
      author: {
        id: users.id,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
      },
    })
    .from(questions)
    .innerJoin(users, eq(questions.authorId, users.id))
    .where(eq(questions.id, question.id));
    
    return NextResponse.json({
      success: true,
      data: questionWithAuthor,
    }, { status: 201 });
    
  } catch (error) {
    return handleApiError(error);
  }
}
```

#### Design Decisions & Tradeoffs

**Decision 1: When to upload images?**

| Approach | Pros | Cons | Selected |
|----------|------|------|----------|
| **Upload images BEFORE metadata** | Server validates all data upfront | Orphaned images if metadata fails | ✅ **Yes** |
| **Upload metadata BEFORE images** | No orphaned images | Poor UX (upload fails after form submission) | ❌ No |
| **Transactional (both together)** | Most reliable | Complex, requires transaction management | ❌ No (overkill) |

**Selected:** Images first, then metadata
- **Rationale**: Better UX (see upload progress), easier error recovery
- **Trade-off**: Some orphaned images in R2 (acceptable, can clean up with cron job later)

**Decision 2: Return full question or minimal response?**

| Approach | Pros | Cons | Selected |
|----------|------|------|----------|
| **Return full question with author** | Client can update UI immediately | Extra database query | ✅ **Yes** |
| **Return just question ID** | Faster, simpler | Client must refetch | ❌ No |

**Selected:** Return full question with author
- **Rationale**: Better UX, enables optimistic UI updates
- **Trade-off**: One extra SELECT query (negligible performance impact)

---

#### 2.2 GET /api/questions - List Questions (Feed)

**Purpose:** Paginated feed of recent questions with author info.

```typescript
// app/api/questions/route.ts (continued)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const offset = (page - 1) * limit;
    
    // Get questions with author info
    const questionsList = await db.select({
      id: questions.id,
      title: questions.title,
      courseCode: questions.courseCode,
      courseName: questions.courseName,
      level: questions.level,
      year: questions.year,
      semester: questions.semester,
      hashtags: questions.hashtags,
      images: questions.images,
      createdAt: questions.createdAt,
      author: {
        id: users.id,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
      },
    })
    .from(questions)
    .innerJoin(users, eq(questions.authorId, users.id))
    .orderBy(desc(questions.createdAt))
    .limit(limit)
    .offset(offset);
    
    // Get total count for pagination
    const [{ count }] = await db.select({
      count: count()
    }).from(questions);
    
    const totalPages = Math.ceil(count / limit);
    
    return NextResponse.json({
      success: true,
      data: {
        data: questionsList.map(q => ({
          ...q,
          thumbnail: q.images[0],
          imageCount: q.images.length,
        })),
        pagination: {
          page,
          limit,
          total: count,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
    });
    
  } catch (error) {
    return handleApiError(error);
  }
}
```

#### Design Decisions & Tradeoffs

**Decision 1: Pagination vs Infinite Scroll**

| Approach | Pros | Cons | Implementation |
|----------|------|------|----------------|
| **Offset pagination** | Simple, page numbers | Performance degrades with large offsets | ✅ **Yes** (MVP) |
| **Cursor pagination** | Better performance, scalable | Complex, no page numbers | ⏭️ V2 |
| **Infinite scroll** | Great mobile UX | Harder to reach specific item | Frontend choice |

**Selected:** Offset pagination with page numbers
- **Rationale**: Simpler for MVP, performance acceptable for <10k records
- **Upgrade path**: Switch to cursor-based when database grows

**Decision 2: Include author info or separate endpoint?**

| Approach | Pros | Cons | Selected |
|----------|------|------|----------|
| **Include author with JOIN** | One request, better UX | Slightly larger payload | ✅ **Yes** |
| **Separate author endpoint** | Smaller payloads | N+1 queries from client | ❌ No |
| **Author IDs only** | Minimal payload | Poor UX (no attribution) | ❌ No |

**Selected:** Include author info with JOIN
- **Rationale**: User attribution is core feature (ENGAGEMENT_AND_FEATURES.md lines 614-648)
- **Trade-off**: Larger JSON response (acceptable, gzip compresses well)

---

#### 2.3 GET /api/questions/search - Search Questions

**Purpose:** Filter questions by course code, name, level, year, semester, hashtags.

```typescript
// app/api/questions/search/route.ts
import { searchQuerySchema } from '@qapp/shared';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Validate query params with Zod
    const params = searchQuerySchema.parse({
      q: searchParams.get('q') || undefined,
      level: searchParams.get('level') || undefined,
      year: searchParams.get('year') || undefined,
      semester: searchParams.get('semester') || undefined,
      hashtag: searchParams.get('hashtag') || undefined,
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
    });
    
    // Build dynamic query
    let query = db.select({
      id: questions.id,
      title: questions.title,
      courseCode: questions.courseCode,
      courseName: questions.courseName,
      level: questions.level,
      year: questions.year,
      semester: questions.semester,
      hashtags: questions.hashtags,
      images: questions.images,
      createdAt: questions.createdAt,
      author: {
        id: users.id,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
      },
    })
    .from(questions)
    .innerJoin(users, eq(questions.authorId, users.id))
    .$dynamic();
    
    const conditions = [];
    
    // Text search (course code or name)
    if (params.q) {
      conditions.push(
        or(
          ilike(questions.courseCode, `%${params.q}%`),
          ilike(questions.courseName, `%${params.q}%`),
          ilike(questions.title, `%${params.q}%`)
        )
      );
    }
    
    // Filter by level
    if (params.level) {
      conditions.push(eq(questions.level, params.level));
    }
    
    // Filter by year
    if (params.year) {
      conditions.push(eq(questions.year, params.year));
    }
    
    // Filter by semester
    if (params.semester) {
      conditions.push(eq(questions.semester, params.semester));
    }
    
    // Filter by hashtag (array contains)
    if (params.hashtag) {
      conditions.push(
        sql`${questions.hashtags} && ARRAY[${params.hashtag}]::text[]`
      );
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    const results = await query
      .orderBy(desc(questions.createdAt))
      .limit(params.limit)
      .offset((params.page - 1) * params.limit);
    
    // ... pagination logic similar to GET /api/questions
    
  } catch (error) {
    return handleApiError(error);
  }
}
```

#### Design Decisions & Tradeoffs

**Decision 1: Search implementation (MVP)**

| Approach | Pros | Cons | Selected |
|----------|------|------|----------|
| **PostgreSQL ILIKE** | Simple, no setup | Case-insensitive, no ranking | ✅ **Yes** (MVP) |
| **PostgreSQL Full-Text Search** | Better relevance, ranking | Requires tsvector column, triggers | ⏭️ V2 |
| **Meilisearch** | Best UX, typo-tolerant | Extra service to manage | ⏭️ V2 if needed |

**Reference:** ENGAGEMENT_AND_FEATURES.md lines 664-770

**Selected:** ILIKE for MVP
- **Rationale**: Adequate for MVP (<1000 papers), no additional setup
- **Upgrade path**: Add full-text search when search quality becomes issue

**Decision 2: Filter combination logic**

**Selected:** AND logic (all filters must match)
- **Rationale**: More specific results, better UX for narrow searches
- **Alternative**: OR logic would be too broad (rare use case)

---

#### 2.4 GET /api/questions/[id] - Get Single Question

**Purpose:** Fetch complete question details with all images and author info.

```typescript
// app/api/questions/[id]/route.ts
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const [question] = await db.select({
      id: questions.id,
      title: questions.title,
      courseCode: questions.courseCode,
      courseName: questions.courseName,
      level: questions.level,
      year: questions.year,
      semester: questions.semester,
      hashtags: questions.hashtags,
      images: questions.images,
      createdAt: questions.createdAt,
      author: {
        id: users.id,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
        createdAt: users.createdAt,
      },
    })
    .from(questions)
    .innerJoin(users, eq(questions.authorId, users.id))
    .where(eq(questions.id, params.id));
    
    if (!question) {
      return NextResponse.json({
        success: false,
        error: 'Question not found',
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      data: question,
    });
    
  } catch (error) {
    return handleApiError(error);
  }
}
```

---

### 3. Upload Presigned URL Endpoint

#### Purpose
Generate presigned URLs for direct client-to-R2 uploads.

**Reference:** STORAGE_AND_UPLOAD_ANALYSIS.md lines 372-407

**File:** `apps/frontend/app/api/upload/presign/route.ts`

```typescript
// app/api/upload/presign/route.ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { requireAuth } from '@/lib/supabase/server';
import { createId } from '@paralleldrive/cuid2';

const R2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: Request) {
  try {
    // Require authentication
    const { userId } = await requireAuth();
    
    const body = await request.json();
    const { filename, contentType } = body;
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(contentType)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid file type. Only JPEG, PNG, and WebP allowed.',
      }, { status: 400 });
    }
    
    // Generate unique key
    const ext = filename.split('.').pop();
    const key = `questions/${userId}/${createId()}.${ext}`;
    
    // Generate presigned URL (10 min expiry)
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      ContentType: contentType,
    });
    
    const presignedUrl = await getSignedUrl(R2, command, { 
      expiresIn: 600 // 10 minutes
    });
    
    const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;
    
    return NextResponse.json({
      success: true,
      data: {
        presignedUrl,
        key,
        publicUrl,
      },
    });
    
  } catch (error) {
    return handleApiError(error);
  }
}
```

#### Design Decisions & Tradeoffs

**Decision 1: Direct upload vs proxy through server**

| Approach | Pros | Cons | Selected |
|----------|------|------|----------|
| **Presigned URLs (direct)** | Scalable, no server bottleneck | Slightly complex client code | ✅ **Yes** |
| **Upload through API route** | Simple client code | Server bandwidth bottleneck | ❌ No |
| **Cloudflare Workers** | Edge performance | Extra service, more complexity | ❌ No |

**Reference:** STORAGE_AND_UPLOAD_ANALYSIS.md lines 324-407

**Selected:** Presigned URLs
- **Rationale**: Scalable, offloads bandwidth from API
- **Trade-off**: Client must handle upload directly (manageable with axios/fetch)

**Decision 2: File organization in R2**

```
R2 Bucket Structure:
questions/
  ├── {userId}/
  │   ├── {cuid2}.jpg
  │   ├── {cuid2}.png
  │   └── ...
  └── ...
```

**Rationale:**
- ✅ Easy to find user's uploads
- ✅ Prevents key collisions (CUID2 is globally unique)
- ✅ Enables future per-user storage quotas

---

### 4. Users API Endpoints

#### 4.1 GET /api/users/[id] - Get User Profile

```typescript
// app/api/users/[id]/route.ts
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const [profile] = await db.select({
      id: users.id,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      createdAt: users.createdAt,
      uploadCount: count(questions.id),
    })
    .from(users)
    .leftJoin(questions, eq(questions.authorId, users.id))
    .where(eq(users.id, params.id))
    .groupBy(users.id);
    
    if (!profile) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      data: { user: profile },
    });
    
  } catch (error) {
    return handleApiError(error);
  }
}
```

#### 4.2 GET /api/users/[id]/questions - Get User's Uploads

```typescript
// app/api/users/[id]/questions/route.ts
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    
    const userQuestions = await db.select({
      id: questions.id,
      title: questions.title,
      courseCode: questions.courseCode,
      courseName: questions.courseName,
      level: questions.level,
      year: questions.year,
      semester: questions.semester,
      hashtags: questions.hashtags,
      images: questions.images,
      createdAt: questions.createdAt,
    })
    .from(questions)
    .where(eq(questions.authorId, params.id))
    .orderBy(desc(questions.createdAt))
    .limit(limit)
    .offset((page - 1) * limit);
    
    // ... pagination logic
    
  } catch (error) {
    return handleApiError(error);
  }
}
```

#### 4.3 PUT /api/users/me - Update Own Profile

```typescript
// app/api/users/me/route.ts
import { updateDisplayNameSchema } from '@qapp/shared';

export async function PUT(request: Request) {
  try {
    const { userId } = await requireAuth();
    
    const body = await request.json();
    const validated = updateDisplayNameSchema.parse(body);
    
    const [updated] = await db.update(users)
      .set({
        displayName: validated.displayName,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    
    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: updated.id,
          displayName: updated.displayName,
          avatarUrl: updated.avatarUrl,
        },
      },
    });
    
  } catch (error) {
    return handleApiError(error);
  }
}
```

---

### 5. Authentication Middleware

#### Purpose
Shared authentication logic for protected routes.

**File:** `apps/frontend/lib/api/auth-middleware.ts`

```typescript
// lib/api/auth-middleware.ts
import { createClient } from '@/lib/supabase/server';

export async function requireAuth() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new AuthenticationError('Authentication required');
  }
  
  return {
    user,
    userId: user.id,
  };
}

// Custom error classes
export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public issues?: any[]) {
    super(message);
    this.name = 'ValidationError';
  }
}
```

---

### 6. Error Handling Strategy

#### Centralized Error Handler

```typescript
// lib/api/error-handler.ts
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AuthenticationError, ValidationError } from './auth-middleware';

export function handleApiError(error: unknown) {
  console.error('API Error:', error);
  
  // Zod validation errors
  if (error instanceof ZodError) {
    return NextResponse.json({
      success: false,
      error: 'Validation failed',
      details: error.errors,
    }, { status: 400 });
  }
  
  // Authentication errors
  if (error instanceof AuthenticationError) {
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 401 });
  }
  
  // Custom validation errors
  if (error instanceof ValidationError) {
    return NextResponse.json({
      success: false,
      error: error.message,
      details: error.issues,
    }, { status: 400 });
  }
  
  // Database errors (Postgres constraint violations, etc.)
  if (error instanceof Error && error.message.includes('unique constraint')) {
    return NextResponse.json({
      success: false,
      error: 'Resource already exists',
    }, { status: 409 });
  }
  
  // Generic errors
  return NextResponse.json({
    success: false,
    error: 'Internal server error',
  }, { status: 500 });
}
```

#### Design Decision: Error Response Format

**Standardized format (all endpoints):**

```typescript
// Success
{
  "success": true,
  "data": { ... }
}

// Error
{
  "success": false,
  "error": "Human-readable error message",
  "details": [ ... ] // Optional: validation errors, etc.
}
```

**Pros:**
- ✅ Consistent client-side error handling
- ✅ TypeScript discriminated union (success: true | false)
- ✅ Easy to check for errors in one line

**Cons:**
- ⚠️ Slightly verbose (extra "success" field)

**Alternative:** HTTP status codes only
- Would be more RESTful but harder for client to parse generically

---

## Day 3: Frontend Core UI

### 1. shadcn/ui Setup

#### Installation & Configuration

```bash
# Install shadcn/ui CLI
npx shadcn@latest init

# Add required components
npx shadcn@latest add button card input select form dialog skeleton badge avatar separator textarea
```

#### Design Decisions

**Decision 1: UI library choice**

| Library | Pros | Cons | Selected |
|---------|------|------|----------|
| **shadcn/ui** | No runtime, full control, accessible | Manual component addition | ✅ **Yes** |
| **Chakra UI** | Complete system, fast setup | Large bundle, harder customization | ❌ No |
| **Radix UI (raw)** | Maximum control, unstyled | Must style everything from scratch | ❌ No (too much work) |
| **Material UI** | Comprehensive, mature | Heavy bundle, distinct look | ❌ No |

**Selected:** shadcn/ui
- **Rationale**: Zero runtime cost, full control, built on Radix (accessible)
- **Trade-off**: Must explicitly add components (acceptable, only ~10 needed for MVP)

---

### 2. Auth Components

#### 2.1 Sign-In Button

**Purpose:** Trigger Google OAuth flow.

**File:** `apps/frontend/components/auth/sign-in-button.tsx`

```typescript
'use client';

import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

export function SignInButton() {
  const handleSignIn = async () => {
    const supabase = createClient();
    
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };
  
  return (
    <Button onClick={handleSignIn} variant="default">
      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
        {/* Google icon SVG */}
      </svg>
      Sign in with Google
    </Button>
  );
}
```

#### 2.2 User Menu

**Purpose:** Avatar dropdown with profile link and sign out.

```typescript
'use client';

import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export function UserMenu() {
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  
  if (!user) return <SignInButton />;
  
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Avatar>
          <AvatarImage src={user.avatarUrl || undefined} />
          <AvatarFallback>
            {user.displayName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => router.push(`/users/${user.id}`)}>
          View Profile
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

#### 2.3 Auth Hook

**Purpose:** Access current user from client components.

**File:** `apps/frontend/hooks/use-auth.ts`

```typescript
'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  
  useEffect(() => {
    // Get initial session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );
    
    return () => subscription.unsubscribe();
  }, [supabase]);
  
  return { user, loading };
}
```

#### Design Decisions

**Decision 1: Auth state management**

| Approach | Pros | Cons | Selected |
|----------|------|------|----------|
| **React Context** | Global state, no prop drilling | Extra provider layer | ⏭️ Later if needed |
| **Custom hook + Supabase listener** | Simple, built-in | Must call hook in each component | ✅ **Yes** (MVP) |
| **TanStack Query** | Cached, consistent | Overkill for auth state | ❌ No |

**Selected:** Custom hook
- **Rationale**: Simplest for MVP, Supabase handles state persistence
- **Upgrade path**: Wrap in Context if too many components need auth

---

### 3. Question Components

#### 3.1 Question Card

**Purpose:** Display question in feed/search results with author info.

**File:** `apps/frontend/components/questions/question-card.tsx`

```typescript
'use client';

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import Image from 'next/image';
import type { QuestionCard as QuestionCardType } from '@qapp/shared';

interface QuestionCardProps {
  question: QuestionCardType;
}

export function QuestionCard({ question }: QuestionCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <Link href={`/questions/${question.id}`}>
        <div className="relative aspect-[4/5] w-full">
          <Image
            src={question.thumbnail}
            alt={question.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      </Link>
      
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <Link href={`/users/${question.author.id}`}>
            <Avatar className="h-8 w-8">
              <AvatarImage src={question.author.avatarUrl || undefined} />
              <AvatarFallback>
                {question.author.displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div>
            <Link 
              href={`/users/${question.author.id}`}
              className="text-sm font-medium hover:underline"
            >
              {question.author.displayName}
            </Link>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(question.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>
        
        <Link href={`/questions/${question.id}`}>
          <h3 className="font-semibold line-clamp-2 hover:underline">
            {question.title}
          </h3>
        </Link>
      </CardHeader>
      
      <CardContent>
        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
          <span className="font-mono">{question.courseCode}</span>
          <span>•</span>
          <span>{question.level}L</span>
          <span>•</span>
          <span>{question.semester}</span>
          <span>•</span>
          <span>{question.year}</span>
        </div>
        
        {question.imageCount > 1 && (
          <p className="text-sm text-muted-foreground mt-2">
            {question.imageCount} pages
          </p>
        )}
      </CardContent>
      
      {question.hashtags.length > 0 && (
        <CardFooter>
          <div className="flex flex-wrap gap-1">
            {question.hashtags.map(tag => (
              <Badge key={tag} variant="secondary">
                #{tag}
              </Badge>
            ))}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
```

#### Design Decisions

**Decision 1: Image loading strategy**

| Approach | Pros | Cons | Selected |
|----------|------|------|----------|
| **Next.js Image (optimized)** | Automatic optimization, lazy loading | Requires imageRemotePatterns config | ✅ **Yes** |
| **Native img tag** | Simple | No optimization, eager loading | ❌ No |
| **Cloudflare Images** | Best quality/performance | Extra cost, more complexity | ⏭️ V2 if needed |

**Selected:** Next.js Image component
- **Rationale**: Free optimization, automatic responsive images
- **Config needed:** Add R2_PUBLIC_URL to `next.config.ts` remotePatterns

**Decision 2: Card layout**

**Selected:** Vertical card (Pinterest-style)
- **Rationale**: Best for mobile (primary device), showcases images
- **Alternative:** Horizontal would show more metadata but less visual

---

#### 3.2 Question Feed

**Purpose:** Paginated list of question cards.

**File:** `apps/frontend/components/questions/question-feed.tsx`

```typescript
'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { QuestionCard } from './question-card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

async function fetchQuestions({ pageParam = 1 }) {
  const res = await fetch(`/api/questions?page=${pageParam}&limit=20`);
  if (!res.ok) throw new Error('Failed to fetch questions');
  return res.json();
}

export function QuestionFeed() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery({
    queryKey: ['questions'],
    queryFn: fetchQuestions,
    getNextPageParam: (lastPage) => {
      return lastPage.data.pagination.hasNext 
        ? lastPage.data.pagination.page + 1 
        : undefined;
    },
    initialPageParam: 1,
  });
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[400px]" />
        ))}
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load questions</p>
      </div>
    );
  }
  
  const questions = data?.pages.flatMap(page => page.data.data) ?? [];
  
  if (questions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No questions yet</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {questions.map(question => (
          <QuestionCard key={question.id} question={question} />
        ))}
      </div>
      
      {hasNextPage && (
        <div className="flex justify-center">
          <Button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            variant="outline"
          >
            {isFetchingNextPage ? 'Loading...' : 'Load More'}
          </Button>
        </div>
      )}
    </div>
  );
}
```

#### Design Decisions

**Decision 1: Pagination UI pattern**

| Approach | Pros | Cons | Selected |
|----------|------|------|----------|
| **"Load More" button** | User control, no auto-scroll | Manual action required | ✅ **Yes** |
| **Infinite scroll (auto)** | Seamless UX | Can feel overwhelming | ⏭️ Easy to add later |
| **Traditional page numbers** | Good for desktop | Poor for mobile | ❌ No (mobile-first) |

**Selected:** "Load More" button with useInfiniteQuery
- **Rationale**: Best UX balance, user controls when to load more
- **Upgrade path**: Add intersection observer for true infinite scroll

**Decision 2: TanStack Query vs manual state**

**Selected:** TanStack Query with useInfiniteQuery
- **Rationale**: Built-in pagination, caching, automatic refetch
- **Trade-off**: Slightly more complex setup, but worth it for DX

---

### 4. Feed Implementation

#### Home Page

**File:** `apps/frontend/app/(main)/page.tsx`

```typescript
import { QuestionFeed } from '@/components/questions/question-feed';

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">QApp</h1>
        <p className="text-muted-foreground">
          All your question papers in one place
        </p>
      </div>
      
      <QuestionFeed />
    </div>
  );
}
```

#### Layout with Navigation

**File:** `apps/frontend/app/(main)/layout.tsx`

```typescript
import { UserMenu } from '@/components/auth/user-menu';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold">
            QApp
          </Link>
          
          <nav className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/search">Search</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/upload">Upload</Link>
            </Button>
            <UserMenu />
          </nav>
        </div>
      </header>
      
      <main className="flex-1">
        {children}
      </main>
      
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © 2026 QApp. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
```

---

### 5. Loading States

#### Page-Level Loading UI

**File:** `apps/frontend/app/(main)/loading.tsx`

```typescript
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Skeleton className="h-12 w-48 mb-2" />
        <Skeleton className="h-6 w-64" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[400px]" />
        ))}
      </div>
    </div>
  );
}
```

#### Design Decisions

**Decision 1: Loading UI strategy**

| Approach | Pros | Cons | Selected |
|----------|------|------|----------|
| **Skeleton screens** | Perceived performance, smooth | More components to build | ✅ **Yes** |
| **Spinner** | Simple, minimal code | Feels slower | ❌ No |
| **Progress bar** | Shows actual progress | Doesn't work for unknown duration | ❌ No |

**Selected:** Skeleton screens
- **Rationale**: Industry best practice, feels faster
- **Implementation:** Use shadcn/ui Skeleton component

---

## Cross-Cutting Concerns

### 1. API Client

**Purpose:** Centralized fetch wrapper with error handling.

**File:** `apps/frontend/lib/api-client.ts`

```typescript
import type { ApiResponse } from '@qapp/shared';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiClient<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(endpoint, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  
  const data: ApiResponse<T> = await res.json();
  
  if (!res.ok || !data.success) {
    throw new ApiError(
      data.error || 'Request failed',
      res.status,
      data.details
    );
  }
  
  return data.data!;
}
```

---

### 2. Next.js Configuration

**File:** `apps/frontend/next.config.ts`

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pub-*.r2.dev', // R2 public domain
      },
      {
        protocol: 'https',
        hostname: process.env.R2_PUBLIC_URL?.replace('https://', '') || '',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // Google avatars
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com', // Fallback avatars
      },
    ],
  },
  experimental: {
    // Enable type-safe env vars
    typedRoutes: true,
  },
};

export default nextConfig;
```

---

## Testing Strategy

### Manual Testing Checklist

**Day 2 - API Endpoints:**
- [ ] POST /api/questions creates question with auth
- [ ] POST /api/questions rejects unauthenticated requests
- [ ] GET /api/questions returns paginated feed
- [ ] GET /api/questions/search filters correctly
- [ ] GET /api/questions/[id] returns question with author
- [ ] POST /api/upload/presign generates valid URL
- [ ] PUT /api/users/me updates display name
- [ ] Auth callback creates user in database

**Day 3 - Frontend:**
- [ ] Sign in with Google works
- [ ] User menu appears after signin
- [ ] Feed displays question cards
- [ ] Question cards show author info
- [ ] "Load More" fetches next page
- [ ] Loading skeletons appear during fetch
- [ ] Empty state shows when no questions
- [ ] Images load from R2 correctly

### Testing Tools

```bash
# Test API endpoints with curl
curl -X POST http://localhost:3000/api/questions \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","courseCode":"CS101",...}'

# Or use Thunder Client / Postman / HTTPie
```

---

## Risk Analysis

### High-Priority Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| **Supabase auth integration issues** | High | Medium | Use official @supabase/ssr, reference docs carefully |
| **R2 CORS errors** | High | Medium | Test presigned URLs early, verify CORS config |
| **Zod validation edge cases** | Medium | High | Test with invalid data, reference schema in both client/server |
| **Image optimization slow** | Medium | Low | Use Next.js Image, lazy load, optimize on client before upload |
| **TanStack Query cache issues** | Low | Low | Use stable query keys, test refetch behavior |

### Mitigation Strategies

1. **Test auth early** - Verify Google OAuth callback before building other features
2. **Test R2 upload immediately** - Don't wait until upload form is complete
3. **Incremental testing** - Test each endpoint as built, not at the end
4. **Reference documentation** - Use official Supabase examples for SSR patterns

---

## Success Criteria

### Day 2 Complete When:

- [ ] All API endpoints return correct data
- [ ] Authentication required for protected routes
- [ ] Zod validation rejects invalid data
- [ ] Presigned URLs work for R2 upload
- [ ] Error handling returns consistent format
- [ ] User is synced to database on OAuth callback

### Day 3 Complete When:

- [ ] User can sign in with Google
- [ ] Feed displays question cards with authors
- [ ] Pagination works (Load More button)
- [ ] Loading states appear during fetches
- [ ] User menu shows after signin
- [ ] Navigation works between pages
- [ ] Empty states show appropriately

### Combined Success (Days 2-3):

**Core User Journey:**
1. Anonymous user visits site → sees feed ✅
2. User clicks "Sign in with Google" → OAuth flow ✅
3. User redirected back → profile created automatically ✅
4. User sees their avatar in top right ✅
5. User clicks "Load More" → pagination works ✅

---

## Implementation Timeline

### Day 2 Breakdown (8 hours)

| Time | Task | Estimated Duration |
|------|------|-------------------|
| 0-1h | OAuth callback handler + user sync | 1 hour |
| 1-2h | Questions POST endpoint + validation | 1 hour |
| 2-3h | Questions GET endpoints (feed, detail, search) | 1 hour |
| 3-4h | Presigned URL endpoint + R2 client | 1 hour |
| 4-5h | Users endpoints (profile, update) | 1 hour |
| 5-6h | Error handling, middleware, testing | 1 hour |
| 6-8h | Manual testing all endpoints, bug fixes | 2 hours |

### Day 3 Breakdown (8 hours)

| Time | Task | Estimated Duration |
|------|------|-------------------|
| 0-1h | shadcn/ui setup + components installation | 1 hour |
| 1-2h | Auth components (SignInButton, UserMenu, hook) | 1 hour |
| 2-4h | Question components (Card, Feed with pagination) | 2 hours |
| 4-5h | Layout with navigation | 1 hour |
| 5-6h | Loading states, error boundaries | 1 hour |
| 6-8h | Integration testing, UI polish, bug fixes | 2 hours |

---

## Conclusion

This implementation plan covers Days 2-3 with:

✅ **Complete API implementation** - All CRUD operations for questions, users, uploads  
✅ **Authentication flow** - Google OAuth with automatic user sync  
✅ **Frontend foundation** - Feed, cards, auth UI, loading states  
✅ **Type safety** - Shared Zod schemas, TypeScript throughout  
✅ **Error handling** - Standardized responses, proper HTTP codes  
✅ **Performance** - TanStack Query caching, Next.js Image optimization  

**Ready to implement upon approval.**

---

**Next Steps:**
1. Review this plan
2. Approve/request modifications
3. Begin Day 2 implementation
4. Test thoroughly after each milestone
5. Proceed to Day 3 when API is stable

**References:**
- ENGAGEMENT_AND_FEATURES.md lines 1014-1072 (timeline)
- AUTHENTICATION_ANALYSIS.md lines 807-920 (Supabase SSR)
- STORAGE_AND_UPLOAD_ANALYSIS.md lines 372-407 (presigned URLs)
- ARCHITECTURE_ANALYSIS.md lines 620-698 (Drizzle patterns)
