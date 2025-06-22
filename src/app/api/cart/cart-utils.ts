// app/api/cart/cart-utils.ts
import prisma from "@/app/lib/prisma";
import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { CART_SESSION_COOKIE_NAME } from "@/middleware"; // Use the constant
import { auth } from "@/auth";
import { headers } from "next/headers";
// import { getServerSession } from "next-auth/next" // If using NextAuth
// import { authOptions } from "@/app/api/auth/[...nextauth]/route"

// Helper to get current user (example with NextAuth, adapt if using something else)
// async function getCurrentUser() {
//  const session = await auth.api.getSession({
//       headers: await headers()
//   })

//    if (!session) {

//      return { error: "Unauthenticated", status: 401 };
//    }
//    return session.user;
// }

export async function getOrCreateCart(req?: NextRequest) {
  const cookieStore = await cookies();
  let cartSessionId = cookieStore.get(CART_SESSION_COOKIE_NAME)?.value;

  let cart;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { error: "Unauthenticated", status: 401 };
  }

  if (session.user?.id) {
    // Logged-in user
    cart = await prisma.cart.findFirst({
      where: { userId: session.user.id },
      include: {
        items: {
          include: { product: true }, // Include product details with each item
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!cart) {
      // If user logged in and had a guest cart, we could merge it here
      // For now, just create a new cart for the user
      cart = await prisma.cart.create({
        data: { userId: session.user.id },
        include: { items: { include: { product: true } } },
      });
    }
  } else if (cartSessionId) {
    // Guest user with session ID
    cart = await prisma.cart.findFirst({
      where: { sessionId: cartSessionId },
      include: {
        items: {
          include: { product: true },
          orderBy: { createdAt: "asc" },
        },
      },
    });
    if (!cart) {
      cart = await prisma.cart.create({
        data: { sessionId: cartSessionId },
        include: { items: { include: { product: true } } },
      });
    }
  } else {
 
    cartSessionId = (await cookies()).get(CART_SESSION_COOKIE_NAME)?.value;
    if (!cartSessionId) {
      
      console.error(
        "Cart session ID cookie not found in getOrCreateCart. Middleware might not be running or configured correctly for this path."
      );
      return null; 
    }
    cart = await prisma.cart.create({
      data: {sessionId: cartSessionId },
      include: { items: { include: { product: true } } },
    });
  }
  return cart;
}
