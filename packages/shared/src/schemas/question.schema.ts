/**
 * Question Validation Schemas
 * Shared between frontend (client-side validation) and backend (server-side)
 * Reference: ENGAGEMENT_AND_FEATURES.md lines 504-532
 */

import { z } from 'zod';
import { QUESTION_LIMITS, SEMESTERS } from '../constants/index';

/**
 * Create question schema
 * Used for POST /api/questions validation
 */
export const createQuestionSchema = z.object({
    title: z
        .string()
        .min(QUESTION_LIMITS.TITLE_MIN_LENGTH, 'Title must be at least 5 characters')
        .max(QUESTION_LIMITS.TITLE_MAX_LENGTH, 'Title must not exceed 200 characters')
        .trim(),

    courseCode: z
        .string()
        .min(QUESTION_LIMITS.COURSE_CODE_MIN_LENGTH, 'Course code must be at least 2 characters')
        .max(QUESTION_LIMITS.COURSE_CODE_MAX_LENGTH, 'Course code must not exceed 20 characters')
        .toUpperCase()
        .trim(),

    courseName: z
        .string()
        .min(QUESTION_LIMITS.COURSE_NAME_MIN_LENGTH, 'Course name must be at least 3 characters')
        .max(QUESTION_LIMITS.COURSE_NAME_MAX_LENGTH, 'Course name must not exceed 100 characters')
        .trim(),

    level: z
        .number()
        .int('Level must be an integer')
        .min(100, 'Level must be at least 100')
        .max(900, 'Level must not exceed 900')
        .refine((val) => val % 100 === 0, {
            error: 'Level must be a multiple of 100 (100, 200, 300, etc.)',
        }),

    year: z
        .number()
        .int('Year must be an integer')
        .min(QUESTION_LIMITS.YEAR_MIN, `Year must be at least ${QUESTION_LIMITS.YEAR_MIN}`)
        .max(QUESTION_LIMITS.YEAR_MAX, `Year must not exceed ${QUESTION_LIMITS.YEAR_MAX}`),

    semester: z.enum(SEMESTERS, {
        error: 'Semester must be First, Second, or LVS',
    }),

    hashtags: z
        .array(
            z
                .string()
                .max(QUESTION_LIMITS.HASHTAG_MAX_LENGTH, 'Hashtag must not exceed 30 characters')
                .trim()
        )
        .max(QUESTION_LIMITS.MAX_HASHTAGS, 'Maximum 10 hashtags allowed')
        .optional(),

    images: z
        .array(z.url('Each image must be a valid URL'))
        .min(1, 'At least 1 image is required')
        .max(10, 'Maximum 10 images allowed'),
});

/**
 * Update question schema (all fields optional)
 * Used for PUT /api/questions/:id validation
 */
export const updateQuestionSchema = createQuestionSchema.partial();

/**
 * Search query schema
 * Used for GET /api/questions/search validation
 * Reference: ENGAGEMENT_AND_FEATURES.md lines 519-527
 */
export const searchQuerySchema = z.object({
    q: z.string().max(100, 'Search query too long').optional(),
    level: z.coerce.number().int().optional(),
    year: z.coerce.number().int().optional(),
    semester: z.enum(SEMESTERS).optional(),
    hashtag: z.string().max(QUESTION_LIMITS.HASHTAG_MAX_LENGTH).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
});

/**
 * Upload question form schema
 * Used for frontend form validation
 * Accepts comma-separated hashtags as string and File[] for images
 * Note: Transform hashtags to array in component logic before API submission
 */
export const uploadQuestionFormSchema = z.object({
    title: z
        .string()
        .min(QUESTION_LIMITS.TITLE_MIN_LENGTH, 'Title must be at least 5 characters')
        .max(QUESTION_LIMITS.TITLE_MAX_LENGTH, 'Title must not exceed 200 characters')
        .trim(),

    courseCode: z
        .string()
        .min(QUESTION_LIMITS.COURSE_CODE_MIN_LENGTH, 'Course code must be at least 2 characters')
        .max(QUESTION_LIMITS.COURSE_CODE_MAX_LENGTH, 'Course code must not exceed 20 characters')
        .toUpperCase()
        .trim(),

    courseName: z
        .string()
        .min(QUESTION_LIMITS.COURSE_NAME_MIN_LENGTH, 'Course name must be at least 3 characters')
        .max(QUESTION_LIMITS.COURSE_NAME_MAX_LENGTH, 'Course name must not exceed 100 characters')
        .trim(),

    level: z
        .number()
        .int('Level must be an integer')
        .min(100, 'Level must be at least 100')
        .max(900, 'Level must not exceed 900')
        .refine((val) => val % 100 === 0, {
            message: 'Level must be a multiple of 100 (100, 200, 300, etc.)',
        }),

    year: z
        .number()
        .int('Year must be an integer')
        .min(QUESTION_LIMITS.YEAR_MIN, `Year must be at least ${QUESTION_LIMITS.YEAR_MIN}`)
        .max(QUESTION_LIMITS.YEAR_MAX, `Year must not exceed ${QUESTION_LIMITS.YEAR_MAX}`),

    semester: z.enum(SEMESTERS, {
        message: 'Semester must be First, Second, or LVS',
    }),

    // Comma-separated string input
    // Transform to array in component before API submission
    hashtags: z
        .string()
        .max(300, 'Hashtags input too long')
        .optional()
        .refine(
            (val) => {
                if (!val || val.trim() === '') return true;
                const tags = val.split(',').map((tag) => tag.trim()).filter((tag) => tag.length > 0);
                return tags.length <= QUESTION_LIMITS.MAX_HASHTAGS;
            },
            { message: `Maximum ${QUESTION_LIMITS.MAX_HASHTAGS} hashtags allowed` }
        )
        .refine(
            (val) => {
                if (!val || val.trim() === '') return true;
                const tags = val.split(',').map((tag) => tag.trim()).filter((tag) => tag.length > 0);
                return tags.every((tag) => tag.length <= QUESTION_LIMITS.HASHTAG_MAX_LENGTH);
            },
            { message: `Each hashtag must not exceed ${QUESTION_LIMITS.HASHTAG_MAX_LENGTH} characters` }
        ),

    // File array for upload
    images: z.custom<File[]>().refine((files) => files && files.length > 0, {
        message: 'At least one image is required',
    }),
});

/**
 * TypeScript types inferred from schemas
 */
export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;
export type SearchQueryInput = z.infer<typeof searchQuerySchema>;
export type UploadQuestionFormData = z.infer<typeof uploadQuestionFormSchema>;

