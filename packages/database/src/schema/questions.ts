/**
 * Questions Table Schema
 * Reference: ENGAGEMENT_AND_FEATURES.md lines 556-587
 * 
 * Stores question paper metadata and image URLs (stored in Cloudflare R2).
 * Each question belongs to a user (authorId foreign key).
 */

import { pgTable, text, integer, timestamp, index } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';
import { users } from './users';

export const questions = pgTable('questions', {
    // Primary key - CUID2 (collision-resistant unique ID)
    id: text('id').primaryKey().$defaultFn(() => createId()),

    // Question paper metadata
    title: text('title').notNull(),
    courseCode: text('course_code').notNull(),
    courseName: text('course_name').notNull(),

    // Level: 100 (1st year), 200 (2nd year), etc.
    level: integer('level').notNull(),

    // Year and semester
    year: integer('year').notNull(),
    semester: text('semester').notNull(), // 'First', 'Second', 'LVS'

    // Optional hashtags for additional categorization
    hashtags: text('hashtags').array().default([]).notNull(),

    // Image URLs from Cloudflare R2 (1-10 images)
    images: text('images').array().notNull(),

    // Foreign key to users table (cascade delete: when user deleted, questions deleted)
    // Reference: ENGAGEMENT_AND_FEATURES.md lines 567
    authorId: text('author_id')
        .references(() => users.id, { onDelete: 'cascade' })
        .notNull(),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    // Indexes for common query patterns
    // Reference: ENGAGEMENT_AND_FEATURES.md lines 582-587

    // Search by course code (most common query)
    courseCodeIdx: index('questions_course_code_idx').on(table.courseCode),

    // Filter by level (100L, 200L, etc.)
    levelIdx: index('questions_level_idx').on(table.level),

    // Sort by newest first (feed display)
    createdAtIdx: index('questions_created_at_idx').on(table.createdAt),

    // User profile page showing their uploads
    authorIdx: index('questions_author_id_idx').on(table.authorId),
}));

/**
 * TypeScript types inferred from schema
 */
export type Question = typeof questions.$inferSelect;
export type NewQuestion = typeof questions.$inferInsert;

