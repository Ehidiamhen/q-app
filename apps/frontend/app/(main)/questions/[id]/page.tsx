/**
 * Question Detail Page
 * View full question paper with images
 * SSR for SEO and social sharing
 */

import { notFound } from 'next/navigation';
import { QuestionImageGallery } from '@/components/questions/question-image-gallery';
import { QuestionDetailHeader } from '@/components/questions/question-detail-header';
import { QuestionAuthorCard } from '@/components/questions/question-author-card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { QuestionDetail } from '@qapp/shared';

async function getQuestion(id: string): Promise<QuestionDetail | null> {
    try {
        const res = await fetch(
            `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/questions/${id}`,
            {
                cache: 'no-store',
            }
        );

        if (!res.ok) {
            return null;
        }

        const response = await res.json();
        // API returns { success: true, data: question }
        return response.data || response;
    } catch (error) {
        console.error('Failed to fetch question:', error);
        return null;
    }
}

export default async function QuestionDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    const question = await getQuestion(id);

    if (!question) {
        notFound();
    }

    return (
        <div className="container mx-auto px-4 py-6 max-w-4xl">
            {/* Back Button */}
            <Link href="/">
                <Button variant="ghost" size="sm" className="mb-4">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Home
                </Button>
            </Link>

            <div className="space-y-6">
                {/* Image Gallery */}
                <QuestionImageGallery images={question.images} title={question.title} />

                <Separator className='bg-gray-600' />

                {/* Question Details */}
                <QuestionDetailHeader question={question} />

                <Separator />

                {/* Author Info */}
                <QuestionAuthorCard
                    author={question.author}
                    uploadedAt={new Date(question.createdAt)}
                />
            </div>
        </div>
    );
}

// Generate metadata for SEO
export async function generateMetadata({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const question = await getQuestion(id);

    if (!question) {
        return {
            title: 'Question Not Found',
        };
    }

    return {
        title: `${question.courseCode} - ${question.title}`,
        description: `${question.courseName} question paper from ${question.year}, ${question.semester} semester, ${question.level} level`,
        openGraph: {
            title: question.title,
            description: `${question.courseCode} - ${question.courseName}`,
            images: question.images && question.images.length > 0 ? [question.images[0]] : [],
        },
    };
}
