// src/app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers'; // To get request headers
import { stripe } from '@/app/lib/stripe'; // Your configured Stripe instance
import prisma from '@/app/lib/prisma';

// Ensure webhook secret is set
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set in environment variables.");
    // Optionally throw an error during build/startup in production
}

export async function POST(req: NextRequest) {
    if (!webhookSecret) {
        return NextResponse.json({ error: 'Server configuration error: Missing webhook secret.' }, { status: 500 });
    }
    

    const buf = await req.arrayBuffer();
    // const body = await req.text(); // Get raw body as textbody
    // console.log('params for stripe payment',body)
    // const signature = headers().get('stripe-signature') as string; // Get signature from headers
    const signature = req.headers.get('stripe-signature') as string;
    console.log('stripe signature',signature)
    
    let event: Stripe.Event;

    // --- Verify the webhook signature ---
    try {
        event = stripe.webhooks.constructEvent(
            Buffer.from(buf),
            signature,
            webhookSecret
        );
        console.log('eeeevvvveeennntt',event)
    } catch (err: any) {
        console.error(`❌ Error verifying webhook signature: ${err.message}`);
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    console.log(`🔔 Stripe Webhook Received: ${event.type}`); // Log received event type

    // --- Handle the specific event type ---
    switch (event.type) {
        case 'payment_intent.succeeded':
            const paymentIntentSucceeded = event.data.object as Stripe.PaymentIntent;
            console.log(`💰 PaymentIntent succeeded: ${paymentIntentSucceeded.id}`);
            await handlePaymentIntentSucceeded(paymentIntentSucceeded);
            break;

        case 'payment_intent.payment_failed':
            const paymentIntentFailed = event.data.object as Stripe.PaymentIntent;
            console.log(`🚫 PaymentIntent failed: ${paymentIntentFailed.id}`);
            // Optional: Handle payment failure (e.g., log, notify user differently)
             await handlePaymentIntentFailed(paymentIntentFailed);
            break;

        // ... handle other event types you care about (e.g., 'checkout.session.completed', 'charge.refunded')
        // case 'charge.succeeded':
        //     const chargeSucceeded = event.data.object as Stripe.Charge;
        //     // Handle charge succeeded if needed (often covered by payment_intent.succeeded)
        //     break;

        default:
            console.log(`Unhandled event type: ${event.type}`);
    }

    // --- Return a 200 response to acknowledge receipt of the event ---
    return NextResponse.json({ received: true });
}

// --- Helper function to handle successful payments ---
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    const paymentIntentId = paymentIntent.id;
    const userId = paymentIntent.metadata?.userId; // Retrieve metadata set during creation
    // const cartId = paymentIntent.metadata?.cartId; // If you stored it

    if (!userId) {
        console.error(`❌ Missing userId in PaymentIntent metadata for ID: ${paymentIntentId}`);
        // You might want to still update an order if you can find it via paymentIntentId,
        // but logging the error is important.
        return; // Or handle differently
    }

    try {
        // --- Idempotency Check: Ensure we haven't processed this already ---
        // Find the order associated with this payment intent
        const existingOrder = await prisma.order.findUnique({
            where: { stripePaymentIntentId: paymentIntentId },
            select: { id: true, status: true } // Select only needed fields
        });

        if (existingOrder && existingOrder.status === 'PAID') {
            console.log(`☑️ Order ${existingOrder.id} for PaymentIntent ${paymentIntentId} already marked as PAID.`);
            return; // Already processed, safely exit
        }

        // --- Update Order Status ---
        // If the order doesn't exist yet OR needs status update
        // NOTE: This assumes you created a PENDING order when the PaymentIntent was created.
        // If not, you might need to CREATE the order here using cart data (which is less ideal).
        // Let's assume PENDING order exists:
        const updatedOrder = await prisma.order.update({
            where: { stripePaymentIntentId: paymentIntentId },
            data: {
                status: 'PAID',
                // You might also store charge ID or other details if needed
                // stripeChargeId: paymentIntent.latest_charge as string | null,
            },
            include: {
                 items: { // Include items to deduct stock
                     select: { productId: true, quantity: true }
                 }
            }
        });
        console.log(`✅ Updated Order ${updatedOrder.id} status to PAID.`);

        // --- Deduct Stock ---
        // Use a transaction to ensure all stock updates succeed or fail together
        const stockUpdates = updatedOrder.items.map(item =>
            prisma.product.update({
                where: { id: item.productId },
                data: {
                    stock: {
                        decrement: item.quantity,
                    },
                },
            })
        );
        await prisma.$transaction(stockUpdates);
        console.log(`📦 Deducted stock for Order ${updatedOrder.id}.`);

        // --- Clear User's Cart ---
        // Find the cart by userId and delete its items (or the whole cart if desired)
        const cart = await prisma.cart.findUnique({ where: { userId } });
        if (cart) {
            await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
            console.log(`🛒 Cleared cart for user ${userId}.`);
            // TODO: Trigger revalidation for cart-related UI if using tags
            // revalidateTag(`cart-${userId}`);
        }

        // --- TODO: Send Order Confirmation Email ---
        // Use a service like Resend, SendGrid, etc.
        // await sendOrderConfirmationEmail(userId, updatedOrder.id);
        console.log(`📧 Triggered order confirmation email for Order ${updatedOrder.id}.`);


    } catch (error: any) {
        console.error(`❌ Error handling payment_intent.succeeded for ${paymentIntentId}:`, error);
        // Consider alerting mechanisms here for failures in webhook processing
    }
}

// --- Optional: Handle failed payments ---
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
    const paymentIntentId = paymentIntent.id;
    const userId = paymentIntent.metadata?.userId;

    console.log(`Handling failed payment for PI: ${paymentIntentId}, User: ${userId}`);

    try {
         // Find the corresponding order (if it exists)
         const order = await prisma.order.findUnique({
            where: { stripePaymentIntentId: paymentIntentId },
            select: { id: true, status: true }
         });

        // If an order exists and is still PENDING, you might update its status to 'FAILED'
        // or simply log the event. You generally wouldn't clear the cart or deduct stock here.
         if (order && order.status === 'PENDING') {
             await prisma.order.update({
                 where: { id: order.id },
                 data: { status: 'FAILED' } // Add 'FAILED' to your status enum/types
             });
             console.log(`📉 Updated Order ${order.id} status to FAILED.`);
         }

        // TODO: Optionally send a notification email to the user about the failed payment.
        // await sendPaymentFailedEmail(userId, paymentIntent.last_payment_error?.message);

    } catch (error) {
         console.error(`❌ Error handling payment_intent.payment_failed for ${paymentIntentId}:`, error);
    }
}