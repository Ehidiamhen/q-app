/**
 * Database Client
 * Drizzle ORM client configured for PostgreSQL (Supabase)
 * Reference: ARCHITECTURE_ANALYSIS.md lines 620-698
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/index';

/**
 * Database connection URL from environment
 * Format: postgresql://user:password@host:port/database
 */
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error(
        'DATABASE_URL environment variable is not set. ' +
        'Get it from Supabase Dashboard → Settings → Database → Connection string'
    );
}

/**
 * PostgreSQL client (postgres.js)
 * Uses connection pooling for efficiency
 */
export const client = postgres(connectionString, { prepare: false });

/**
 * Drizzle ORM instance
 * Provides type-safe query builder
 */
export const db = drizzle(client, { schema });

/**
 * Export all schemas and types
 */
export * from './schema/index';

