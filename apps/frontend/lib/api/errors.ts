/**
 * API Error Classes and Handler
 * Centralized error handling for all API routes
 */

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

/**
 * Custom error classes
 */
export class AuthenticationError extends Error {
    constructor(message: string = 'Authentication required') {
        super(message);
        this.name = 'AuthenticationError';
    }
}

export class ValidationError extends Error {
    constructor(
        message: string,
        public issues?: any[]
    ) {
        super(message);
        this.name = 'ValidationError';
    }
}

export class NotFoundError extends Error {
    constructor(message: string = 'Resource not found') {
        super(message);
        this.name = 'NotFoundError';
    }
}

export class ForbiddenError extends Error {
    constructor(message: string = 'Forbidden') {
        super(message);
        this.name = 'ForbiddenError';
    }
}

/**
 * Centralized error handler for API routes
 * Returns consistent error response format
 */
export function handleApiError(error: unknown) {
    console.error('API Error:', error);

    // Zod validation errors
    if (error instanceof ZodError) {
        return NextResponse.json(
            {
                success: false,
                error: 'Validation failed',
                details: error.issues[0].message,
            },
            { status: 400 }
        );
    }

    // Authentication errors
    if (error instanceof AuthenticationError) {
        return NextResponse.json(
            {
                success: false,
                error: error.message,
            },
            { status: 401 }
        );
    }

    // Not found errors
    if (error instanceof NotFoundError) {
        return NextResponse.json(
            {
                success: false,
                error: error.message,
            },
            { status: 404 }
        );
    }

    // Forbidden errors
    if (error instanceof ForbiddenError) {
        return NextResponse.json(
            {
                success: false,
                error: error.message,
            },
            { status: 403 }
        );
    }

    // Custom validation errors
    if (error instanceof ValidationError) {
        return NextResponse.json(
            {
                success: false,
                error: error.message,
                details: error.issues,
            },
            { status: 400 }
        );
    }

    // Database constraint violations
    if (error instanceof Error) {
        if (error.message.includes('unique constraint')) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Resource already exists',
                },
                { status: 409 }
            );
        }

        if (error.message.includes('foreign key constraint')) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid reference',
                },
                { status: 400 }
            );
        }
    }

    // Generic errors
    return NextResponse.json(
        {
            success: false,
            error: 'Internal server error',
        },
        { status: 500 }
    );
}
