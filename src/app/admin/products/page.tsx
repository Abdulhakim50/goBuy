// src/app/admin/products/page.tsx
import Link from 'next/link';
import Image from 'next/image';
import prisma from '@/app/lib/prisma';
import { formatPrice } from '@/app/lib/utils'; // Use your price formatter
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge'; // For potential status later
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
import { PlusCircle } from 'lucide-react'; // Icon for add button
// Placeholder components for future Edit/Delete buttons
import ProductActions from '@/components/admin/product-actions';
import { auth } from '@/app/lib/auth';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
    title: 'Manage Products | Admin Panel',
    description: 'View and manage store products.',
};

// Revalidate this page frequently or use tags if needed
// export const revalidate = 60; // Revalidate every 60 seconds
export const dynamic = 'force-dynamic'; // Ensure fresh data on each request


export default async function AdminProductsPage() {


  


    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
        redirect('/'); // Or homepage
    }

    // Fetch all products - Add pagination later for large catalogs
    const products = await prisma.product.findMany({
        orderBy: { createdAt: 'desc' },
        // Select specific fields if needed
        // select: { id: true, name: true, price: true, stock: true, images: true, createdAt: true }
    });

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

            {products.length === 0 ? (
                 <div className="text-center py-10 border rounded-lg bg-secondary">
                    <p className="text-muted-foreground mb-4">No products found.</p>
                    <p className="text-sm text-muted-foreground">Add your first product to get started!</p>
                </div>
            ) : (
                <div className="border rounded-lg overflow-hidden">
                    <Table>
                        {products.length > 10 && <TableCaption>A list of store products.</TableCaption>}
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[80px]">Image</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Stock</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Date Added</TableHead>
                                {/* Optional: Status column */}
                                {/* <TableHead>Status</TableHead> */}
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {products.map((product) => (
                                <TableRow key={product.id}>
                                    <TableCell>
                                        <Image
                                            src={product.images?.[0] ?? '/placeholder-image.png'}
                                            alt={product.name}
                                            width={48}
                                            height={48}
                                            className="object-cover rounded border aspect-square" // Ensure square aspect ratio
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium">{product.name}</TableCell>
                                    <TableCell>
                                        {product.stock > 0 ? (
                                             <span>{product.stock}</span>
                                        ) : (
                                             <Badge variant="outline">Out of Stock</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>{formatPrice(product.price)}</TableCell>
                                    <TableCell>{new Date(product.createdAt).toLocaleDateString()}</TableCell>
                                    {/* Optional: Status Badge - you might add an 'isActive' field later */}
                                    {/* <TableCell><Badge variant="default">Active</Badge></TableCell> */}
                                    <TableCell className="text-right">
                                        {/* Placeholder for Edit/Delete Actions */}
                                        <ProductActions productId={product.id} />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
             {/* TODO: Add Pagination controls here if many products */}
        </div>
    );
}