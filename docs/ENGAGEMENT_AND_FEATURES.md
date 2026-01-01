# QApp: Engagement, Features & MVP Scope

**Document Version:** 1.0  
**Date:** January 1, 2026  
**Author:** System Architecture Analysis  
**Status:** Final - MVP Scope Defined

---

## Table of Contents

- [Executive Summary](#executive-summary)
- [Feature Prioritization Framework](#feature-prioritization-framework)
- [MVP Feature Set](#mvp-feature-set)
  - [Core Features (Must Have)](#core-features-must-have)
  - [Nice-to-Have (If Time Permits)](#nice-to-have-if-time-permits)
  - [Deferred to V2](#deferred-to-v2)
- [API Design](#api-design)
- [Data Models](#data-models)
- [Search Implementation](#search-implementation)
- [Incentivization Strategies](#incentivization-strategies)
- [User Interface Considerations](#user-interface-considerations)
- [Implementation Roadmap](#implementation-roadmap)
- [Alternative Approaches (For Future Reference)](#alternative-approaches-for-future-reference)
- [References](#references)

---

## Executive Summary

This document defines the feature scope for QApp's MVP, prioritizing features that deliver core value while staying within the ~1 week development timeline. The approach is ruthlessly minimal for V1, with a clear roadmap for V2 enhancements.

**MVP Scope:**
- Upload question papers with metadata ✅
- Browse feed of uploaded papers ✅
- Search by course code, name, level ✅
- View question paper details ✅

**Deferred to V2:**
- Likes/upvotes ❌
- Comments ❌
- User profiles ❌
- Followership ❌
- PDF support ❌
- Download functionality ❌
- Bookmarks/saves ❌

**Key Rationale**: Ship a working product that solves the core problem (finding question papers), then iterate based on user feedback.

---

## Feature Prioritization Framework

### MoSCoW Method Applied

| Priority | Meaning | Time Allocation |
|----------|---------|-----------------|
| **Must Have** | Core value, MVP fails without it | 70% of effort |
| **Should Have** | Important but not essential for launch | 20% of effort |
| **Could Have** | Nice to have, only if time permits | 10% of effort |
| **Won't Have** | Explicitly out of scope for this version | 0% |

### Prioritization Criteria

| Criterion | Weight | Question |
|-----------|--------|----------|
| Core Value | 40% | Does it solve the primary problem? |
| Implementation Time | 30% | Can it be built in ~1 week? |
| User Impact | 20% | How many users benefit? |
| Technical Risk | 10% | Is it technically straightforward? |

---

## MVP Feature Set

### Core Features (Must Have)

#### 1. Question Paper Upload

**Description**: Users can upload images of question papers with metadata.

**User Story**: 
> As a student, I want to upload a photo of a question paper so that other students can access it.

**Requirements**:
- Upload 1-10 images per question paper
- Required metadata: course code, course name, level, year, semester
- Optional: hashtags (for additional categorization)
- Client-side image compression
- Progress indicator during upload

**Technical Implementation**:
```typescript
// Upload form data structure
interface QuestionPaperUpload {
  title: string;           // e.g., "CS101 Final Exam 2024"
  courseCode: string;      // e.g., "CS101"
  courseName: string;      // e.g., "Introduction to Programming"
  level: number;           // 100, 200, 300, 400, 500
  year: number;            // 2024
  semester: string;        // "First" | "Second" | "Summer"
  hashtags?: string[];     // ["programming", "java"]
  images: File[];          // 1-10 images
}
```

**UI Components Needed**:
- Multi-file image picker
- Form fields with validation
- Image preview thumbnails
- Upload progress bar
- Success/error feedback

**Time Estimate**: 1.5-2 days

---

#### 2. Question Feed (Home Page)

**Description**: Users see a chronological feed of recently uploaded question papers.

**User Story**:
> As a student, I want to browse recent uploads so that I can discover question papers I might need.

**Requirements**:
- Display question papers in reverse chronological order
- Show: title, course code, level, semester, thumbnail, upload date
- Infinite scroll or pagination
- Responsive grid layout

**Technical Implementation**:
```typescript
// Feed query
const feed = await db.select()
  .from(questions)
  .orderBy(desc(questions.createdAt))
  .limit(20)
  .offset(page * 20);
```

**UI Components Needed**:
- Question card component
- Grid/list layout
- Loading skeleton
- Empty state ("No questions yet")
- Pagination or infinite scroll

**Time Estimate**: 1 day

---

#### 3. Search Functionality

**Description**: Users can search question papers by course code, name, level, and hashtags.

**User Story**:
> As a student, I want to search for "CS101" so that I can find all question papers for that course.

**Requirements**:
- Search by course code (exact match)
- Search by course name (partial match)
- Filter by level (100, 200, etc.)
- Filter by year
- Filter by semester
- Search by hashtags (optional)

**Technical Implementation**:
```typescript
// Search endpoint
interface SearchParams {
  q?: string;          // Text query (course code or name)
  level?: number;      // Filter by level
  year?: number;       // Filter by year
  semester?: string;   // Filter by semester
  hashtag?: string;    // Filter by hashtag
  page?: number;       // Pagination
}

// PostgreSQL full-text search
const searchResults = await db.select()
  .from(questions)
  .where(
    and(
      q ? or(
        ilike(questions.courseCode, `%${q}%`),
        ilike(questions.courseName, `%${q}%`)
      ) : undefined,
      level ? eq(questions.level, level) : undefined,
      year ? eq(questions.year, year) : undefined,
      semester ? eq(questions.semester, semester) : undefined
    )
  )
  .orderBy(desc(questions.createdAt))
  .limit(20);
```

**UI Components Needed**:
- Search input with autocomplete (optional)
- Filter dropdowns (level, year, semester)
- Results list
- "No results" state
- Clear filters button

**Time Estimate**: 1 day

---

#### 4. Question Detail View

**Description**: Users can view full details and images of a question paper.

**User Story**:
> As a student, I want to view all images of a question paper so that I can study from it.

**Requirements**:
- Display all metadata
- Image gallery with zoom capability
- Swipe between images (mobile)
- Back navigation

**Technical Implementation**:
```typescript
// Detail query
const question = await db.select()
  .from(questions)
  .where(eq(questions.id, id))
  .limit(1);
```

**UI Components Needed**:
- Image gallery/carousel
- Metadata display
- Zoom functionality
- Share button (copy link)
- Back button

**Time Estimate**: 0.5-1 day

---

### Nice-to-Have (If Time Permits)

#### 5. User Profile (Basic)

**Description**: Users can see their uploaded question papers.

**User Story**:
> As a contributor, I want to see all the question papers I've uploaded.

**Requirements**:
- "My Uploads" page
- List of user's contributions
- Delete own uploads

**Time Estimate**: 0.5 day

---

#### 6. Edit/Delete Own Uploads

**Description**: Users can modify or remove their own uploads.

**Requirements**:
- Edit metadata (not images)
- Delete question paper
- Confirmation dialog

**Time Estimate**: 0.5 day

---

### Deferred to V2

| Feature | Reason for Deferring | V2 Priority |
|---------|---------------------|-------------|
| **Likes/Upvotes** | Adds complexity, not core to finding papers | High |
| **Comments** | Moderation needed, scope creep | Medium |
| **User Profiles** | Not essential for anonymous MVP | Medium |
| **Followership** | Social features can wait | Low |
| **PDF Upload** | Technical complexity (preview, processing) | High |
| **Download** | Copyright/abuse concerns to address | Medium |
| **Bookmarks/Saves** | Needs user accounts to be meaningful | Medium |
| **Notifications** | Requires email infrastructure | Low |
| **Admin Dashboard** | Manual moderation sufficient initially | Medium |

---

## API Design

### MVP Endpoints

```
┌─────────────────────────────────────────────────────────────────┐
│                        API ENDPOINTS                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  QUESTIONS                                                       │
│  ──────────                                                      │
│  POST   /api/questions          Create question paper            │
│  GET    /api/questions          Get feed (paginated)             │
│  GET    /api/questions/:id      Get single question              │
│  GET    /api/questions/search   Search questions                 │
│  PUT    /api/questions/:id      Update own question (optional)   │
│  DELETE /api/questions/:id      Delete own question (optional)   │
│                                                                  │
│  UPLOAD                                                          │
│  ──────                                                          │
│  POST   /api/upload/presign     Get presigned URL for R2         │
│                                                                  │
│  AUTH (if needed)                                                │
│  ────                                                            │
│  POST   /api/auth/device        Register device token            │
│  POST   /api/auth/link          Link account with email          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Request/Response Specifications

#### POST /api/questions

```typescript
// Request
{
  "title": "CS101 Introduction to Programming - Final Exam 2024",
  "courseCode": "CS101",
  "courseName": "Introduction to Programming",
  "level": 100,
  "year": 2024,
  "semester": "First",
  "hashtags": ["programming", "java", "final"],
  "images": [
    "https://r2.qapp.com/questions/abc123-page1.jpg",
    "https://r2.qapp.com/questions/abc123-page2.jpg"
  ]
}

// Response (201 Created)
{
  "id": "clx1234567890",
  "title": "CS101 Introduction to Programming - Final Exam 2024",
  "courseCode": "CS101",
  "courseName": "Introduction to Programming",
  "level": 100,
  "year": 2024,
  "semester": "First",
  "hashtags": ["programming", "java", "final"],
  "images": [...],
  "authorId": "device_abc123",
  "createdAt": "2026-01-01T12:00:00Z",
  "updatedAt": "2026-01-01T12:00:00Z"
}
```

#### GET /api/questions

```typescript
// Request
GET /api/questions?page=1&limit=20

// Response
{
  "data": [
    {
      "id": "clx1234567890",
      "title": "CS101 Final Exam 2024",
      "courseCode": "CS101",
      "courseName": "Introduction to Programming",
      "level": 100,
      "year": 2024,
      "semester": "First",
      "hashtags": ["programming"],
      "thumbnail": "https://r2.qapp.com/questions/abc123-page1.jpg",
      "imageCount": 3,
      "createdAt": "2026-01-01T12:00:00Z"
    },
    // ... more questions
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### GET /api/questions/search

```typescript
// Request
GET /api/questions/search?q=programming&level=100&year=2024

// Response
{
  "data": [...],
  "query": {
    "q": "programming",
    "level": 100,
    "year": 2024
  },
  "pagination": {...},
  "totalResults": 12
}
```

### Validation Schemas (Zod)

```typescript
// schemas/question.ts
import { z } from 'zod';

export const createQuestionSchema = z.object({
  title: z.string().min(5).max(200),
  courseCode: z.string().min(2).max(20).toUpperCase(),
  courseName: z.string().min(3).max(100),
  level: z.number().int().min(100).max(900).multipleOf(100),
  year: z.number().int().min(2000).max(2100),
  semester: z.enum(['First', 'Second', 'Summer']),
  hashtags: z.array(z.string().max(30)).max(10).optional(),
  images: z.array(z.string().url()).min(1).max(10),
});

export const searchQuerySchema = z.object({
  q: z.string().max(100).optional(),
  level: z.coerce.number().int().optional(),
  year: z.coerce.number().int().optional(),
  semester: z.enum(['First', 'Second', 'Summer']).optional(),
  hashtag: z.string().max(30).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
```

---

## Data Models

### Database Schema

```typescript
// packages/database/src/schema.ts
import { pgTable, text, integer, timestamp, boolean } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

// Users table (for both anonymous and authenticated)
export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  deviceId: text('device_id').unique(),
  email: text('email').unique(),
  displayName: text('display_name'),
  isAnonymous: boolean('is_anonymous').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Questions table
export const questions = pgTable('questions', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  title: text('title').notNull(),
  courseCode: text('course_code').notNull(),
  courseName: text('course_name').notNull(),
  level: integer('level').notNull(),
  year: integer('year').notNull(),
  semester: text('semester').notNull(),
  hashtags: text('hashtags').array().default([]),
  images: text('images').array().notNull(),
  authorId: text('author_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Reports table (for content moderation)
export const reports = pgTable('reports', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  questionId: text('question_id').references(() => questions.id).notNull(),
  reporterId: text('reporter_id').references(() => users.id).notNull(),
  reason: text('reason').notNull(),
  status: text('status').default('pending').notNull(), // pending, reviewed, resolved
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Indexes for common queries
// CREATE INDEX idx_questions_course_code ON questions(course_code);
// CREATE INDEX idx_questions_level ON questions(level);
// CREATE INDEX idx_questions_created_at ON questions(created_at DESC);
// CREATE INDEX idx_questions_author ON questions(author_id);
```

### TypeScript Types

```typescript
// packages/shared/src/types.ts

export interface User {
  id: string;
  deviceId?: string;
  email?: string;
  displayName?: string;
  isAnonymous: boolean;
  createdAt: Date;
}

export interface Question {
  id: string;
  title: string;
  courseCode: string;
  courseName: string;
  level: number;
  year: number;
  semester: 'First' | 'Second' | 'Summer';
  hashtags: string[];
  images: string[];
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuestionCard {
  id: string;
  title: string;
  courseCode: string;
  courseName: string;
  level: number;
  year: number;
  semester: string;
  hashtags: string[];
  thumbnail: string;
  imageCount: number;
  createdAt: Date;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
```

---

## Search Implementation

### MVP: PostgreSQL ILIKE Search

For MVP, simple ILIKE queries are sufficient:

```typescript
// Simple search implementation
async function searchQuestions(params: SearchParams) {
  const { q, level, year, semester, page = 1, limit = 20 } = params;
  
  let query = db.select().from(questions);
  
  const conditions = [];
  
  if (q) {
    conditions.push(
      or(
        ilike(questions.courseCode, `%${q}%`),
        ilike(questions.courseName, `%${q}%`),
        ilike(questions.title, `%${q}%`)
      )
    );
  }
  
  if (level) conditions.push(eq(questions.level, level));
  if (year) conditions.push(eq(questions.year, year));
  if (semester) conditions.push(eq(questions.semester, semester));
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }
  
  const results = await query
    .orderBy(desc(questions.createdAt))
    .limit(limit)
    .offset((page - 1) * limit);
  
  return results;
}
```

### Future: Full-Text Search

For V2, consider PostgreSQL full-text search:

```sql
-- Add full-text search column
ALTER TABLE questions ADD COLUMN search_vector tsvector;

-- Create trigger to update search vector
CREATE FUNCTION update_search_vector() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.course_code, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.course_name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'B') ||
    setweight(to_tsvector('english', array_to_string(NEW.hashtags, ' ')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER questions_search_vector_update
  BEFORE INSERT OR UPDATE ON questions
  FOR EACH ROW EXECUTE FUNCTION update_search_vector();

-- Create index
CREATE INDEX idx_questions_search ON questions USING GIN(search_vector);

-- Search query
SELECT * FROM questions
WHERE search_vector @@ plainto_tsquery('english', 'programming java')
ORDER BY ts_rank(search_vector, plainto_tsquery('english', 'programming java')) DESC;
```

### Search Comparison (For Future)

| Solution | MVP | Scalability | Features | Cost |
|----------|-----|-------------|----------|------|
| **ILIKE** | ✅ Perfect | ⭐⭐ Limited | ⭐⭐ Basic | Free |
| **PG Full-Text** | ✅ Good | ⭐⭐⭐ Good | ⭐⭐⭐ Good | Free |
| **Meilisearch** | ⚠️ Extra setup | ⭐⭐⭐⭐ Great | ⭐⭐⭐⭐⭐ Best | Self-host free |
| **Algolia** | ⚠️ Overkill | ⭐⭐⭐⭐⭐ Best | ⭐⭐⭐⭐⭐ Best | $$$$ |

**MVP Decision**: ILIKE is sufficient. Upgrade to PG Full-Text or Meilisearch in V2 if needed.

---

## Incentivization Strategies

### The Challenge

Crowdsourced platforms face the "cold start" problem:
- No content → No users
- No users → No content

### Strategies to Consider (V2)

#### 1. Gamification

**Elements**:
- Points for uploads
- Contributor badges ("Top Uploader", "Pioneer", "Course Expert")
- Leaderboard (weekly/monthly top contributors)

**Implementation Complexity**: Medium

**Effectiveness**: High for engaged users

#### 2. Social Recognition

**Elements**:
- Like/upvote on quality uploads
- "Helpful" counts
- Public contributor profiles

**Implementation Complexity**: Medium

**Effectiveness**: High for ego-driven motivation

#### 3. Utility Incentives

**Elements**:
- Premium features for contributors (advanced search, bookmarks)
- Early access to new features
- Ad-free experience (if ads are added)

**Implementation Complexity**: High

**Effectiveness**: Medium

#### 4. Social Features

**Elements**:
- Follow top contributors
- Notifications for new uploads in followed courses
- Share to WhatsApp/social

**Implementation Complexity**: Medium-High

**Effectiveness**: Medium

### MVP Approach: Start Without Explicit Incentives

For MVP, the core incentive is **utility**:
- "I upload because I want others to have access"
- "I upload because my friend might need it"
- Inherent value of organizing shared resources

**V2 Plan**: Add likes/upvotes first (lowest effort, highest signal).

---

## User Interface Considerations

### Key Screens

#### 1. Home / Feed

```
┌─────────────────────────────────────────┐
│  QApp                        [Search]   │
├─────────────────────────────────────────┤
│  [Upload Question Paper]                │
├─────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐       │
│  │  CS101      │  │  MTH201     │       │
│  │  Final 2024 │  │  Midterm    │       │
│  │  [Image]    │  │  [Image]    │       │
│  │  100L • 1st │  │  200L • 2nd │       │
│  └─────────────┘  └─────────────┘       │
│  ┌─────────────┐  ┌─────────────┐       │
│  │  PHY102     │  │  ENG101     │       │
│  │  ...        │  │  ...        │       │
│  └─────────────┘  └─────────────┘       │
│                                         │
│  [Load More]                            │
└─────────────────────────────────────────┘
```

#### 2. Search / Filter

```
┌─────────────────────────────────────────┐
│  ← Search                               │
├─────────────────────────────────────────┤
│  [programming_____________] [Search]    │
│                                         │
│  Filters:                               │
│  [Level ▼]  [Year ▼]  [Semester ▼]     │
│                                         │
├─────────────────────────────────────────┤
│  12 results for "programming"           │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ CS101 - Intro to Programming    │   │
│  │ Final Exam 2024 • 100L          │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │ CS201 - Data Structures         │   │
│  │ ...                             │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

#### 3. Upload Form

```
┌─────────────────────────────────────────┐
│  ← Upload Question Paper                │
├─────────────────────────────────────────┤
│                                         │
│  [+ Add Images]                         │
│  ┌─────┐ ┌─────┐ ┌─────┐               │
│  │ 📷  │ │ 📷  │ │ 📷  │               │
│  │ ×   │ │ ×   │ │ ×   │               │
│  └─────┘ └─────┘ └─────┘               │
│                                         │
│  Title*                                 │
│  [CS101 Final Exam 2024___________]    │
│                                         │
│  Course Code*        Course Name*       │
│  [CS101____]         [Intro to Prog__] │
│                                         │
│  Level*    Year*     Semester*          │
│  [100L ▼]  [2024 ▼]  [First ▼]         │
│                                         │
│  Hashtags (optional)                    │
│  [programming, java, final_________]   │
│                                         │
│  [Submit Question Paper]                │
│                                         │
└─────────────────────────────────────────┘
```

#### 4. Question Detail

```
┌─────────────────────────────────────────┐
│  ← CS101 Final Exam 2024                │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐   │
│  │                                 │   │
│  │         [IMAGE 1/3]             │   │
│  │                                 │   │
│  │    ←  Swipe for more  →         │   │
│  └─────────────────────────────────┘   │
│  ○ ● ○                                  │
│                                         │
│  CS101 - Introduction to Programming    │
│  Final Examination                      │
│                                         │
│  📚 100 Level                           │
│  📅 2024 • First Semester               │
│  🏷️ programming, java, final            │
│                                         │
│  Uploaded Jan 1, 2026                   │
│                                         │
│  [Share] [Report]                       │
└─────────────────────────────────────────┘
```

### UI Component Library

For fast development, use shadcn/ui (already mentioned in architecture):

```bash
npx shadcn@latest init
npx shadcn@latest add button card input select form dialog
```

Components needed:
- `Button`, `Card`, `Input`, `Select`, `Form` - Core form elements
- `Dialog` - Confirmation modals
- `Skeleton` - Loading states
- `Badge` - Tags/hashtags
- `AspectRatio` - Image containers

---

## Implementation Roadmap

### ~1 Week MVP Timeline

```
Day 1: Project Setup & Database
├── Set up monorepo structure
├── Configure Supabase (database + auth)
├── Set up Cloudflare R2
├── Define database schema
└── Run migrations

Day 2: Backend API
├── Implement /api/questions endpoints
├── Implement /api/upload/presign
├── Add authentication middleware
├── Add validation with Zod
└── Test endpoints

Day 3: Frontend - Core UI
├── Set up shadcn/ui
├── Build QuestionCard component
├── Build Feed page (home)
├── Build Search page
└── Add loading states

Day 4: Frontend - Upload Flow
├── Build Upload form
├── Implement image picker
├── Add client-side compression
├── Connect to presign API
├── Handle upload errors
└── Success feedback

Day 5: Frontend - Detail & Polish
├── Build Question detail page
├── Image gallery/carousel
├── Responsive design fixes
├── Error handling
└── Empty states

Day 6: Testing & Deployment
├── Manual testing all flows
├── Fix critical bugs
├── Deploy to Vercel
├── Configure environment variables
├── DNS setup (if custom domain)
└── Smoke test production

Day 7: Buffer / Nice-to-Haves
├── My Uploads page (if time)
├── Edit/Delete functionality (if time)
├── Performance optimizations
└── Documentation
```

### Success Criteria for MVP Launch

- [ ] User can upload a question paper with images
- [ ] User can see feed of question papers
- [ ] User can search by course code or name
- [ ] User can view question paper details with all images
- [ ] App works on mobile and desktop
- [ ] App is deployed and accessible

---

## Alternative Approaches (For Future Reference)

### Alternative 1: Start with Likes

**When to consider:**
- Want social proof from day one
- Willing to add 0.5-1 day to timeline

**Implementation:**
```typescript
// Add likes table
export const likes = pgTable('likes', {
  id: text('id').primaryKey(),
  questionId: text('question_id').references(() => questions.id),
  userId: text('user_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  uniqueUserQuestion: unique().on(table.questionId, table.userId),
}));

// Add like count to question card
```

---

### Alternative 2: Include Bookmarks

**When to consider:**
- Users request save functionality
- Want to increase return visits

**Implementation:**
```typescript
export const bookmarks = pgTable('bookmarks', {
  id: text('id').primaryKey(),
  questionId: text('question_id').references(() => questions.id),
  userId: text('user_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
});
```

---

### Alternative 3: Comments

**When to consider:**
- Want community discussion
- Have moderation strategy

**Trade-offs:**
- Requires moderation
- Potential for spam/abuse
- Adds complexity

---

### Alternative 4: PDF Support

**When to consider:**
- Users upload PDFs more than images
- Have PDF viewing solution

**Considerations:**
- PDF.js for rendering
- Thumbnail generation
- Larger file sizes
- Mobile viewing experience

---

### Alternative 5: Admin Dashboard

**When to consider:**
- Content moderation becomes unmanageable
- Need analytics

**Features:**
- View all reports
- Ban users/devices
- Delete inappropriate content
- Usage statistics

---

## References

1. [MoSCoW Prioritization Method](https://www.productplan.com/glossary/moscow-prioritization/)
2. [Cold Start Problem](https://en.wikipedia.org/wiki/Cold_start_(recommender_systems))
3. [PostgreSQL Full-Text Search](https://www.postgresql.org/docs/current/textsearch.html)
4. [shadcn/ui Components](https://ui.shadcn.com/)
5. [Drizzle ORM Documentation](https://orm.drizzle.team/)
6. [Zod Validation](https://zod.dev/)
7. [Crowdsourced Content Platforms](https://www.nngroup.com/articles/user-generated-content/)

---

**Document Status**: Complete - MVP Scope Defined  
**MVP Features**: Upload, Feed, Search, Detail View  
**Deferred Features**: Likes, Comments, Bookmarks, PDF, Download  
**Estimated Timeline**: ~1 week  
**Next Action**: Begin implementation following the roadmap

