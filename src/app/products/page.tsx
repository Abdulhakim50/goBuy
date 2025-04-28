// src/app/(main)/products/page.tsx
import prisma from "@/app/lib/prisma";
import ProductCard from "@/components/product-card"; // Your existing product card component
import { Metadata } from "next";
import PaginationControls from "@/components/admin/pagination-controls"; // Reuse the component
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Products | MyShop",
  description: "Browse our collection of products.",
};

// Revalidate frequently or use tags if product data changes often
// export const revalidate = 300; // Revalidate every 5 minutes
export const dynamic = 'force-dynamic'; // Or use revalidate for better caching

const PRODUCTS_PER_PAGE = 10; // Define how many products per page for public view (can be different from admin)

// Accept searchParams for page number
export default async function ProductsPage({
    searchParams,
}: {
    searchParams?: { [key: string]: string | string[] | undefined };
}) {

    // --- Pagination Logic ---
    const page = Number(searchParams?.page ?? '1');
    const take = PRODUCTS_PER_PAGE;
    const skip = (page - 1) * take;

    // --- Fetch Paginated Products AND Total Count ---
    // TODO: Add filtering/sorting logic here based on other searchParams later
    // Example: Add a 'where' clause for filtering by category or search term
    const whereClause = {}; // Placeholder for filters

    const [products, totalProducts] = await prisma.$transaction([
        prisma.product.findMany({
            where: whereClause, // Apply filters if any
            orderBy: { createdAt: 'desc' }, // Default sorting, can be changed based on params
            skip: skip,
            take: take,
            // Select only necessary fields for the card
            select: { id: true, name: true, slug: true, price: true, images: true, stock: true /* Include stock if needed for card */ },
        }),
        prisma.product.count({ where: whereClause }), // Count based on the same filters
    ]);

    const totalPages = Math.ceil(totalProducts / take);
    // --- End Pagination Logic ---

    return (
    <div>
        <h1 className="text-3xl font-bold mb-6">Products</h1>
        {/* TODO: Add Sorting/Filtering UI controls here */}

        {products.length === 0 && page === 1 ? (
             <div className="text-center py-16 border rounded-lg bg-secondary">
                <p className="text-muted-foreground mb-4">No products found matching your criteria.</p>
                {/* Optional: Link to clear filters if filters are active */}
            </div>
        ) : products.length === 0 && page > 1 ? (
             <div className="text-center py-16 border rounded-lg bg-secondary">
                <p className="text-muted-foreground mb-4">No products found on this page.</p>
                 <Button variant="outline" asChild><Link href="/products?page=1">Go to First Page</Link></Button>
            </div>
        ) : (
            <>
                {/* Product Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
                    {products.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>

                {/* Pagination Controls */}
                <PaginationControls
                    currentPage={page}
                    totalPages={totalPages}
                    baseUrl="/products" // Base URL for public products
                />
            </>
        )}
        </div>
    );
}