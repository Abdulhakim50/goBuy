// src/components/pagination-controls.tsx
"use client"; // This component uses client-side logic potentially (though links work server-side)

import Link from "next/link";
import { useSearchParams } from "next/navigation"; // Hook to read current search params easily
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string; // Base path for the links (e.g., /admin/products)
  queryParamName?: string; // Optional: if using a different query param than 'page'
}

export default function PaginationControls({
  currentPage,
  totalPages,
  baseUrl,
  queryParamName = "page", // Default to 'page'
}: PaginationControlsProps) {
  // const searchParams = useSearchParams(); // Can be used to preserve other query params if needed

  const hasPreviousPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;

  // Function to create URL with updated page number (preserves other params if needed)
  const createPageUrl = (pageNumber: number): string => {
    const params = new URLSearchParams(); // Use URLSearchParams for easier query string manipulation
    // TODO: Preserve existing search params if necessary
    // searchParams.forEach((value, key) => {
    //     if (key !== queryParamName) { // Don't copy the old page param
    //         params.append(key, value);
    //     }
    // });
    params.set(queryParamName, pageNumber.toString());
    return `${baseUrl}?${params.toString()}`;
  };

  // Don't render controls if only one page
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-center space-x-4 mt-6">
      {/* Previous Button */}
      <Button
        variant="outline"
        size="sm"
        disabled={!hasPreviousPage}
        asChild={hasPreviousPage} // Render as Link only if enabled
      >
        {hasPreviousPage ? (
          <Link href={createPageUrl(currentPage - 1)}>
            <ChevronLeft className="mr-2 h-4 w-4" /> Previous
          </Link>
        ) : (
          // Span prevents hydration errors if button disabled state changes client-side
          <span>
            <ChevronLeft className="mr-2 h-4 w-4" /> Previous
          </span>
        )}
      </Button>

      {/* Page Indicator */}
      <span className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}
      </span>

      {/* Next Button */}
      <Button
        variant="outline"
        size="sm"
        disabled={!hasNextPage}
        asChild={hasNextPage} // Render as Link only if enabled
      >
        {hasNextPage ? (
          <Link href={createPageUrl(currentPage + 1)}>
            Next <ChevronRight className="ml-2 h-4 w-4" />
          </Link>
        ) : (
          <span>
            Next <ChevronRight className="ml-2 h-4 w-4" />
          </span>
        )}
      </Button>
    </div>
  );
}
