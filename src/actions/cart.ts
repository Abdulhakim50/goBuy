"use server"; // Mark all functions in this file as Server Actions

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import prisma from "@/app/lib/prisma";
import { Prisma } from "@prisma/client";

import { auth } from "@/app/lib/auth"; // Get user session info
import { Cart } from "@prisma/client";

// Type guard to check if user is authenticated
type AuthError = { error: string; status: number };
type CartResponse =
  | { success: true; message: string }
  | { success: false; error: string; status?: number };

async function ensureAuthenticated(): Promise<string | AuthError> {
  const session = await auth();
  if (!session?.user?.id) {
    // Can't redirect directly from here if called via fetch/RPC
    // Return an error object or specific code
    return { error: "Unauthenticated", status: 401 };
  }
  return session.user.id;
}

// Helper to get or create user's cart
type CartWithItems = Prisma.CartGetPayload<{ include: { items: true } }>;

async function getOrCreateCart(userId: string): Promise<CartWithItems> {
  let cart = await prisma.cart.findUnique({
    where: { userId },
    include: { items: true },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId },
      include: { items: true },
    });
  }

  return cart;
}

// --- Add to Cart Action ---
export async function addToCartAction(productId: string, quantity: number) {
  const authResult = await ensureAuthenticated();
  if (typeof authResult !== "string") {
    // Check if it's an AuthError object
    return {
      success: false,
      error: authResult.error || "Unauthorized",
      status: authResult.status || 401,
    };
  }
  const userId = authResult;

  if (!productId || quantity <= 0) {
    return { error: "Invalid input", status: 400 };
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { stock: true },
    });

    if (!product) {
      return { error: "Product not found", status: 404 };
    }
    if (product.stock < quantity) {
      return { error: "Insufficient stock", status: 400 };
    }

    const cart = await getOrCreateCart(userId);

    const existingItem = cart.items.find(
      (item) => item.productId === productId
    );
    let requiresNewItem = false;
    if (existingItem) {
      // Check combined quantity against stock
      const newQuantity = existingItem.quantity + quantity;
      if (product.stock < newQuantity) {
        return {
          error: "Insufficient stock for combined quantity",
          status: 400,
        };
      }
      // Update quantity
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      });
    } else {
      // Add new item
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: productId,
          quantity: quantity,
        },
      });
    }
    requiresNewItem = true;

    const updatedCart = await prisma.cart.findUnique({
      where: { userId },
      select: { _count: { select: { items: true } } } // Select distinct item count
 });
 const newItemCount = updatedCart?._count.items ?? cart.items.length + (requiresNewItem ? 1 : 0);

    // Revalidate the cart page and product page (or layout potentially)
    revalidatePath("/cart");
    revalidatePath(`/products/${productId}`); // Or use tags if more complex

    return { success: true, message: "Item added to cart!" , newCartItemCount: newItemCount };
  } catch (error) {
    console.error("Error adding to cart:", error);
    return { error: "Could not add item to cart", status: 500 };
  }
}

// --- Remove From Cart Action ---
export async function removeFromCartAction(cartItemId: string) {
  const authResult = await ensureAuthenticated();
  if (typeof authResult !== "string")
    return {
      success: false,
      error: authResult.error || "Unauthorized",
      status: authResult.status || 401,
    };
  const userId = authResult;

  try {
    // Ensure the item belongs to the user's cart (security check)
    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: cartItemId,
        cart: { userId: userId },
      },
    });

    if (!cartItem) {
      return { error: "Item not found or not authorized", status: 404 };
    }

    await prisma.cartItem.delete({
      where: { id: cartItemId },
    });

    revalidatePath("/cart");
    return { success: true, message: "Item removed." };
  } catch (error) {
    console.error("Error removing item from cart:", error);
    return { error: "Could not remove item", status: 500 };
  }
}

// --- Update Cart Item Quantity Action ---
export async function updateCartItemQuantityAction(
  cartItemId: string,
  quantity: number
) {
  const authResult = await ensureAuthenticated();
  if (typeof authResult !== "string")
    return {
      success: false,
      error: authResult.error || "Unauthorized",
      status: authResult.status || 401,
    };
  const userId = authResult;

  if (quantity <= 0) {
    // If quantity is zero or less, treat as removal
    return removeFromCartAction(cartItemId);
  }

  try {
    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: cartItemId,
        cart: { userId: userId },
      },
      include: { product: { select: { stock: true } } }, // Include product stock
    });

    if (!cartItem) {
      return { error: "Item not found or not authorized", status: 404 };
    }

    if (cartItem.product.stock < quantity) {
      return {
        error: `Insufficient stock. Only ${cartItem.product.stock} available.`,
        status: 400,
      };
    }

    await prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity: quantity },
    });

    revalidatePath("/cart");
    return { success: true, message: "Quantity updated." };
  } catch (error) {
    console.error("Error updating cart quantity:", error);
    return { error: "Could not update quantity", status: 500 };
  }
}
