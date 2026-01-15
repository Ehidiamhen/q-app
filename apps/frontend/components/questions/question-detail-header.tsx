'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import type { QuestionDetail } from '@qapp/shared';

interface QuestionDetailHeaderProps {
    question: Pick<
        QuestionDetail,
        'id' | 'title' | 'courseCode' | 'courseName' | 'level' | 'semester' | 'year' | 'hashtags'
    >;
}

export function QuestionDetailHeader({ question }: QuestionDetailHeaderProps) {
    const { copy } = useCopyToClipboard();
    const [isSharing, setIsSharing] = useState(false);

    const handleShare = async () => {
        // Prevent multiple simultaneous share attempts
        if (isSharing) return;

        setIsSharing(true);

        try {
            const url = `${window.location.origin}/questions/${question.id}`;

            // Check if Web Share API is available and we're in a secure context
            const canShare =
                typeof navigator !== 'undefined' &&
                'share' in navigator &&
                window.isSecureContext;

            // Use native share API if available (mobile/HTTPS only)
            if (canShare) {
                try {
                    await navigator.share({
                        title: question.title,
                        text: `Check out this question paper: ${question.courseCode} - ${question.courseName}`,
                        url,
                    });
                    return; // Successfully shared
                } catch (error) {
                    // User cancelled (AbortError) or other error
                    const err = error as Error;
                    if (err.name === 'AbortError') {
                        // User cancelled, do nothing
                        return;
                    }
                    // Other errors, fallback to copy below
                }
            }

            // Fallback: copy to clipboard (works everywhere)
            copy(url);
        } finally {
            // Reset sharing state after a short delay
            setTimeout(() => setIsSharing(false), 500);
        }
    };

    return (
        <div className="space-y-4">
            {/* Title */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                    <h1 className="text-2xl font-bold">{question.title}</h1>
                    <p className="text-muted-foreground mt-1">
                        {question.courseCode} - {question.courseName}
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShare}
                    disabled={isSharing}
                >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                </Button>
            </div>

            {/* Metadata Badges */}
            <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{question.level} Level</Badge>
                <Badge variant="secondary">{question.semester} Semester</Badge>
                <Badge variant="secondary">{question.year}</Badge>
            </div>

            {/* Hashtags */}
            {question.hashtags && question.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {question.hashtags.map((tag) => (
                        <Badge key={tag} variant="outline">
                            #{tag}
                        </Badge>
                    ))}
                </div>
            )}
        </div>
    );
}
