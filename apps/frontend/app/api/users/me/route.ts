/**
 * Users API - Update Own Profile
 * GET /api/users/me - Get own profile
 * PUT /api/users/me - Update own display name
 * 
 * Reference: DAY_2_3_IMPLEMENTATION_PLAN.md - Users endpoints
 */

import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/server';
import { db, users } from '@qapp/database';
import { updateDisplayNameSchema } from '@qapp/shared';
import { handleApiError } from '@/lib/api/errors';
import { eq } from 'drizzle-orm';

/**
 * GET /api/users/me
 * Get authenticated user's profile
 * Requires authentication
 */
export async function GET(request: Request) {
    try {
        const { userId } = await requireAuth();

        const [profile] = await db
            .select({
                id: users.id,
                email: users.email,
                displayName: users.displayName,
                avatarUrl: users.avatarUrl,
                createdAt: users.createdAt,
            })
            .from(users)
            .where(eq(users.id, userId));

        return NextResponse.json({
            success: true,
            data: {
                user: profile,
            },
        });
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * PUT /api/users/me
 * Update authenticated user's display name
 * Requires authentication
 * 
 * Request body:
 * {
 *   displayName: string;
 * }
 */
export async function PUT(request: Request) {
    try {
        const { userId } = await requireAuth();

        // Parse and validate request body
        const body = await request.json();
        const validated = updateDisplayNameSchema.parse(body);

        // Update user
        const [updated] = await db
            .update(users)
            .set({
                displayName: validated.displayName,
                updatedAt: new Date(),
            })
            .where(eq(users.id, userId))
            .returning();

        return NextResponse.json({
            success: true,
            data: {
                user: {
                    id: updated.id,
                    displayName: updated.displayName,
                    avatarUrl: updated.avatarUrl,
                    email: updated.email,
                },
            },
        });
    } catch (error) {
        return handleApiError(error);
    }
}
