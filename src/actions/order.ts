"use server";

import prisma from "@/app/lib/prisma";
import { auth } from "@/app/lib/auth";
import { stripe, calculateOrderAmountInCents } from "@/app/lib/stripe";
import { CartItem, Product, OrderStatus,UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";

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
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "User not authenticated", status: 401 };
  }
  const userId = session.user.id;

  try {
    // 1. Retrieve the user's cart items from the database (server-side source of truth)
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, price: true, stock: true }, // Include stock
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return { error: "Cart is empty", status: 400 };
    }

    const cartItems: CartItemWithProduct[] = cart.items;

    // 2. Verify stock levels (important check before payment)
    for (const item of cartItems) {
      if (item.product.stock < item.quantity) {
        return {
          error: `Insufficient stock for ${item.product.name}. Only ${item.product.stock} left.`,
          status: 400,
        };
      }
    }

    // 3. Calculate the total amount *on the server* in the smallest currency unit (e.g., cents)
    const amountInCents = calculateOrderAmountInCents(
      cartItems.map((item) => ({
        price: item.product.price,
        quantity: item.quantity,
      }))
    );

    if (amountInCents <= 0) {
      return { error: "Invalid order amount", status: 400 };
    }

    // Optional: Look for an existing Order with a matching PaymentIntent that hasn't been paid yet
    // This prevents creating multiple PaymentIntents for the same checkout attempt if the user refreshes, etc.
    // You'd need to add a 'stripePaymentIntentId' field to your Order model.
    // Let's skip this optimization for simplicity now, but consider it for production.

    // 4. Create a Payment Intent with Stripe
    // We pass metadata which can be useful for linking the Stripe payment back to our order/user
    // especially in webhook handlers.
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "usd", // Or your desired currency
      metadata: {
        userId: userId,
        // Add other relevant info like cartId if needed: cartId: cart.id
      },
      // You might enable automatic_payment_methods in production for broader payment options
      // automatic_payment_methods: { enabled: true },
      payment_method_types: ["card"], // Start with card payments
    });

    if (!paymentIntent.client_secret) {
      throw new Error("Failed to create Payment Intent client secret.");
    }

    try {
      await prisma.order.create({
        data: {
          userId: userId,
          totalAmount: amountInCents / 100, // Store standard amount
          status: OrderStatus.PENDING, // Use enum
          stripePaymentIntentId: paymentIntent.id, // Link to PaymentIntent
          // Create OrderItems based on CartItems
          items: {
            create: cartItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.product.price, // Store price at time of order
            })),
          },
          // Store shipping address if collected earlier
          // shippingAddress: JSON.stringify(shippingDetails),
        },
      });
      console.log(
        `Created PENDING order for PaymentIntent: ${paymentIntent.id}`
      );
    } catch (orderError: any) {
      // If order creation fails AFTER payment intent is created, it's tricky.
      // Ideally, log this severe error. Maybe try to refund/cancel the PaymentIntent?
      // This highlights why database transactions covering multiple operations are useful.
      console.error(
        `❌ CRITICAL: Failed to create PENDING order after PI creation (${paymentIntent.id}):`,
        orderError
      );
      // Don't return client_secret if order failed to save, as we can't fulfill it later.
      return {
        error: "Failed to save order details. Please try again later.",
        status: 500,
      };
    }

    // Optional: Create a preliminary Order record in your DB with 'PENDING' status
    // and associate the paymentIntent.id. This helps track attempts.
    // await prisma.order.create({ data: { userId, totalAmount: amountInCents / 100, status: 'PENDING', stripePaymentIntentId: paymentIntent.id, items: { create: ... } }});

    // 5. Return the client_secret and the calculated total
    return {
      success: true,
      clientSecret: paymentIntent.client_secret,
      orderTotal: amountInCents / 100, // Return total in standard currency unit for display
    };
  } catch (error: any) {
    console.error("Error creating Payment Intent:", error);
    // Provide a more specific error message if possible
    const errorMessage =
      error instanceof Error ? error.message : "Could not initiate checkout";
    return { error: errorMessage, status: 500 };
  }
}



export async function updateOrderStatusAction(
  orderId: string,
  newStatus: OrderStatus
): Promise<OrderActionResult> {

  // 1. Check Authentication & Authorization (Admin Only)
  const session = await auth();
  if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return { error: "Unauthorized: Admin access required." };
  }

  // 2. Validate Inputs (Basic)
  if (!orderId) {
      return { error: "Invalid Order ID." };
  }
  // Ensure the newStatus is a valid OrderStatus enum value
  if (!Object.values(OrderStatus).includes(newStatus)) {
       return { error: "Invalid status value provided."};
  }


  try {
      // 3. Find the existing order to ensure it exists
      const existingOrder = await prisma.order.findUnique({
          where: { id: orderId },
          // Include userId if needed for notifications
          select: { id: true, status: true, userId: true }
      });

      if (!existingOrder) {
          return { error: "Order not found." };
      }

      // 4. Optional: Prevent changing status back from terminal states (e.g., DELIVERED, CANCELED)
      // if ([OrderStatus.DELIVERED, OrderStatus.CANCELED, OrderStatus.FAILED].includes(existingOrder.status)) {
      //      if (existingOrder.status !== newStatus) { // Allow setting *to* the same terminal state? Maybe not needed.
      //          return { error: `Cannot change status from a terminal state (${existingOrder.status}).` };
      //      }
      // }

      // 5. Update the order status
      await prisma.order.update({
          where: { id: orderId },
          data: {
              status: newStatus,
              // Optionally update updatedAt timestamp automatically (Prisma does this)
          },
      });

      console.log(`Admin ${session.user.email} updated order ${orderId} status to ${newStatus}`);

      // --- Side Effects ---
      // 6. TODO: Send status update notification email to the customer
      // Only send for specific transitions (e.g., PAID -> SHIPPED, SHIPPED -> DELIVERED)
      // if (newStatus === OrderStatus.SHIPPED || newStatus === OrderStatus.DELIVERED) {
      //    await sendOrderStatusUpdateEmail(existingOrder.userId, orderId, newStatus);
      // }


  } catch (error: any) {
      console.error(`Error updating status for order ${orderId}:`, error);
      return { error: "Database error: Could not update order status." };
  }

  // 7. Revalidate relevant paths
  revalidatePath('/admin/orders'); // Admin list
  revalidatePath(`/admin/orders/${orderId}`); // Admin detail
  // Revalidate customer's order history as well
  revalidatePath('/account/orders');
  revalidatePath(`/account/orders/${orderId}`);

  return { success: true }; // Indicate success
}
