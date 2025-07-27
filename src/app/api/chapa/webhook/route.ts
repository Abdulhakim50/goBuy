import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { OrderStatus } from "@prisma/client";
import * as crypto from "crypto";

// This is the secure endpoint Chapa will call.
export async function POST(req: NextRequest) {
  // 1. Verify the webhook signature to ensure it's from Chapa
  const signature = req.headers.get("x-chapa-signature");
  const bodyText = await req.text(); // Read the raw body text

  if (!signature) {
    return NextResponse.json({ message: "Signature missing" }, { status: 400 });
  }

  try {
    const hash = crypto
      .createHmac("sha256", "123456789")
      .update(bodyText)
      .digest("hex");

    if (hash !== signature) {
      return NextResponse.json({ message: "Invalid signature" }, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json({ message: "Error verifying signature" }, { status: 500 });
  }

  // 2. If signature is valid, process the event
  try {
    const event = JSON.parse(bodyText);
    const { tx_ref, status } = event;

    if (!tx_ref) {
      return NextResponse.json({ message: "Missing tx_ref" }, { status: 400 });
    }

    // Find the order that is waiting for this payment
    const order = await prisma.order.findUnique({
      where: { tx_ref: tx_ref, status: OrderStatus.PENDING },
      include: { items: true }
    });

    if (!order) {
      // Could be an old webhook or one we've already processed. It's safe to ignore.
      console.log(`Webhook received for unknown or already processed tx_ref: ${tx_ref}`);
      return NextResponse.json({ message: "Order not found or already processed" }, { status: 200 });
    }

    // 3. Update order status based on the webhook event
    if (status === 'success') {
      // PAYMENT SUCCESSFUL
      await prisma.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.PAID },
      });
      // TODO: Send a confirmation email here
      console.log(`✅ Order ${order.id} (tx_ref: ${tx_ref}) marked as PAID.`);
    } else {
      // PAYMENT FAILED OR CANCELED
      console.log(`❌ Order ${order.id} (tx_ref: ${tx_ref}) payment failed. Restoring stock.`);
      // Use a transaction to safely restore stock and update the order
      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.FAILED },
        });

        // Restore stock for each item in the failed order
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
      });
    }

    // 4. Respond to Chapa to acknowledge receipt of the webhook
    return NextResponse.json({ message: "Webhook received" }, { status: 200 });

  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ message: `Webhook error: ${error.message}` }, { status: 400 });
  }
}