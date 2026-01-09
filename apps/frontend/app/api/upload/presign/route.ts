/**
 * R2 Presigned URL API
 * POST /api/upload/presign - Generate presigned URL for direct R2 upload
 * 
 * Reference: DAY_2_3_IMPLEMENTATION_PLAN.md - Upload presigned URL
 */

import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { requireAuth } from '@/lib/supabase/server';
import { handleApiError, ValidationError } from '@/lib/api/errors';
import { createId } from '@paralleldrive/cuid2';

// Initialize R2 client
const R2 = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_PUBLIC_URL!,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
});

// Allowed file types
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * POST /api/upload/presign
 * Generate presigned URL for direct client-to-R2 upload
 * Requires authentication
 * 
 * Request body:
 * {
 *   filename: string;
 *   contentType: string;
 *   size?: number;
 * }
 */
export async function POST(request: Request) {
    try {
        // Require authentication
        const { userId } = await requireAuth();

        const body = await request.json();
        const { filename, contentType, size } = body;

        // Validate required fields
        if (!filename || !contentType) {
            throw new ValidationError('filename and contentType are required');
        }

        // Validate file type
        if (!ALLOWED_TYPES.includes(contentType)) {
            throw new ValidationError(
                `Invalid file type. Allowed types: ${ALLOWED_TYPES.join(', ')}`
            );
        }

        // Validate file size if provided
        if (size && size > MAX_FILE_SIZE) {
            throw new ValidationError(
                `File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`
            );
        }

        // Generate unique key
        const ext = filename.split('.').pop() || 'jpg';
        const key = `questions/${userId}/${createId()}.${ext}`;

        // Generate presigned URL (10 minute expiry)
        const command = new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME!,
            Key: key,
            ContentType: contentType,
        });

        const presignedUrl = await getSignedUrl(R2, command, {
            expiresIn: 600, // 10 minutes
        });

        // Construct public URL
        const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

        return NextResponse.json({
            success: true,
            data: {
                presignedUrl,
                key,
                publicUrl,
            },
        });
    } catch (error) {
        return handleApiError(error);
    }
}
