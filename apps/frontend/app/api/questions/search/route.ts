/**
 * Questions Search API
 * GET /api/questions/search - Search and filter questions
 * 
 * Reference: DAY_2_3_IMPLEMENTATION_PLAN.md - Search implementation
 */

import { NextResponse } from 'next/server';
import { db, questions, users } from '@qapp/database';
import { searchQuerySchema } from '@qapp/shared';
import { handleApiError } from '@/lib/api/errors';
import { eq, desc, count, and, or, ilike, sql } from 'drizzle-orm';

/**
 * GET /api/questions/search?q=CS101&level=100&year=2024&semester=First&page=1&limit=20
 * Search questions with filters
 * Public endpoint (no auth required)
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);

        // Validate query params with Zod
        const params = searchQuerySchema.parse({
            q: searchParams.get('q') || undefined,
            level: searchParams.get('level') || undefined,
            year: searchParams.get('year') || undefined,
            semester: searchParams.get('semester') || undefined,
            hashtag: searchParams.get('hashtag') || undefined,
            page: searchParams.get('page') || '1',
            limit: searchParams.get('limit') || '20',
        });

        const conditions = [];

        // Text search (course code, name, or title)
        if (params.q) {
            conditions.push(
                or(
                    ilike(questions.courseCode, `%${params.q}%`),
                    ilike(questions.courseName, `%${params.q}%`),
                    ilike(questions.title, `%${params.q}%`)
                )
            );
        }

        // Filter by level
        if (params.level) {
            conditions.push(eq(questions.level, params.level));
        }

        // Filter by year
        if (params.year) {
            conditions.push(eq(questions.year, params.year));
        }

        // Filter by semester
        if (params.semester) {
            conditions.push(eq(questions.semester, params.semester));
        }

        // Filter by hashtag (array contains)
        if (params.hashtag) {
            conditions.push(
                sql`${questions.hashtags} && ARRAY[${params.hashtag}]::text[]`
            );
        }

        // Build query
        let query = db
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
            .$dynamic();

        // Apply filters if any
        if (conditions.length > 0) {
            query = query.where(and(...conditions));
        }

        // Execute query with pagination
        const results = await query
            .orderBy(desc(questions.createdAt))
            .limit(params.limit)
            .offset((params.page - 1) * params.limit);

        // Get total count with same filters
        let countQuery = db
            .select({ value: count() })
            .from(questions)
            .$dynamic();

        if (conditions.length > 0) {
            countQuery = countQuery.where(and(...conditions));
        }

        const [{ value: totalCount }] = await countQuery;

        const totalPages = Math.ceil(totalCount / params.limit);

        // Transform to include thumbnail and image count
        const data = results.map((q) => ({
            ...q,
            thumbnail: q.images[0],
            imageCount: q.images.length,
        }));

        return NextResponse.json({
            success: true,
            data: {
                data,
                query: {
                    q: params.q,
                    level: params.level,
                    year: params.year,
                    semester: params.semester,
                    hashtag: params.hashtag,
                },
                pagination: {
                    page: params.page,
                    limit: params.limit,
                    total: totalCount,
                    totalPages,
                    hasNext: params.page < totalPages,
                    hasPrev: params.page > 1,
                },
                totalResults: totalCount,
            },
        });
    } catch (error) {
        return handleApiError(error);
    }
}
