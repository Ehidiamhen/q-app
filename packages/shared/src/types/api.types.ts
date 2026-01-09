/**
 * API Type Definitions
 * Reference: ENGAGEMENT_AND_FEATURES.md lines 330-501 (API design)
 * Reference: Untrack INITIAL_FE_IMPLEMENTATION.md lines 194-276 (type system)
 */

import type { QuestionCard, QuestionDetail } from './question.types.js';
import type { PublicUserProfile, SessionUser } from './user.types.js';

/**
 * Generic API response wrapper
 * All API endpoints return this structure for consistency
 */
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

/**
 * Error response structure
 */
export interface ErrorResponse {
    success: false;
    error: string;
}

/**
 * Pagination metadata
 * Reference: ENGAGEMENT_AND_FEATURES.md lines 423-430
 */
export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
    data: T[];
    pagination: PaginationMeta;
}

// ============================================================================
// QUESTION ENDPOINTS
// ============================================================================

/**
 * POST /api/questions - Create question paper
 * Reference: ENGAGEMENT_AND_FEATURES.md lines 363-396
 */
export interface CreateQuestionRequest {
    title: string;
    courseCode: string;
    courseName: string;
    level: number;
    year: number;
    semester: string;
    hashtags?: string[];
    images: string[]; // R2 URLs
}

export type CreateQuestionResponse = ApiResponse<QuestionDetail>;

/**
 * GET /api/questions - List questions (feed)
 * Reference: ENGAGEMENT_AND_FEATURES.md lines 398-431
 */
export interface ListQuestionsRequest {
    page?: number;
    limit?: number;
}

export type ListQuestionsResponse = ApiResponse<PaginatedResponse<QuestionCard>>;

/**
 * GET /api/questions/:id - Get single question
 */
export type GetQuestionResponse = ApiResponse<QuestionDetail>;

/**
 * GET /api/questions/search - Search questions
 * Reference: ENGAGEMENT_AND_FEATURES.md lines 433-451
 */
export interface SearchQuestionsRequest {
    q?: string; // Text query (course code or name)
    level?: number;
    year?: number;
    semester?: string;
    hashtag?: string;
    page?: number;
    limit?: number;
}

export interface SearchQuestionsResponseData extends PaginatedResponse<QuestionCard> {
    query: {
        q?: string;
        level?: number;
        year?: number;
        semester?: string;
        hashtag?: string;
    };
    totalResults: number;
}

export type SearchQuestionsResponse = ApiResponse<SearchQuestionsResponseData>;

/**
 * PUT /api/questions/:id - Update own question
 */
export interface UpdateQuestionRequest {
    title?: string;
    courseCode?: string;
    courseName?: string;
    level?: number;
    year?: number;
    semester?: string;
    hashtags?: string[];
}

export type UpdateQuestionResponse = ApiResponse<QuestionDetail>;

/**
 * DELETE /api/questions/:id - Delete own question
 */
export type DeleteQuestionResponse = ApiResponse<{ message: string }>;

// ============================================================================
// UPLOAD ENDPOINTS
// ============================================================================

/**
 * POST /api/upload/presign - Get presigned URL for R2 upload
 * Reference: STORAGE_AND_UPLOAD_ANALYSIS.md lines 372-407
 */
export interface PresignUploadRequest {
    filename: string;
    contentType: string;
}

export interface PresignUploadData {
    presignedUrl: string; // URL to PUT the file
    key: string; // R2 object key
    publicUrl: string; // Public URL to access uploaded file
}

export type PresignUploadResponse = ApiResponse<PresignUploadData>;

// ============================================================================
// USER ENDPOINTS
// ============================================================================

/**
 * GET /api/users/:id - Get user profile
 * Reference: ENGAGEMENT_AND_FEATURES.md lines 453-468
 */
export interface GetUserProfileData {
    user: PublicUserProfile;
}

export type GetUserProfileResponse = ApiResponse<GetUserProfileData>;

/**
 * GET /api/users/:id/questions - Get user's uploads
 * Reference: ENGAGEMENT_AND_FEATURES.md lines 470-480
 */
export interface GetUserQuestionsRequest {
    page?: number;
    limit?: number;
}

export type GetUserQuestionsResponse = ApiResponse<PaginatedResponse<QuestionCard>>;

/**
 * PUT /api/users/me - Update own profile
 * Reference: ENGAGEMENT_AND_FEATURES.md lines 482-500
 */
export interface UpdateProfileRequest {
    displayName: string;
}

export interface UpdateProfileData {
    user: SessionUser;
}

export type UpdateProfileResponse = ApiResponse<UpdateProfileData>;

