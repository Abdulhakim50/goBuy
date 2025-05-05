// src/app/admin/orders/[orderId]/page.tsx
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import prisma from "@/app/lib/prisma";
import { formatPrice } from "@/app/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { OrderStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Home as HomeIcon } from "lucide-react"; // Use different name for Home icon
import OrderStatusUpdater from "@/components/admin/order-status-updater"; // Component for status updates (create next)

// Helper function (same as before)
function getStatusBadgeVariant(
  status: OrderStatus
): "default" | "secondary" | "destructive" | "outline" {
  // ... (copy implementation)
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

type AdminOrderDetailPageProps = {
  params: { orderId: string };
};

// Function to generate dynamic metadata
export async function generateMetadata({
  params,
}: AdminOrderDetailPageProps): Promise<Metadata> {
  const orderId = params.orderId;
  // Fetch minimal data just for title if needed, or keep it simple
  // const order = await prisma.order.findUnique({ where: { id: orderId }, select: { userId: true }});
  return {
    title: `Order Details #${orderId.substring(0, 8)} | Admin Panel`,
    description: `Admin view for order ${orderId}`,
  };
}

// Ensure fresh data for status
export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({
  params,
}: AdminOrderDetailPageProps) {
  const { orderId } = params;

  // Middleware protects this route for ADMIN role, no need for explicit check here

  // Fetch the specific order including all necessary details
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
              imagePath: true,
            },
          },
        },
        // orderBy: { createdAt: 'asc' } // Consistent item order
      },
      user: {
        // Include customer details
        select: { name: true, email: true },
      },
    },
  });

  // Handle order not found
  if (!order) {
    notFound(); // Triggers the nearest not-found.tsx page
  }

  // Calculate totals (same logic as customer order detail)
  const subtotal = order.items.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );
  const total = order.totalAmount;

  // TODO: Parse shipping address if stored as JSON string
  // const shippingAddress = order.shippingAddress ? JSON.parse(order.shippingAddress) : null;

  return (
    <div>
      <Button variant="outline" size="sm" asChild className="mb-4">
        <Link href="/admin/orders">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Orders
        </Link>
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order Details & Items (Main Column) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Header */}
          <div className="border rounded-lg p-6">
            <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
              <div>
                <h1 className="text-xl font-bold mb-1">
                  Order #{order.id.substring(0, 8)}...
                </h1>
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
            <p className="text-sm text-muted-foreground font-mono">
              {order.id}
            </p>
            {/* Display Payment Intent ID if available */}
            {order.stripePaymentIntentId && (
              <p className="text-xs text-muted-foreground mt-1">
                Payment Intent:{" "}
                <span className="font-mono">{order.stripePaymentIntentId}</span>
              </p>
            )}
          </div>

          {/* Order Items */}
          <div className="border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">
              Items Ordered ({order.items.length})
            </h2>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-start gap-4">
                  <Link href={`/products/${item.product.slug}`} target="_blank">
                    {" "}
                    {/* Open product in new tab */}
                    <Image
                      src={item.imagePath ?? "/placeholder-image.png"}
                      alt={item.product.name}
                      width={64}
                      height={64}
                      className="object-cover rounded border"
                    />
                  </Link>
                  <div className="flex-grow">
                    <Link
                      href={`/products/${item.product.slug}`}
                      target="_blank"
                      className="font-medium hover:underline"
                    >
                      {item.product.name}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      Qty: {item.quantity}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Price: {formatPrice(item.price)}
                    </p>
                  </div>
                  <p className="font-semibold text-right">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
            <Separator className="my-4" />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {/* Add Shipping/Taxes if available */}
              <div className="flex justify-between font-semibold text-base">
                <span>Order Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Customer & Admin Actions (Sidebar Column) */}
        <div className="lg:col-span-1 space-y-6">
          {/* Customer Info */}
          <div className="border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <User className="mr-2 h-5 w-5" />
              Customer
            </h2>
            <p className="font-medium">{order.user.name ?? "N/A"}</p>
            <p className="text-sm text-muted-foreground">
              {order.user.email ?? "N/A"}
            </p>
            {/* Add link to view customer details page later */}
            {/* <Button variant="outline" size="sm" className="mt-3 w-full">View Customer</Button> */}
          </div>

          {/* Shipping Address */}
          {/* TODO: Add Shipping Address display when available */}
          {/* {shippingAddress && (
                        <div className="border rounded-lg p-6">
                            <h2 className="text-lg font-semibold mb-4 flex items-center"><HomeIcon className="mr-2 h-5 w-5"/>Shipping Address</h2>
                            <p>{shippingAddress.name}</p>
                            // ... other address fields ...
                        </div>
                    )} */}

          {/* Admin Actions - Update Status */}
          <div className="border rounded-lg p-6 sticky top-20">
            {" "}
            {/* Sticky actions */}
            <h2 className="text-lg font-semibold mb-4">Admin Actions</h2>
            <OrderStatusUpdater
              orderId={order.id}
              currentStatus={order.status}
            />
            {/* Add other actions like 'Resend confirmation email', 'Issue Refund' etc. later */}
          </div>
        </div>
      </div>
    </div>
  );
}
