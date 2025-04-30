// src/components/pagination-controls.tsx
'use client';

import Link from 'next/link';
// Remove useSearchParams if only passing query params explicitly
// import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationControlsProps {
    currentPage: number;
    totalPages: number;
    baseUrl: string;
    queryParamName?: string;
    preserveQuery?: Record<string, string | number | undefined>; // Optional: Pass existing query params to preserve
}

export default function PaginationControls({
    currentPage,
    totalPages,
    baseUrl,
    queryParamName = 'page',
    preserveQuery = {}, // Default to empty object
}: PaginationControlsProps) {

    const hasPreviousPage = currentPage > 1;
    const hasNextPage = currentPage < totalPages;

    // Function to create URL with updated page number and preserved params
    const createPageUrl = (pageNumber: number): string => {
        const params = new URLSearchParams();
        // Add preserved params first
        for (const [key, value] of Object.entries(preserveQuery)) {
            if (value !== undefined && value !== null && value !== '' && value !== 'all') { // Add checks to avoid adding empty/default params
                 params.set(key, String(value));
            }
        }
        // Set the new page number
        params.set(queryParamName, pageNumber.toString());
        return `${baseUrl}?${params.toString()}`;
    };

    if (totalPages <= 1) return null;

    return (
        <div className="flex items-center justify-center space-x-4 mt-6">
            {/* Previous Button */}
            <Button variant="outline" size="sm" disabled={!hasPreviousPage} asChild={hasPreviousPage}>
                {hasPreviousPage ? ( <Link href={createPageUrl(currentPage - 1)}> <ChevronLeft className="mr-2 h-4 w-4" /> Previous </Link> ) : ( <span><ChevronLeft className="mr-2 h-4 w-4" /> Previous</span> )}
            </Button>

            {/* Page Indicator */}
            <span className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</span>

            {/* Next Button */}
            <Button variant="outline" size="sm" disabled={!hasNextPage} asChild={hasNextPage}>
                 {hasNextPage ? ( <Link href={createPageUrl(currentPage + 1)}> Next <ChevronRight className="ml-2 h-4 w-4" /> </Link> ) : ( <span>Next <ChevronRight className="ml-2 h-4 w-4" /></span> )}
            </Button>
        </div>
    );
}