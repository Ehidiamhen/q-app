/**
 * Shared Constants
 * Reference: ENGAGEMENT_AND_FEATURES.md for business logic
 */

/**
 * University semester types
 * Used for filtering and categorizing question papers
 */
export const SEMESTERS = ['First', 'Second', 'LVS'] as const;
export type Semester = typeof SEMESTERS[number];

/**
 * University level/year options
 * Common format: 100 (1st year), 200 (2nd year), etc.
 */
export const LEVELS = [100, 200, 300, 400, 500, 600, 700, 800, 900] as const;
export type Level = typeof LEVELS[number];

/**
 * Valid image upload limits
 * Reference: ENGAGEMENT_AND_FEATURES.md lines 90-95
 */
export const IMAGE_UPLOAD_LIMITS = {
  MIN_IMAGES: 1,
  MAX_IMAGES: 10,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB per image
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'] as const,
} as const;

/**
 * Question paper validation limits
 */
export const QUESTION_LIMITS = {
  TITLE_MIN_LENGTH: 5,
  TITLE_MAX_LENGTH: 200,
  COURSE_CODE_MIN_LENGTH: 2,
  COURSE_CODE_MAX_LENGTH: 20,
  COURSE_NAME_MIN_LENGTH: 3,
  COURSE_NAME_MAX_LENGTH: 100,
  HASHTAG_MAX_LENGTH: 30,
  MAX_HASHTAGS: 10,
  YEAR_MIN: 2000,
  YEAR_MAX: 2100,
} as const;

/**
 * User profile validation limits
 */
export const USER_LIMITS = {
  DISPLAY_NAME_MIN_LENGTH: 2,
  DISPLAY_NAME_MAX_LENGTH: 50,
} as const;

/**
 * Pagination defaults
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 50,
} as const;

