import { getOrCreateCart } from "../cart-utils";
import prisma from "@/app/lib/prisma";
import { NextResponse,NextRequest } from "next/server";

export async function POST(request: NextRequest) { // Or use DELETE method
  try {
    const body = await request.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json({ message: 'Product ID is required' }, { status: 400 });
    }

    const cart = await getOrCreateCart(request);
     if (!cart || "error" in cart) {
        return NextResponse.json({ message: 'Could not establish cart session.' }, { status: 500 });
    }

    await prisma.cartItem.deleteMany({ // deleteMany in case something went wrong and there are duplicates (shouldn't happen with unique constraint)
      where: { cartId: cart.id, productId },
    });

    const updatedCart = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: { items: { include: { product: true }, orderBy: {createdAt: 'asc'} } },
    });
    return NextResponse.json({ message: 'Item removed from cart', cart: updatedCart });
  } catch (error) {
    console.error('Failed to remove item:', error);
    return NextResponse.json({ message: 'Failed to remove item', error: (error as Error).message }, { status: 500 });
  }
}
