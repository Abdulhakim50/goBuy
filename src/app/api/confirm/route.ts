import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { headers } from "next/headers";
import prisma from "@/app/lib/prisma";
import { Prisma } from "@prisma/client";
import { CartItem,Product,OrderStatus } from "@prisma/client";

// This endpoint expects a GET with a query param (?tnx_ref=...)

type CartWithItems = Prisma.CartGetPayload<{ include: { items: true } }>;
type CartItemWithProduct = CartItem & {
  product: Pick<Product, "id" | "name" | "price" | "stock">;
};


export async function GET(req: NextRequest) {
  // Get the transaction reference from the query string

  const session = await auth.api.getSession({
     headers: await headers(),
   });
 
   if (!session?.user?.id) {
     return { error: "User not authenticated", status: 401 };
   }
   const userId = session.user.id;

  const tax_ref = req.nextUrl.searchParams.get("tax_ref");
  const amount = req.nextUrl.searchParams.get("amount");

  if (!tax_ref) {
    return NextResponse.json(
      { message: "Missing transaction reference", status: "error" },
      { status: 400 }
    );
  }

  if (!amount) {
    return NextResponse.json(
      { message: "Missing amount", status: "error" },
      { status: 400 }
    );
  }

  try {
    // Chapa expects a GET request for verification
    const chapaRes = await fetch(
      `https://api.chapa.co/v1/transaction/verify/${tax_ref}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
        },
      }
    );

    const data = await chapaRes.json();

    if (data.status !== "success") {
      return NextResponse.json(
        { message: "Chapa Verification Failed", status: "error", chapa: data },
        { status: 400 }
      );
    }

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
    
    try {
          await prisma.order.create({
            data: {
              userId: userId,
              totalAmount: parseInt(amount), // Ensure amount is a number
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

    return NextResponse.json({
      message: "Payment successful",
      status: "success",
      chapa: data,
    });
  } catch (e: any) {
    console.log("Error in payment verification:", e);
    return NextResponse.json(
      { message: `Webhook error: ${e.message || e}`, status: "error" },
      { status: 400 }
    );
  }
}
