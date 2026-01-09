/**
 * Users Table Schema
 * Reference: ENGAGEMENT_AND_FEATURES.md lines 546-554
 * Reference: AUTHENTICATION_ANALYSIS.md lines 318-465 (Google OAuth)
 * 
 * User records are created automatically when users sign in with Google OAuth.
 * The id field matches Supabase auth.users.id (UUID).
 */

import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
    // Primary key - matches Supabase auth.users.id (UUID from Google OAuth)
    id: text('id').primaryKey(),

    // Email from Google OAuth (unique constraint)
    email: text('email').unique().notNull(),

    // Display name (editable by user, initially from Google profile)
    displayName: text('display_name').notNull(),

    // Avatar URL from Google profile picture (nullable if not provided)
    avatarUrl: text('avatar_url'),

    // Authentication provider (always 'google' for MVP)
    provider: text('provider').default('google').notNull(),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

/**
 * TypeScript types inferred from schema
 * Reference: Untrack INITIAL_FE_IMPLEMENTATION.md lines 194-276
 */
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

