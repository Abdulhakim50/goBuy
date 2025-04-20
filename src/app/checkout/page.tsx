// src/app/checkout/page.tsx
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/app/lib/auth';
import CheckoutFormWrapper from '@/components/checkout-form-wrapper'; // We'll create this Client Component

export const metadata: Metadata = {
    title: 'Checkout | MyShop',
    description: 'Complete your purchase.',
};

// Prevent caching of this page if authentication state is critical
export const dynamic = 'force-dynamic';

export default async function CheckoutPage() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect('/login?callbackUrl=/checkout');
    }

    // You could potentially pre-fetch cart summary data here if needed
    // for display before the payment intent is created, but it's often
    // handled within the client component flow after intent creation.

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-6 text-center">Checkout</h1>

            {/*
              We use a wrapper Client Component here because the process involves:
              1. Maybe collecting Shipping info first (client-side state).
              2. Calling the Server Action to get the client_secret.
              3. Setting up Stripe Elements, which requires client-side JS and the client_secret.
            */}
            <CheckoutFormWrapper />

        </div>
    );
}