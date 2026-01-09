# QApp: Storage & Upload Analysis

**Document Version:** 1.0  
**Date:** January 1, 2026  
**Author:** System Architecture Analysis  
**Status:** Final - MVP Approach Selected

---

## Table of Contents

- [Executive Summary](#executive-summary)
- [Requirements Analysis](#requirements-analysis)
- [Storage Provider Comparison](#storage-provider-comparison)
  - [AWS S3](#aws-s3)
  - [Cloudflare R2](#cloudflare-r2)
  - [Backblaze B2](#backblaze-b2)
  - [Supabase Storage](#supabase-storage)
  - [UploadThing](#uploadthing)
- [Cost Analysis](#cost-analysis)
- [Upload Strategy Comparison](#upload-strategy-comparison)
  - [Approach 1: Direct Upload with Presigned URLs](#approach-1-direct-upload-with-presigned-urls)
  - [Approach 2: Server-Side Upload](#approach-2-server-side-upload)
  - [Approach 3: Managed Upload Service](#approach-3-managed-upload-service)
- [Image Optimization](#image-optimization)
- [Implementation Details](#implementation-details)
- [Final Recommendation](#final-recommendation)
- [Alternative Approaches (For Future Reference)](#alternative-approaches-for-future-reference)
- [References](#references)

---

## Executive Summary

This document analyzes storage solutions and upload strategies for QApp's image hosting needs. After evaluating cost, performance, and integration complexity:

**Selected Stack:**
- **Storage Provider**: Cloudflare R2 (zero egress fees, S3-compatible)
- **Upload Strategy**: Direct upload with presigned URLs (scalable, no backend bottleneck)
- **Image Delivery**: Cloudflare CDN (included with R2)
- **Fallback**: Supabase Storage (if simpler integration preferred)

**Key Rationale**: Cloudflare R2's zero egress fees provide significant cost savings for an image-heavy application where reads (viewing question papers) far outnumber writes (uploads).

---

## Requirements Analysis

### Storage Requirements

| Requirement | Specification | Notes |
|-------------|---------------|-------|
| File Types | Images (JPEG, PNG, WebP) | PDFs in future version |
| Max File Size | 10 MB per image | Reasonable for phone photos |
| Images per Upload | 1-10 images | Multi-page question papers |
| Expected Storage (Year 1) | 1-5 GB | Dozens-hundreds of users |
| Read:Write Ratio | ~100:1 | Far more views than uploads |
| Delivery Speed | < 2s globally | CDN required |
| Retention | Indefinite | Question papers remain valuable |

### Access Patterns

```
Upload Flow (Rare):
User → Upload Form → Storage → Database (metadata)

View Flow (Frequent):
User → Feed/Search → CDN → Storage → Image Display
```

The high read:write ratio means **egress costs dominate** in traditional cloud storage.

---

## Storage Provider Comparison

### AWS S3

**Overview**: The industry standard for object storage. Highly reliable, extensive feature set.

#### Pricing (Standard Storage Class, US East)

| Component | Price | Notes |
|-----------|-------|-------|
| Storage | $0.023/GB/month | First 50 TB |
| PUT/POST requests | $0.005/1,000 requests | Uploads |
| GET requests | $0.0004/1,000 requests | Downloads |
| **Data Transfer OUT** | **$0.09/GB** | Egress (the killer) |

#### Pros

- ✅ Most mature and reliable object storage
- ✅ Extensive ecosystem and tooling
- ✅ Multiple storage classes (save on infrequent access)
- ✅ Excellent documentation
- ✅ Direct integration with AWS services

#### Cons

- ❌ **Egress fees are expensive** ($0.09/GB)
- ❌ Complex pricing model
- ❌ No built-in CDN (need CloudFront separately)
- ❌ AWS account complexity for simple projects

#### Cost Example (QApp Scale)

```
Monthly: 5 GB stored, 50 GB transferred (views)

Storage:     5 GB × $0.023     = $0.12
PUT (500):   500 × $0.000005   = $0.00
GET (10k):   10,000 × $0.0000004 = $0.00
Egress:      50 GB × $0.09     = $4.50
                                 -------
Total:                           $4.62/month
```

**Verdict**: Egress makes S3 expensive for read-heavy apps.

---

### Cloudflare R2

**Overview**: S3-compatible storage with zero egress fees. Built-in global CDN.

#### Pricing

| Component | Price | Notes |
|-----------|-------|-------|
| Storage | $0.015/GB/month | 10 GB free |
| Class A ops (writes) | $4.50/million | PUT, POST, LIST |
| Class B ops (reads) | $0.36/million | GET, HEAD |
| **Data Transfer OUT** | **$0 (FREE)** | Zero egress! |

#### Free Tier

- 10 GB storage
- 1 million Class A operations/month
- 10 million Class B operations/month
- Unlimited egress

#### Pros

- ✅ **Zero egress fees** (huge cost savings)
- ✅ S3-compatible API (easy migration)
- ✅ Built-in global CDN (Cloudflare network)
- ✅ Generous free tier (10 GB)
- ✅ Simple pricing model
- ✅ No minimum fees or commitments

#### Cons

- ❌ Newer service (less battle-tested than S3)
- ❌ Fewer features than S3 (no lifecycle policies yet)
- ❌ Cloudflare account required
- ❌ No AWS ecosystem integrations

#### Cost Example (QApp Scale)

```
Monthly: 5 GB stored, 50 GB transferred (views)

Storage:     5 GB × $0.015     = $0.075
Class A:     500 ops           = $0.00 (free tier)
Class B:     10,000 ops        = $0.00 (free tier)
Egress:      50 GB × $0        = $0.00
                                 -------
Total:                           $0.08/month (or FREE within free tier)
```

**Verdict**: Best cost-effectiveness for read-heavy applications.

---

### Backblaze B2

**Overview**: Budget-friendly cloud storage, S3-compatible.

#### Pricing

| Component | Price | Notes |
|-----------|-------|-------|
| Storage | $0.006/GB/month | Cheapest storage |
| Class A ops | $0.004/10,000 | Uploads |
| Class B ops | $0.004/10,000 | Downloads |
| Data Transfer OUT | $0.01/GB | Low but not free |

#### Free Tier

- 10 GB storage
- Unlimited uploads
- 1 GB/day free egress

#### Pros

- ✅ Cheapest storage per GB
- ✅ S3-compatible API
- ✅ Low egress (not zero, but cheap)
- ✅ Simple, transparent pricing

#### Cons

- ❌ Egress still costs (unlike R2)
- ❌ Smaller ecosystem
- ❌ No built-in CDN
- ❌ Need Cloudflare/Fastly for CDN (though free with Bandwidth Alliance)

#### Cost Example (QApp Scale)

```
Monthly: 5 GB stored, 50 GB transferred

Storage:     5 GB × $0.006     = $0.03
Egress:      50 GB × $0.01     = $0.50
                                 -------
Total:                           $0.53/month
```

**Verdict**: Good budget option, but R2 is cheaper for high-read scenarios.

---

### Supabase Storage

**Overview**: Built into Supabase, uses S3 under the hood. Integrated with Supabase Auth.

#### Pricing (Free Tier)

| Component | Limit |
|-----------|-------|
| Storage | 1 GB |
| Bandwidth | 2 GB/month |
| File uploads | Unlimited |

#### Paid Tier ($25/month Pro)

- 100 GB storage included
- 200 GB bandwidth included
- $0.021/GB additional storage

#### Pros

- ✅ **Integrated with Supabase Auth** (easy access control)
- ✅ Simple API for Next.js
- ✅ Built-in image transformations
- ✅ No separate account needed (if using Supabase DB)
- ✅ Row-level security for files

#### Cons

- ❌ Lower free tier limits (1 GB storage, 2 GB bandwidth)
- ❌ Tied to Supabase ecosystem
- ❌ Less cost-effective at scale than R2
- ❌ CDN less global than Cloudflare

#### Cost Example (QApp Scale)

```
Monthly: 5 GB stored, 50 GB transferred

Free tier exceeded → Must upgrade to Pro ($25/month)
```

**Verdict**: Great for quick integration, but expensive at scale.

---

### UploadThing

**Overview**: Purpose-built file upload service for Next.js/React.

#### Pricing

| Tier | Price | Storage | Bandwidth |
|------|-------|---------|-----------|
| Free | $0 | 2 GB | 2 GB/month |
| Pro | $25/month | 100 GB | 100 GB/month |

#### Pros

- ✅ **Easiest integration** (purpose-built for Next.js)
- ✅ Type-safe client
- ✅ Built-in upload UI components
- ✅ Handles presigned URLs automatically
- ✅ Great developer experience

#### Cons

- ❌ Expensive at scale
- ❌ Vendor lock-in
- ❌ Limited customization
- ❌ Small free tier

**Verdict**: Best DX, but not cost-effective for this project.

---

### Storage Provider Comparison Table

| Provider | Storage/GB/mo | Egress/GB | Free Tier | CDN | S3-Compatible | Best For |
|----------|---------------|-----------|-----------|-----|---------------|----------|
| **Cloudflare R2** | $0.015 | **$0** | 10 GB | ✅ Built-in | ✅ | Read-heavy apps |
| AWS S3 | $0.023 | $0.09 | 5 GB (12mo) | ❌ (+CloudFront) | ✅ Native | AWS ecosystem |
| Backblaze B2 | $0.006 | $0.01 | 10 GB | ❌ (need CDN) | ✅ | Budget storage |
| Supabase Storage | ~$0.021 | Included | 1 GB | ⚠️ Limited | ❌ | Supabase users |
| UploadThing | Bundled | Bundled | 2 GB | ✅ | ❌ | Quick prototypes |

---

## Cost Analysis

### Projected Usage Scenarios

#### MVP (Months 1-3)
- 100 uploads × 3 images avg = 300 images
- 2 MB average per image = 600 MB stored
- 1,000 views/day × 3 images = 3,000 requests/day
- ~90,000 requests/month, ~180 GB transfer

#### Growth (Months 4-12)
- 1,000 uploads × 3 images = 3,000 images
- ~6 GB stored
- 5,000 views/day = 450,000 requests/month
- ~900 GB transfer/month

### Cost Comparison at Scale (Month 12)

| Provider | Storage | Egress | Total/month |
|----------|---------|--------|-------------|
| **Cloudflare R2** | $0.09 | $0 | **$0.09** |
| AWS S3 | $0.14 | $81 | $81.14 |
| Backblaze B2 | $0.04 | $9 | $9.04 |
| Supabase Storage | $25 (Pro) | Included | $25.00 |

**Winner: Cloudflare R2** — 900x cheaper than S3 at scale.

---

## Upload Strategy Comparison

### Approach 1: Direct Upload with Presigned URLs

```
┌──────────┐      1. Request URL      ┌──────────┐
│  Client  │ ───────────────────────► │  Server  │
│ (Browser)│                          │ (Next.js)│
└──────────┘                          └────┬─────┘
     │                                     │
     │                              2. Generate presigned URL
     │                                     │
     │      3. Return presigned URL        │
     │ ◄───────────────────────────────────┘
     │
     │      4. Direct upload to storage
     ▼
┌──────────────────────┐
│   Cloudflare R2      │
│   (Object Storage)   │
└──────────────────────┘
```

#### How It Works

1. Client requests a presigned URL from your API
2. Server generates a time-limited, signed URL for R2
3. Client uploads directly to R2 using the presigned URL
4. Client notifies server of successful upload
5. Server saves metadata to database

#### Implementation

```typescript
// API Route: /api/upload/presign
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const R2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: Request) {
  const { filename, contentType } = await request.json();
  
  // Generate unique key
  const key = `questions/${Date.now()}-${filename}`;
  
  // Create presigned URL (expires in 10 minutes)
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });
  
  const presignedUrl = await getSignedUrl(R2, command, { expiresIn: 600 });
  
  return Response.json({
    presignedUrl,
    key,
    publicUrl: `${process.env.R2_PUBLIC_URL}/${key}`,
  });
}
```

```typescript
// Client-side upload
async function uploadImage(file: File) {
  // 1. Get presigned URL
  const { presignedUrl, key, publicUrl } = await fetch('/api/upload/presign', {
    method: 'POST',
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type,
    }),
  }).then(r => r.json());
  
  // 2. Upload directly to R2
  await fetch(presignedUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
    },
  });
  
  // 3. Return public URL for database storage
  return publicUrl;
}
```

#### Pros

- ✅ **No backend bottleneck** — files don't pass through server
- ✅ **Scalable** — handles large files without server memory issues
- ✅ **Fast** — direct connection to storage
- ✅ **Serverless-friendly** — no long-running requests

#### Cons

- ❌ More complex client-side code
- ❌ Two-step process (get URL, then upload)
- ❌ Need CORS configuration on storage
- ❌ Harder to validate file content before upload

---

### Approach 2: Server-Side Upload

```
┌──────────┐      1. Upload file      ┌──────────┐      2. Forward      ┌──────────┐
│  Client  │ ───────────────────────► │  Server  │ ──────────────────► │ Storage  │
│ (Browser)│                          │ (Next.js)│                      │   (R2)   │
└──────────┘                          └──────────┘                      └──────────┘
```

#### Implementation

```typescript
// API Route: /api/upload
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  
  // Validate file
  if (!file || file.size > 10 * 1024 * 1024) {
    return Response.json({ error: 'Invalid file' }, { status: 400 });
  }
  
  const buffer = Buffer.from(await file.arrayBuffer());
  const key = `questions/${Date.now()}-${file.name}`;
  
  // Upload to R2
  await R2.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: file.type,
  }));
  
  return Response.json({
    publicUrl: `${process.env.R2_PUBLIC_URL}/${key}`,
  });
}
```

#### Pros

- ✅ **Simpler client code** — standard form upload
- ✅ **Server-side validation** — can verify file before storing
- ✅ **No CORS issues** — same-origin upload
- ✅ **Can process images** — resize, compress on server

#### Cons

- ❌ **Server bottleneck** — all data passes through server
- ❌ **Memory usage** — file loaded into server memory
- ❌ **Timeout issues** — Vercel has 4.5MB body limit (free) and 10s timeout
- ❌ **Costly** — uses server compute time

---

### Approach 3: Managed Upload Service (UploadThing)

```typescript
// uploadthing.ts
import { createUploadthing } from 'uploadthing/next';

const f = createUploadthing();

export const ourFileRouter = {
  questionImage: f({ image: { maxFileSize: '10MB', maxFileCount: 10 } })
    .onUploadComplete(async ({ file }) => {
      console.log('Upload complete:', file.url);
      return { url: file.url };
    }),
};

// Client usage
import { UploadButton } from '@uploadthing/react';

<UploadButton
  endpoint="questionImage"
  onClientUploadComplete={(res) => {
    console.log('Files:', res);
  }}
/>
```

#### Pros

- ✅ **Easiest implementation** — minutes to set up
- ✅ **Built-in UI components**
- ✅ **Handles everything** — presigning, CORS, etc.

#### Cons

- ❌ **Cost** — $25/month after 2GB
- ❌ **Vendor lock-in**
- ❌ **Less control**

---

### Upload Strategy Comparison Table

| Aspect | Presigned URLs | Server-Side | UploadThing |
|--------|---------------|-------------|-------------|
| **Implementation Complexity** | ⭐⭐⭐ Medium | ⭐⭐⭐⭐ Easy | ⭐⭐⭐⭐⭐ Easiest |
| **Scalability** | ⭐⭐⭐⭐⭐ Best | ⭐⭐ Limited | ⭐⭐⭐⭐ Good |
| **File Size Limit** | Unlimited | 4.5MB (Vercel free) | 10MB |
| **Server Load** | ⭐⭐⭐⭐⭐ None | ⭐⭐ High | ⭐⭐⭐⭐⭐ None |
| **Cost** | ⭐⭐⭐⭐⭐ Free | ⭐⭐⭐⭐⭐ Free | ⭐⭐ $25/mo |
| **Validation** | ⭐⭐ Client-side | ⭐⭐⭐⭐⭐ Server-side | ⭐⭐⭐ Limited |

**Recommendation for QApp MVP**: **Presigned URLs with Cloudflare R2**

---

## Image Optimization

### Strategies for Fast Image Loading

#### 1. Client-Side Compression Before Upload

```typescript
import imageCompression from 'browser-image-compression';

async function compressAndUpload(file: File) {
  const options = {
    maxSizeMB: 1,              // Max 1MB
    maxWidthOrHeight: 1920,    // Max dimension
    useWebWorker: true,
  };
  
  const compressedFile = await imageCompression(file, options);
  return uploadImage(compressedFile);
}
```

#### 2. Next.js Image Component

```tsx
import Image from 'next/image';

// Automatic optimization, lazy loading, responsive images
<Image
  src={question.images[0]}
  alt={question.title}
  width={800}
  height={600}
  placeholder="blur"
  blurDataURL={question.blurHash}
/>
```

#### 3. Cloudflare Image Resizing (R2 + Images)

```typescript
// Request transformed image
const thumbnailUrl = `${R2_PUBLIC_URL}/${key}?width=300&height=200&fit=cover`;
```

### Recommended Image Pipeline

```
User uploads photo
       │
       ▼
┌─────────────────────┐
│ Client: Compress    │  → Max 1MB, max 1920px
│ (browser-image-     │
│  compression)       │
└─────────────────────┘
       │
       ▼
┌─────────────────────┐
│ Upload to R2        │  → Presigned URL, direct upload
└─────────────────────┘
       │
       ▼
┌─────────────────────┐
│ View: Next.js Image │  → Lazy load, responsive, CDN
└─────────────────────┘
```

---

## Implementation Details

### Environment Variables

```env
# Cloudflare R2 Configuration
R2_ENDPOINT=https://<account_id>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your_access_key_id
R2_SECRET_ACCESS_KEY=your_secret_access_key
R2_BUCKET_NAME=qapp-images
R2_PUBLIC_URL=https://images.qapp.example.com  # Custom domain or R2.dev URL
```

### R2 Bucket Setup

1. Create Cloudflare account (free)
2. Navigate to R2 in dashboard
3. Create bucket: `qapp-images`
4. Enable public access (for image viewing)
5. Generate API tokens with read/write access
6. (Optional) Connect custom domain

### CORS Configuration for R2

```json
[
  {
    "AllowedOrigins": ["https://your-app.vercel.app", "http://localhost:3000"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

### Database Schema for Images

```typescript
// packages/database/src/schema.ts
import { pgTable, text, timestamp, integer } from 'drizzle-orm/pg-core';

export const questions = pgTable('questions', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  courseCode: text('course_code').notNull(),
  courseName: text('course_name').notNull(),
  level: integer('level').notNull(),
  year: integer('year').notNull(),
  semester: text('semester').notNull(),
  hashtags: text('hashtags').array().default([]),
  images: text('images').array().notNull(),  // Array of R2 URLs
  authorId: text('author_id').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
```

### Complete Upload Flow

```typescript
// 1. Upload component (simplified)
export function UploadForm() {
  const [images, setImages] = useState<string[]>([]);
  
  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    
    const uploadedUrls = await Promise.all(
      files.map(async (file) => {
        // Compress
        const compressed = await compressImage(file);
        
        // Get presigned URL
        const { presignedUrl, publicUrl } = await fetch('/api/upload/presign', {
          method: 'POST',
          body: JSON.stringify({
            filename: file.name,
            contentType: file.type,
          }),
        }).then(r => r.json());
        
        // Upload to R2
        await fetch(presignedUrl, {
          method: 'PUT',
          body: compressed,
          headers: { 'Content-Type': file.type },
        });
        
        return publicUrl;
      })
    );
    
    setImages(prev => [...prev, ...uploadedUrls]);
  }
  
  async function handleSubmit(formData: FormData) {
    await fetch('/api/questions', {
      method: 'POST',
      body: JSON.stringify({
        ...Object.fromEntries(formData),
        images,
      }),
    });
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <input type="file" multiple accept="image/*" onChange={handleFileSelect} />
      {/* ... other form fields ... */}
    </form>
  );
}
```

---

## Final Recommendation

### Selected Stack

| Component | Choice | Rationale |
|-----------|--------|-----------|
| **Storage Provider** | Cloudflare R2 | Zero egress, 10GB free, CDN included |
| **Upload Strategy** | Presigned URLs | Scalable, no server bottleneck |
| **Image Compression** | browser-image-compression | Client-side, reduces upload size |
| **Image Display** | Next.js Image | Optimization, lazy loading |

### Why This Wins for QApp

1. **Cost**: Effectively free at MVP scale (10GB storage, unlimited transfer)
2. **Performance**: Cloudflare's global CDN for fast image delivery
3. **Scalability**: Presigned URLs handle any upload volume
4. **Simplicity**: S3-compatible API means familiar patterns
5. **No Lock-in**: Can migrate to S3 if needed (same API)

### Implementation Priority

1. ✅ Set up Cloudflare R2 bucket
2. ✅ Implement presigned URL endpoint
3. ✅ Build upload component with compression
4. ✅ Configure CORS for R2
5. ✅ Set up custom domain (optional but recommended)

---

## Alternative Approaches (For Future Reference)

### Alternative 1: Supabase Storage

**When to consider:**
- Already using Supabase for everything
- Need tight integration with row-level security
- Simpler integration is priority over cost

**Implementation:**
```typescript
import { supabase } from '@/lib/supabase';

const { data, error } = await supabase.storage
  .from('questions')
  .upload(`${userId}/${filename}`, file);
```

---

### Alternative 2: AWS S3 + CloudFront

**When to consider:**
- Already in AWS ecosystem
- Need advanced features (lifecycle policies, versioning)
- Enterprise requirements

**Additional setup:**
- CloudFront distribution for CDN
- S3 bucket policy for CloudFront access
- Higher operational complexity

---

### Alternative 3: Self-Hosted (MinIO)

**When to consider:**
- Data sovereignty requirements
- On-premise deployment
- Maximum control

**Trade-offs:**
- Need to manage infrastructure
- Need separate CDN solution
- More operational overhead

---

### Alternative 4: Vercel Blob

**When to consider:**
- Want simplest possible integration
- Already on Vercel Pro/Enterprise
- Cost is not primary concern

**Pricing:** $0.25/GB storage, included bandwidth

---

## References

1. [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
2. [Cloudflare R2 Pricing](https://developers.cloudflare.com/r2/pricing/)
3. [AWS S3 Pricing](https://aws.amazon.com/s3/pricing/)
4. [AWS SDK v3 - S3 Presigned URLs](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/modules/_aws_sdk_s3_request_presigner.html)
5. [Supabase Storage](https://supabase.com/docs/guides/storage)
6. [UploadThing Documentation](https://uploadthing.com/docs)
7. [browser-image-compression](https://github.com/Donaldcwl/browser-image-compression)
8. [Next.js Image Optimization](https://nextjs.org/docs/pages/building-your-application/optimizing/images)

---

**Document Status**: Complete - MVP Approach Selected  
**Selected Storage**: Cloudflare R2  
**Selected Upload Strategy**: Presigned URLs with client-side compression  
**Next Action**: Review AUTHENTICATION_ANALYSIS.md for auth implementation details

