/**
 * Questions API - Single Question
 * GET /api/questions/:id - Get question details
 * PUT /api/questions/:id - Update own question
 * DELETE /api/questions/:id - Delete own question
 * 
 * Reference: DAY_2_3_IMPLEMENTATION_PLAN.md - Questions endpoints
 */

import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/server';
import { db, questions, users } from '@qapp/database';
import { updateQuestionSchema } from '@qapp/shared';
import { handleApiError, NotFoundError, ForbiddenError } from '@/lib/api/errors';
import { eq } from 'drizzle-orm';

/**
 * GET /api/questions/:id
 * Get single question with full details and author info
 * Public endpoint (no auth required)
 */
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const [question] = await db
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
                updatedAt: questions.updatedAt,
                author: {
                    id: users.id,
                    displayName: users.displayName,
                    avatarUrl: users.avatarUrl,
                    createdAt: users.createdAt,
                },
            })
            .from(questions)
            .innerJoin(users, eq(questions.authorId, users.id))
            .where(eq(questions.id, id));

        if (!question) {
            throw new NotFoundError('Question not found');
        }

        return NextResponse.json({
            success: true,
            data: question,
        });
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * PUT /api/questions/:id
 * Update own question (metadata only, not images)
 * Requires authentication and ownership
 */
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { userId } = await requireAuth();

        // Check if question exists and user owns it
        const [existing] = await db
            .select({ authorId: questions.authorId })
            .from(questions)
            .where(eq(questions.id, id));

        if (!existing) {
            throw new NotFoundError('Question not found');
        }

        if (existing.authorId !== userId) {
            throw new ForbiddenError('You can only update your own questions');
        }

        // Parse and validate request body
        const body = await request.json();
        const validated = updateQuestionSchema.parse(body);

        // Update question
        const [updated] = await db
            .update(questions)
            .set({
                ...validated,
                updatedAt: new Date(),
            })
            .where(eq(questions.id, id))
            .returning();

        // Fetch with author info
        const [questionWithAuthor] = await db
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
                updatedAt: questions.updatedAt,
                author: {
                    id: users.id,
                    displayName: users.displayName,
                    avatarUrl: users.avatarUrl,
                },
            })
            .from(questions)
            .innerJoin(users, eq(questions.authorId, users.id))
            .where(eq(questions.id, id));

        return NextResponse.json({
            success: true,
            data: questionWithAuthor,
        });
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * DELETE /api/questions/:id
 * Delete own question
 * Requires authentication and ownership
 */
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { userId } = await requireAuth();

        // Check if question exists and user owns it
        const [existing] = await db
            .select({ authorId: questions.authorId })
            .from(questions)
            .where(eq(questions.id, id));

        if (!existing) {
            throw new NotFoundError('Question not found');
        }

        if (existing.authorId !== userId) {
            throw new ForbiddenError('You can only delete your own questions');
        }

        // Delete question
        await db.delete(questions).where(eq(questions.id, id));

        return NextResponse.json({
            success: true,
            data: { message: 'Question deleted successfully' },
        });
    } catch (error) {
        return handleApiError(error);
    }
}
