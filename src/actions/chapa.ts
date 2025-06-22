"use server";

import { calculateOrderAmountInCents } from "@/app/lib/stripe";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { Product, CartItem,OrderStatus } from "@prisma/client";
import prisma from "@/app/lib/prisma";

type ChapaInitResponse = {
  message: string;
  status: string;
  data: {
    checkout_url: string;
  };
};

// export async function chapaPaymentInitaization(): Promise<ChapaInitResponse> {
//   const tax_ref = `txn_${Date.now()}`; // Unique transaction reference

//   const res = await fetch("https://api.chapa.co/v1/transaction/initialize", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
//     },
//     body: JSON.stringify({
//       amount: 1000,
//       currency: "ETB",
//       email: "la@gmail.com",
//       first_name: "John",
//       last_name: "Doe",
//       phone_number: "0912345678",
//       tx_ref: tax_ref,
//       callback_url: "http://localhost:3000/confirm",
//       return_url: `http://localhost:3000/orderConfirmation/${tax_ref}`,
//       metadata: {
//         custom_field: "value",
//       },
//     }),
//   });

//   const data: ChapaInitResponse = await res.json();

//   if (!res.ok || data.status !== "success") {
//     throw new Error(`Chapa Init Failed: ${data.message}`);
//   }

//   return data;
// }

type CartItemWithProduct = CartItem & {
  product: Pick<Product, "id" | "name" | "price" | "stock">;
};

interface OrderActionResult {
  error?: string | null;
  success?: boolean;
}

type CreatePaymentIntentResult =
  | { success: true; data : ChapaInitResponse; orderTotal: number }
  | { error: string; status?: number };

export async function chapaPaymentInitaization(): Promise<CreatePaymentIntentResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return { error: "User not authenticated", status: 401 };
  }
  const userId = session.user.id;
  const tax_ref = `txn_${Date.now()}`;

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

    // const paymentIntent = await stripe.paymentIntents.create({
    //   amount: amountInCents,
    //   currency: "usd",
    //   metadata: {
    //     userId: userId,
    //   },

    //   payment_method_types: ["card"],
    // });

    const res = await fetch("https://api.chapa.co/v1/transaction/initialize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
      },
      body: JSON.stringify({
        amount: amountInCents / 100, // Chapa expects amount in the smallest currency unit
        currency: "ETB",
        email: session?.user.email ,
        first_name: session.user.name,
        tx_ref: tax_ref,
        callback_url: "http://localhost:3000/confirm",
        return_url: `http://localhost:3000/orderConfirmation/${tax_ref}`,
    
      }),
    });

    const data: ChapaInitResponse = await res.json();

    if (!res.ok || data.status !== "success") {
      throw new Error(`Chapa Init Failed: ${data.message}`);
    }

    // if (!paymentIntent.client_secret) {
    //   throw new Error("Failed to create Payment Intent client secret.");
    // }

    try {
      await prisma.order.create({
        data: {
          userId: userId,
          totalAmount: amountInCents / 100,
          status: OrderStatus.PENDING,

          items: {
            create: cartItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.product.price,
            })),
          },
        },
      });
    
    } catch (orderError: any) {
      console.error(
        `❌ CRITICAL: Failed to create PENDING order after PI creation):`,
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
      data: data,
      orderTotal: amountInCents / 100,
    };
  } catch (error: any) {
    console.error("Error creating Payment Intent:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Could not initiate checkout";
    return { error: errorMessage, status: 500 };
  }
}
