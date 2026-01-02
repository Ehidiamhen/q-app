# QApp: Authentication & Authorization Analysis

**Document Version:** 1.0  
**Date:** January 1, 2026  
**Author:** System Architecture Analysis  
**Status:** Final - MVP Approach Selected

---

## Table of Contents

- [Executive Summary](#executive-summary)
- [Requirements Analysis](#requirements-analysis)
- [Authentication Approaches](#authentication-approaches)
  - [Approach 1: Anonymous Device Tokens](#approach-1-anonymous-device-tokens)
  - [Approach 2: Magic Link (Email)](#approach-2-magic-link-email)
  - [Approach 3: OAuth Social Login](#approach-3-oauth-social-login)
  - [Approach 4: Phone OTP](#approach-4-phone-otp)
  - [Approach 5: Hybrid Anonymous + Optional Account](#approach-5-hybrid-anonymous--optional-account)
- [Auth Provider Comparison](#auth-provider-comparison)
  - [Supabase Auth](#supabase-auth)
  - [NextAuth.js (Auth.js)](#nextauthjs-authjs)
  - [Clerk](#clerk)
  - [Firebase Auth](#firebase-auth)
- [Authorization Model](#authorization-model)
- [Security Considerations](#security-considerations)
- [Implementation Details](#implementation-details)
- [Final Recommendation](#final-recommendation)
- [Alternative Approaches (For Future Reference)](#alternative-approaches-for-future-reference)
- [References](#references)

---

## Executive Summary

This document analyzes authentication approaches for QApp, balancing the requirement for **frictionless browsing** with **accountability for contributions**. After evaluating multiple approaches:

**Selected Approach:**
- **Anonymous Access**: Read-only (browse and search) - no authentication required
- **Google OAuth**: Required for uploads and future features (likes, saves, comments)
- **Auth Provider**: Supabase Auth with Google OAuth (integrated with database, generous free tier)
- **User Profiles**: Automatic creation on first Google login with editable display names

**Key Rationale**: Zero friction for discovery (anonymous browsing), with streamlined Google OAuth for any contributions. This creates accountability for uploaded content while keeping the entry barrier low for casual users.

---

## Requirements Analysis

### User Experience Requirements

| Requirement | Priority | Notes |
|-------------|----------|-------|
| Zero-friction browsing | 🔴 Critical | No signup wall for viewing content |
| Simple auth for uploads | 🔴 Critical | Google OAuth - one click |
| Contribution tracking | 🔴 Critical | Users see their uploads on profile |
| User attribution | 🔴 Critical | Show uploader on question cards |
| Abuse prevention | 🔴 Critical | Authentic accounts for accountability |
| Account recovery | 🔴 Critical | Google handles recovery |

### Security Requirements

| Requirement | Priority | Notes |
|-------------|----------|-------|
| Prevent spam uploads | 🔴 Critical | Google OAuth + rate limiting |
| Content accountability | 🔴 Critical | Real Google accounts for uploads |
| Data protection | 🔴 Critical | Supabase Auth handles tokens securely |
| API protection | 🔴 Critical | Authenticated endpoints for writes |
| User privacy | 🔴 Critical | Email not publicly visible |

### The Friction-Security Tradeoff

```
High Friction                                              Low Friction
    │                                                           │
    ▼                                                           ▼
┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐
│ Email + │   │ Email   │   │ OAuth   │   │ Phone   │   │Anonymous│
│Password │   │ Verify  │   │ Social  │   │ OTP     │   │ Token   │
│ + 2FA   │   │ Only    │   │ Login   │   │         │   │         │
└─────────┘   └─────────┘   └─────────┘   └─────────┘   └─────────┘
    │             │             │             │             │
    ▼             ▼             ▼             ▼             ▼
  Most          High         Medium         Low          Zero
  Secure       Security      Security     Security     Initial
                                                      Friction
```

**Target for QApp**: 
- **Browse/Search**: Rightmost (zero friction, anonymous)
- **Upload/Contribute**: Middle-left (Google OAuth, low friction, secure)

---

## Authentication Approaches

### Approach 1: Anonymous Read-Only Access

#### How It Works

```
Any Visit:
┌──────────┐    Browse/Search Requests    ┌──────────┐
│  Client  │ ──────────────────────────► │  Server  │
│ (Browser)│                              │          │
└──────────┘                              └──────────┘
     │                                         │
     │    Returns public data (no auth)        │
     │ ◄───────────────────────────────────────┘
     
No Authentication Required:
- ✅ Browse question feed
- ✅ Search questions
- ✅ View question details
- ✅ View user profiles (public)

Authentication Required (triggers Google OAuth):
- ❌ Upload questions
- ❌ Like posts (future)
- ❌ Save/bookmark (future)
- ❌ Comment (future)
```

#### Implementation

```typescript
// API route protection - public routes
export async function GET(request: Request) {
  // No auth check - public data
  const questions = await db.select()
    .from(questions)
    .orderBy(desc(questions.createdAt))
    .limit(20);
  
  return Response.json({ questions });
}
```

```typescript
// API route protection - authenticated routes
export async function POST(request: Request) {
  // Get user from Supabase session
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return Response.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }
  
  // User is authenticated, proceed with upload
  const userId = session.user.id;
  // ... upload logic
}
```

#### Pros

- ✅ **Zero friction for discovery**: Instant access to content
- ✅ **Simple implementation**: No anonymous token management
- ✅ **Clear boundaries**: Auth required only for contributions
- ✅ **SEO-friendly**: Public content indexable
- ✅ **Lower server costs**: No anonymous user records

#### Cons

- ❌ **Can't track anonymous users**: No analytics on browsers
- ❌ **No personalization**: Can't save preferences without login
- ❌ **Conversion required**: Must sign in to contribute

#### Best For

- ✅ **Content discovery platforms** (like QApp)
- ✅ **Public-first applications**
- ✅ **Social accountability desired**

---

### Approach 2: Magic Link (Email)

#### How It Works

```
1. User enters email
2. Server sends email with login link (contains token)
3. User clicks link
4. Server validates token, creates session
5. User is logged in (no password ever)
```

```typescript
// Request magic link
const { error } = await supabase.auth.signInWithOtp({
  email: 'user@example.com',
  options: {
    emailRedirectTo: 'https://qapp.com/auth/callback',
  },
});

// User clicks link, handled by callback
const { data, error } = await supabase.auth.exchangeCodeForSession(code);
```

#### Pros

- ✅ **No password to remember**: Just email
- ✅ **Secure**: Token expires, email verifies identity
- ✅ **Cross-device sync**: Same email = same account
- ✅ **Account recovery**: Email is the recovery method
- ✅ **Familiar pattern**: Many apps use this

#### Cons

- ❌ **Friction**: Must enter email, check inbox, click link
- ❌ **Email dependency**: Must have access to email
- ❌ **Delayed access**: Wait for email delivery
- ❌ **Spam folder issues**: Links may get filtered
- ❌ **Requires email service**: Cost at scale

---

### Approach 3: OAuth Social Login

#### How It Works

```
1. User clicks "Sign in with Google"
2. Redirect to Google OAuth
3. User authorizes
4. Redirect back with auth code
5. Exchange code for tokens
6. User is logged in
```

```typescript
// Supabase OAuth
const { error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: 'https://qapp.com/auth/callback',
  },
});
```

#### Available Providers

| Provider | Ease of Setup | User Base | Notes |
|----------|---------------|-----------|-------|
| Google | ⭐⭐⭐⭐⭐ | Universal | Most common, trusted |
| GitHub | ⭐⭐⭐⭐⭐ | Developers | Great for dev audience |
| Apple | ⭐⭐⭐ | iOS users | Required for iOS apps |
| Facebook | ⭐⭐⭐ | General | Privacy concerns |
| Twitter/X | ⭐⭐⭐ | Social | API instability |

#### Pros

- ✅ **Quick signup**: 2 clicks if already logged into provider
- ✅ **No password management**: Provider handles security
- ✅ **Verified identity**: Email usually verified
- ✅ **Cross-device sync**: Provider account = app account
- ✅ **Rich profile data**: Name, avatar available

#### Cons

- ❌ **Provider dependency**: If provider is down, users can't login
- ❌ **Privacy concerns**: "Sign in with Google" feels invasive to some
- ❌ **Not truly anonymous**: Identity linked to social account
- ❌ **Setup complexity**: OAuth app registration per provider
- ❌ **Redirect flow**: Briefly leaves your app

---

### Approach 4: Phone OTP

#### How It Works

```
1. User enters phone number
2. Server sends SMS with 6-digit code
3. User enters code
4. Server validates, creates session
```

```typescript
// Send OTP
const { error } = await supabase.auth.signInWithOtp({
  phone: '+1234567890',
});

// Verify OTP
const { data, error } = await supabase.auth.verifyOtp({
  phone: '+1234567890',
  token: '123456',
  type: 'sms',
});
```

#### Pros

- ✅ **Quick verification**: 6 digits to type
- ✅ **No password**: Phone number is identity
- ✅ **Familiar pattern**: Banking apps use this
- ✅ **Strong identity**: Phone numbers are harder to fake

#### Cons

- ❌ **SMS costs money**: $0.01-0.05 per SMS (Twilio)
- ❌ **International complexity**: Country codes, formatting
- ❌ **Delivery delays**: SMS can be slow
- ❌ **Phone access required**: Not everyone has phone at hand
- ❌ **Privacy concerns**: Phone number is sensitive PII

---

### Approach 5: Google OAuth for Contributions (SELECTED)

#### How It Works

```
Browse/Search (No Auth):
┌──────────┐    Public API Requests    ┌──────────┐
│  Client  │ ──────────────────────────►│  Server  │
│ (Browser)│◄──────────────────────────│          │
└──────────┘    Returns public data     └──────────┘

Upload/Contribute (Auth Required):
┌──────────┐  1. Click "Upload"         ┌──────────┐
│  Client  │ ──────────────────────────►│  Server  │
│          │                             │          │
│          │  2. Redirect to Google      │          │
│          │◄────────────────────────────│          │
└──────────┘                             └──────────┘
     │
     ▼
┌──────────────────────┐
│   Google OAuth       │
│   User authorizes    │
└──────────┬───────────┘
           │
           ▼
┌──────────┐  3. Callback with token   ┌──────────┐
│  Client  │────────────────────────────►│  Server  │
│          │                             │          │
│          │  4. Create/Get user profile │          │
│          │     - Save email, name      │          │
│          │     - Save avatar URL       │          │
│          │     - Create session        │          │
│          │◄────────────────────────────│          │
│          │  5. Return to upload page   │          │
└──────────┘                             └──────────┘
```

#### Implementation

```typescript
// Supabase Auth with Google OAuth
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Client-side: Trigger Google OAuth
export async function signInWithGoogle() {
  const supabase = createClientComponentClient();
  
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });
  
  if (error) throw error;
}

// Server-side: Handle callback and create user profile
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  
  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    await supabase.auth.exchangeCodeForSession(code);
    
    // Get user data from Google
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      // Create or update user profile
      const { user } = session;
      
      await db.insert(users).values({
        id: user.id,
        email: user.email!,
        displayName: user.user_metadata.full_name || user.email!.split('@')[0],
        avatarUrl: user.user_metadata.avatar_url,
        provider: 'google',
      }).onConflictDoUpdate({
        target: users.id,
        set: {
          email: user.email!,
          avatarUrl: user.user_metadata.avatar_url,
        },
      });
    }
  }
  
  return NextResponse.redirect(new URL('/upload', request.url));
}
```

```typescript
// Protected API route example
export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return Response.json(
      { error: 'Sign in with Google to upload' },
      { status: 401 }
    );
  }
  
  // User is authenticated
  const userId = session.user.id;
  const body = await request.json();
  
  const question = await db.insert(questions).values({
    ...body,
    authorId: userId,
  }).returning();
  
  return Response.json({ question });
}
```

#### Pros

- ✅ **Simple auth flow**: One-click Google signin
- ✅ **Accountability**: Real Google accounts for uploads
- ✅ **User attribution**: Show uploader names on posts
- ✅ **Profile data**: Email, name, avatar from Google
- ✅ **Account recovery**: Google handles it
- ✅ **Cross-device**: Works anywhere user signs in
- ✅ **Spam prevention**: Harder to create fake accounts
- ✅ **Free tier generous**: Supabase 50k MAU

#### Cons

- ❌ **Google dependency**: If Google OAuth is down, can't upload
- ❌ **Friction for contributions**: Must sign in to upload
- ❌ **Email required**: Google accounts have email (acceptable)
- ❌ **Not truly anonymous**: But that's the goal (accountability)

#### Best For

- ✅ **Social platforms** where attribution matters
- ✅ **User-generated content** requiring accountability
- ✅ **Apps prioritizing quality** over quantity

---

### Authentication Approach Comparison

| Approach | Browse Friction | Upload Friction | Security | Accountability | Cost |
|----------|-----------------|-----------------|----------|----------------|------|
| Anonymous Token | ⭐⭐⭐⭐⭐ None | ⭐⭐⭐⭐⭐ None | ⭐⭐ Basic | ❌ Low | Free |
| Magic Link | ⭐⭐⭐⭐⭐ None | ⭐⭐⭐ Medium | ⭐⭐⭐⭐ Good | ✅ Medium | ~$0.001/email |
| **Google OAuth (Selected)** | ⭐⭐⭐⭐⭐ None | ⭐⭐⭐⭐ Low | ⭐⭐⭐⭐⭐ Best | ✅ High | Free |
| Phone OTP | ⭐⭐⭐⭐⭐ None | ⭐⭐⭐ Medium | ⭐⭐⭐⭐ Good | ✅ High | ~$0.01/SMS |

**Recommendation for QApp MVP**: **Google OAuth for Contributions (Approach 5)**

**Why This Wins:**
- Zero friction for discovery (anonymous browse/search)
- Low friction for contributions (one-click Google signin)
- High accountability (real Google accounts)
- User attribution for social features (show uploader on posts)
- Foundation for future social features (likes, follows, comments)

---

## Auth Provider Comparison

### Supabase Auth

**Overview**: Built into Supabase, works seamlessly with Supabase database.

#### Free Tier
- 50,000 monthly active users
- Unlimited OAuth logins
- Email auth included
- No SMS free tier (need Twilio)

#### Pros

- ✅ **Integrated with Supabase DB**: Same service, simpler setup
- ✅ **Generous free tier**: 50k MAU is plenty for MVP
- ✅ **Row Level Security**: Auth integrated with data access
- ✅ **Multiple providers**: Google, GitHub, email, phone
- ✅ **Built-in UI components**: Pre-built auth forms

#### Cons

- ❌ **Tied to Supabase**: Less portable than standalone auth
- ❌ **Limited customization**: UI components less flexible
- ❌ **No passwordless with anonymous**: Need custom implementation

#### When to Use

- ✅ Already using Supabase for database
- ✅ Want simplest possible setup
- ✅ Need OAuth + email auth

---

### NextAuth.js (Auth.js)

**Overview**: The most popular auth library for Next.js. Self-hosted.

#### Pricing
- Free (open source)
- You pay for database hosting

#### Pros

- ✅ **Free and open source**: No per-user costs
- ✅ **Next.js native**: Perfect integration
- ✅ **Many providers**: 50+ OAuth providers
- ✅ **Database adapters**: Works with any database
- ✅ **Full control**: Customize everything

#### Cons

- ❌ **Setup complexity**: More configuration than managed services
- ❌ **Self-maintained**: You handle updates, security patches
- ❌ **Email requires service**: Need Resend/SendGrid for magic links
- ❌ **No built-in UI**: Build your own forms

#### When to Use

- ✅ Want maximum control and flexibility
- ✅ Don't want per-user pricing
- ✅ Comfortable with more setup

---

### Clerk

**Overview**: Modern auth platform with excellent developer experience.

#### Pricing
- Free: 10,000 MAU
- Pro: $0.02/MAU after free tier

#### Pros

- ✅ **Best developer experience**: Beautiful, drop-in components
- ✅ **Pre-built UI**: Sign-in, sign-up, user profile
- ✅ **Modern features**: MFA, organizations, impersonation
- ✅ **Webhooks**: Sync users to your database
- ✅ **Edge-ready**: Works with edge runtimes

#### Cons

- ❌ **Costs at scale**: $0.02/MAU adds up
- ❌ **Vendor lock-in**: Harder to migrate away
- ❌ **Overkill for MVP**: Many features you won't use
- ❌ **No anonymous auth**: Need custom implementation

#### When to Use

- ✅ Want polished auth with minimal code
- ✅ Budget allows for SaaS auth
- ✅ Need advanced features (organizations, MFA)

---

### Firebase Auth

**Overview**: Google's auth service, part of Firebase platform.

#### Pricing
- Free: 50,000 MAU (phone: 10k/month)
- Pay-as-you-go after

#### Pros

- ✅ **Generous free tier**: 50k MAU free
- ✅ **Anonymous auth built-in**: Native support!
- ✅ **Phone auth included**: 10k free SMS/month
- ✅ **Google ecosystem**: Works with other Firebase services
- ✅ **Reliable**: Google infrastructure

#### Cons

- ❌ **Firebase SDK size**: Larger bundle
- ❌ **Google lock-in**: Tied to Firebase ecosystem
- ❌ **Not Supabase-integrated**: Separate from your database
- ❌ **Firestore push**: Firebase nudges you toward Firestore

#### When to Use

- ✅ Need built-in anonymous auth
- ✅ Want free phone OTP
- ✅ Using Firebase for other services

---

### Auth Provider Comparison Table

| Provider | Free Tier | Anonymous Auth | OAuth | Email | Phone | DX |
|----------|-----------|----------------|-------|-------|-------|-----|
| **Supabase Auth** | 50k MAU | ⚠️ Custom | ✅ | ✅ | 💰 Paid | ⭐⭐⭐⭐ |
| NextAuth.js | Unlimited | ⚠️ Custom | ✅ | ✅ | ⚠️ Custom | ⭐⭐⭐ |
| Clerk | 10k MAU | ⚠️ Custom | ✅ | ✅ | ✅ | ⭐⭐⭐⭐⭐ |
| Firebase Auth | 50k MAU | ✅ Native | ✅ | ✅ | ✅ 10k free | ⭐⭐⭐⭐ |

**Recommendation for QApp MVP**: **Supabase Auth** (if using Supabase DB) or **Custom JWT + NextAuth.js** (for maximum control)

Given we're using Supabase for database, **Supabase Auth** provides the simplest integration with our existing stack.

---

## Authorization Model

### User Roles (MVP)

For MVP, we have two clear authorization levels:

```typescript
// Anonymous (not signed in)
interface AnonymousUser {
  authenticated: false;
}

// Authenticated (signed in with Google)
interface AuthenticatedUser {
  authenticated: true;
  user: {
    id: string;
    email: string;
    displayName: string;
    avatarUrl: string | null;
  };
}

// Permissions Matrix
const permissions = {
  // Public (no auth required)
  browse: { anonymous: true, authenticated: true },
  search: { anonymous: true, authenticated: true },
  viewQuestions: { anonymous: true, authenticated: true },
  viewProfiles: { anonymous: true, authenticated: true },
  
  // Authenticated only
  upload: { anonymous: false, authenticated: true },
  editOwnQuestions: { anonymous: false, authenticated: true },
  deleteOwnQuestions: { anonymous: false, authenticated: true },
  updateOwnProfile: { anonymous: false, authenticated: true },
  
  // Future (V2) - authenticated only
  likeQuestions: { anonymous: false, authenticated: true },
  saveBookmarks: { anonymous: false, authenticated: true },
  comment: { anonymous: false, authenticated: true },
  
  // Admin only (future)
  deleteAnyQuestion: { anonymous: false, authenticated: 'admin' },
  banUsers: { anonymous: false, authenticated: 'admin' },
};
```

### Rate Limiting

```typescript
// Prevent abuse without requiring login
const rateLimits = {
  // Per device/user
  uploads: { max: 10, window: '1h' },      // 10 uploads per hour
  searchRequests: { max: 100, window: '1m' }, // 100 searches per minute
  
  // Global
  globalUploads: { max: 100, window: '1h' },  // Circuit breaker
};

// Implementation with Upstash Redis
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 h'),
  analytics: true,
});

async function checkUploadLimit(userId: string) {
  const { success, remaining } = await ratelimit.limit(userId);
  if (!success) {
    throw new Error('Upload limit exceeded. Try again later.');
  }
  return remaining;
}
```

### Row Level Security (Supabase)

```sql
-- Questions table policies
-- Anyone can read questions (including anonymous)
CREATE POLICY "Questions are viewable by everyone" ON questions
  FOR SELECT USING (true);

-- Only authenticated users can insert questions
CREATE POLICY "Authenticated users can insert questions" ON questions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = author_id);

-- Users can only update their own questions
CREATE POLICY "Users can update own questions" ON questions
  FOR UPDATE USING (auth.uid() = author_id);

-- Users can only delete their own questions
CREATE POLICY "Users can delete own questions" ON questions
  FOR DELETE USING (auth.uid() = author_id);

-- Users table policies
-- User profiles are publicly readable
CREATE POLICY "Profiles are viewable by everyone" ON users
  FOR SELECT USING (true);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);
```

---

## Security Considerations

### Token Security

```typescript
// JWT best practices
const tokenConfig = {
  algorithm: 'HS256',
  expiresIn: '7d',           // Reasonable expiry
  issuer: 'qapp',
  audience: 'qapp-users',
};

// Secure token storage (client)
// ❌ Don't: Store in localStorage (XSS vulnerable)
// ✅ Do: Use httpOnly cookies when possible

// For anonymous tokens, localStorage is acceptable tradeoff
// because there's no sensitive data to protect
```

### Input Validation

```typescript
// Validate all auth inputs
import { z } from 'zod';

const emailSchema = z.string().email();
const deviceIdSchema = z.string().min(10).max(50);
const otpSchema = z.string().length(6).regex(/^\d+$/);

// Example validation
async function validateMagicLink(email: string) {
  const result = emailSchema.safeParse(email);
  if (!result.success) {
    throw new Error('Invalid email format');
  }
  return result.data;
}
```

### Abuse Prevention

```typescript
// Strategies for preventing abuse without heavy auth

// 1. Rate limiting (already covered)
// 2. Content moderation queue
// 3. Report functionality
// 4. Device fingerprinting for ban evasion

// Simple report system
export const reports = pgTable('reports', {
  id: text('id').primaryKey(),
  questionId: text('question_id').references(() => questions.id),
  reporterId: text('reporter_id'),  // Device ID of reporter
  reason: text('reason'),
  status: text('status').default('pending'),  // pending, reviewed, dismissed
  createdAt: timestamp('created_at').defaultNow(),
});
```

---

## Implementation Details

### Recommended Implementation: Supabase Auth with Google OAuth

```typescript
// lib/auth/index.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

const supabase = createClientComponentClient();

// Client-side: Check if user is authenticated
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return null;
  }
  
  // Fetch user profile from database
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single();
  
  return {
    id: session.user.id,
    email: session.user.email!,
    displayName: profile?.display_name || session.user.user_metadata.full_name,
    avatarUrl: profile?.avatar_url || session.user.user_metadata.avatar_url,
  };
}

// Client-side: Sign in with Google
export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });
  
  if (error) throw error;
}

// Client-side: Sign out
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// Client-side: Update display name
export async function updateDisplayName(displayName: string) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');
  
  const { error } = await supabase
    .from('users')
    .update({ display_name: displayName })
    .eq('id', session.user.id);
  
  if (error) throw error;
}
```

### Auth Callback Handler

```typescript
// app/auth/callback/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  
  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    await supabase.auth.exchangeCodeForSession(code);
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      const { user } = session;
      
      // Create or update user profile in database
      await db.insert(users).values({
        id: user.id,
        email: user.email!,
        displayName: user.user_metadata.full_name || user.email!.split('@')[0],
        avatarUrl: user.user_metadata.avatar_url || null,
        provider: 'google',
      }).onConflictDoUpdate({
        target: users.id,
        set: {
          email: user.email!,
          // Update avatar URL in case it changed
          avatarUrl: user.user_metadata.avatar_url || null,
        },
      });
    }
  }
  
  // Redirect to upload page or wherever user was going
  return NextResponse.redirect(new URL('/', request.url));
}
```

### Protected API Route Middleware

```typescript
// lib/auth/middleware.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function requireAuth() {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('Authentication required');
  }
  
  return {
    userId: session.user.id,
    email: session.user.email!,
  };
}

// Usage in API routes
export async function POST(request: Request) {
  try {
    const { userId } = await requireAuth();
    
    // User is authenticated, proceed
    const body = await request.json();
    const question = await db.insert(questions).values({
      ...body,
      authorId: userId,
    }).returning();
    
    return Response.json({ question });
  } catch (error) {
    return Response.json(
      { error: 'Please sign in to upload' },
      { status: 401 }
    );
  }
}
```

### Auth Context Provider

```typescript
// providers/auth-provider.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { User } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateDisplayName: (name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClientComponentClient();
  
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        loadUserProfile(session.user.id);
      } else {
        setIsLoading(false);
      }
    });
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          await loadUserProfile(session.user.id);
        } else {
          setUser(null);
        }
      }
    );
    
    return () => subscription.unsubscribe();
  }, []);
  
  async function loadUserProfile(userId: string) {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (data) {
      setUser({
        id: data.id,
        email: data.email,
        displayName: data.display_name,
        avatarUrl: data.avatar_url,
      });
    }
    setIsLoading(false);
  }
  
  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }
  
  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
  }
  
  async function updateDisplayName(displayName: string) {
    if (!user) throw new Error('Not authenticated');
    
    await supabase
      .from('users')
      .update({ display_name: displayName })
      .eq('id', user.id);
    
    setUser({ ...user, displayName });
  }
  
  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      signInWithGoogle,
      signOut,
      updateDisplayName,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
```

### Usage in Components

```typescript
// Example: Upload page - check authentication
'use client';

export function UploadPage() {
  const { user, isLoading, signInWithGoogle } = useAuth();
  
  if (isLoading) return <Spinner />;
  
  // User not authenticated - show sign in prompt
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-2xl font-bold mb-4">Sign in to Upload</h2>
        <p className="text-muted-foreground mb-6">
          Sign in with Google to share question papers
        </p>
        <Button onClick={signInWithGoogle}>
          <GoogleIcon className="mr-2" />
          Sign in with Google
        </Button>
      </div>
    );
  }
  
  // User authenticated - show upload form
  return (
    <div>
      <h1>Upload Question Paper</h1>
      <UploadForm userId={user.id} />
    </div>
  );
}
```

```typescript
// Example: Show upload button with auth check
export function UploadButton() {
  const { user, signInWithGoogle } = useAuth();
  const router = useRouter();
  
  function handleClick() {
    if (!user) {
      // Not signed in - trigger Google OAuth
      signInWithGoogle();
    } else {
      // Signed in - go to upload page
      router.push('/upload');
    }
  }
  
  return (
    <Button onClick={handleClick}>
      {user ? 'Upload Question Paper' : 'Sign in to Upload'}
    </Button>
  );
}
```

---

## Final Recommendation

### Selected Approach

| Component | Choice | Rationale |
|-----------|--------|-----------|
| **Browse/Search** | No authentication | Zero friction for discovery |
| **Upload/Contribute** | Google OAuth (required) | Accountability + user attribution |
| **Auth Provider** | Supabase Auth | Integrated with database, generous free tier |
| **User Profiles** | Automatic creation | Display name editable, avatar from Google |
| **Rate Limiting** | Upstash Redis | Additional spam prevention |
| **Session Storage** | httpOnly cookies (Supabase) | Secure, cross-domain compatible |

### User Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    BROWSE (NO AUTH REQUIRED)                     │
│                                                                  │
│  1. User lands on QApp                                          │
│  2. Immediately browse question feed                             │
│  3. Search for specific courses                                  │
│  4. View question details                                        │
│  5. View uploader profiles                                       │
│                                                                  │
│  NO SIGNUP WALL FOR VIEWING! 🎉                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  UPLOAD (AUTH REQUIRED)                          │
│                                                                  │
│  User clicks "Upload Question Paper"                             │
│                                                                  │
│  Not signed in? Show modal:                                      │
│  ┌───────────────────────────────────────────────┐              │
│  │ Sign in to Upload                             │              │
│  │                                               │              │
│  │ [🔵 Continue with Google]                    │              │
│  │                                               │              │
│  │ Share question papers with your classmates    │              │
│  └───────────────────────────────────────────────┘              │
│                                                                  │
│  After Google OAuth:                                             │
│  - Profile created automatically (name, avatar from Google)      │
│  - Redirected to upload page                                     │
│  - All uploads attributed to user profile                        │
└─────────────────────────────────────────────────────────────────┘
```

### User Profile Flow

```
On First Login (Google OAuth):
1. User authorizes Google
2. Backend receives: email, name, avatar URL
3. Create user profile:
   - email: user@example.com
   - displayName: "John Doe" (from Google)
   - avatarUrl: https://lh3.googleusercontent.com/...
4. User can edit display name anytime in settings

User Profile Display:
- Question cards show: [Avatar] DisplayName
- Profile page shows: Avatar, DisplayName, Joined date, Upload count
- Other users can click to view public profile
```

### Why This Wins for QApp

1. **Zero friction for discovery**: Anyone can browse without signup
2. **Simple auth when needed**: One-click Google signin
3. **Social accountability**: Real names/avatars on uploads
4. **User attribution**: Know who contributed what
5. **Foundation for V2**: Profiles ready for likes, follows, etc.
6. **Spam prevention**: Real Google accounts + rate limiting
7. **Better UX**: Social context makes content more trustworthy

---

## Alternative Approaches (For Future Reference)

### Alternative 1: Require Email from Start

**When to consider:**
- Need to contact users (notifications)
- Spam becomes unmanageable
- Accountability is critical

**Implementation:**
- Remove anonymous flow
- Magic link or OAuth only
- Higher friction but more control

---

### Alternative 2: Phone OTP for Universities

**When to consider:**
- University provides phone numbers
- Want stronger identity verification
- Budget allows SMS costs

**Implementation:**
- Supabase Auth with Twilio
- Or Firebase Auth (10k free SMS/month)

---

### Alternative 3: University SSO (SAML/OIDC)

**When to consider:**
- University has identity provider
- Want to verify university membership
- Institutional deployment

**Implementation:**
- SAML integration with university IdP
- Or university OAuth if available

---

### Alternative 4: Clerk for Polish

**When to consider:**
- Want beautiful pre-built UI
- Budget allows $0.02/MAU
- Need advanced features (MFA, orgs)

**Trade-off:**
- Higher cost
- Better UX out of box

---

## References

1. [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
2. [NextAuth.js Documentation](https://next-auth.js.org/)
3. [Clerk Documentation](https://clerk.com/docs)
4. [Firebase Auth Documentation](https://firebase.google.com/docs/auth)
5. [JWT Best Practices](https://auth0.com/docs/secure/tokens/json-web-tokens/json-web-token-best-practices)
6. [Upstash Rate Limiting](https://upstash.com/docs/redis/sdks/ratelimit-ts/overview)
7. [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

---

**Document Status**: Complete - MVP Approach Selected  
**Selected Approach**: Anonymous device tokens + optional Supabase Auth upgrade  
**Auth Provider**: Supabase Auth  
**Next Action**: Review ENGAGEMENT_AND_FEATURES.md for feature prioritization

