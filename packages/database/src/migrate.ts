/**
 * Database Migration Runner
 * Applies generated SQL migrations to Supabase database
 * 
 * Usage: pnpm db:migrate
 * 
 * Reference: ARCHITECTURE_ANALYSIS.md lines 620-698
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

/**
 * Run all pending migrations
 */
async function runMigrations() {
    // Direct database URL for migrations
    const connectionString = process.env.DIRECT_DB_URL;

    if (!connectionString) {
        console.error('❌ DIRECT_DB_URL environment variable is not set');
        console.error('Get it from: Supabase Dashboard → Settings → Database → Connection string');
        process.exit(1);
    }

    console.log('🔄 Connecting to database...');

    // Create single connection for migrations (max: 1 prevents connection pool)
    const sql = postgres(connectionString, { max: 1 });
    const db = drizzle(sql);

    try {
        console.log('🚀 Running migrations...');

        await migrate(db, { migrationsFolder: './src/migrations' });

        console.log('✅ Migrations completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await sql.end();
        console.log('🔌 Database connection closed');
    }
}

// Run migrations if this file is executed directly
runMigrations().catch((error) => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
});

