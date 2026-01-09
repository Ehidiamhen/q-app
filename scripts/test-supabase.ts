/**
 * Supabase Connection Test Script
 * Verifies database and auth configuration
 * 
 * Usage: pnpm test:supabase
 * 
 * Prerequisites:
 * - NEXT_PUBLIC_SUPABASE_URL set in .env.local
 * - SUPABASE_SECRET_KEY set in .env.local
 * - DATABASE_URL set in .env.local
 */

import { createClient } from '@supabase/supabase-js';
import postgres from 'postgres';

async function testSupabase() {
    console.log('🧪 Testing Supabase Connection...\n');

    // Check environment variables
    console.log('📋 Checking environment variables...');
    const requiredEnvVars = {
        'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL,
        'SUPABASE_SECRET_KEY': process.env.SUPABASE_SECRET_KEY,
        'DATABASE_URL': process.env.DATABASE_URL,
    };

    const missing = Object.entries(requiredEnvVars)
        .filter(([_, value]) => !value)
        .map(([key]) => key);

    if (missing.length > 0) {
        console.error('❌ Missing environment variables:');
        missing.forEach(key => console.error(`   - ${key}`));
        console.error('\n💡 Add them to .env.local (copy from .env.example)');
        process.exit(1);
    }

    console.log('✅ All environment variables present\n');

    // Test 1: Supabase Auth Connection
    console.log('🔐 Testing Supabase Auth...');
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SECRET_KEY!
        );

        const { data, error } = await supabase.auth.getSession();

        if (error) {
            throw error;
        }

        console.log('✅ Supabase Auth configured correctly\n');
    } catch (error) {
        console.error('❌ Supabase Auth connection failed:', error);
        process.exit(1);
    }

    // Test 2: Database Connection
    console.log('🗄️  Testing Database Connection...');
    let sql: ReturnType<typeof postgres> | null = null;

    try {
        sql = postgres(process.env.DATABASE_URL!, { max: 1 });

        // Test query
        const result = await sql`SELECT NOW() as current_time, version() as pg_version`;

        console.log('✅ Database connection successful');
        console.log(`   PostgreSQL version: ${result[0].pg_version.split(' ')[1]}`);
        console.log(`   Server time: ${result[0].current_time}\n`);
    } catch (error) {
        console.error('❌ Database connection failed:', error);
        process.exit(1);
    }

    // Test 3: Check if tables exist
    console.log('📊 Checking database tables...');
    try {
        const tables = await sql!`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'questions', 'reports')
      ORDER BY table_name
    `;

        const existingTables = tables.map(t => t.table_name);
        const expectedTables = ['users', 'questions', 'reports'];
        const missingTables = expectedTables.filter(t => !existingTables.includes(t));

        if (missingTables.length > 0) {
            console.warn('⚠️  Some tables are missing:');
            missingTables.forEach(t => console.warn(`   - ${t}`));
            console.warn('\n💡 Run migrations: pnpm db:migrate');
        } else {
            console.log('✅ All tables exist:');
            existingTables.forEach(t => console.log(`   ✓ ${t}`));
        }

        // Check row counts
        if (existingTables.length > 0) {
            console.log('\n📈 Row counts:');
            for (const table of existingTables) {
                const count = await sql!`SELECT COUNT(*) as count FROM ${sql!(table)}`;
                console.log(`   ${table}: ${count[0].count} rows`);
            }
        }

    } catch (error) {
        console.warn('⚠️  Could not check tables (this is okay if migrations not run yet)');
        console.warn('   Error:', error instanceof Error ? error.message : error);
    } finally {
        if (sql) {
            await sql.end();
        }
    }

    console.log('\n✅ Supabase connection test completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. If tables are missing: pnpm db:generate && pnpm db:migrate');
    console.log('   2. Configure Google OAuth in Supabase Dashboard');
    console.log('   3. Test R2 connection: pnpm test:r2');
}

// Run test
testSupabase().catch((error) => {
    console.error('\n❌ Test failed with unexpected error:', error);
    process.exit(1);
});

