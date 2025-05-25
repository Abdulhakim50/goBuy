"use client";

import { useState, useTransition, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { createPaymentIntentAction } from "@/actions/order";
import { Loader2 } from "lucide-react";

// --- Stripe Imports ---
import { loadStripe, StripeElementsOptions } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import PaymentElementForm from "./payment-element-form"; // Import the new component
import { formatPrice } from "@/app/lib/utils";
// --- End Stripe Imports ---

// Load Stripe outside of the component's render cycle
// Make sure to use NEXT_PUBLIC_ prefix for the publishable key
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

interface ShippingDetails {
  name: string;
  addressLine1: string;
  city: string;
  postalCode: string;
  country: string;
}

export default function CheckoutFormWrapper() {
  const [isPendingAction, startTransition] = useTransition();
  const [step, setStep] = useState<"shipping" | "payment">("shipping");
  const [shippingDetails, setShippingDetails] = useState<ShippingDetails>({
    name: "",
    addressLine1: "",
    city: "",
    postalCode: "",
    country: "",
  }); // Keep your state
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderTotal, setOrderTotal] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleShippingSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    // ... your validation ...

    startTransition(async () => {
      const result =
        await createPaymentIntentAction(/* pass shipping if needed */);
      if (result.error) {
        setError(result.error);
        toast(/* ... */);
      } else if (result.success && result.clientSecret) {
        setClientSecret(result.clientSecret);
        setOrderTotal(result.orderTotal);
        setStep("payment");
      }
    });
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setShippingDetails((prev) => ({ ...prev, [name]: value }));
  };

  // --- Stripe Elements Options ---
  // Pass the clientSecret obtained from the server action
  // Appearance API can be used for detailed styling
  const options: StripeElementsOptions | undefined = clientSecret
    ? {
        clientSecret,
        appearance: {
          theme: "stripe", // or 'night', 'flat', or use Appearance API variables
          // variables: { colorPrimary: '#0570de' },
        },
      }
    : undefined;
  // --- End Stripe Elements Options ---

  // --- Render Logic ---

  if (step === "shipping") {
    return (
      <form
        onSubmit={handleShippingSubmit}
        className="space-y-4 border p-6 rounded-lg"
      >
        {/* ... Your Shipping form fields ... */}
        <h2 className="text-xl font-semibold mb-4">Shipping Address</h2>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        {/* Add form fields for shipping details */}
        <div>
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            name="name"
            value={shippingDetails.name}
            onChange={handleInputChange}
            required
            disabled={isPendingAction}
          />
        </div>
        <div>
          <Label htmlFor="addressLine1">Address Line 1</Label>
          <Input
            id="addressLine1"
            name="addressLine1"
            value={shippingDetails.addressLine1}
            onChange={handleInputChange}
            required
            disabled={isPendingAction}
          />
        </div>
        {/* Add fields for city, postal code, country etc. */}
        <div>
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            name="city"
            value={shippingDetails.city}
            onChange={handleInputChange}
            required
            disabled={isPendingAction}
          />
        </div>
        <div>
          <Label htmlFor="postalCode">Postal Code</Label>
          <Input
            id="postalCode"
            name="postalCode"
            value={shippingDetails.postalCode}
            onChange={handleInputChange}
            required
            disabled={isPendingAction}
          />
        </div>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        {/* ... name, address, city, postalCode ... */}
        <Button type="submit" className="w-full" disabled={isPendingAction}>
          {isPendingAction ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          {isPendingAction ? "Processing..." : "Continue to Payment"}
        </Button>
      </form>
    );
  }

  if (step === "payment" && clientSecret && options && orderTotal !== null) {
    return (
      <div className="border p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Payment Details</h2>
        <p className="mb-4">
          Complete your payment for {formatPrice(orderTotal)}.
        </p>
        {/* --- Stripe Elements Integration --- */}
        <Elements options={options} stripe={stripePromise}>
          <PaymentElementForm
            clientSecret={clientSecret}
            orderTotal={orderTotal}
            // shippingDetails={shippingDetails} // Pass if needed
          />
        </Elements>
        {/* --- End Stripe Elements Integration --- */}
      </div>
    );
  }

  // Fallback / Loading state after shipping submission
  if (isPendingAction) {
    return (
      <div className="text-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Initial state or error state before shipping
  return (
    <div className="text-center py-10 text-muted-foreground">
      Please complete shipping details.
    </div>
  );
}
