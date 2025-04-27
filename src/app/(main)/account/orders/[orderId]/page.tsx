// src/app/(main)/account/orders/[orderId]/page.tsx
import { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import prisma from '@/app/lib/prisma';
import { auth } from '@/app/lib/auth';
import { formatPrice } from '@/app/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { OrderStatus } from '@prisma/client'; // Import enum if you used it
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

// Helper function (same as in orders list page)
function getStatusBadgeVariant(status: OrderStatus): "default" | "secondary" | "destructive" | "outline" {
    // ... (copy the implementation from the previous step)
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

// Define expected params structure
type OrderDetailPageProps = {
    params: { orderId: string };
};

// Function to generate dynamic metadata (optional but good)
export async function generateMetadata({ params }: OrderDetailPageProps): Promise<Metadata> {
  const orderId = params.orderId;
  // Basic check for user might be possible here if needed, but auth check is main security
  return {
    title: `Order Details #${orderId.substring(0, 8)}... | MyShop`,
    description: `Details for order ${orderId}`,
  };
}


export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
    const { orderId } = params;
    const session = await auth();

    // 1. Authentication Check
    if (!session?.user?.id) {
        redirect(`/login?callbackUrl=/account/orders/${orderId}`);
    }
    const userId = session.user.id;

    // 2. Fetch the specific order including items and product details
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
            items: {
                include: {
                    product: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                            images: true,
                        },
                    },
                },
            },
            // Include user only if you need to display user info (unlikely here)
            // user: { select: { name: true, email: true } }
        },
    });

    // 3. Authorization Check: Ensure the order exists AND belongs to the logged-in user
    if (!order || order.userId !== userId) {
        notFound(); // Triggers the nearest not-found.tsx page
    }

    // 4. Calculate totals (could also store subtotal/taxes separately on Order model)
    const subtotal = order.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    // Assume totalAmount on order record is the final source of truth
    const total = order.totalAmount;

    // TODO: Parse shipping address if stored as JSON string
    // const shippingAddress = order.shippingAddress ? JSON.parse(order.shippingAddress) : null;


    return (
        <div>
            <Button variant="outline" size="sm" asChild className="mb-4">
                <Link href="/account/orders">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Orders
                </Link>
            </Button>

            <div className="border rounded-lg p-6">
                 <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                     <div>
                        <h1 className="text-2xl font-bold mb-1">Order Details</h1>
                        <p className="text-sm text-muted-foreground">
                            Order ID: <span className="font-mono">{order.id}</span>
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Placed on: {new Date(order.createdAt).toLocaleString()}
                        </p>
                     </div>
                     <div>
                        <span className="text-sm font-medium mr-2">Status:</span>
                        <Badge variant={getStatusBadgeVariant(order.status)}>
                            {order.status}
                        </Badge>
                     </div>
                 </div>

                 <Separator className="my-6" />

                 <h2 className="text-lg font-semibold mb-4">Items Ordered</h2>
                 <div className="space-y-4 mb-6">
                     {order.items.map((item) => (
                         <div key={item.id} className="flex items-start gap-4">
                             <Link href={`/products/${item.product.slug}`}>
                                 <Image
                                     src={item.product.images?.[0] ?? '/placeholder-image.png'}
                                     alt={item.product.name}
                                     width={64}
                                     height={64}
                                     className="object-cover rounded border"
                                 />
                             </Link>
                             <div className="flex-grow">
                                 <Link href={`/products/${item.product.slug}`} className="font-medium hover:underline">
                                     {item.product.name}
                                 </Link>
                                 <p className="text-sm text-muted-foreground">
                                     Quantity: {item.quantity}
                                 </p>
                                  <p className="text-sm text-muted-foreground">
                                     Price per item: {formatPrice(item.price)} {/* Price at time of order */}
                                 </p>
                             </div>
                             <p className="font-semibold text-right">
                                 {formatPrice(item.price * item.quantity)}
                             </p>
                         </div>
                     ))}
                 </div>

                 <Separator className="my-6" />

                {/* TODO: Add Shipping Address display */}
                {/* {shippingAddress && (
                    <div className="mb-6">
                         <h2 className="text-lg font-semibold mb-4">Shipping Address</h2>
                         <p>{shippingAddress.name}</p>
                         <p>{shippingAddress.addressLine1}</p>
                         ... etc ...
                    </div>
                )} */}


                 <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
                 <div className="space-y-2">
                     <div className="flex justify-between">
                         <span className="text-muted-foreground">Subtotal</span>
                         <span>{formatPrice(subtotal)}</span>
                     </div>
                     {/* Add lines for shipping, taxes if applicable/stored */}
                     {/* <div className="flex justify-between">
                         <span className="text-muted-foreground">Shipping</span>
                         <span>{formatPrice(order.shippingCost || 0)}</span>
                     </div>
                     <div className="flex justify-between">
                         <span className="text-muted-foreground">Taxes</span>
                         <span>{formatPrice(order.taxAmount || 0)}</span>
                     </div> */}
                     <Separator className="my-2" />
                     <div className="flex justify-between font-bold text-lg">
                         <span>Total</span>
                         <span>{formatPrice(total)}</span>
                     </div>
                 </div>

                 {/* Optional: Add re-order button or other actions */}
                 {/* <div className="mt-6 text-right">
                    <Button>Re-order Items</Button>
                 </div> */}
            </div>
        </div>
    );
}