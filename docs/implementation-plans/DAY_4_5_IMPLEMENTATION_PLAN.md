# 📋 Day 4-5 Implementation Plan: Upload Flow & Feature Completion

**Status:** Planning Phase - Awaiting Approval  
**Date:** January 13, 2026  
**Phase:** Days 4-5 of MVP Development  
**Scope:** User Profiles, Search, Upload Form, Question Detail

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current State Analysis](#current-state-analysis)
3. [Day 4: User Profiles & Search](#day-4-user-profiles--search)
4. [Day 5: Upload Flow & Question Detail](#day-5-upload-flow--question-detail)
5. [Technical Design Decisions](#technical-design-decisions)
6. [Implementation Roadmap](#implementation-roadmap)
7. [Risk Assessment](#risk-assessment)
8. [Success Criteria](#success-criteria)

---

## Executive Summary

### Objectives

Days 4-5 will complete the MVP by implementing:

1. **User Profile Pages** - Display user info, uploads, and edit display name
2. **Search Functionality** - Filters for course code, level, year, semester
3. **Upload Form** - Multi-image upload with client-side compression and R2 integration
4. **Question Detail Page** - Image gallery with swipe/zoom capabilities

### Timeline

- **Day 4:** User Profiles + Search (6-8 hours)
- **Day 5:** Upload Form + Question Detail (8-10 hours)
- **Total:** 14-18 hours

### Key Dependencies

All backend APIs are already implemented and tested:
- ✅ `/api/users/:id` - Get user profile
- ✅ `/api/users/:id/questions` - Get user's uploads
- ✅ `/api/users/me` - Update display name
- ✅ `/api/questions/search` - Search with filters
- ✅ `/api/upload/presign` - R2 presigned URLs
- ✅ `/api/questions` - Create question
- ✅ `/api/questions/:id` - Get question detail

---

## Current State Analysis

### What's Complete ✅

| Component | Status | Details |
|-----------|--------|---------|
| Backend APIs | ✅ Complete | All 12 endpoints implemented and tested |
| Database Schema | ✅ Complete | Users, questions, reports tables |
| Auth Flow | ✅ Complete | Google OAuth + session management |
| Navigation | ✅ Complete | Mobile bottom tabs + desktop sidebar |
| Question Feed | ✅ Complete | Paginated feed with TanStack Query |
| Question Cards | ✅ Complete | Author attribution, metadata display |
| UI Components | ✅ Complete | Button, Avatar, Card, Badge, Skeleton, Separator |

### What's Pending ⏳

| Feature | Current State | Required Work |
|---------|---------------|---------------|
| User Profile Page | Empty placeholder | Full implementation |
| Search Page | Empty placeholder | Search bar + filters |
| Upload Page | Empty placeholder | Complete form + R2 integration |
| Question Detail | Empty placeholder | Image gallery + metadata |

---

## Day 4: User Profiles & Search

### 4.1 User Profile Page

#### Overview

**Goal:** Display user information and their uploaded question papers

**Route:** `/users/[id]`

**Requirements:**
- Show user avatar, display name, join date
- Display upload count
- List all user's uploads (reuse QuestionCard)
- "Edit Display Name" button (only on own profile)
- Loading and error states

#### Design Approach

**Option 1: Server-Side Rendering (SSR) ✅ RECOMMENDED**

```typescript
// apps/frontend/app/(main)/users/[id]/page.tsx
export default async function UserProfilePage({ params }) {
  const { id } = await params;
  
  // Fetch on server
  const userRes = await fetch(`${API_URL}/api/users/${id}`);
  const user = await userRes.json();
  
  // Pass to client component for uploads (infinite scroll)
  return <UserProfileContent user={user} userId={id} />;
}
```

**Pros:**
- ✅ SEO-friendly (user profiles indexed)
- ✅ Faster initial paint (data on first render)
- ✅ Better UX for profile sharing

**Cons:**
- ⚠️ Slightly more complex pattern
- ⚠️ Need to handle server/client split

**Option 2: Client-Side Rendering (CSR)**

```typescript
// Fetch everything on client with TanStack Query
const { data: user } = useQuery({
  queryKey: ['user', id],
  queryFn: () => fetch(`/api/users/${id}`).then(r => r.json())
});
```

**Pros:**
- ✅ Simpler implementation
- ✅ Consistent with feed pattern

**Cons:**
- ❌ No SEO (profiles not indexed)
- ❌ Loading spinner on every visit
- ❌ Poor experience for shared links

**Decision:** Use **Option 1 (SSR)** for better UX and SEO

#### Implementation Details

**Components to Create:**

1. **`components/users/user-profile-header.tsx`**
   - Avatar (large, 80-100px)
   - Display name (h1)
   - Join date ("Member since Jan 2026")
   - Upload count ("12 papers shared")
   - Edit button (conditionally rendered)

2. **`components/users/edit-display-name-dialog.tsx`**
   - Modal/dialog with input field
   - Validation: 2-50 characters, trim whitespace
   - Uses `PUT /api/users/me`
   - Toast on success/error
   - Uses shadcn/ui Dialog component (needs to be created)

3. **`components/users/user-uploads-list.tsx`**
   - Client component with TanStack Query
   - Fetches `/api/users/:id/questions`
   - Reuses QuestionCard component
   - Same grid layout as feed
   - "Load More" pagination
   - Empty state: "No uploads yet"

**New UI Components Needed:**

- **Dialog** - For edit display name modal
- **Input** - For form fields
- **Label** - For form labels
- **Toast/Sonner** - For success/error notifications

**API Integration:**

```typescript
// Fetch user profile (server-side)
const response = await fetch(`http://localhost:3000/api/users/${id}`, {
  cache: 'no-store'
});

// Fetch user uploads (client-side)
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: ['user-uploads', userId],
  queryFn: ({ pageParam = 1 }) => 
    fetch(`/api/users/${userId}/questions?page=${pageParam}`).then(r => r.json()),
  getNextPageParam: (lastPage) => 
    lastPage.pagination.hasNext ? lastPage.pagination.page + 1 : undefined,
});

// Update display name
const mutation = useMutation({
  mutationFn: (newName: string) =>
    fetch('/api/users/me', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName: newName }),
    }).then(r => r.json()),
  onSuccess: () => {
    // Invalidate queries, show toast
  },
});
```

**Time Estimate:** 3-4 hours

---

### 4.2 Search Page

#### Overview

**Goal:** Allow users to search and filter question papers

**Route:** `/search`

**Requirements:**
- Search input (queries course code, course name, title)
- Filter dropdowns: Level, Year, Semester
- "Clear filters" button
- Display results in same grid as feed
- Show result count
- Empty state: "No results found"
- Loading state

#### Design Approach

**Option 1: URL-Based Filters ✅ RECOMMENDED**

```typescript
// URL: /search?q=CS101&level=100&year=2024
const searchParams = useSearchParams();
const q = searchParams.get('q');
const level = searchParams.get('level');
// ...filters reflected in URL
```

**Pros:**
- ✅ Shareable search URLs
- ✅ Browser back/forward works
- ✅ Better UX (bookmark searches)
- ✅ SEO benefits (indexed search results)

**Cons:**
- ⚠️ More complex state management

**Option 2: Local State Filters**

```typescript
const [filters, setFilters] = useState({ q: '', level: null });
```

**Pros:**
- ✅ Simpler implementation

**Cons:**
- ❌ Can't share search results
- ❌ No browser navigation support
- ❌ Poor UX

**Decision:** Use **Option 1 (URL-based)** for better UX

#### Implementation Details

**Components to Create:**

1. **`components/search/search-bar.tsx`**
   - Input with search icon
   - Debounced input (300ms delay)
   - "Clear" button (X icon)
   - Updates URL on change

2. **`components/search/search-filters.tsx`**
   - Level dropdown (100, 200, 300, 400, 500)
   - Year dropdown (dynamic: 2000-2026)
   - Semester dropdown (First, Second, LVS)
   - "Clear All Filters" button
   - Updates URL on selection

3. **`components/search/search-results.tsx`**
   - Fetches `/api/questions/search` with URL params
   - Displays result count: "24 results for 'CS101'"
   - Reuses QuestionCard component
   - Same grid layout as feed
   - "Load More" pagination
   - Empty state with icon

**New UI Components Needed:**

- **Input** - For search field
- **Select** - For filter dropdowns
- **Form** - For filter form

**Debounced Search Implementation:**

```typescript
'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useDebounce } from '@/hooks/use-debounce';

export function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get('q') || '');
  const debouncedValue = useDebounce(value, 300);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (debouncedValue) {
      params.set('q', debouncedValue);
    } else {
      params.delete('q');
    }
    router.push(`/search?${params.toString()}`);
  }, [debouncedValue]);

  return <Input value={value} onChange={(e) => setValue(e.target.value)} />;
}
```

**API Integration:**

```typescript
const buildSearchURL = (params: URLSearchParams) => {
  const query = new URLSearchParams();
  if (params.get('q')) query.set('q', params.get('q')!);
  if (params.get('level')) query.set('level', params.get('level')!);
  if (params.get('year')) query.set('year', params.get('year')!);
  if (params.get('semester')) query.set('semester', params.get('semester')!);
  query.set('page', pageParam.toString());
  return `/api/questions/search?${query.toString()}`;
};

const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: ['search', searchParams.toString()],
  queryFn: ({ pageParam = 1 }) => 
    fetch(buildSearchURL(searchParams)).then(r => r.json()),
  getNextPageParam: (lastPage) => 
    lastPage.pagination.hasNext ? lastPage.pagination.page + 1 : undefined,
});
```

**Time Estimate:** 2-3 hours

---

**Day 4 Total Time:** 5-7 hours

**Day 4 Deliverables:**
- ✅ User profile page with uploads
- ✅ Edit display name functionality
- ✅ Search with filters (URL-based)
- ✅ 3 new UI components (Dialog, Input, Select/Label)

---

## Day 5: Upload Flow & Question Detail

### 5.1 Upload Form

#### Overview

**Goal:** Allow authenticated users to upload question papers with images

**Route:** `/upload`

**Requirements:**
- Auth check (redirect to sign-in if not authenticated)
- Multi-image upload (1-10 images)
- Image preview with remove option
- Client-side image compression
- Form fields: title, course code, course name, level, year, semester, hashtags
- Validation with error messages
- Progress indicator during upload
- Success feedback + redirect to new question

#### Design Decisions

##### 5.1.1 Image Upload Approach

**Option 1: Direct R2 Upload with Presigned URLs ✅ RECOMMENDED**

**Flow:**
1. User selects images
2. Compress images client-side
3. Request presigned URLs from `/api/upload/presign`
4. Upload directly to R2 from browser
5. Submit form with R2 URLs to `/api/questions`

**Pros:**
- ✅ No server bandwidth usage
- ✅ Faster uploads (direct to R2)
- ✅ Scalable (no server bottleneck)
- ✅ Lower costs (no egress from server)
- ✅ Already implemented in backend

**Cons:**
- ⚠️ More complex client logic
- ⚠️ Multiple upload requests

**Option 2: Server-Side Upload**

**Flow:**
1. Upload images to Next.js API route
2. Server uploads to R2
3. Return URLs to client

**Pros:**
- ✅ Simpler client code

**Cons:**
- ❌ Server bandwidth usage
- ❌ Slower (two-hop upload)
- ❌ Not scalable
- ❌ Higher costs

**Decision:** Use **Option 1 (Direct R2)** - already implemented

##### 5.1.2 Image Compression Library

**Option 1: browser-image-compression ✅ RECOMMENDED**

```typescript
import imageCompression from 'browser-image-compression';

const compressedFile = await imageCompression(file, {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
});
```

**Pros:**
- ✅ Popular (3M+ downloads/week)
- ✅ Simple API
- ✅ Web worker support (non-blocking)
- ✅ Configurable compression

**Cons:**
- ⚠️ 50KB bundle size

**Option 2: canvas-based compression (custom)**

```typescript
// Manual canvas compression
const canvas = document.createElement('canvas');
// ... resize and compress
```

**Pros:**
- ✅ No dependencies

**Cons:**
- ❌ More complex
- ❌ Need to handle edge cases
- ❌ No web worker
- ❌ Reinventing the wheel

**Decision:** Use **browser-image-compression** - battle-tested

##### 5.1.3 Image Preview & Selection

**Option 1: Native HTML5 File Input with Custom UI ✅ RECOMMENDED**

```tsx
<input
  type="file"
  multiple
  accept="image/*"
  onChange={handleFileChange}
  className="hidden"
  id="file-upload"
/>
<label htmlFor="file-upload">
  <Button>Select Images</Button>
</label>
```

**Pros:**
- ✅ No dependencies
- ✅ Native mobile camera support
- ✅ Simple implementation
- ✅ Full control over UI

**Cons:**
- ⚠️ Need to build preview grid

**Option 2: react-dropzone**

```tsx
<Dropzone onDrop={handleDrop}>
  {/* Drop zone UI */}
</Dropzone>
```

**Pros:**
- ✅ Drag & drop support
- ✅ Built-in file validation

**Cons:**
- ❌ 70KB bundle size
- ❌ Overkill for mobile-first
- ❌ Drag & drop less useful on mobile

**Decision:** Use **Option 1 (Native)** - mobile-first, lighter

#### Implementation Details

**Components to Create:**

1. **`components/upload/upload-form.tsx`**
   - Client component (uses useAuth)
   - Redirect if not authenticated
   - Form with react-hook-form + Zod validation
   - Handles all state: images, metadata, upload progress
   - Orchestrates entire upload flow

2. **`components/upload/image-picker.tsx`**
   - Hidden file input + custom button
   - Image preview grid (thumbnails)
   - Remove image button (X on each preview)
   - Max 10 images validation
   - File type validation (images only)
   - File size warning (before compression)

3. **`components/upload/image-preview-grid.tsx`**
   - Display selected images as thumbnails
   - Remove button on each
   - Shows image count (3/10)
   - Reorder images (optional - defer to V2)

4. **`components/upload/upload-progress.tsx`**
   - Progress bar showing upload status
   - Step indicator:
     1. Compressing images...
     2. Uploading images... (X/10)
     3. Creating question...
   - Prevents navigation during upload

**New UI Components Needed:**

- **Form** - Form wrapper with validation
- **Input** - Text inputs
- **Label** - Form labels
- **Select** - Dropdowns for level, year, semester
- **Textarea** - For title (optional)
- **Progress** - Upload progress bar

**Upload Flow Implementation:**

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import imageCompression from 'browser-image-compression';

export function UploadForm() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const handleUpload = async (formData) => {
    setUploading(true);
    setProgress({ current: 0, total: files.length });

    try {
      // 1. Compress images
      const compressedFiles = await Promise.all(
        files.map(file => imageCompression(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        }))
      );

      // 2. Get presigned URLs
      const { urls } = await fetch('/api/upload/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: files.length }),
      }).then(r => r.json());

      // 3. Upload to R2
      const uploadedUrls = [];
      for (let i = 0; i < compressedFiles.length; i++) {
        await fetch(urls[i].uploadUrl, {
          method: 'PUT',
          body: compressedFiles[i],
          headers: { 'Content-Type': compressedFiles[i].type },
        });
        uploadedUrls.push(urls[i].publicUrl);
        setProgress({ current: i + 1, total: files.length });
      }

      // 4. Create question
      const question = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          images: uploadedUrls,
        }),
      }).then(r => r.json());

      // 5. Success - redirect
      router.push(`/questions/${question.id}`);
    } catch (error) {
      console.error('Upload failed:', error);
      // Show error toast
    } finally {
      setUploading(false);
    }
  };

  if (!isAuthenticated) {
    return <SignInPrompt />;
  }

  return (
    <form onSubmit={handleSubmit(handleUpload)}>
      {/* Form fields */}
    </form>
  );
}
```

**Form Validation (Zod):**

```typescript
import { z } from 'zod';
import { createQuestionSchema } from '@qapp/shared';

const uploadFormSchema = createQuestionSchema.omit({ images: true }).extend({
  files: z.array(z.instanceof(File))
    .min(1, 'At least one image is required')
    .max(10, 'Maximum 10 images allowed'),
});

type UploadFormData = z.infer<typeof uploadFormSchema>;
```

**Time Estimate:** 5-6 hours

---

### 5.2 Question Detail Page

#### Overview

**Goal:** Display full question paper with all images and metadata

**Route:** `/questions/[id]`

**Requirements:**
- Display all images in a gallery/carousel
- Swipe between images (mobile)
- Zoom functionality
- Image counter (2/5)
- Show all metadata (course, level, year, semester, hashtags)
- Show uploader info (avatar, name, join date)
- "View Profile" link
- Share button (copy link)
- Back button
- Loading and error states

#### Design Approach

**Option 1: Server-Side Rendering (SSR) ✅ RECOMMENDED**

```typescript
export default async function QuestionDetailPage({ params }) {
  const { id } = await params;
  const res = await fetch(`${API_URL}/api/questions/${id}`);
  const question = await res.json();
  return <QuestionDetail question={question} />;
}
```

**Pros:**
- ✅ SEO-friendly (questions indexed by Google)
- ✅ Faster initial load
- ✅ Better for sharing (preview cards)
- ✅ Critical for discovery

**Cons:**
- ⚠️ Need to handle server error states

**Decision:** Use **Option 1 (SSR)** - essential for SEO

#### Image Gallery Approach

**Option 1: Native CSS Scroll Snap + Touch Events ✅ RECOMMENDED**

```css
.gallery {
  display: flex;
  overflow-x: scroll;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
}

.image {
  scroll-snap-align: center;
  flex-shrink: 0;
  width: 100%;
}
```

**Pros:**
- ✅ No dependencies
- ✅ Native performance
- ✅ Works on all devices
- ✅ Accessibility built-in
- ✅ Small bundle size

**Cons:**
- ⚠️ Need to implement zoom separately

**Option 2: Embla Carousel**

```typescript
import useEmblaCarousel from 'embla-carousel-react';
```

**Pros:**
- ✅ Rich features
- ✅ Good documentation

**Cons:**
- ❌ 20KB bundle size
- ❌ Overkill for simple swipe

**Option 3: Swiper**

**Pros:**
- ✅ Very feature-rich

**Cons:**
- ❌ 140KB bundle size
- ❌ Overkill
- ❌ Performance overhead

**Decision:** Start with **Option 1 (Native)**, upgrade if needed

#### Zoom Implementation

**Option 1: react-medium-image-zoom ✅ RECOMMENDED**

```typescript
import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css';

<Zoom>
  <img src={image} alt="Question paper" />
</Zoom>
```

**Pros:**
- ✅ Lightweight (10KB)
- ✅ Works with Next.js Image
- ✅ Smooth animations
- ✅ Mobile-friendly

**Cons:**
- ⚠️ CSS import needed

**Option 2: Custom pinch-zoom**

**Pros:**
- ✅ No dependencies

**Cons:**
- ❌ Complex implementation
- ❌ Need to handle touch events
- ❌ Cross-browser issues

**Decision:** Use **react-medium-image-zoom**

#### Implementation Details

**Components to Create:**

1. **`components/questions/question-detail-header.tsx`**
   - Course code + name
   - Title
   - Metadata badges (level, year, semester)
   - Hashtags
   - Share button
   - Back button

2. **`components/questions/question-image-gallery.tsx`**
   - Scroll snap container
   - All images with Next.js Image
   - Image counter (2/5)
   - Navigation dots
   - Zoom on click
   - Loading skeleton

3. **`components/questions/question-author-card.tsx`**
   - Avatar (medium size)
   - Display name
   - Join date ("Member since...")
   - Upload count
   - "View Profile" link
   - Reusable component

**New UI Components Needed:**

- **Dialog** - For share dialog (or use native share API)
- **Separator** - To divide sections

**Implementation:**

```typescript
// apps/frontend/app/(main)/questions/[id]/page.tsx
import { notFound } from 'next/navigation';
import { QuestionImageGallery } from '@/components/questions/question-image-gallery';
import { QuestionDetailHeader } from '@/components/questions/question-detail-header';
import { QuestionAuthorCard } from '@/components/questions/question-author-card';

export default async function QuestionDetailPage({ params }) {
  const { id } = await params;
  
  const res = await fetch(`http://localhost:3000/api/questions/${id}`, {
    cache: 'no-store'
  });
  
  if (!res.ok) {
    notFound();
  }
  
  const question = await res.json();

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Image Gallery */}
      <QuestionImageGallery images={question.images} title={question.title} />
      
      {/* Header with metadata */}
      <QuestionDetailHeader question={question} />
      
      {/* Author info */}
      <QuestionAuthorCard author={question.author} />
    </div>
  );
}
```

**Gallery Component:**

```typescript
'use client';

import { useState } from 'react';
import Image from 'next/image';
import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css';

export function QuestionImageGallery({ 
  images, 
  title 
}: { 
  images: string[]; 
  title: string; 
}) {
  const [currentIndex, setCurrentIndex] = useState(0);

  return (
    <div className="space-y-4">
      {/* Main image */}
      <div className="relative aspect-[3/4] bg-muted rounded-lg overflow-hidden">
        <Zoom>
          <Image
            src={images[currentIndex]}
            alt={`${title} - Page ${currentIndex + 1}`}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 896px"
            priority
          />
        </Zoom>
      </div>

      {/* Image counter */}
      <div className="text-center text-sm text-muted-foreground">
        {currentIndex + 1} / {images.length}
      </div>

      {/* Thumbnail navigation */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`relative flex-shrink-0 w-16 h-20 rounded border-2 transition-colors ${
                i === currentIndex 
                  ? 'border-primary' 
                  : 'border-transparent'
              }`}
            >
              <Image
                src={img}
                alt={`Thumbnail ${i + 1}`}
                fill
                className="object-cover rounded"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

**Share Implementation:**

```typescript
'use client';

export function ShareButton({ questionId }: { questionId: string }) {
  const handleShare = async () => {
    const url = `${window.location.origin}/questions/${questionId}`;
    
    // Use native share API if available (mobile)
    if (navigator.share) {
      await navigator.share({
        title: 'Check out this question paper',
        url,
      });
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(url);
      // Show toast: "Link copied!"
    }
  };

  return (
    <Button onClick={handleShare} variant="outline">
      Share
    </Button>
  );
}
```

**Time Estimate:** 3-4 hours

---

**Day 5 Total Time:** 8-10 hours

**Day 5 Deliverables:**
- ✅ Upload form with R2 integration
- ✅ Client-side image compression
- ✅ Question detail page with gallery
- ✅ Zoom functionality
- ✅ Share functionality

---

## Technical Design Decisions

### 1. State Management Approach

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| **Form State** | react-hook-form | Industry standard, works with Zod, better DX |
| **Server State** | TanStack Query | Already in use, perfect for pagination |
| **URL State** | useSearchParams | Native Next.js, better UX, shareable URLs |
| **Local UI State** | useState | Simple, no overhead for temporary UI state |

### 2. Data Fetching Strategy

| Page | Pattern | Reason |
|------|---------|--------|
| **User Profile** | SSR + CSR hybrid | Profile data SSR (SEO), uploads CSR (pagination) |
| **Search** | CSR only | Dynamic filters, TanStack Query handles caching |
| **Upload** | CSR only | Authenticated, complex client-side logic |
| **Question Detail** | SSR | Critical for SEO and social sharing |

### 3. Component Architecture

**Principle:** Composition over inheritance

```
Page (Server Component)
  └─> Fetch data on server
  └─> Pass to Client Components
      └─> Handle interactivity
      └─> Manage local state
```

**Example:**

```typescript
// Server Component (page.tsx)
export default async function UserProfilePage({ params }) {
  const user = await fetchUser(params.id); // Server-side
  return <UserProfileContent user={user} />; // Client component
}

// Client Component
'use client';
export function UserProfileContent({ user }) {
  const uploads = useUserUploads(user.id); // Client-side
  return (/* Interactive UI */);
}
```

### 4. Image Optimization Strategy

| Stage | Action | Tool | Impact |
|-------|--------|------|--------|
| **Client** | Compress before upload | browser-image-compression | -70% file size |
| **Upload** | Direct to R2 | Presigned URLs | 0 server bandwidth |
| **Display** | Responsive images | Next.js Image | Automatic optimization |
| **Caching** | Browser cache | Cache headers | Faster subsequent loads |

### 5. Error Handling Strategy

**Levels of error handling:**

1. **API Level** - Already implemented in `lib/api/errors.ts`
2. **Query Level** - TanStack Query error states
3. **Form Level** - Zod validation + react-hook-form
4. **UI Level** - Error boundaries + fallback UI

```typescript
// Example: Upload form error handling
try {
  await uploadImages();
} catch (error) {
  if (error instanceof ValidationError) {
    setError('form', { message: error.message });
  } else if (error instanceof NetworkError) {
    toast.error('Upload failed. Check your connection.');
  } else {
    toast.error('Something went wrong. Please try again.');
  }
}
```

### 6. Performance Optimizations

| Optimization | Implementation | Benefit |
|--------------|----------------|---------|
| **Image Lazy Loading** | Next.js Image default | Faster initial load |
| **Query Caching** | TanStack Query (5min) | Reduce API calls |
| **Debounced Search** | useDebounce hook | Reduce search API calls |
| **Web Workers** | Image compression | Non-blocking compression |
| **Progressive Enhancement** | SSR + hydration | Fast first paint |

---

## Implementation Roadmap

### Day 4 Timeline (6-7 hours)

| Time | Task | Deliverable |
|------|------|-------------|
| **Hour 1** | Create UI components | Input, Label, Dialog, Select |
| **Hour 2-3** | User Profile Page | Profile header, edit display name |
| **Hour 3-4** | User Uploads List | List component with pagination |
| **Hour 5-6** | Search Page | Search bar, filters, results |
| **Hour 7** | Testing & Polish | Test all flows, fix bugs |

### Day 5 Timeline (8-10 hours)

| Time | Task | Deliverable |
|------|------|-------------|
| **Hour 1** | Create UI components | Form, Progress, Textarea |
| **Hour 2** | Image Picker Component | File input, preview grid |
| **Hour 3-4** | Upload Form Logic | Form validation, state management |
| **Hour 5-6** | R2 Upload Integration | Compression, presigned URLs, upload |
| **Hour 7-8** | Question Detail Page | Gallery, metadata display |
| **Hour 8-9** | Image Gallery & Zoom | Scroll snap, zoom, navigation |
| **Hour 10** | Testing & Polish | Test upload flow, fix bugs |

### Dependencies Installation

**New packages needed:**

```json
{
  "dependencies": {
    "browser-image-compression": "^2.0.2",
    "react-hook-form": "^7.54.2",
    "react-medium-image-zoom": "^5.2.15",
    "@hookform/resolvers": "^3.9.1"
  }
}
```

**shadcn/ui components needed:**

```bash
# Day 4
npx shadcn@latest add dialog input label select form

# Day 5
npx shadcn@latest add progress textarea
```

---

## Risk Assessment

### High Risk ⚠️

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Large image upload failures** | Medium | High | Chunked upload, retry logic, clear error messages |
| **Browser compatibility (image compression)** | Low | Medium | Fallback to uncompressed, browser detection |
| **shadcn CLI issues** | High | Low | Manual component creation (already proven) |

### Medium Risk ⚠️

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Search performance with many filters** | Medium | Medium | Indexed queries (already implemented), pagination |
| **Mobile upload experience** | Medium | Medium | Thorough mobile testing, camera integration |
| **Form validation complexity** | Low | Medium | Leverage Zod schemas from @qapp/shared |

### Low Risk ✅

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **SSR data fetching** | Low | Low | Proven pattern, error boundaries |
| **Image gallery performance** | Low | Low | Next.js Image optimization, lazy loading |
| **URL state management** | Low | Low | Native Next.js APIs |

---

## Success Criteria

### Functional Requirements ✅

**User Profile:**
- [ ] Display user avatar, name, join date, upload count
- [ ] List all user uploads with pagination
- [ ] Edit display name (own profile only)
- [ ] Toast notifications for success/error
- [ ] Loading and error states

**Search:**
- [ ] Search by text (course code, name, title)
- [ ] Filter by level, year, semester
- [ ] Display result count
- [ ] Clear filters button
- [ ] URL-based filters (shareable)
- [ ] Same pagination as feed

**Upload:**
- [ ] Auth check with sign-in prompt
- [ ] Multi-image selection (1-10)
- [ ] Image preview with remove option
- [ ] Client-side compression
- [ ] Upload progress indicator
- [ ] Form validation with clear errors
- [ ] Success redirect to new question

**Question Detail:**
- [ ] Display all images in gallery
- [ ] Swipe between images (mobile)
- [ ] Zoom on click
- [ ] Image counter
- [ ] All metadata displayed
- [ ] Author info with profile link
- [ ] Share button (native or clipboard)

### Non-Functional Requirements ✅

**Performance:**
- [ ] First Contentful Paint < 1.5s
- [ ] Image compression reduces size by >50%
- [ ] Upload completes within reasonable time (10MB in <30s)
- [ ] Search debounced to avoid excessive API calls

**UX:**
- [ ] Clear loading states everywhere
- [ ] Helpful error messages
- [ ] Success feedback (toasts/redirects)
- [ ] Mobile-optimized forms
- [ ] Accessible (keyboard navigation, screen readers)

**Code Quality:**
- [ ] Type-safe (TypeScript)
- [ ] Validated (Zod schemas)
- [ ] Tested (manual testing all flows)
- [ ] Documented (component comments)

---

## Questions for User

Before proceeding, please confirm:

1. ✅ **SSR Approach:** Approve SSR for User Profile and Question Detail pages for SEO benefits?

2. ✅ **Search Filters:** Approve URL-based filters for shareable search results?

3. ✅ **Image Compression:** Approve browser-image-compression library (50KB bundle size)?

4. ✅ **Image Gallery:** Start with native CSS scroll snap, upgrade to Embla later if needed?

5. ✅ **Toast Notifications:** Which library? Options:
   - **Sonner** (recommended, 15KB, beautiful)
   - **react-hot-toast** (10KB, simpler)
   - **Manual** (custom toast component)

6. ✅ **Form Library:** Approve react-hook-form for upload form? (Industry standard, works with Zod)

7. 🔍 **Upload Success UX:** After successful upload, should we:
   - **Option A:** Redirect to the new question detail page ✅ RECOMMENDED
   - **Option B:** Redirect to user profile (show new upload)
   - **Option C:** Stay on upload form with success message + "Upload Another"

8. 🔍 **Edit Question Feature:** Should we implement edit/delete for own uploads in this phase?
   - Listed as "Nice-to-Have" in docs (0.5 day)
   - Can defer to V2 or add if time permits

---

## Next Steps

Upon approval:

1. **Install Dependencies**
   ```bash
   pnpm add browser-image-compression react-hook-form @hookform/resolvers react-medium-image-zoom sonner
   ```

2. **Create UI Components**
   - Manually create: Input, Label, Select, Form, Dialog, Progress, Textarea
   - Or attempt shadcn CLI (may fail due to pnpm store issue)

3. **Start Day 4 Implementation**
   - User Profile Page
   - Search Page

4. **Start Day 5 Implementation**
   - Upload Form
   - Question Detail Page

5. **Testing & Polish**
   - Manual testing all flows
   - Fix bugs
   - Edge case handling

---

## Appendix

### A. Useful Hooks to Create

```typescript
// hooks/use-debounce.ts
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  
  return debouncedValue;
}

// hooks/use-copy-to-clipboard.ts
export function useCopyToClipboard() {
  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    // Optional: show toast
  };
  return { copy };
}
```

### B. API Error Handling

All API calls should follow this pattern:

```typescript
const response = await fetch('/api/...');

if (!response.ok) {
  const error = await response.json();
  throw new Error(error.error || 'Something went wrong');
}

const data = await response.json();
return data;
```

### C. Type Safety Checklist

- ✅ All API responses typed (use types from @qapp/shared)
- ✅ Form data validated with Zod
- ✅ Props interfaces for all components
- ✅ No `any` types
- ✅ Strict mode enabled

---

**Document Status:** Ready for Review  
**Estimated Total Time:** 14-18 hours (Days 4-5)  
**Blockers:** None - all dependencies in place  
**Next Action:** Await user approval to proceed with implementation

---

## References

1. [Next.js 16 App Router Documentation](https://nextjs.org/docs)
2. [TanStack Query Documentation](https://tanstack.com/query/latest)
3. [react-hook-form Documentation](https://react-hook-form.com/)
4. [browser-image-compression Documentation](https://www.npmjs.com/package/browser-image-compression)
5. [react-medium-image-zoom Documentation](https://www.npmjs.com/package/react-medium-image-zoom)
6. [Zod Documentation](https://zod.dev/)
7. [shadcn/ui Components](https://ui.shadcn.com/)
8. [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
9. [Web Share API](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share)
10. [CSS Scroll Snap](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Scroll_Snap)
