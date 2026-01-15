'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useDebounce } from '@/hooks/use-debounce';

export function SearchBar() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [value, setValue] = useState(searchParams.get('q') || '');
    const debouncedValue = useDebounce(value, 300);

    // Update URL when debounced value changes
    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());
        const currentQuery = params.get('q') || '';

        // Only update if the value actually changed
        if (debouncedValue !== currentQuery) {
            if (debouncedValue) {
                params.set('q', debouncedValue);
            } else {
                params.delete('q');
            }

            // Reset to page 1 when search query changes
            params.delete('page');

            // Use replace instead of push to avoid polluting history
            router.replace(`/search?${params.toString()}`, { scroll: false });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedValue]);

    const handleClear = () => {
        setValue('');
    };

    return (
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
                type="text"
                placeholder="Search by course code or name..."
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="pl-9 pr-9"
            />
            {value && (
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClear}
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                >
                    <X className="h-4 w-4" />
                </Button>
            )}
        </div>
    );
}
