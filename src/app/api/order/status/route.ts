import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { auth } from "@/auth";
import { headers } from "next/headers";

// This endpoint is for the client to poll the status of an order
export async function GET(req: NextRequest) {
   const session = await auth.api.getSession({
      headers: await headers(),
    }); // Use the standard auth() helper
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const tx_ref = req.nextUrl.searchParams.get("tx_ref");

  if (!tx_ref) {
    return NextResponse.json({ error: "Missing tx_ref" }, { status: 400 });
  }

  try {
    const order = await prisma.order.findFirst({
      where: {
        tx_ref: tx_ref,
        userId: session.user.id, // Ensure users can only query their own orders
      },
      select: {
        status: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    

    return NextResponse.json({ status: order.status });
  } catch (error) {
    console.error("Error fetching order status:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}