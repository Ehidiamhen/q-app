'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';
import { LEVELS, SEMESTERS } from '@qapp/shared';

export function SearchFilters() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const level = searchParams.get('level');
    const year = searchParams.get('year');
    const semester = searchParams.get('semester');

    const updateFilter = (key: string, value: string | null) => {
        const params = new URLSearchParams(searchParams.toString());

        if (value) {
            params.set(key, value);
        } else {
            params.delete(key);
        }

        // Reset to page 1 when filters change
        params.delete('page');

        // Use replace to avoid polluting history
        router.replace(`/search?${params.toString()}`, { scroll: false });
    };

    const clearAllFilters = () => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete('level');
        params.delete('year');
        params.delete('semester');
        params.delete('page');
        // Use replace to avoid polluting history
        router.replace(`/search?${params.toString()}`, { scroll: false });
    };

    const hasActiveFilters = level || year || semester;

    // Generate year options (2000 to current year)
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: currentYear - 2000 + 1 }, (_, i) =>
        (currentYear - i).toString()
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Filters</h3>
                {hasActiveFilters && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearAllFilters}
                        className="h-8"
                    >
                        <X className="h-3 w-3 mr-1" />
                        Clear All
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Level Filter */}
                <div className="space-y-2">
                    <Label htmlFor="level">Level</Label>
                    <Select
                        value={level || undefined}
                        onValueChange={(value) =>
                            updateFilter('level', value || null)
                        }
                    >
                        <SelectTrigger id="level">
                            <SelectValue placeholder="All levels" />
                        </SelectTrigger>
                        <SelectContent>
                            {LEVELS.map((lvl) => (
                                <SelectItem key={lvl} value={lvl.toString()}>
                                    {lvl} Level
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Year Filter */}
                <div className="space-y-2">
                    <Label htmlFor="year">Year</Label>
                    <Select
                        value={year || undefined}
                        onValueChange={(value) => updateFilter('year', value || null)}
                    >
                        <SelectTrigger id="year">
                            <SelectValue placeholder="All years" />
                        </SelectTrigger>
                        <SelectContent className='overflow-y-scroll max-h-[500px]'>
                            {years.map((yr) => (
                                <SelectItem key={yr} value={yr}>
                                    {yr}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Semester Filter */}
                <div className="space-y-2">
                    <Label htmlFor="semester">Semester</Label>
                    <Select
                        value={semester || undefined}
                        onValueChange={(value) =>
                            updateFilter('semester', value || null)
                        }
                    >
                        <SelectTrigger id="semester">
                            <SelectValue placeholder="All semesters" />
                        </SelectTrigger>
                        <SelectContent>
                            {SEMESTERS.map((sem) => (
                                <SelectItem key={sem} value={sem}>
                                    {sem} Semester
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    );
}
