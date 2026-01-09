/**
 * Users API - Get User's Questions
 * GET /api/users/:id/questions - Get questions uploaded by user
 * 
 * Reference: DAY_2_3_IMPLEMENTATION_PLAN.md - Users endpoints
 */

import { NextResponse } from 'next/server';
import { db, users, questions } from '@qapp/database';
import { handleApiError } from '@/lib/api/errors';
import { eq, desc, count } from 'drizzle-orm';

/**
 * GET /api/users/:id/questions?page=1&limit=20
 * Get questions uploaded by specific user
 * Public endpoint (no auth required)
 */
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
        const offset = (page - 1) * limit;

        // Get user's questions with author info
        const userQuestions = await db
            .select({
                id: questions.id,
                title: questions.title,
                courseCode: questions.courseCode,
                courseName: questions.courseName,
                level: questions.level,
                year: questions.year,
                semester: questions.semester,
                hashtags: questions.hashtags,
                images: questions.images,
                createdAt: questions.createdAt,
                author: {
                    id: users.id,
                    displayName: users.displayName,
                    avatarUrl: users.avatarUrl,
                },
            })
            .from(questions)
            .innerJoin(users, eq(questions.authorId, users.id))
            .where(eq(questions.authorId, id))
            .orderBy(desc(questions.createdAt))
            .limit(limit)
            .offset(offset);

        // Get total count for this user
        const [{ value: totalCount }] = await db
            .select({ value: count() })
            .from(questions)
            .where(eq(questions.authorId, id));

        const totalPages = Math.ceil(totalCount / limit);

        // Transform to include thumbnail and image count
        const data = userQuestions.map((q) => ({
            ...q,
            thumbnail: q.images[0],
            imageCount: q.images.length,
        }));

        return NextResponse.json({
            success: true,
            data: {
                data,
                pagination: {
                    page,
                    limit,
                    total: totalCount,
                    totalPages,
                    hasNext: page < totalPages,
                    hasPrev: page > 1,
                },
            },
        });
    } catch (error) {
        return handleApiError(error);
    }
}
