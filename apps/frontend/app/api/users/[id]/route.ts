/**
 * Users API - Get User Profile
 * GET /api/users/:id - Get user profile with upload count
 * 
 * Reference: DAY_2_3_IMPLEMENTATION_PLAN.md - Users endpoints
 */

import { NextResponse } from 'next/server';
import { db, users, questions } from '@qapp/database';
import { handleApiError, NotFoundError } from '@/lib/api/errors';
import { eq, count } from 'drizzle-orm';

/**
 * GET /api/users/:id
 * Get user profile with upload statistics
 * Public endpoint (no auth required)
 */
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Get user profile with upload count
        const [profile] = await db
            .select({
                id: users.id,
                displayName: users.displayName,
                avatarUrl: users.avatarUrl,
                createdAt: users.createdAt,
                uploadCount: count(questions.id),
            })
            .from(users)
            .leftJoin(questions, eq(questions.authorId, users.id))
            .where(eq(users.id, id))
            .groupBy(users.id, users.displayName, users.avatarUrl, users.createdAt);

        if (!profile) {
            throw new NotFoundError('User not found');
        }

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
