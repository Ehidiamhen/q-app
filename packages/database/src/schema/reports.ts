/**
 * Reports Table Schema
 * Reference: ENGAGEMENT_AND_FEATURES.md lines 572-580
 * 
 * Content moderation: Users can report inappropriate question papers.
 * Admins review reports and take action (delete question, warn user, etc.).
 */

import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';
import { questions } from './questions';
import { users } from './users';

export const reports = pgTable('reports', {
    // Primary key - CUID2
    id: text('id').primaryKey().$defaultFn(() => createId()),

    // Question being reported (cascade delete: when question deleted, reports deleted)
    questionId: text('question_id')
        .references(() => questions.id, { onDelete: 'cascade' })
        .notNull(),

    // User who submitted the report
    reporterId: text('reporter_id')
        .references(() => users.id)
        .notNull(),

    // Reason for report
    reason: text('reason').notNull(),

    // Status: 'pending' (default), 'reviewed', 'resolved'
    status: text('status').default('pending').notNull(),

    // Timestamp
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

/**
 * TypeScript types inferred from schema
 */
export type Report = typeof reports.$inferSelect;
export type NewReport = typeof reports.$inferInsert;

