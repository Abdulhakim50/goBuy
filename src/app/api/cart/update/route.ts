import { getOrCreateCart } from "../cart-utils";
import prisma from "@/app/lib/prisma";
import { NextResponse,NextRequest } from "next/server";

export async function POST(request: NextRequest) { // Or use PUT method
  try {
    const body = await request.json();
    const { productId, quantity } = body;

    if (!productId || typeof quantity !== 'number') {
      return NextResponse.json({ message: 'Invalid product ID or quantity' }, { status: 400 });
    }
    if (quantity <= 0) {
        // Delegate to remove logic
        return NextResponse.json({ message: 'Quantity must be positive. Use remove to delete.' }, { status: 400 });
        // Or you could call the remove logic here. For simplicity, client handles this.
    }

    const cart = await getOrCreateCart(request);
    if (!cart || "error" in cart) {
        return NextResponse.json({ message: 'Could not establish cart session.' }, { status: 500 });
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }
    if (product.stock < quantity) {
        return NextResponse.json({ message: 'Not enough stock' }, { status: 400 });
    }

    await prisma.cartItem.updateMany({ // updateMany in case, but should be unique
      where: { cartId: cart.id, productId },
      data: { quantity },
    });

    const updatedCart = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: { items: { include: { product: true }, orderBy: {createdAt: 'asc'} } },
    });
    return NextResponse.json({ message: 'Cart updated', cart: updatedCart });
  } catch (error) {
    console.error('Failed to update cart:', error);
    return NextResponse.json({ message: 'Failed to update cart', error: (error as Error).message }, { status: 500 });
  }
}