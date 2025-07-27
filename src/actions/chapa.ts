"use server";

import { headers } from "next/headers";
import { auth } from "@/auth";
import prisma from "@/app/lib/prisma";
import { OrderStatus, Prisma } from "@prisma/client";
import { calculateOrderAmountInCents } from "@/app/lib/stripe"; // Assuming this works for you

type ChapaInitResponse = {
  message: string;
  status: string;
  data: {
    checkout_url: string;
  };
};

type CreateOrderResult =
  | { success: true; checkoutUrl: string }
  | { error: string };

export async function chapaPaymentInitaization(): Promise<CreateOrderResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;

  if (!userId) {
    return { error: "User not authenticated." };
  }

  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: { product: true },
      },
    },
  });

  if (!cart || cart.items.length === 0) {
    return { error: "Your cart is empty." };
  }

  const tx_ref = `txn-${userId}-${Date.now()}`;
  const amountInCents = calculateOrderAmountInCents(
    cart.items.map((item) => ({
      price: item.product.price,
      quantity: item.quantity,
    }))
  );
  const amountInBirr = amountInCents / 100;

  // --- CRITICAL: Use a Database Transaction ---
  try {
    await prisma.$transaction(async (tx) => {
      // 1. Check for stock one last time inside the transaction
      for (const item of cart.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });
        if (!product || product.stock < item.quantity) {
          throw new Error(`Insufficient stock for ${item.product.name}.`);
        }
      }

      // 2. Create the Order with a 'PENDING' status
      await tx.order.create({
        data: {
          userId: userId,
          totalAmount: amountInBirr,
          status: OrderStatus.PENDING,
          tx_ref: tx_ref, // Link the order to the Chapa transaction
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.product.price,
            })),
          },
        },
      });

      // 3. Decrement stock for EACH item
    });
  } catch (error: any) {
    console.error("Transaction failed:", error);
    return {
      error: error.message || "Could not create your order. Please try again.",
    };
  }
  // --- End of Transaction ---

  // 5. If the transaction was successful, THEN initialize payment with Chapa
  try {
    const res = await fetch("https://api.chapa.co/v1/transaction/initialize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
      },
      body: JSON.stringify({
        amount: amountInBirr,
        currency: "ETB",
        email: session.user.email,
        first_name: session.user.name,
        tx_ref: tx_ref,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/chapa/webhook`,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/orderConfirmation/confirm?tx_ref=${tx_ref}`,
      }),
    });

    const chapaResponse: ChapaInitResponse = await res.json();

    if (
      chapaResponse.status !== "success" ||
      !chapaResponse.data.checkout_url
    ) {
      // TODO: Here you should handle payment init failure by canceling the order
      // and restoring stock. For now, we'll just return an error.
      console.error("Chapa initialization failed:", chapaResponse);
      return { error: "Could not connect to the payment provider." };
    }
    
     
    
  

    return { success: true, checkoutUrl: chapaResponse.data.checkout_url };
  } catch (error) {
    console.error("Error initializing Chapa payment:", error);
    return { error: "An error occurred while setting up your payment." };
  }
}
