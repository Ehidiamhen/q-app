/**
 * User Validation Schemas
 * Reference: ENGAGEMENT_AND_FEATURES.md lines 528-532
 */

import { z } from 'zod';
import { USER_LIMITS } from '../constants/index';

/**
 * Update display name schema
 * Used for PUT /api/users/me validation
 */
export const updateDisplayNameSchema = z.object({
    displayName: z
        .string()
        .min(USER_LIMITS.DISPLAY_NAME_MIN_LENGTH, 'Display name must be at least 2 characters')
        .max(USER_LIMITS.DISPLAY_NAME_MAX_LENGTH, 'Display name must not exceed 50 characters')
        .trim()
        .refine((val) => val.length > 0, {
            error: 'Display name cannot be empty or only whitespace',
        }),
});

/**
 * TypeScript type inferred from schema
 */
export type UpdateDisplayNameInput = z.infer<typeof updateDisplayNameSchema>;

