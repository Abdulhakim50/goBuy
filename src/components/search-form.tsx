// src/components/search-form.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

export default function SearchForm() {
    const [searchTerm, setSearchTerm] = useState('');
    const router = useRouter();

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const trimmedSearchTerm = searchTerm.trim();
        if (!trimmedSearchTerm) {
            return; // Don't search if empty
        }
        // Navigate to the search results page with the query parameter
        router.push(`/search?q=${encodeURIComponent(trimmedSearchTerm)}`);
    };

    return (
        <form onSubmit={handleSubmit} className="flex w-full max-w-sm items-center space-x-2">
            <Input
                type="search" // Use type="search" for semantics and potential browser features
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9" // Match header height if needed
                aria-label="Search products"
            />
            <Button type="submit" variant="outline" size="icon" className="h-9 w-9 shrink-0">
                <Search className="h-4 w-4" />
                <span className="sr-only">Search</span> {/* Accessibility */}
            </Button>
        </form>
    );
}