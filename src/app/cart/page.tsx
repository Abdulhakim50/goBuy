// src/app/cart/page.tsx
import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import prisma from "@/app/lib/prisma";
import { auth } from "@/app/lib/auth"; // Get user session
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import CartItemActions from "@/components/cart-item-actions"; // Client component for buttons
import { formatPrice } from "@/app//lib/utils"; // Helper function for currency formatting

export const metadata: Metadata = {
  title: "Shopping Cart | MyShop",
  description: "Review items in your shopping cart.",
};

// Helper function (you'd put this in src/lib/utils.ts)
// export function formatPrice(price: number) {
//   return new Intl.NumberFormat('en-US', {
//     style: 'currency',
//     currency: 'USD',
//   }).format(price);
// }

export default async function CartPage() {
  const session = await auth();

  if (!session?.user?.id) {
    // Redirect to login if not authenticated
    // You might want to store the intended destination (/cart) in the redirect URL
    redirect("/login?callbackUrl=/cart");
  }

  const userId = session.user.id;

  // Fetch the user's cart including items and product details
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              price: true,
              images: true, // Get images for display
            },
          },
        },
        orderBy: {
          createdAt: "asc", // Order items by when they were added
        },
      },
    },
  });

  const cartItems = cart?.items ?? []; // Handle case where cart might not exist yet

  // Calculate total price server-side (important for accuracy)
  const subtotal = cartItems.reduce((acc, item) => {
    return acc + item.product.price * item.quantity;
  }, 0);

  // TODO: Add logic for taxes, shipping estimates later if needed

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Your Shopping Cart</h1>

      {cartItems.length === 0 ? (
        <div className="text-center py-10 border rounded-lg bg-secondary">
          <p className="text-muted-foreground mb-4">Your cart is empty.</p>
          <Button asChild>
            <Link href="/products">Start Shopping</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Cart Items List (Left/Main Column) */}
          <div className="md:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 p-4 border rounded-lg"
              >
                <Link href={`/products/${item.product.slug}`}>
                  <Image
                    src={item.imagePath ?? "/placeholder-image.png"}
                    alt={item.product.name}
                    width={80}
                    height={80}
                    className="object-cover rounded"
                  />
                </Link>
                <div className="flex-grow">
                  <Link
                    href={`/products/${item.product.slug}`}
                    className="font-medium hover:underline"
                  >
                    {item.product.name}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {formatPrice(item.product.price)} each
                  </p>
                </div>
                {/* Client Component for Quantity/Remove */}
                <CartItemActions
                  cartItemId={item.id}
                  initialQuantity={item.quantity}
                  productId={item.product.id} // Pass product ID for stock checks if needed later
                />
                <p className="font-semibold w-20 text-right">
                  {formatPrice(item.product.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>

          {/* Order Summary (Right/Sidebar Column) */}
          <div className="md:col-span-1">
            <div className="p-6 border rounded-lg sticky top-20">
              {" "}
              {/* Sticky summary */}
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
              <div className="flex justify-between mb-2">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {/* Add lines for Taxes, Shipping later */}
              {/* <div className="flex justify-between mb-2 text-muted-foreground">
                                <span>Taxes</span>
                                <span>Calculated at checkout</span>
                            </div>
                            <div className="flex justify-between mb-4 text-muted-foreground">
                                <span>Shipping</span>
                                <span>Calculated at checkout</span>
                            </div> */}
              <Separator className="my-4" />
              <div className="flex justify-between font-bold text-lg mb-6">
                <span>Total</span>
                <span>{formatPrice(subtotal)}</span>{" "}
                {/* Update when taxes/shipping added */}
              </div>
              <Button className="w-full" asChild>
                <Link href="/checkout">Proceed to Checkout</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
