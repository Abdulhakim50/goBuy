
import { getOrCreateCart } from '../cart-utils'; // Adjust path
import prisma from '@/app/lib/prisma';
import { NextResponse, NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, quantity = 1 } = body;
    console.log('Adding item to cart:', { productId, quantity });

    if (!productId || typeof quantity !== 'number' || quantity <= 0) {
      return NextResponse.json({ message: 'Invalid product ID or quantity' }, { status: 400 });
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


    const existingItem = await prisma.cartItem.findFirst({
      where: { cartId: cart.id, productId },
    });

    if (existingItem) {
      // Check stock for additional quantity
      const totalQuantityNeeded = existingItem.quantity + quantity;
      if (product.stock < totalQuantityNeeded) {
           return NextResponse.json({ message: `Not enough stock. Only ${product.stock - existingItem.quantity} more available.` }, { status: 400 });
      }
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: { increment: quantity } }, // Atomically increment
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
          priceAtPurchase: product.price, // Store current price
        },
      });
    }

    const updatedCart = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: { items: { include: { product: true }, orderBy: {createdAt: 'asc'} } },
    });

    return NextResponse.json({ message: 'Item added to cart', cart: updatedCart });
  } catch (error) {
    console.error('Failed to add item to cart:', error);
    return NextResponse.json({ message: 'Failed to add item to cart', error: (error as Error).message }, { status: 500 });
  }
}
