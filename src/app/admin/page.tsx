// src/app/admin/page.tsx
import Link from 'next/link';
import prisma from '@/app/lib/prisma';
import { formatPrice } from '@/app/lib/utils';
import { Metadata } from 'next';
import { OrderStatus } from '@prisma/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription,CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DollarSign, Package, ShoppingCart, Users } from 'lucide-react'; // Icons for stats

export const metadata: Metadata = {
    title: 'Admin Dashboard | MyShop',
    description: 'Overview of store performance and activity.',
};

// Fetch fresh data each time the dashboard is visited
export const dynamic = 'force-dynamic';

// Helper for Status Badge Variant (copy from previous steps if not globally available)
function getStatusBadgeVariant(status: OrderStatus): "default" | "secondary" | "destructive" | "outline" {
    switch (status) { /* ... implementation ... */
        case OrderStatus.PAID: case OrderStatus.SHIPPED: case OrderStatus.DELIVERED: return "default";
        case OrderStatus.PENDING: return "secondary";
        case OrderStatus.CANCELED: case OrderStatus.FAILED: return "destructive";
        default: return "outline";
    }
}

// Reusable Stats Card Component (can be moved to components/admin/stats-card.tsx)
interface StatsCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    description?: string;
    link?: string; // Optional link to relevant page
}
function StatsCard({ title, value, icon, description, link }: StatsCardProps) {
    const cardContent = (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {description && <p className="text-xs text-muted-foreground">{description}</p>}
            </CardContent>
        </Card>
    );

    if (link) {
        return <Link href={link} className="hover:opacity-90 transition-opacity">{cardContent}</Link>;
    }
    return cardContent;
}


export default async function AdminDashboardPage() {
    // --- Fetch Dashboard Data ---
    // Use Promise.all to fetch data concurrently
    const [
        salesData,
        orderCount,
        userCount,
        productCount,
        recentOrders
    ] = await Promise.all([
        // Total Revenue from PAID orders
        prisma.order.aggregate({
            _sum: { totalAmount: true },
            where: { status: OrderStatus.PAID },
        }),
        // Total Orders
        prisma.order.count(),
        // Total Users/Customers
        prisma.user.count(),
        // Total Products
        prisma.product.count(),
        // Recent Orders (e.g., last 5)
        prisma.order.findMany({
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: {
                user: { select: { name: true, email: true } },
            },
        }),
        // TODO: Add queries for low stock items, pending orders count etc. later
    ]);

    const totalRevenue = salesData._sum.totalAmount ?? 0;
    // --- End Data Fetching ---


    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Dashboard</h1>

            {/* Stats Cards Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                    title="Total Revenue"
                    value={formatPrice(totalRevenue)}
                    icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
                    description="From all paid orders"
                    link="/admin/orders?status=PAID" // Example link
                />
                 <StatsCard
                    title="Total Orders"
                    value={orderCount}
                    icon={<ShoppingCart className="h-4 w-4 text-muted-foreground" />}
                     description="All time orders"
                     link="/admin/orders"
                />
                 <StatsCard
                    title="Total Customers"
                    value={userCount}
                    icon={<Users className="h-4 w-4 text-muted-foreground" />}
                     description="Registered users"
                     link="/admin/users"
                />
                 <StatsCard
                    title="Total Products"
                    value={productCount}
                    icon={<Package className="h-4 w-4 text-muted-foreground" />}
                     description="Active products in store"
                     link="/admin/products"
                />
                 {/* Add more cards: Pending Orders, Low Stock etc. */}
            </div>

            {/* Recent Orders Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Orders</CardTitle>
                    <CardDescription>A quick look at the latest orders.</CardDescription>
                </CardHeader>
                <CardContent>
                     {recentOrders.length === 0 ? (
                         <p className="text-sm text-muted-foreground">No recent orders.</p>
                     ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Order ID</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentOrders.map((order) => (
                                    <TableRow key={order.id}>
                                        <TableCell className="font-mono">
                                             <Link href={`/admin/orders/${order.id}`} className="hover:underline">
                                                #{order.id.substring(0, 8)}...
                                             </Link>
                                        </TableCell>
                                        <TableCell>{order.user.name ?? order.user.email ?? 'N/A'}</TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusBadgeVariant(order.status)}>
                                                {order.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">{formatPrice(order.totalAmount)}</TableCell>
                                         <TableCell className="text-right">
                                            <Button variant="outline" size="sm" asChild>
                                                 <Link href={`/admin/orders/${order.id}`}>View</Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                     )}
                </CardContent>
                 {orderCount > recentOrders.length && ( // Show only if there are more orders than shown
                     <CardFooter className="text-right">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/admin/orders">View All Orders</Link>
                        </Button>
                     </CardFooter>
                 )}
            </Card>

             {/* TODO: Add other sections like "Low Stock Products" or "Activity Feed" */}

        </div>
    );
}