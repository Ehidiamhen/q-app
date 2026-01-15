'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { QuestionCard } from '@/components/questions/question-card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Loader2, FileQuestion } from 'lucide-react';
import type { PaginatedResponse, QuestionCard as QuestionCardType } from '@qapp/shared';

async function fetchUserQuestions(userId: string, pageParam: number) {
    const res = await fetch(
        `/api/users/${userId}/questions?page=${pageParam}&limit=20`
    );

    if (!res.ok) {
        throw new Error('Failed to fetch user questions');
    }

    const data = await res.json();
    console.log("DATA: ", data.data)
    return data.data as PaginatedResponse<QuestionCardType>;
}

interface UserUploadsListProps {
    userId: string;
    displayName: string;
}

export function UserUploadsList({ userId, displayName }: UserUploadsListProps) {
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError,
        error,
    } = useInfiniteQuery({
        queryKey: ['user-uploads', userId],
        queryFn: ({ pageParam = 1 }) => fetchUserQuestions(userId, pageParam),
        getNextPageParam: (lastPage) =>
            lastPage.pagination.hasNext ? lastPage.pagination.page + 1 : undefined,
        initialPageParam: 1,
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 10, // 10 minutes cache
    });

    // console.log("DATA: ", data)
    // Loading state
    if (isLoading) {
        return (
            <div className="space-y-8 w-full mx-auto">
                <div className="flex flex-wrap gap-4 justify-center">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <Card key={i} className="overflow-hidden border-0 w-sm">
                            <CardHeader className="p-3 pb-2">
                                <div className="flex items-center gap-2">
                                    <Skeleton className="h-6 w-6 rounded-full bg-white/15" />
                                    <div className="flex-1 space-y-1">
                                        <Skeleton className="h-3 w-20 bg-white/15" />
                                        <Skeleton className="h-2.5 w-16 bg-white/15" />
                                    </div>
                                </div>
                            </CardHeader>
                            <Skeleton className="aspect-3/4 w-full bg-white/15" />
                            <CardContent className="p-3 pb-2">
                                <Skeleton className="h-4 w-full bg-white/15" />
                                <Skeleton className="h-4 w-3/4 bg-white/15 mt-1" />
                            </CardContent>
                            <CardContent className="p-3 pt-0">
                                <Skeleton className="h-3 w-full bg-white/15" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    // Error state
    if (isError) {
        return (
            <div className="text-center py-12">
                <p className="text-destructive mb-4">
                    {error.message || 'Failed to load uploads'}
                </p>
                <Button onClick={() => window.location.reload()} variant="outline">
                    Try Again
                </Button>
            </div>
        );
    }

    const questions = data?.pages.flatMap((page) => page.data) ?? [];

    // Empty state
    if (questions.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <FileQuestion className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No uploads yet</p>
                <p className="text-sm mt-1">
                    {displayName} hasn't shared any question papers yet.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8 w-full mx-auto">
            <div className="flex flex-wrap gap-4 justify-center">
                {questions.map((question) => (
                    <div key={question.id}>
                        <QuestionCard question={question} />
                    </div>
                ))}
            </div>

            {/* Load More Button */}
            {hasNextPage && (
                <div className="flex justify-center">
                    <Button
                        onClick={() => fetchNextPage()}
                        disabled={isFetchingNextPage}
                        variant="outline"
                        size="lg"
                    >
                        {isFetchingNextPage ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Loading...
                            </>
                        ) : (
                            'Load More'
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
}
