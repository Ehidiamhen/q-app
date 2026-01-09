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
- **Anonymous browsing** (no auth required) ✅
- **Google OAuth** for uploads (one-click signin) ✅
- Upload question papers with metadata ✅
- Browse feed of uploaded papers ✅
- Search by course code, name, level ✅
- View question paper details ✅
- **User profiles** (basic: avatar, display name, uploads) ✅
- **User attribution** on question cards ✅

**Deferred to V2:**
- Likes/upvotes ❌
- Comments ❌
- Followership ❌
- PDF support ❌
- Download functionality ❌
- Bookmarks/saves ❌
- Advanced profiles (bio, stats, badges) ❌

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
  semester: string;        // "First" | "Second" | "LVS"
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

#### 5. User Profiles

**Description**: User profiles display contributor information and their uploads.

**User Story**:
> As a student, I want to see who uploaded a question paper and view their other contributions.

**Requirements**:
- **Profile Creation**: Automatic on Google OAuth signin
- **Profile Display**: Avatar (from Google), display name, joined date
- **User's Uploads**: List of all questions uploaded by user
- **Edit Display Name**: Users can update their display name
- **Public Profiles**: Anyone can view user profiles
- **Profile Link**: Question cards show uploader with link to profile

**Technical Implementation**:
```typescript
// User profile data
interface UserProfile {
  id: string;
  email: string;              // Not publicly visible
  displayName: string;        // Editable
  avatarUrl: string | null;   // From Google OAuth
  provider: string;           // 'google'
  createdAt: Date;
}

// Profile query with upload count
const profile = await db.select({
  id: users.id,
  displayName: users.displayName,
  avatarUrl: users.avatarUrl,
  createdAt: users.createdAt,
  uploadCount: count(questions.id),
}).from(users)
  .leftJoin(questions, eq(questions.authorId, users.id))
  .where(eq(users.id, userId))
  .groupBy(users.id);
```

**UI Components Needed**:
- User avatar component (with fallback to initials)
- Profile header (avatar, name, stats)
- Edit display name modal/form
- User's uploads list (reuse question card)
- Profile link on question cards

**Time Estimate**: 1-1.5 days

---

### Nice-to-Have (If Time Permits)

---

#### 6. Edit/Delete Own Uploads

**Description**: Users can modify or remove their own uploads.

**Requirements**:
- Edit metadata (not images)
- Delete question paper
- Confirmation dialog
- Only visible on own uploads

**Time Estimate**: 0.5 day

---

### Deferred to V2

| Feature | Reason for Deferring | V2 Priority |
|---------|---------------------|-------------|
| **Likes/Upvotes** | Profiles foundation ready, add next | High |
| **Comments** | Moderation needed, scope creep | Medium |
| **Followership** | Social features can wait | Medium |
| **PDF Upload** | Technical complexity (preview, processing) | High |
| **Download** | Copyright/abuse concerns to address | Medium |
| **Bookmarks/Saves** | Auth ready, can add easily | Medium |
| **Notifications** | Requires email infrastructure | Low |
| **Admin Dashboard** | Manual moderation sufficient initially | Medium |
| **Advanced Profiles** | Bio, badges, stats | Low |

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
│  USERS / PROFILES                                                │
│  ────────────────                                                │
│  GET    /api/users/:id          Get user profile                 │
│  GET    /api/users/:id/questions Get user's uploads              │
│  PUT    /api/users/me           Update own display name          │
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

#### GET /api/users/:id

```typescript
// Request
GET /api/users/clx123456

// Response
{
  "user": {
    "id": "clx123456",
    "displayName": "John Doe",
    "avatarUrl": "https://lh3.googleusercontent.com/...",
    "createdAt": "2026-01-01T10:00:00Z",
    "uploadCount": 12
  }
}
```

#### GET /api/users/:id/questions

```typescript
// Request
GET /api/users/clx123456/questions?page=1&limit=20

// Response
{
  "data": [...],  // Array of question objects
  "pagination": {...}
}
```

#### PUT /api/users/me

```typescript
// Request (authenticated)
{
  "displayName": "Jane Smith"
}

// Response
{
  "user": {
    "id": "clx123456",
    "displayName": "Jane Smith",
    "avatarUrl": "...",
    "createdAt": "2026-01-01T10:00:00Z"
  }
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
  semester: z.enum(['First', 'Second', 'LVS']),
  hashtags: z.array(z.string().max(30)).max(10).optional(),
  images: z.array(z.url()).min(1).max(10),
});

export const searchQuerySchema = z.object({
  q: z.string().max(100).optional(),
  level: z.coerce.number().int().optional(),
  year: z.coerce.number().int().optional(),
  semester: z.enum(['First', 'Second', 'LVS']).optional(),
  hashtag: z.string().max(30).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const updateDisplayNameSchema = z.object({
  displayName: z.string().min(2).max(50).trim(),
});
```

---

## Data Models

### Database Schema

```typescript
// packages/database/src/schema.ts
import { pgTable, text, integer, timestamp, boolean } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

// Users table (authenticated via Google OAuth)
export const users = pgTable('users', {
  id: text('id').primaryKey(),  // Supabase auth.users.id
  email: text('email').unique().notNull(),
  displayName: text('display_name').notNull(),
  avatarUrl: text('avatar_url'),
  provider: text('provider').default('google').notNull(),
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
// CREATE INDEX idx_users_email ON users(email);
```

**Note**: Users are now **required** to authenticate via Google OAuth to upload. Anonymous browsing (read-only) requires no user record.

### TypeScript Types

```typescript
// packages/shared/src/types.ts

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  provider: string;
  createdAt: Date;
}

export interface PublicUserProfile {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt: Date;
  uploadCount?: number;
}

export interface Question {
  id: string;
  title: string;
  courseCode: string;
  courseName: string;
  level: number;
  year: number;
  semester: 'First' | 'Second' | 'LVS';
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
  // Author information for display
  author: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
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
// Simple search implementation with author info
async function searchQuestions(params: SearchParams) {
  const { q, level, year, semester, page = 1, limit = 20 } = params;
  
  // Join with users to get author info
  let query = db.select({
    // Question fields
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
    // Author fields
    author: {
      id: users.id,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
    },
  })
  .from(questions)
  .innerJoin(users, eq(questions.authorId, users.id));
  
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
│  [Upload Question Paper]  [User Avatar ▼]│
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐   │
│  │  [👤] John Doe    2 days ago    │   │
│  │  CS101 Final Exam 2024          │   │
│  │  ┌─────────────┐                │   │
│  │  │  [Image]    │  100L • 1st    │   │
│  │  └─────────────┘                │   │
│  │  #programming #java             │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │  [👤] Jane Smith  5 days ago    │   │
│  │  MTH201 Midterm 2024            │   │
│  │  ┌─────────────┐                │   │
│  │  │  [Image]    │  200L • 2nd    │   │
│  │  └─────────────┘                │   │
│  └─────────────────────────────────┘   │
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
│  ┌─────────────────────────────────┐   │
│  │ Uploaded by                     │   │
│  │ [👤 Avatar] John Doe            │   │  ← Clickable
│  │ Jan 1, 2026                     │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [Share] [Report]                       │
└─────────────────────────────────────────┘
```

#### 5. User Profile Page

```
┌─────────────────────────────────────────┐
│  ← Profile                              │
├─────────────────────────────────────────┤
│       ┌─────────┐                       │
│       │  [👤]   │                       │
│       │ Avatar  │                       │
│       └─────────┘                       │
│                                         │
│        John Doe                         │
│        [Edit Display Name]   (if own)   │
│                                         │
│        Joined Jan 1, 2026               │
│        12 question papers uploaded      │
│                                         │
├─────────────────────────────────────────┤
│  Uploads                                │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐   │
│  │  CS101 Final Exam 2024          │   │
│  │  [Image] 100L • 1st             │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │  PHY102 Midterm 2024            │   │
│  │  [Image] 100L • 2nd             │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [Load More]                            │
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
- `Avatar` - User avatars with fallback to initials
- `Separator` - Section dividers

---

## Implementation Roadmap

### ~1 Week MVP Timeline

```
Day 1: Project Setup & Database
├── Set up monorepo structure
├── Configure Supabase (database + auth)
├── Set up Google OAuth in Supabase
├── Set up Cloudflare R2
├── Define database schema (users + questions)
└── Run migrations

Day 2: Backend API & Auth
├── Implement Google OAuth callback handler
├── Implement /api/questions endpoints (with auth checks)
├── Implement /api/upload/presign (protected)
├── Implement /api/users endpoints (profile, update)
├── Add authentication middleware
├── Add validation with Zod
└── Test endpoints

Day 3: Frontend - Auth & Core UI
├── Set up shadcn/ui
├── Build AuthProvider component
├── Build sign-in modal/flow
├── Build Avatar component
├── Build QuestionCard component (with author info)
├── Build Feed page (home)
└── Add loading states

Day 4: Frontend - User Profiles
├── Build user profile page
├── Build "my uploads" list
├── Build edit display name form
├── Build Search page
└── Link avatars/names to profiles

Day 5: Frontend - Upload Flow
├── Build Upload form
├── Add "Sign in to upload" check
├── Implement image picker
├── Add client-side compression
├── Connect to presign API
├── Handle upload errors
└── Success feedback

Day 6: Frontend - Detail & Polish
├── Build Question detail page
├── Image gallery/carousel
├── Show uploader info on detail page
├── Responsive design fixes
├── Error handling
└── Empty states

Day 7: Testing & Deployment
├── Manual testing all flows (browse, auth, upload, profile)
├── Fix critical bugs
├── Deploy to Vercel
├── Configure environment variables (Supabase, R2, Google OAuth)
├── DNS setup (if custom domain)
└── Smoke test production
```

### Success Criteria for MVP Launch

**Anonymous Users (No Auth):**
- [ ] Can browse question feed
- [ ] Can search by course code/name/level
- [ ] Can view question paper details with all images
- [ ] Can view user profiles (public)

**Authenticated Users (Google OAuth):**
- [ ] Can sign in with Google (one click)
- [ ] Profile automatically created with Google data
- [ ] Can upload question papers with images
- [ ] Can edit their display name
- [ ] Can view their own uploads on profile
- [ ] Can delete their own uploads

**User Attribution:**
- [ ] Question cards show uploader avatar + name
- [ ] Clicking uploader navigates to their profile
- [ ] Profile page shows user's uploads

**General:**
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

