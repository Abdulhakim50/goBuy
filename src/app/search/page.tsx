// src/app/(main)/search/page.tsx
import prisma from "@/app/lib/prisma";
import ProductCard from "@/components/product-card";
import { Metadata } from "next";
import PaginationControls from "@/components/admin/pagination-controls";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Prisma } from '@prisma/client'; // Import Prisma namespace for types

export const metadata: Metadata = {
  title: "Search Results | MyShop", // Dynamic title set below
  description: "Find products in our store.",
};

// Ensure fresh results for each search
export const dynamic = 'force-dynamic';

const PRODUCTS_PER_PAGE = 12; // Or your preferred number

// Generate dynamic title based on search query
// export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
//     const query = searchParams?.q as string | undefined;
//     const title = query ? `Search results for "${query}"` : 'Search Products';
//     return {
//         title: `${title} | MyShop`,
//         description: `Find ${query ? query : 'products'} in our store.`,
//         // Prevent indexing of search results pages with no query or potentially low-quality results
//         robots: { index: !!query, follow: !!query }
//     };
// }

interface SearchPageProps {
     searchParams?: { [key: string]: string | string[] | undefined };
}


export default async function SearchPage({ searchParams }: SearchPageProps) {
    // --- Read Search & Pagination Params ---
    const query = searchParams?.q as string | undefined;
    const page = Number(searchParams?.page ?? '1');
    // Add sort/filter params here later if needed on search page
    // const sort = ...

    // --- Redirect if no query ---
    // if (!query) {
    //      redirect('/products'); // Or show a prompt to search
    // }
    // Let's allow rendering even without query, showing a prompt


    // --- Pagination Logic ---
    const take = PRODUCTS_PER_PAGE;
    const skip = (page - 1) * take;

    // --- Build Prisma Query Options ---
    let whereClause: Prisma.ProductWhereInput = {};
    if (query) {
        // Search in name OR description (case-insensitive)
         whereClause = {
             OR: [
                 { name: { contains: query, mode: 'insensitive' } },
                 { description: { contains: query, mode: 'insensitive' } },
                // Optional: Add SKU or other searchable fields
                // { sku: { contains: query, mode: 'insensitive' } },
             ]
         };
    }
    // Add other filters (e.g., category, in-stock) if combining search with filters

    let orderByClause: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' }; // Default sort
    // Add sorting logic based on searchParams?.sort later if needed


    // --- Fetch Paginated Search Results AND Total Count ---
    // Only fetch if there's a query, otherwise results are empty
    const [products, totalProducts] = query ? await prisma.$transaction([
        prisma.product.findMany({
            where: whereClause,
            orderBy: orderByClause,
            skip: skip,
            take: take,
            select: { id: true, name: true, slug: true, price: true, imagePath: true, stock: true }, // Include imagePath
        }),
        prisma.product.count({ where: whereClause }),
    ]) : [[], 0]; // Return empty results if no query

    const totalPages = Math.ceil(totalProducts / take);
    // --- End Fetching Logic ---

    return (
    <div>
        <h1 className="text-3xl font-bold mb-6">
            {query ? `Search results for "${query}"` : 'Search Products'}
        </h1>

         {/* Optional: Show filter/sort controls here too */}

         {!query && (
             <div className="text-center py-16 border rounded-lg bg-secondary">
                <p className="text-muted-foreground">Please enter a search term in the header search bar.</p>
            </div>
         )}

        {query && products.length === 0 && page === 1 ? (
             <div className="text-center py-16 border rounded-lg bg-secondary">
                <p className="text-muted-foreground mb-4">No products found matching "{query}".</p>
                <Button variant="outline" asChild><Link href="/products">Browse All Products</Link></Button>
            </div>
        ) : query && products.length === 0 && page > 1 ? (
            <div className="text-center py-16 border rounded-lg bg-secondary">
                <p className="text-muted-foreground mb-4">No products found on this page for "{query}".</p>
                 <Button variant="outline" asChild><Link href={`/search?q=${encodeURIComponent(query)}&page=1`}>Go to First Page</Link></Button>
            </div>
        ) : query && products.length > 0 ? (
            <>
                {/* Product Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
                    {products.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>

                {/* Pagination Controls - Preserve the search query */}
                <PaginationControls
                    currentPage={page}
                    totalPages={totalPages}
                    baseUrl="/search"
                    preserveQuery={{ q: query /* Add sort/filter if implemented */ }}
                />
            </>
        ) : null /* Render nothing else if !query and products array is empty */}
        </div>
    );
}