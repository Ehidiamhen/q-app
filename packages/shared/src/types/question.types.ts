/**
 * Question Type Definitions
 * Reference: ENGAGEMENT_AND_FEATURES.md lines 556-587 (database schema)
 */

import type { Semester, Level } from '../constants/index.js';
import type { PublicUserProfile } from './user.types.js';

/**
 * Complete question record (matches database schema)
 */
export interface Question {
    id: string; // CUID2
    title: string;
    courseCode: string;
    courseName: string;
    level: Level;
    year: number;
    semester: Semester;
    hashtags: string[];
    images: string[]; // Array of R2 URLs (1-10 images)
    authorId: string; // References users.id
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Question card for feed/search display
 * Includes author info and thumbnail
 * Reference: ENGAGEMENT_AND_FEATURES.md lines 614-648
 */
export interface QuestionCard {
    id: string;
    title: string;
    courseCode: string;
    courseName: string;
    level: Level;
    year: number;
    semester: Semester;
    hashtags: string[];
    thumbnail: string; // First image from images array
    imageCount: number; // Total number of images
    createdAt: Date;
    // Author information for attribution
    author: {
        id: string;
        displayName: string;
        avatarUrl: string | null;
    };
}

/**
 * Question detail view
 * Includes all images and full author profile
 */
export interface QuestionDetail extends Omit<QuestionCard, 'thumbnail' | 'imageCount'> {
    images: string[]; // Full array of image URLs
    author: PublicUserProfile;
}

/**
 * Question upload input (before processing)
 * Used in upload form
 */
export interface QuestionUploadInput {
    title: string;
    courseCode: string;
    courseName: string;
    level: Level;
    year: number;
    semester: Semester;
    hashtags?: string[];
    images: File[]; // Client-side File objects
}

/**
 * Question creation payload (after image upload to R2)
 * Sent to API after images are uploaded
 */
export interface CreateQuestionPayload {
    title: string;
    courseCode: string;
    courseName: string;
    level: Level;
    year: number;
    semester: Semester;
    hashtags?: string[];
    images: string[]; // R2 URLs after upload
}

