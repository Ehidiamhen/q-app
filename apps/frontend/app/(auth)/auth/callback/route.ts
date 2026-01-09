/**
 * Google OAuth Callback Handler
 * Exchanges auth code for session and syncs user to database
 * 
 * Reference: DAY_2_3_IMPLEMENTATION_PLAN.md - OAuth callback
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { db, users } from '@qapp/database';
import { eq } from 'drizzle-orm';
import type { User } from '@supabase/supabase-js';

/**
 * Sync Supabase auth user to our database
 * Uses upsert to handle both new users and returning users
 */
async function syncUser(supabaseUser: User) {
    const userData = {
        id: supabaseUser.id,
        email: supabaseUser.email!,
        displayName:
            supabaseUser.user_metadata.full_name ||
            supabaseUser.user_metadata.name ||
            supabaseUser.email!.split('@')[0],
        avatarUrl: supabaseUser.user_metadata.avatar_url || null,
        provider: 'google',
    };

    // Upsert: Insert if new, update avatar if exists
    await db
        .insert(users)
        .values(userData)
        .onConflictDoUpdate({
            target: users.id,
            set: {
                avatarUrl: userData.avatarUrl,
                updatedAt: new Date(),
            },
        });

    console.log(`User synced: ${userData.email} (${userData.id})`);
}

/**
 * Handle OAuth callback from Google
 * GET /auth/callback?code=...
 */
export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const origin = requestUrl.origin;

    if (code) {
        try {
            const supabase = await createClient();

            // Exchange code for session
            const { data, error } = await supabase.auth.exchangeCodeForSession(code);

            if (error) {
                console.error('OAuth callback error:', error);
                return NextResponse.redirect(`${origin}/?error=auth_failed`);
            }

            if (data.user) {
                // Sync user to our database
                await syncUser(data.user);
            }

            // Successful auth - redirect to home
            return NextResponse.redirect(`${origin}/`);
        } catch (error) {
            console.error('Error syncing user:', error);
            return NextResponse.redirect(`${origin}/?error=sync_failed`);
        }
    }

    // No code provided - redirect to home
    return NextResponse.redirect(`${origin}/`);
}
