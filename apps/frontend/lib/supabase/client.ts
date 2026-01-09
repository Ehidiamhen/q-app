/**
 * Supabase Client (Client-Side)
 * Use in React components and client-side code
 * 
 * Uses @supabase/ssr for improved SSR support
 * Reference: https://supabase.com/docs/guides/auth/server-side/creating-a-client
 */

import { createBrowserClient } from '@supabase/ssr';

/**
 * Client-side Supabase client
 * Uses browser cookies for session management
 * Safe to use in React components and Client Components
 */
export function createClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

