// src/app/(main)/account/orders/page.tsx
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import prisma from '@/app/lib/prisma';
import { auth } from '@/app/lib/auth';
import { formatPrice } from '@/app/lib/utils'; // Use your price formatter
import { Badge } from '@/components/ui/badge'; // Shadcn badge for status
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"; // Shadcn table components
import { OrderStatus } from '@prisma/client'; // Import enum if you used it


export const metadata: Metadata = {
    title: 'My Orders | MyShop',
    description: 'View your past orders.',
};

// Helper to get appropriate badge variant based on status
function getStatusBadgeVariant(status: OrderStatus): "default" | "secondary" | "destructive" | "outline" {
    switch (status) {
        case OrderStatus.PAID:
        case OrderStatus.SHIPPED:
        case OrderStatus.DELIVERED:
            return "default"; // Greenish/Default success
        case OrderStatus.PENDING:
            return "secondary"; // Grey/Yellowish
        case OrderStatus.CANCELED:
        case OrderStatus.FAILED:
            return "destructive"; // Red
        default:
            return "outline";
    }
}

export default async function OrdersPage() {
    const session = await auth();

    // Redundant check (layout already protects), but good practice
    if (!session?.user?.id) {
        redirect('/login?callbackUrl=/account/orders');
    }
    const userId = session.user.id;

    // Fetch orders for the current user, newest first
    const orders = await prisma.order.findMany({
        where: { userId: userId },
        orderBy: { createdAt: 'desc' },
        // Optionally include items if needed on this overview page
        // include: { items: { include: { product: true } } }
    });

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">My Orders</h1>

            {orders.length === 0 ? (
                <div className="text-center py-10 border rounded-lg bg-secondary">
                    <p className="text-muted-foreground mb-4">You haven't placed any orders yet.</p>
                    <Button asChild>
                        <Link href="/products">Start Shopping</Link>
                    </Button>
                </div>
            ) : (
                <div className="border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[100px]">Order ID</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                                {/* Optional: Add head for actions/view details */}
                                {/* <TableHead className="text-right">Actions</TableHead> */}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orders.map((order) => (
                                <TableRow key={order.id}>
                                    <TableCell className="font-medium">
                                        {/* Display a shortened ID or link to detail page */}
                                        <Link href={`/account/orders/${order.id}`} className="hover:underline">
                                           View Detail
                                        </Link>
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
                                    {/* Optional: View Details Button */}
                                    {/* <TableCell className="text-right">
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={`/account/orders/${order.id}`}>View Details</Link>
                                        </Button>
                                    </TableCell> */}
                                </TableRow>
                            ))}
                        </TableBody>
                         {orders.length > 10 && <TableCaption>A list of your recent orders.</TableCaption>}
                    </Table>
                </div>
            )}
        </div>
    );
}