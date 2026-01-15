/**
 * Search Page
 * Search and filter question papers
 * URL-based filters for shareable searches
 */

import { Suspense } from 'react';
import { SearchBar } from '@/components/search/search-bar';
import { SearchFilters } from '@/components/search/search-filters';
import { SearchResults } from '@/components/search/search-results';
import { Separator } from '@/components/ui/separator';

function SearchContent() {
    return (
        <div className="space-y-6">
            {/* Search Bar */}
            <SearchBar />

            {/* Filters */}
            <SearchFilters />

            <Separator />

            {/* Results */}
            <SearchResults />
        </div>
    );
}

export default function SearchPage() {
    return (
        <div className="container mx-auto px-4 py-6 max-w-7xl">
            <div className="mb-6">
                <h1 className="text-2xl font-bold mb-1">Search</h1>
                <p className="text-sm text-muted-foreground">
                    Find question papers by course, level, or year
                </p>
            </div>

            <Suspense
                fallback={
                    <div className="text-center py-12 text-muted-foreground">
                        Loading search...
                    </div>
                }
            >
                <SearchContent />
            </Suspense>
        </div>
    );
}
