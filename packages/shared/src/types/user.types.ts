/**
 * User Type Definitions
 * Reference: ENGAGEMENT_AND_FEATURES.md lines 546-554 (database schema)
 * Reference: AUTHENTICATION_ANALYSIS.md lines 318-465 (Google OAuth)
 */

/**
 * Complete user record (matches database schema)
 */
export interface User {
  id: string; // UUID from Supabase auth.users.id
  email: string;
  displayName: string; // Editable by user
  avatarUrl: string | null; // From Google OAuth profile picture
  provider: string; // 'google' for MVP
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Public user profile (safe to expose to all users)
 * Excludes sensitive data like email
 * Reference: ENGAGEMENT_AND_FEATURES.md lines 597-613
 */
export interface PublicUserProfile {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt: Date;
  uploadCount?: number; // Number of questions uploaded
}

/**
 * User data from Google OAuth
 * Received during authentication callback
 */
export interface GoogleUserMetadata {
  full_name: string;
  avatar_url: string;
  email: string;
  email_verified: boolean;
  provider: 'google';
}

/**
 * Session user (authenticated state)
 * Used in auth context and protected routes
 */
export interface SessionUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
}

