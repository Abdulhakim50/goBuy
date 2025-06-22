// src/components/product-filters.tsx
'use client'; // Needs client-side hooks for interaction and navigation

import { useState, useEffect } from 'react'; // Import hooks for local state
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';   // Import Input for price fields
import { Button } from '@/components/ui/button'; // Import Button for applying price filter

// Define types again here or import from page if shared
type SortOption = 'newest' | 'price-asc' | 'price-desc';
type FilterOption = 'all' | 'in-stock';

interface ProductFiltersProps {
    currentSort: SortOption;
    currentFilter: FilterOption;
    // Add props for price. They are strings as they come from URL search params.
    currentMinPrice?: string;
    currentMaxPrice?: string;
}

export default function ProductFilters({
    currentSort,
    currentFilter,
    currentMinPrice = '', // Default to empty string if not provided
    currentMaxPrice = '', // Default to empty string if not provided
}: ProductFiltersProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams(); // Get current search params

    // Local state for price inputs to avoid re-rendering on every keystroke
    const [minPrice, setMinPrice] = useState(currentMinPrice);
    const [maxPrice, setMaxPrice] = useState(currentMaxPrice);

    // Effect to sync local state if URL params change (e.g., user navs back/forward)
    useEffect(() => {
        setMinPrice(currentMinPrice);
        setMaxPrice(currentMaxPrice);
    }, [currentMinPrice, currentMaxPrice]);

    // Handler for Sort and Filter dropdowns (remains the same)
    const handleValueChange = (type: 'sort' | 'filter', value: string) => {
        const current = new URLSearchParams(Array.from(searchParams.entries()));

        if (value && value !== 'all') {
             current.set(type, value);
        } else {
             current.delete(type);
        }

        current.delete('page');
        const search = current.toString();
        const query = search ? `?${search}` : "";
        router.push(`${pathname}${query}`);
    };

    // New handler to apply the price filter from the input fields
    const handlePriceChange = () => {
        const current = new URLSearchParams(Array.from(searchParams.entries()));

        // Set minPrice param if value exists, otherwise remove it
        if (minPrice) {
            current.set('minPrice', minPrice);
        } else {
            current.delete('minPrice');
        }

        // Set maxPrice param if value exists, otherwise remove it
        if (maxPrice) {
            current.set('maxPrice', maxPrice);
        } else {
            current.delete('maxPrice');
        }

        current.delete('page'); // Reset to first page
        const search = current.toString();
        const query = search ? `?${search}` : "";
        router.push(`${pathname}${query}`);
    };


    return (
        // Changed to `sm:items-end` for better alignment with mixed-height controls
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 w-full flex-wrap">
             {/* Filter Dropdown */}
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

            {/* === NEW: Price Range Filter === */}
            <div className="flex items-end gap-2">
                <div className="grid gap-1.5">
                    <Label htmlFor="min-price" className="text-sm font-medium whitespace-nowrap">Price From</Label>
                    <Input
                        id="min-price"
                        type="number"
                        placeholder="$ Min"
                        className="w-[100px]"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        min="0"
                    />
                </div>
                 <div className="grid gap-1.5">
                    <Label htmlFor="max-price" className="text-sm font-medium whitespace-nowrap">Price To</Label>
                    <Input
                        id="max-price"
                        type="number"
                        placeholder="$ Max"
                        className="w-[100px]"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        min="0"
                    />
                </div>
                <Button onClick={handlePriceChange}>Apply</Button>
            </div>
        </div>
    );
}