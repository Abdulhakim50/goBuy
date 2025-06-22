// app/products/page.tsx

import prisma from "@/app/lib/prisma";
import ProductCard from "@/components/product-card";
import { Metadata } from "next";
import PaginationControls from "@/components/admin/pagination-controls";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Prisma } from '@prisma/client';
import ProductFilters from "@/components/product-filters";

export const metadata: Metadata = {
  title: "Products | MyShop",
  description: "Browse our collection of products.",
};

export const dynamic = 'force-dynamic';

const PRODUCTS_PER_PAGE = 12;

// --- Define Types (as before) ---
type SortOption = 'newest' | 'price-asc' | 'price-desc';
const DEFAULT_SORT: SortOption = 'newest';

type FilterOption = 'all' | 'in-stock';
const DEFAULT_FILTER: FilterOption = 'all';


export default async function ProductsPage({
    searchParams,
}: {
    searchParams?: { [key: string]: string | string[] | undefined };
}) {
    // --- 1. Read All Search Params ---
    const page = Number(searchParams?.page ?? '1');
    const sort = (searchParams?.sort as SortOption) ?? DEFAULT_SORT;
    const filter = (searchParams?.filter as FilterOption) ?? DEFAULT_FILTER;
    // NEW: Read min and max price from URL search params
    const minPrice = searchParams?.minPrice as string | undefined;
    const maxPrice = searchParams?.maxPrice as string | undefined;

    // --- Pagination Logic ---
    const take = PRODUCTS_PER_PAGE;
    const skip = (page - 1) * take;

    // --- 2. Build Prisma Query Options ---
    let whereClause: Prisma.ProductWhereInput = {};
    let orderByClause: Prisma.ProductOrderByWithRelationInput = {};

    // Apply Stock Filter
    if (filter === 'in-stock') {
        whereClause.stock = { gt: 0 };
    }

    // NEW: Apply Price Filter
    const priceCondition: { gte?: number; lte?: number } = {};
    // Check if minPrice is a valid number string before adding to query
    if (minPrice && !isNaN(Number(minPrice))) {
        priceCondition.gte = Number(minPrice);
    }
    // Check if maxPrice is a valid number string
    if (maxPrice && !isNaN(Number(maxPrice))) {
        priceCondition.lte = Number(maxPrice);
    }
    // If either gte or lte was set, add the price condition to the main where clause
    if (Object.keys(priceCondition).length > 0) {
        whereClause.price = priceCondition;
    }


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

    // --- Fetch Data ---
    const [products, totalProducts] = await prisma.$transaction([
        prisma.product.findMany({
            where: whereClause,
            orderBy: orderByClause,
            skip: skip,
            take: take,
            select: { id: true, name: true, slug: true, price: true, imagePath: true, stock: true ,description : true},
        }),
        prisma.product.count({ where: whereClause }),
    ]);
    
    const totalPages = Math.ceil(totalProducts / take);
    

   return (
  <div className="">
    <h1 className="text-3xl font-bold mb-6">Products</h1>

    <div className="flex flex-col md:flex-row gap-6">
      {/* Filters Section */}
      <aside className="md:w-1/4 w-full border rounded-lg p-4 bg-muted">
        <ProductFilters
          currentSort={sort}
          currentFilter={filter}
          currentMinPrice={minPrice}
          currentMaxPrice={maxPrice}
        />
      </aside>

      {/* Products Section */}
      <main className="md:w-3/4 w-full">
        {products.length === 0 && page === 1 ? (
          <div className="text-center py-16 border rounded-lg bg-secondary">
            <p className="text-muted-foreground mb-4">
              No products found matching your criteria.
            </p>
            <Button variant="outline" asChild>
              <Link href="/products">Clear Filters</Link>
            </Button>
          </div>
        ) : products.length === 0 && page > 1 ? (
          <div className="text-center py-16 border rounded-lg bg-secondary">
            <p className="text-muted-foreground mb-4">No products found on this page.</p>
            <Button variant="outline" asChild>
              <Link href={`/products?page=1&sort=${sort}&filter=${filter}`}>
                Go to First Page
              </Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            <PaginationControls
              currentPage={page}
              totalPages={totalPages}
              baseUrl="/products"
              preserveQuery={{ sort, filter, minPrice, maxPrice }}
            />
          </>
        )}
      </main>
    </div>
  </div>
);
}