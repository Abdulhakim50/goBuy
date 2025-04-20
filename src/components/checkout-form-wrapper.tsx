'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { createPaymentIntentAction } from '@/actions/order'; // Import the Server Action
import { Loader2 } from 'lucide-react';
// import PaymentElementComponent from './payment-element'; // We will create this next!

// Interface for shipping details (expand as needed)
interface ShippingDetails {
    name: string;
    addressLine1: string;
    city: string;
    postalCode: string;
    country: string; // Consider using a country code (e.g., 'US')
}

export default function CheckoutFormWrapper() {
    const [isPending, startTransition] = useTransition();
    const [step, setStep] = useState<'shipping' | 'payment'>('shipping'); // Control flow: shipping -> payment
    const [shippingDetails, setShippingDetails] = useState<ShippingDetails>({
        name: '',
        addressLine1: '',
        city: '',
        postalCode: '',
        country: 'US', // Default or select
    });
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [orderTotal, setOrderTotal] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleShippingSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null); // Clear previous errors

        // Basic validation (add more robust validation)
        if (!shippingDetails.name || !shippingDetails.addressLine1 || !shippingDetails.city || !shippingDetails.postalCode) {
             setError("Please fill in all required shipping fields.");
             return;
        }

        // Call the server action to create payment intent
        startTransition(async () => {
            const result = await createPaymentIntentAction(); // Pass shipping details if needed by action

            if (result.error) {
                setError(result.error);
                toast('Checkout Error',{
                    description: result.error,
                });
            } else if (result.success && result.clientSecret) {
                setClientSecret(result.clientSecret);
                setOrderTotal(result.orderTotal);
                setStep('payment'); // Move to the payment step
            }
        });
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
         const { name, value } = event.target;
         setShippingDetails(prev => ({ ...prev, [name]: value }));
    };

    // --- Render Logic ---

    if (step === 'shipping') {
        return (
            <form onSubmit={handleShippingSubmit} className="space-y-4 border p-6 rounded-lg">
                 <h2 className="text-xl font-semibold mb-4">Shipping Address</h2>
                 {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

                 {/* Add form fields for shipping details */}
                 <div>
                     <Label htmlFor="name">Full Name</Label>
                     <Input id="name" name="name" value={shippingDetails.name} onChange={handleInputChange} required disabled={isPending} />
                 </div>
                 <div>
                     <Label htmlFor="addressLine1">Address Line 1</Label>
                     <Input id="addressLine1" name="addressLine1" value={shippingDetails.addressLine1} onChange={handleInputChange} required disabled={isPending} />
                 </div>
                 {/* Add fields for city, postal code, country etc. */}
                 <div>
                     <Label htmlFor="city">City</Label>
                     <Input id="city" name="city" value={shippingDetails.city} onChange={handleInputChange} required disabled={isPending} />
                 </div>
                 <div>
                     <Label htmlFor="postalCode">Postal Code</Label>
                     <Input id="postalCode" name="postalCode" value={shippingDetails.postalCode} onChange={handleInputChange} required disabled={isPending} />
                 </div>
                 {/* Add Country select later */}


                 <Button type="submit" className="w-full" disabled={isPending}>
                     {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                     {isPending ? 'Processing...' : 'Continue to Payment'}
                 </Button>
            </form>
        );
    }

    if (step === 'payment' && clientSecret) {
        // Placeholder for the actual Stripe Payment Element component
        return (
            <div className="border p-6 rounded-lg">
                <h2 className="text-xl font-semibold mb-4">Payment Details</h2>
                <p className="mb-4">Please enter your payment information below to complete your order.</p>
                <p className="font-semibold mb-4">Order Total: ${orderTotal?.toFixed(2)}</p>

                {/* We will replace this div with the Stripe Elements component in the next step */}
                <div className="bg-gray-100 p-4 rounded text-center text-gray-600">
                    Stripe Payment Form will load here...
                    <p className='text-xs break-all'>Client Secret (for demo): {clientSecret}</p>
                </div>

                 {/* Example of passing clientSecret and shippingDetails */}
                {/* <PaymentElementComponent clientSecret={clientSecret} shippingDetails={shippingDetails} /> */}
            </div>
        );
    }

    // Fallback or initial loading state (optional)
    return <div className='text-center'><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
}