// src/app/admin/products/page.tsx
import Link from 'next/link';
import Image from 'next/image';
import prisma from '@/app/lib/prisma';
import { formatPrice } from '@/app/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Metadata } from 'next';
import { PlusCircle } from 'lucide-react';
import ProductActions from '@/components/admin/product-actions';
import PaginationControls from '@/components/admin/pagination-controls'; // Import pagination component

export const metadata: Metadata = {
    title: 'Manage Products | Admin Panel',
    description: 'View and manage store products.',
};

// Ensure fresh data on each request for pagination
export const dynamic = 'force-dynamic';

const PRODUCTS_PER_PAGE = 10; // Define how many products per page

// The page now accepts searchParams for the current page
export default async function AdminProductsPage({
    searchParams,
}: {
    searchParams?: { [key: string]: string | string[] | undefined };
}) {
    // --- Pagination Logic ---
    const page = Number(searchParams?.page ?? '1'); // Default to page 1 if not provided or invalid
    const take = PRODUCTS_PER_PAGE;
    const skip = (page - 1) * take; // Calculate how many records to skip

    // --- Fetch Paginated Products AND Total Count ---
    // Use Prisma transaction to fetch both in one go for consistency
    const [products, totalProducts] = await prisma.$transaction([
        prisma.product.findMany({
            orderBy: { createdAt: 'desc' },
            skip: skip,
            take: take,
            // Select specific fields if needed
        }),
        prisma.product.count(), // Get the total count of products
    ]);

    const totalPages = Math.ceil(totalProducts / take); // Calculate total pages
    // --- End Pagination Logic ---


    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Manage Products</h1>
                <Button asChild>
                    <Link href="/admin/products/new">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add New Product
                    </Link>
                </Button>
            </div>

            {products.length === 0 && page === 1 ? ( // Show only if first page is empty
                 <div className="text-center py-10 border rounded-lg bg-secondary">
                    <p className="text-muted-foreground mb-4">No products found.</p>
                    <p className="text-sm text-muted-foreground">Add your first product to get started!</p>
                </div>
            ) : products.length === 0 && page > 1 ? ( // Handle empty page beyond page 1
                 <div className="text-center py-10 border rounded-lg bg-secondary">
                    <p className="text-muted-foreground mb-4">No products found on this page.</p>
                     <Button variant="outline" asChild><Link href="/admin/products?page=1">Go to First Page</Link></Button>
                </div>
            ) : (
                <>
                    {/* Product Table */}
                    <div className="border rounded-lg overflow-hidden mb-6"> {/* Added margin-bottom */}
                        <Table>
                             <TableCaption>Showing page {page} of {totalPages}. Total products: {totalProducts}.</TableCaption>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px]">Image</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Stock</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead>Date Added</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {products.map((product) => (
                                    <TableRow key={product.id}>
                                        {/* ... TableCells as before ... */}
                                        <TableCell>
                                            <Image src={product.images?.[0] ?? '/placeholder-image.png'} alt={product.name} width={48} height={48} className="object-cover rounded border aspect-square"/>
                                        </TableCell>
                                        <TableCell className="font-medium">{product.name}</TableCell>
                                        <TableCell>{product.stock > 0 ? <span>{product.stock}</span> : <Badge variant="outline">Out of Stock</Badge>}</TableCell>
                                        <TableCell>{formatPrice(product.price)}</TableCell>
                                        <TableCell>{new Date(product.createdAt).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right"><ProductActions productId={product.id} /></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination Controls */}
                    <PaginationControls
                        currentPage={page}
                        totalPages={totalPages}
                        baseUrl="/admin/products" // Base URL for pagination links
                    />
                </>
            )}
        </div>
    );
}