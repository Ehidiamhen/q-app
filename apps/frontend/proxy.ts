/**
 * Next.js Middleware
 * Runs on every request before reaching the route
 * 
 * Used for: Supabase auth token refresh
 * Reference: AUTHENTICATION_ANALYSIS.md lines 922-962
 */

import { updateSession } from './lib/supabase/proxy';
import { NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
    return await updateSession(request);
}

/**
 * Configure which routes run middleware
 * Currently: Run on all routes (needed for auth session refresh)
 */
export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization)
         * - favicon.ico (favicon)
         * - public files (*.svg, *.png, etc.)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};

