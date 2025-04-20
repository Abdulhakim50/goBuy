// src/components/payment-element-form.tsx
'use client';

import { useEffect, useState, useTransition } from 'react';
import {
    PaymentElement,
    useStripe,
    useElements
} from '@stripe/react-stripe-js';
import { StripePaymentElementOptions } from '@stripe/stripe-js'; // Import type
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { formatPrice } from '@/app/lib/utils'; // Assuming you have this

interface PaymentElementFormProps {
    clientSecret: string;
    orderTotal: number;
    // Optionally pass shipping details if needed for display or Stripe
    // shippingDetails: ShippingDetails;
}

export default function PaymentElementForm({ clientSecret, orderTotal }: PaymentElementFormProps) {
    const stripe = useStripe(); // Hook to get the Stripe instance
    const elements = useElements(); // Hook to get Elements instance (for PaymentElement)

    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!stripe || !elements) {
            // Stripe.js hasn't yet loaded.
            // Make sure to disable form submission until Stripe.js has loaded.
            console.error("Stripe.js has not loaded yet.");
            setErrorMessage("Payment processing is not ready. Please wait a moment and try again.");
            return;
        }

        setIsProcessing(true); // Show loading state
        setErrorMessage(null); // Clear previous errors

        // Trigger form validation and wallet collection
        const { error: submitError } = await elements.submit();
        if (submitError) {
             setErrorMessage(submitError.message ?? "An error occurred during validation.");
             setIsProcessing(false);
             return;
        }

        // Confirm the Payment Intent using the clientSecret
        const { error } = await stripe.confirmPayment({
            elements, // Pass the Elements instance tied to the PaymentElement
            clientSecret, // The client secret obtained from your server action
            confirmParams: {
                // Make sure to change this to your payment completion page
                // This is where Stripe redirects the user after authentication (like 3D Secure)
                return_url: `${window.location.origin}/order/confirm`, // Crucial! Create this page next.
                // You can pass payment_method_data here if needed (e.g., billing details
                // if not collected by PaymentElement, though usually it does)
                // payment_method_data: {
                //    billing_details: { ... }
                // }
            },
            // If you handle redirects yourself (less common for Payment Element)
            // redirect: 'if_required'
        });

        // Handle errors from stripe.confirmPayment. It will only reach here if
        // there's an immediate error (e.g., network issue, invalid client secret).
        // Most successes and recoverable failures (like failed 3DS) result in a redirect.
        if (error) {
            console.error("Stripe confirmation error:", error);
            setErrorMessage(error.message ?? "An unexpected error occurred. Please try again.");
            setIsProcessing(false); // Re-enable button
        }

        // If confirmPayment is called without an immediate error, the user is typically
        // redirected by Stripe to the `return_url`. You don't usually need
        // to handle the success case *here* because the processing happens
        // on the redirected page or via webhooks. setIsProcessing(false) might
        // not even be reached if the redirect happens.
    };

    // Define appearance and layout options for the PaymentElement
    const paymentElementOptions: StripePaymentElementOptions = {
        layout: 'tabs', // 'tabs', 'accordion', 'spaced'
        // Add other options like defaultValues, business, etc. if needed
        // see: https://stripe.com/docs/js/elements_object/create_payment_element#payment_element_create-options
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* The PaymentElement dynamically renders input fields for card details, wallets, etc. */}
            <PaymentElement options={paymentElementOptions} />

            {errorMessage && (
                <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-md">
                    {errorMessage}
                </div>
            )}

            <Button
                type="submit"
                disabled={!stripe || !elements || isProcessing}
                className="w-full"
            >
                {isProcessing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {isProcessing ? 'Processing...' : `Pay ${formatPrice(orderTotal)}`}
            </Button>
        </form>
    );
}