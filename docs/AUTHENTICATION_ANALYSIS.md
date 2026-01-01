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

This document analyzes authentication approaches for QApp, balancing the requirement for **frictionless, anonymous-feeling access** with **security and accountability**. After evaluating multiple approaches:

**Selected Approach:**
- **MVP Authentication**: Anonymous device tokens with optional account upgrade
- **Auth Provider**: Supabase Auth (integrated with database, generous free tier)
- **Upgrade Path**: Optional magic link email authentication for cross-device sync

**Key Rationale**: Maximum friction reduction for first use, with progressive account creation for users who want to track their contributions or sync across devices.

---

## Requirements Analysis

### User Experience Requirements

| Requirement | Priority | Notes |
|-------------|----------|-------|
| Zero-friction first use | 🔴 Critical | No signup wall before browsing/uploading |
| Cross-device sync | 🟡 Nice-to-have | Not required for MVP |
| Contribution tracking | 🟡 Nice-to-have | "Your uploads" feature |
| Abuse prevention | 🔴 Critical | Prevent spam/inappropriate content |
| Account recovery | 🟢 Low | Not critical if anonymous |

### Security Requirements

| Requirement | Priority | Notes |
|-------------|----------|-------|
| Prevent spam uploads | 🔴 Critical | Rate limiting, basic verification |
| Content accountability | 🟡 Medium | Ability to ban bad actors |
| Data protection | 🔴 Critical | Secure token storage |
| API protection | 🔴 Critical | Prevent unauthorized access |

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

**Target for QApp**: Right side (anonymous) with optional move left (account linking).

---

## Authentication Approaches

### Approach 1: Anonymous Device Tokens

#### How It Works

```
First Visit:
┌──────────┐     1. No token found     ┌──────────┐
│  Client  │ ────────────────────────► │  Server  │
│ (Browser)│                           │          │
└──────────┘                           └────┬─────┘
     │                                      │
     │                               2. Generate anonymous user
     │                                  + device token (JWT)
     │                                      │
     │       3. Return token               │
     │ ◄────────────────────────────────────┘
     │
     │       4. Store in localStorage
     ▼
┌──────────────────────┐
│ localStorage:        │
│ qapp_device_token=   │
│ eyJhbGciOiJIUzI1...  │
└──────────────────────┘

Subsequent Visits:
- Token found in localStorage
- Included in API requests
- Server validates and identifies user
```

#### Implementation

```typescript
// lib/auth/device-token.ts
import { SignJWT, jwtVerify } from 'jose';
import { nanoid } from 'nanoid';

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export async function createDeviceToken(deviceId: string) {
  const token = await new SignJWT({ deviceId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('365d')  // Long-lived for anonymous users
    .sign(secret);
  
  return token;
}

export async function verifyDeviceToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as { deviceId: string };
  } catch {
    return null;
  }
}

// Client-side initialization
export function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return '';
  
  let deviceId = localStorage.getItem('qapp_device_id');
  if (!deviceId) {
    deviceId = nanoid();
    localStorage.setItem('qapp_device_id', deviceId);
  }
  return deviceId;
}
```

```typescript
// API middleware
export async function withAuth(request: Request) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    // Create new anonymous user
    const deviceId = nanoid();
    const user = await db.insert(users).values({ deviceId }).returning();
    const newToken = await createDeviceToken(deviceId);
    return { user: user[0], token: newToken, isNew: true };
  }
  
  const payload = await verifyDeviceToken(token);
  if (!payload) {
    throw new Error('Invalid token');
  }
  
  const user = await db.select().from(users).where(eq(users.deviceId, payload.deviceId));
  return { user: user[0], token, isNew: false };
}
```

#### Pros

- ✅ **Zero friction**: No signup, no login, instant access
- ✅ **Simple implementation**: Just JWT + localStorage
- ✅ **Privacy-friendly**: No email/phone required
- ✅ **Works offline**: Token stored locally
- ✅ **Fast**: No external auth service calls

#### Cons

- ❌ **No account recovery**: Clear localStorage = lose identity
- ❌ **No cross-device sync**: Each device is separate user
- ❌ **Easier to abuse**: Can clear storage to bypass bans
- ❌ **No email for notifications**: Can't contact users

#### Best For

- ✅ MVP where friction reduction is priority
- ✅ Apps where identity persistence is nice-to-have
- ✅ Privacy-focused applications

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

### Approach 5: Hybrid Anonymous + Optional Account

#### How It Works

```
First Visit:
┌──────────────────────────────────────────┐
│ Anonymous device token created           │
│ User can browse, upload, search          │
│ All actions tied to device ID            │
└──────────────────────────────────────────┘

Later (Optional):
┌──────────────────────────────────────────┐
│ "Want to save your contributions?"       │
│ [Link Email] [Sign in with Google]       │
│                                          │
│ Device token linked to real account      │
│ Cross-device sync enabled                │
│ Account recovery available               │
└──────────────────────────────────────────┘
```

#### Implementation

```typescript
// Database schema supports both anonymous and linked accounts
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  deviceId: text('device_id').unique(),  // Anonymous identifier
  email: text('email').unique(),          // Optional: linked email
  provider: text('provider'),              // Optional: 'google', 'email', null
  displayName: text('display_name'),       // Optional
  isAnonymous: boolean('is_anonymous').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// Link anonymous account to email
export async function linkAccount(deviceId: string, email: string) {
  // Check if email already exists
  const existing = await db.select().from(users).where(eq(users.email, email));
  
  if (existing.length > 0) {
    // Merge: Transfer anonymous user's content to existing account
    await db.update(questions)
      .set({ authorId: existing[0].id })
      .where(eq(questions.authorId, deviceId));
    
    // Delete anonymous user
    await db.delete(users).where(eq(users.deviceId, deviceId));
    
    return existing[0];
  } else {
    // Upgrade: Add email to anonymous account
    const updated = await db.update(users)
      .set({ email, isAnonymous: false })
      .where(eq(users.deviceId, deviceId))
      .returning();
    
    return updated[0];
  }
}
```

#### Pros

- ✅ **Best of both worlds**: Zero friction start, optional upgrade
- ✅ **Progressive trust**: Users prove identity when they want to
- ✅ **No lost data**: Anonymous contributions preserved after linking
- ✅ **Flexible**: Users choose their comfort level
- ✅ **Incentivized upgrade**: "Save your uploads" motivation

#### Cons

- ❌ **Implementation complexity**: Two auth flows to maintain
- ❌ **Account merge logic**: Handling edge cases
- ❌ **UX design needed**: When/how to prompt for upgrade

---

### Authentication Approach Comparison

| Approach | Friction | Security | Cross-Device | Recovery | Cost |
|----------|----------|----------|--------------|----------|------|
| Anonymous Token | ⭐⭐⭐⭐⭐ None | ⭐⭐ Basic | ❌ No | ❌ No | Free |
| Magic Link | ⭐⭐⭐ Medium | ⭐⭐⭐⭐ Good | ✅ Yes | ✅ Yes | ~$0.001/email |
| OAuth Social | ⭐⭐⭐⭐ Low | ⭐⭐⭐⭐⭐ Best | ✅ Yes | ✅ Yes | Free |
| Phone OTP | ⭐⭐⭐ Medium | ⭐⭐⭐⭐ Good | ✅ Yes | ✅ Yes | ~$0.01/SMS |
| **Hybrid** | ⭐⭐⭐⭐⭐ None | ⭐⭐⭐⭐ Good | Optional | Optional | Varies |

**Recommendation for QApp MVP**: **Approach 5 - Hybrid Anonymous + Optional Account**

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

For MVP, we keep authorization simple:

```typescript
// Only two states that matter
interface AuthContext {
  user: {
    id: string;
    isAnonymous: boolean;
    deviceId: string;
    email?: string;
  } | null;
}

// Permissions
const permissions = {
  browse: true,           // Everyone can browse
  search: true,           // Everyone can search
  view: true,             // Everyone can view questions
  upload: true,           // Everyone can upload (with rate limits)
  editOwn: true,          // Users can edit their own uploads
  deleteOwn: true,        // Users can delete their own uploads
  deleteAny: false,       // Admin only (future)
  ban: false,             // Admin only (future)
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
-- Users can read all questions
CREATE POLICY "Questions are viewable by everyone" ON questions
  FOR SELECT USING (true);

-- Users can only insert their own questions
CREATE POLICY "Users can insert own questions" ON questions
  FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Users can only update their own questions
CREATE POLICY "Users can update own questions" ON questions
  FOR UPDATE USING (auth.uid() = author_id);

-- Users can only delete their own questions
CREATE POLICY "Users can delete own questions" ON questions
  FOR DELETE USING (auth.uid() = author_id);
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

### Recommended Implementation: Supabase Auth with Anonymous Fallback

```typescript
// lib/auth/index.ts
import { createClient } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Get or create user identity
export async function getOrCreateUser() {
  // Check for Supabase session first
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session) {
    return {
      id: session.user.id,
      email: session.user.email,
      isAnonymous: false,
      provider: session.user.app_metadata.provider,
    };
  }
  
  // Fall back to anonymous device token
  let deviceId = localStorage.getItem('qapp_device_id');
  
  if (!deviceId) {
    deviceId = nanoid();
    localStorage.setItem('qapp_device_id', deviceId);
    
    // Create anonymous user in database
    await supabase.from('users').insert({
      id: deviceId,
      device_id: deviceId,
      is_anonymous: true,
    });
  }
  
  return {
    id: deviceId,
    isAnonymous: true,
    deviceId,
  };
}

// Optional: Link anonymous account to email
export async function linkWithEmail(email: string) {
  const user = await getOrCreateUser();
  
  if (!user.isAnonymous) {
    throw new Error('Already linked to an account');
  }
  
  // Send magic link
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      data: { deviceId: user.deviceId },  // Pass device ID to merge
    },
  });
  
  if (error) throw error;
  
  return { message: 'Check your email for login link' };
}

// Handle auth callback (after magic link click)
export async function handleAuthCallback() {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error || !session) throw new Error('Auth failed');
  
  const deviceId = session.user.user_metadata.deviceId;
  
  if (deviceId) {
    // Merge anonymous account with new auth account
    await supabase.rpc('merge_anonymous_account', {
      anonymous_id: deviceId,
      auth_id: session.user.id,
    });
  }
  
  return session;
}
```

### Database Function for Account Merging

```sql
-- Supabase SQL function to merge anonymous account
CREATE OR REPLACE FUNCTION merge_anonymous_account(
  anonymous_id TEXT,
  auth_id UUID
) RETURNS void AS $$
BEGIN
  -- Transfer questions from anonymous to authenticated user
  UPDATE questions
  SET author_id = auth_id::TEXT
  WHERE author_id = anonymous_id;
  
  -- Delete anonymous user record
  DELETE FROM users WHERE device_id = anonymous_id;
  
  -- Update authenticated user to remove anonymous flag
  UPDATE users
  SET is_anonymous = false
  WHERE id = auth_id::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Auth Context Provider

```typescript
// providers/auth-provider.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { getOrCreateUser, type User } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  linkWithEmail: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    async function init() {
      try {
        const user = await getOrCreateUser();
        setUser(user);
      } catch (error) {
        console.error('Auth init failed:', error);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);
  
  return (
    <AuthContext.Provider value={{ user, isLoading, linkWithEmail, signOut }}>
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
// Example: Upload page
export function UploadPage() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return <Spinner />;
  
  return (
    <div>
      <UploadForm userId={user!.id} />
      
      {user?.isAnonymous && (
        <Card className="mt-4">
          <p>Want to save your uploads across devices?</p>
          <LinkAccountButton />
        </Card>
      )}
    </div>
  );
}
```

---

## Final Recommendation

### Selected Approach

| Component | Choice | Rationale |
|-----------|--------|-----------|
| **Primary Auth** | Anonymous device tokens | Zero friction, privacy-friendly |
| **Optional Upgrade** | Supabase Auth (magic link) | Cross-device sync when needed |
| **Auth Provider** | Supabase Auth | Integrated with database |
| **Rate Limiting** | Upstash Redis | Prevent abuse |
| **Session Storage** | localStorage (anonymous) / httpOnly cookie (linked) | Security appropriate to risk |

### User Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         FIRST VISIT                              │
│                                                                  │
│  1. User lands on QApp                                          │
│  2. Device ID generated automatically                            │
│  3. Anonymous user created in database                           │
│  4. User can immediately browse, search, upload                  │
│                                                                  │
│  NO SIGNUP WALL! 🎉                                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      LATER (OPTIONAL)                            │
│                                                                  │
│  User sees prompt: "Save your uploads across devices?"           │
│                                                                  │
│  [Link with Email]  [Sign in with Google]  [Maybe Later]        │
│                                                                  │
│  If linked:                                                      │
│  - Anonymous account merged with authenticated account           │
│  - All uploads preserved                                         │
│  - Cross-device sync enabled                                     │
└─────────────────────────────────────────────────────────────────┘
```

### Why This Wins for QApp

1. **Zero friction to start**: Students can use immediately
2. **Privacy by default**: No personal data required
3. **Opt-in identity**: Users choose when to share email
4. **Simple implementation**: Uses Supabase features we already have
5. **Abuse prevention**: Rate limiting handles bad actors
6. **Upgrade path**: Can add more auth methods later

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

