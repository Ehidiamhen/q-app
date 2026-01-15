'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useInfiniteQuery } from '@tanstack/react-query';
import { QuestionCard } from '@/components/questions/question-card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Loader2, Search } from 'lucide-react';
import type { PaginatedResponse, QuestionCard as QuestionCardType } from '@qapp/shared';

async function searchQuestions(searchParams: URLSearchParams, pageParam: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', pageParam.toString());
    params.set('limit', '20');

    const res = await fetch(`/api/questions/search?${params.toString()}`);

    if (!res.ok) {
        throw new Error('Failed to search questions');
    }

    const data = await res.json();
    return data.data as PaginatedResponse<QuestionCardType>;
}

export function SearchResults() {
    const searchParams = useSearchParams();

    // Check if there's any search query or filters
    const hasSearchQuery = useMemo(() => {
        const q = searchParams.get('q');
        const level = searchParams.get('level');
        const year = searchParams.get('year');
        const semester = searchParams.get('semester');
        return !!(q || level || year || semester);
    }, [searchParams]);

    // Memoize the query key to prevent unnecessary re-queries
    const queryKey = useMemo(() => {
        const q = searchParams.get('q') || '';
        const level = searchParams.get('level') || '';
        const year = searchParams.get('year') || '';
        const semester = searchParams.get('semester') || '';
        return ['search', q, level, year, semester];
    }, [searchParams]);

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError,
        error,
    } = useInfiniteQuery({
        queryKey,
        queryFn: ({ pageParam = 1 }) => searchQuestions(searchParams, pageParam),
        getNextPageParam: (lastPage) =>
            lastPage.pagination.hasNext ? lastPage.pagination.page + 1 : undefined,
        initialPageParam: 1,
        enabled: hasSearchQuery, // Only fetch when there's a search query or filters
        staleTime: 1000 * 60 * 5, // 5 minutes (increased from 2)
        gcTime: 1000 * 60 * 10, // 10 minutes cache
    });

    // Show initial state when no query has been made
    if (!hasSearchQuery) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Start searching</p>
                <p className="text-sm mt-1">
                    Enter a search term or apply filters to find questions
                </p>
            </div>
        );
    }

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
                    {error.message || 'Failed to load search results'}
                </p>
                <Button onClick={() => window.location.reload()} variant="outline">
                    Try Again
                </Button>
            </div>
        );
    }

    const questions = data?.pages.flatMap((page) => page.data) ?? [];
    const totalResults = data?.pages[0]?.pagination.total ?? 0;

    // Empty state
    if (questions.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No results found</p>
                <p className="text-sm mt-1">
                    Try adjusting your search query or filters
                </p>
            </div>
        );
    }

    // Get search query for result count message
    const query = searchParams.get('q');
    const hasFilters =
        searchParams.get('level') ||
        searchParams.get('year') ||
        searchParams.get('semester');

    return (
        <div className="space-y-6">
            {/* Result Count */}
            <div className="text-sm text-muted-foreground">
                {totalResults} {totalResults === 1 ? 'result' : 'results'}
                {query && (
                    <>
                        {' '}
                        for <span className="font-semibold text-foreground">"{query}"</span>
                    </>
                )}
                {hasFilters && ' with filters applied'}
            </div>

            {/* Results Grid */}
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
        </div>
    );
}
