/**
 * Upload Page
 * Upload new question papers (auth required)
 */

'use client';

import { useAuth } from '@/hooks/use-auth';
import { SignInButton } from '@/components/auth/sign-in-button';
import { UploadForm } from '@/components/upload/upload-form';
import { Loader2 } from 'lucide-react';

export default function UploadPage() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-6 max-w-2xl">
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="container mx-auto px-4 py-6 max-w-2xl">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold mb-1">Upload Question Paper</h1>
                    <p className="text-sm text-muted-foreground">
                        Share a past exam paper with fellow students
                    </p>
                </div>

                <div className="text-center py-12">
                    <p className="text-muted-foreground mb-4">
                        You need to sign in to upload question papers
                    </p>
                    <SignInButton />
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-6 max-w-2xl">
            <div className="mb-6">
                <h1 className="text-2xl font-bold mb-1">Upload Question Paper</h1>
                <p className="text-sm text-muted-foreground">
                    Share a past exam paper with fellow students
                </p>
            </div>

            <UploadForm />
        </div>
    );
}
