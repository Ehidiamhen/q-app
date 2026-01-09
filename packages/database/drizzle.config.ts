/**
 * Drizzle Kit Configuration
 * Generates migrations from TypeScript schemas
 * Reference: ARCHITECTURE_ANALYSIS.md lines 620-698 (Drizzle ORM)
 */

import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    // Schema files location
    schema: './src/schema/index.ts',

    // Output directory for generated migrations
    out: './src/migrations',

    // Database dialect
    dialect: 'postgresql',

    // Database connection (from environment variable)
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },

    // Verbose logging during generation
    verbose: true,

    // Strict mode (fail on potential data loss)
    strict: true,
});

