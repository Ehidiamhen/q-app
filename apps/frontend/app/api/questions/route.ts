/**
 * Questions API - Create and List
 * POST /api/questions - Create new question
 * GET /api/questions - List questions (feed)
 * 
 * Reference: DAY_2_3_IMPLEMENTATION_PLAN.md - Questions endpoints
 */

import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/server';
import { db, questions, users } from '@qapp/database';
import { createQuestionSchema } from '@qapp/shared';
import { handleApiError } from '@/lib/api/errors';
import { eq, desc, count } from 'drizzle-orm';

/**
 * POST /api/questions
 * Create a new question paper
 * Requires authentication
 */
export async function POST(request: Request) {
    try {
        // Require authentication
        const { userId } = await requireAuth();

        // Parse and validate request body
        const body = await request.json();
        const validated = createQuestionSchema.parse(body);

        // Insert question
        const [question] = await db
            .insert(questions)
            .values({
                ...validated,
                authorId: userId,
            })
            .returning();

        // Fetch with author info for response
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
            .where(eq(questions.id, question.id));

        return NextResponse.json(
            {
                success: true,
                data: questionWithAuthor,
            },
            { status: 201 }
        );
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * GET /api/questions?page=1&limit=20
 * List questions in reverse chronological order (feed)
 * Public endpoint (no auth required)
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
        const offset = (page - 1) * limit;

        // Get questions with author info
        const questionsList = await db
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
            .orderBy(desc(questions.createdAt))
            .limit(limit)
            .offset(offset);

        // Get total count for pagination
        const [{ value: totalCount }] = await db
            .select({ value: count() })
            .from(questions);

        const totalPages = Math.ceil(totalCount / limit);

        // Transform to include thumbnail and image count
        const data = questionsList.map((q) => ({
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
