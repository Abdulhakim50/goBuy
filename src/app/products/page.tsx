// src/app/(main)/products/page.tsx
import prisma from "@/app/lib/prisma";
import ProductCard from "@/components/product-card";
import { Metadata } from "next";
import PaginationControls from "@/components/admin/pagination-controls";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Prisma } from '@prisma/client'; // Import Prisma namespace for types
import ProductFilters from "@/components/product-filters"; // Import filter/sort controls component

export const metadata: Metadata = {
  title: "Products | MyShop",
  description: "Browse our collection of products.",
};

export const dynamic = 'force-dynamic';

const PRODUCTS_PER_PAGE = 12;

// Define allowed sort options
type SortOption = 'newest' | 'price-asc' | 'price-desc';
const DEFAULT_SORT: SortOption = 'newest';

// Define allowed filter options (example)
type FilterOption = 'all' | 'in-stock';
const DEFAULT_FILTER: FilterOption = 'all';


export default async function ProductsPage({
    searchParams,
}: {
    searchParams?: { [key: string]: string | string[] | undefined };
}) {
    // --- Read Search Params ---
    const page = Number(searchParams?.page ?? '1');
    const sort = (searchParams?.sort as SortOption) ?? DEFAULT_SORT;
    const filter = (searchParams?.filter as FilterOption) ?? DEFAULT_FILTER;
    // Add category, search term params later...
    // const category = searchParams?.category as string | undefined;
    // const searchTerm = searchParams?.search as string | undefined;

    // --- Pagination Logic ---
    const take = PRODUCTS_PER_PAGE;
    const skip = (page - 1) * take;

    // --- Build Prisma Query Options ---
    let whereClause: Prisma.ProductWhereInput = {}; // Start with empty where clause
    let orderByClause: Prisma.ProductOrderByWithRelationInput = {}; // Start with empty order clause

    // Apply Filters
    if (filter === 'in-stock') {
        whereClause.stock = { gt: 0 }; // Filter for stock greater than 0
    }
    // Add other filters (category, search term) here
    // if (category) { whereClause.categoryId = category; } // Assuming category relation
    // if (searchTerm) { whereClause.name = { contains: searchTerm, mode: 'insensitive' }; }

    // Apply Sorting
    switch (sort) {
        case 'price-asc':
            orderByClause = { price: 'asc' };
            break;
        case 'price-desc':
            orderByClause = { price: 'desc' };
            break;
        case 'newest':
        default:
            orderByClause = { createdAt: 'desc' };
            break;
    }
    // --- End Build Prisma Query Options ---


    // --- Fetch Paginated & Filtered/Sorted Products AND Total Count ---
    const [products, totalProducts] = await prisma.$transaction([
        prisma.product.findMany({
            where: whereClause, // Apply dynamic where clause
            orderBy: orderByClause, // Apply dynamic order clause
            skip: skip,
            take: take,
            select: { id: true, name: true, slug: true, price: true, images: true, stock: true },
        }),
        prisma.product.count({ where: whereClause }), // Count based on the same filters
    ]);

    const totalPages = Math.ceil(totalProducts / take);
    // --- End Fetching Logic ---

    return (
    <div>
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
            <h1 className="text-3xl font-bold">Products</h1>
            {/* --- Sorting/Filtering Controls --- */}
            <ProductFilters currentSort={sort} currentFilter={filter} />
        </div>


        {/* Product Grid & Pagination (Conditional Rendering as before) */}
        {products.length === 0 && page === 1 ? (
             <div className="text-center py-16 border rounded-lg bg-secondary">
                <p className="text-muted-foreground mb-4">No products found matching your criteria.</p>
                {/* TODO: Add a 'Clear Filters' button that links to /products */}
                 <Button variant="outline" asChild><Link href="/products">Clear Filters</Link></Button>
            </div>
        ) : products.length === 0 && page > 1 ? (
            // ... (empty page message as before) ...
             <div className="text-center py-16 border rounded-lg bg-secondary">
                <p className="text-muted-foreground mb-4">No products found on this page.</p>
                 <Button variant="outline" asChild><Link href={`/products?page=1&sort=${sort}&filter=${filter}`}>Go to First Page</Link></Button>
            </div>
        ) : (
            <>
                {/* Product Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
                    {products.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>

                {/* Pagination Controls - Pass existing filters/sorts */}
                <PaginationControls
                    currentPage={page}
                    totalPages={totalPages}
                    baseUrl="/products"
                    // Pass current sort/filter to preserve them during pagination
                    preserveQuery={{ sort, filter }}
                />
            </>
        )}
        </div>
    );
}