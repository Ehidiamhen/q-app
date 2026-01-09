/**
 * Supabase Client (Server-Side)
 * Use in API routes, Server Components, and server actions
 * 
 * Uses @supabase/ssr for improved SSR support with proper cookie handling
 * Reference: https://supabase.com/docs/guides/auth/server-side/creating-a-client
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Server-side Supabase client
 * Uses Next.js cookies for session management
 * Use in:
 * - API routes (app/api/*\/route.ts)
 * - Server Components (async components)
 * - Server Actions
 */
export async function createClient() {
    const cookieStore = await cookies();

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        }
    );
}

/**
 * Get current session from server
 * Returns null if not authenticated
 */
export async function getSession() {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    return session;
}

/**
 * Get current user from server
 * Returns null if not authenticated
 */
export async function getUser() {
    const session = await getSession();
    return session?.user ?? null;
}

/**
 * Require authentication (throws if not authenticated)
 * Use in protected API routes
 */
export async function requireAuth() {
    const session = await getSession();

    if (!session) {
        throw new Error('Authentication required');
    }

    return {
        session,
        userId: session.user.id,
        user: session.user,
    };
}

