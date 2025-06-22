import { getOrCreateCart } from "../cart-utils";
import prisma from "@/app/lib/prisma";
import { NextResponse,NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const cart = await getOrCreateCart(request);
    if (!cart || "error" in cart) {
      // No cart to clear, or session issue. Could return 200 if idempotent.
      return NextResponse.json({ message: 'No active cart to clear or session issue.' }, { status: 404 });
    }

    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    // Optional: Delete the cart itself if it's now empty and you prefer that.
    // await prisma.cart.delete({ where: { id: cart.id } });
    // If you delete the cart, then getOrCreateCart will make a new one next time.

    // Return an empty cart structure or just success
    const clearedCart = await prisma.cart.findUnique({
        where: {id: cart.id},
        include: { items: true } // items will be empty
    });

    return NextResponse.json({ message: 'Cart cleared', cart: clearedCart });
  } catch (error) {
    console.error('Failed to clear cart:', error);
    return NextResponse.json({ message: 'Failed to clear cart', error: (error as Error).message }, { status: 500 });
  }
}