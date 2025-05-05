"use client"; // This component needs interactivity

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useCartStore } from '@/stores/cart-store'; //
import { addToCartAction } from "@/actions/cart"; // Import the Server Action
import { Loader2 } from "lucide-react"; // Icon for loading state

interface AddToCartButtonProps {
  productId: string;
  // Add availableStock if needed for client-side validation/feedback
}

export default function AddToCartButton({ productId }: AddToCartButtonProps) {
  const [quantity, setQuantity] = useState(1);
  const [isPending, startTransition] = useTransition(); // Hook for loading state with Server Actions
   
  const { setCount } = useCartStore();  

  
  const handleAddToCart = () => {
    if (quantity <= 0) {
      toast("Invalid Quantity", {
        description: "Please enter a quantity greater than zero.",
      });
      return;
    }

    // Use startTransition to wrap the Server Action call
    startTransition(async () => {
      const result = await addToCartAction(productId, quantity);

      if (result?.error) {
        toast("Error", {
          description: result.error,
        });
        // Handle specific errors, e.g., redirect to login if 401
        if (result.status === 401) {
          // Maybe show login modal or redirect
          // window.location.href = '/login'; // Simple redirect example
        }
      } else if (result?.success) {
        toast("Success!", {
          description: result.message || "Item added to cart.",
        });
        // Optionally reset quantity or provide other feedback
        // setQuantity(1);
      } else {
        // Fallback generic error
        toast("Error", {
          description: "Something went wrong. Please try again.",
        });
      }
    });
  };

  return (
    <div className="flex items-center gap-4">
      <Input
        type="number"
        min="1"
        // max={availableStock} // Add max based on stock if passed
        value={quantity}
        onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
        className="w-20"
        disabled={isPending}
      />
      <Button onClick={handleAddToCart} disabled={isPending}>
        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {isPending ? "Adding..." : "Add to Cart"}
      </Button>
    </div>
  );
}
