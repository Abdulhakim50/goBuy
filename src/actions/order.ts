"use server";

import prisma from "@/app/lib/prisma";
import { stripe, calculateOrderAmountInCents } from "@/app/lib/stripe";
import { CartItem, Product, OrderStatus, UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { headers } from "next/headers";

type CartItemWithProduct = CartItem & {
  product: Pick<Product, "id" | "name" | "price" | "stock">;
};

interface OrderActionResult {
  error?: string | null;
  success?: boolean;
}

type CreatePaymentIntentResult =
  | { success: true; clientSecret: string; orderTotal: number }
  | { error: string; status?: number };

export async function createPaymentIntentAction(): Promise<CreatePaymentIntentResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return { error: "User not authenticated", status: 401 };
  }
  const userId = session.user.id;

  try {
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, price: true, stock: true },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return { error: "Cart is empty", status: 400 };
    }

    const cartItems: CartItemWithProduct[] = cart.items;

    for (const item of cartItems) {
      if (item.product.stock < item.quantity) {
        return {
          error: `Insufficient stock for ${item.product.name}. Only ${item.product.stock} left.`,
          status: 400,
        };
      }
    }

    const amountInCents = calculateOrderAmountInCents(
      cartItems.map((item) => ({
        price: item.product.price,
        quantity: item.quantity,
      }))
    );

    if (amountInCents <= 0) {
      return { error: "Invalid order amount", status: 400 };
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "usd",
      metadata: {
        userId: userId,
      },

      payment_method_types: ["card"],
    });

    if (!paymentIntent.client_secret) {
      throw new Error("Failed to create Payment Intent client secret.");
    }

    try {
      await prisma.order.create({
        data: {
          userId: userId,
          totalAmount: amountInCents / 100,
          status: OrderStatus.PENDING,
          stripePaymentIntentId: paymentIntent.id,

          items: {
            create: cartItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.product.price,
            })),
          },
        },
      });
      console.log(
        `Created PENDING order for PaymentIntent: ${paymentIntent.id}`
      );
    } catch (orderError: any) {
      console.error(
        `❌ CRITICAL: Failed to create PENDING order after PI creation (${paymentIntent.id}):`,
        orderError
      );

      return {
        error: "Failed to save order details. Please try again later.",
        status: 500,
      };
    }

    try {
      await prisma.product.update({
        where: { id: cartItems[0].productId },
        data: {
          stock: {
            decrement: cartItems[0].quantity,
          },
        },
      });
    } catch (error) {
      console.error(
        `Error updating stock for product ${cartItems[0].productId}:`,
        error
      );
      return {
        error: "Failed to update product stock. Please try again later.",
        status: 500,
      };
    }

    return {
      success: true,
      clientSecret: paymentIntent.client_secret,
      orderTotal: amountInCents / 100,
    };
  } catch (error: any) {
    console.error("Error creating Payment Intent:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Could not initiate checkout";
    return { error: errorMessage, status: 500 };
  }
}

export async function updateOrderStatusAction(
  orderId: string,
  newStatus: OrderStatus
): Promise<OrderActionResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  console.log(
    "SessHGHJGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGHYTYTUYYYYYYYYYYion:",
    session
  );

  const userRole = await prisma.user.findUnique({
    where: { id: session?.user?.id },
    select: { role: true },
  });

  if (!session?.user || !session.user.id || userRole?.role !== UserRole.ADMIN) {
    return { error: "Unauthorized: Admin access required." };
  }

  if (!orderId) {
    return { error: "Invalid Order ID." };
  }

  if (!Object.values(OrderStatus).includes(newStatus)) {
    return { error: "Invalid status value provided." };
  }

  try {
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },

      select: { id: true, status: true, userId: true },
    });

    if (!existingOrder) {
      return { error: "Order not found." };
    }

    if (newStatus === "CANCELED") {
      const orderItems = await prisma.orderItem.findMany({
        where: { orderId: existingOrder.id },
        select: { productId: true, quantity: true },
      });

      for (const item of orderItems) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        });
      }
    }

    if (existingOrder.status === newStatus) {
      return { error: "No status change needed." };
    }

    if (existingOrder.status === "CANCELED" && newStatus === "PENDING") {
       const orderItems = await prisma.orderItem.findMany({
        where: { orderId: existingOrder.id },
        select: { productId: true, quantity: true },
      });

      for (const item of orderItems) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }
    }

    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: newStatus,
      },
    });

    console.log(
      `Admin ${session.user.email} updated order ${orderId} status to ${newStatus}`
    );
  } catch (error: any) {
    console.error(`Error updating status for order ${orderId}:`, error);
    return { error: "Database error: Could not update order status." };
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);

  revalidatePath("/account/orders");
  revalidatePath(`/account/orders/${orderId}`);

  return { success: true };
}
