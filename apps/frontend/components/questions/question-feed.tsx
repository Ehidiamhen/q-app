/**
 * Question Feed
 * Paginated list of questions with infinite scroll
 */

'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { QuestionCard } from './question-card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, FileQuestion } from 'lucide-react';
import type { PaginatedResponse, QuestionCard as QuestionCardType } from '@qapp/shared';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';

async function fetchQuestions({ pageParam = 1 }) {
    const res = await fetch(`/api/questions?page=${pageParam}&limit=20`);
    if (!res.ok) throw new Error('Failed to fetch questions');
    const data = await res.json();
    return data.data as PaginatedResponse<QuestionCardType>;
}

export function QuestionFeed() {
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        error,
    } = useInfiniteQuery({
        queryKey: ['questions'],
        queryFn: fetchQuestions,
        getNextPageParam: (lastPage) => {
            return lastPage.pagination.hasNext
                ? lastPage.pagination.page + 1
                : undefined;
        },
        initialPageParam: 1,
    });

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

    if (error) {
        return (
            <div className="text-center py-12">
                <FileQuestion className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">Failed to load questions</p>
                <Button variant="outline" onClick={() => window.location.reload()}>
                    Try Again
                </Button>
            </div>
        );
    }

    const questions = data?.pages.flatMap((page) => page.data) ?? [];

    if (questions.length === 0) {
        return (
            <div className="text-center py-12">
                <FileQuestion className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No questions yet</h3>
                <p className="text-muted-foreground mb-4">
                    Be the first to upload a question paper!
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8 w-full mx-auto">
            <div className="flex flex-wrap gap-4 justify-center"> {/*grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 */}
                {questions.map((question) => (
                    <div key={question.id}>
                        <QuestionCard question={question} />
                        {/* <Separator className="block lg:hidden bg-white/15" /> */}
                    </div>
                ))}
            </div>

            {hasNextPage && (
                <div className="flex justify-center">
                    <Button
                        onClick={() => fetchNextPage()}
                        disabled={isFetchingNextPage}
                        variant="outline"
                    >
                        {isFetchingNextPage ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
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
