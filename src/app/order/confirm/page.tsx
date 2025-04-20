// src/app/order/confirm/page.tsx
import { Suspense } from 'react';
import { stripe } from '@/app/lib/stripe'; // Server-side Stripe instance
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { Metadata } from 'next';
import { Loader2 } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Order Confirmation | MyShop',
};

// This component will extract params and fetch status
async function ConfirmationStatus({ paymentIntentId, clientSecret }: { paymentIntentId: string, clientSecret: string }) {
    if (!stripe) {
        return <StatusDisplay status="error" message="Stripe configuration error." />;
    }
    if (!paymentIntentId || !clientSecret) {
         return <StatusDisplay status="error" message="Missing payment information." />;
    }

    try {
        // Retrieve the PaymentIntent from Stripe using the ID and secret
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
            client_secret: clientSecret,
        });

        // Analyze the status
        switch (paymentIntent.status) {
            case 'succeeded':
                // Important: While this indicates success to the user,
                // rely on WEBHOOKS to fulfill the order reliably in your backend.
                return <StatusDisplay status="success" message="Payment Successful! Your order is confirmed." paymentIntentId={paymentIntentId} />;
            case 'processing':
                return <StatusDisplay status="processing" message="Your payment is processing. We'll update you when it's complete." />;
            case 'requires_payment_method':
                 // This might happen if the initial attempt failed on this page
                 return <StatusDisplay status="error" message="Payment failed. Please try another payment method." showRetry={true} />;
            case 'requires_action':
                 // Should typically not land here if redirect flow worked, but handle just in case
                 return <StatusDisplay status="error" message="Further action required. Please follow the prompts from your bank." />;
            case 'canceled':
                 return <StatusDisplay status="error" message="Payment was canceled." />;
            default:
                return <StatusDisplay status="error" message="Something went wrong. Please contact support." />;
        }
    } catch (error: any) {
        console.error("Error retrieving PaymentIntent:", error);
         return <StatusDisplay status="error" message={error.message || "An error occurred while retrieving payment status."} />;
    }
}

// Simple component to display status visually
function StatusDisplay({ status, message, showRetry = false, paymentIntentId }: { status: 'success' | 'processing' | 'error', message: string, showRetry?: boolean, paymentIntentId?: string }) {
    let Icon = Clock;
    let color = "text-yellow-600";
    let bgColor = "bg-yellow-50";

    if (status === 'success') {
        Icon = CheckCircle;
        color = "text-green-600";
        bgColor = "bg-green-50";
    } else if (status === 'error') {
        Icon = XCircle;
        color = "text-red-600";
        bgColor = "bg-red-50";
    }

    return (
        <div className={`max-w-md mx-auto mt-10 p-6 border rounded-lg text-center ${bgColor}`}>
            <Icon className={`w-12 h-12 mx-auto mb-4 ${color}`} />
            <h2 className={`text-xl font-semibold mb-2 ${color}`}>
                {status === 'success' ? 'Payment Confirmed' : status === 'processing' ? 'Payment Processing' : 'Payment Issue'}
            </h2>
            <p className="text-muted-foreground mb-6">{message}</p>
            {paymentIntentId && status === 'success' && (
                 <p className="text-sm text-muted-foreground mb-4">Order Reference: {paymentIntentId}</p>
            )}
            <div className="flex justify-center gap-4">
                <Button asChild variant="outline">
                    <Link href="/products">Continue Shopping</Link>
                </Button>
                {showRetry && (
                     <Button asChild>
                        <Link href="/checkout">Try Again</Link>
                    </Button>
                )}
                 {status === 'success' && ( // Link to order history (create later)
                     <Button asChild>
                        <Link href="/account/orders">View Orders</Link>
                    </Button>
                )}
            </div>
        </div>
    );
}


// The Page component itself uses Suspense for client-side parameter reading
export default function OrderConfirmationPage({
    searchParams,
}: {
    searchParams?: { [key: string]: string | string[] | undefined };
}) {
    const paymentIntentId = searchParams?.payment_intent as string;
    const clientSecret = searchParams?.payment_intent_client_secret as string;

    // Use Suspense to handle the async component and client-side param reading
    // Note: For server-side parameter reading and data fetching based on them,
    // you'd typically make the page component async and read params directly.
    // Here, Suspense handles the fallback while the client gets the params.
    return (
         <Suspense fallback={<div className='text-center py-20'><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /> Loading confirmation...</div>}>
            <ConfirmationStatus paymentIntentId={paymentIntentId} clientSecret={clientSecret} />
        </Suspense>
    );
}