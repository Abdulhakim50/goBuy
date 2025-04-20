// src/lib/stripe.ts
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is missing in environment variables');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    typescript: true,
    // You can add other configurations here if needed
});

// Optional: Helper to calculate order amount in cents
export function calculateOrderAmountInCents(items: Array<{ price: number; quantity: number }>): number {
    const total = items.reduce((acc, item) => {
        return acc + (item.price * item.quantity);
    }, 0);
    // Convert to cents and ensure it's an integer
    return Math.round(total * 100);
}