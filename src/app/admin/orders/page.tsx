// src/app/admin/orders/page.tsx
import Link from 'next/link';
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
import { OrderStatus } from '@prisma/client'; // Import enum
// import { Eye } from 'lucide-react'; // Icon for view details

export const metadata: Metadata = {
    title: 'Manage Orders | Admin Panel',
    description: 'View and manage customer orders.',
};

// Helper to get appropriate badge variant based on status (same as before)
function getStatusBadgeVariant(status: OrderStatus): "default" | "secondary" | "destructive" | "outline" {
    switch (status) {
        case OrderStatus.PAID:
        case OrderStatus.SHIPPED:
        case OrderStatus.DELIVERED:
            return "default";
        case OrderStatus.PENDING:
            return "secondary";
        case OrderStatus.CANCELED:
        case OrderStatus.FAILED:
            return "destructive";
        default:
            return "outline";
    }
}

// Ensure fresh data, especially for order statuses
export const dynamic = 'force-dynamic';

export default async function AdminOrdersPage() {
    // Fetch all orders - Add pagination for large number of orders
    const orders = await prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            // Include user data to display customer name/email
            user: {
                select: { id: true, name: true, email: true },
            },
            // Optionally include item count or brief summary if needed
            // _count: { select: { items: true } } // Example: Get count of items
        },
    });

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Manage Orders</h1>
                {/* Optional: Add Export button or filters here later */}
            </div>

            {orders.length === 0 ? (
                 <div className="text-center py-10 border rounded-lg bg-secondary">
                    <p className="text-muted-foreground mb-4">No orders found.</p>
                </div>
            ) : (
                <div className="border rounded-lg overflow-hidden">
                    <Table>
                         {orders.length > 10 && <TableCaption>A list of all customer orders.</TableCaption>}
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[100px]">Order ID</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                                {/* Optional: Add head for actions */}
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orders.map((order) => (
                                <TableRow key={order.id}>
                                    <TableCell className="font-mono">
                                        {/* Link to a future admin order detail view */}
                                        <Link href={`/admin/orders/${order.id}`} className="hover:underline">
                                           #{order.id.substring(0, 8)}...
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        <div className='flex flex-col'>
                                            <span>{order.user.name ?? 'N/A'}</span>
                                            <span className='text-xs text-muted-foreground'>{order.user.email ?? 'N/A'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {new Date(order.createdAt).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusBadgeVariant(order.status)}>
                                            {order.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {formatPrice(order.totalAmount)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {/* Placeholder/Link for View Details Action */}
                                        <Button variant="outline" size="sm" asChild>
                                             <Link href={`/admin/orders/${order.id}`}> {/* Link to admin detail view */}
                                                {/* <Eye className="mr-2 h-4 w-4" /> */}
                                                View
                                             </Link>
                                        </Button>
                                        {/* Add other actions like 'Update Status' later */}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
             {/* TODO: Add Pagination controls here */}
        </div>
    );
}