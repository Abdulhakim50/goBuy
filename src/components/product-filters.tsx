// src/components/product-filters.tsx
'use client'; // Needs client-side hooks for interaction and navigation

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';

// Define types again here or import from page if shared
type SortOption = 'newest' | 'price-asc' | 'price-desc';
type FilterOption = 'all' | 'in-stock';

interface ProductFiltersProps {
    currentSort: SortOption;
    currentFilter: FilterOption;
    // Add props for categories etc. if needed
}

export default function ProductFilters({ currentSort, currentFilter }: ProductFiltersProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams(); // Get current search params

    const handleValueChange = (type: 'sort' | 'filter', value: string) => {
        const current = new URLSearchParams(Array.from(searchParams.entries())); // Create mutable copy

        // Update the specific parameter
        if (value && value !== 'all') { // Add 'all' check for filters to remove param if default
             current.set(type, value);
        } else {
             current.delete(type); // Remove param if default value selected
        }

        // Reset page to 1 when sorting/filtering changes
        current.delete('page');

        const search = current.toString();
        const query = search ? `?${search}` : ""; // Avoid trailing '?' if no params

        // Use router to push the new URL state
        router.push(`${pathname}${query}`);
    };

    return (
        <div className="flex flex-col sm:flex-row items-center gap-4">
             {/* Filter Dropdown (Example: In Stock) */}
             <div className="flex items-center gap-2">
                <Label htmlFor="filter-select" className="text-sm font-medium whitespace-nowrap">Filter by:</Label>
                <Select
                    value={currentFilter}
                    onValueChange={(value) => handleValueChange('filter', value)}
                >
                    <SelectTrigger id="filter-select" className="w-[180px]">
                        <SelectValue placeholder="Filter..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Products</SelectItem>
                        <SelectItem value="in-stock">In Stock</SelectItem>
                        {/* Add other filters like categories here */}
                    </SelectContent>
                </Select>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
                <Label htmlFor="sort-select" className="text-sm font-medium whitespace-nowrap">Sort by:</Label>
                <Select
                    value={currentSort}
                    onValueChange={(value) => handleValueChange('sort', value)}
                >
                    <SelectTrigger id="sort-select" className="w-[180px]">
                        <SelectValue placeholder="Sort..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="newest">Newest Arrivals</SelectItem>
                        <SelectItem value="price-asc">Price: Low to High</SelectItem>
                        <SelectItem value="price-desc">Price: High to Low</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}