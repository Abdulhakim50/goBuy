"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
import {
  updateCartItemQuantityAction,
  removeFromCartAction,
} from "@/actions/cart"; // Import Server Actions

interface CartItemActionsProps {
  cartItemId: string;
  initialQuantity: number;
  productId: string; // Keep productId if needed for stock check feedback
}

export default function CartItemActions({
  cartItemId,
  initialQuantity,
  productId,
}: CartItemActionsProps) {
  const [quantity, setQuantity] = useState(initialQuantity);
  const [isPendingUpdate, startUpdateTransition] = useTransition();
  const [isPendingRemove, startRemoveTransition] = useTransition();

  const handleQuantityChange = (newQuantityStr: string) => {
    const newQuantity = parseInt(newQuantityStr, 10);

    if (isNaN(newQuantity) || newQuantity === quantity) return; // No change or invalid input

    // Optimistic UI update (optional but improves perceived performance)
    const previousQuantity = quantity;
    setQuantity(newQuantity); // Update local state immediately

    startUpdateTransition(async () => {
      const result = await updateCartItemQuantityAction(
        cartItemId,
        newQuantity
      );

      if (result?.error) {
        // Revert optimistic update on error
        setQuantity(previousQuantity);
        toast("Update Failed", {
          description: result.error,
        });
      } else {
        // Success message (optional)
        // toast({ title: "Quantity updated" });
        // No need to setQuantity again, revalidation will fetch the latest state
      }
    });
  };

  const handleRemoveItem = () => {
    startRemoveTransition(async () => {
      const result = await removeFromCartAction(cartItemId);

      if (result?.error) {
        toast("Remove Failed", {
          description: result.error,
        });
      } else {
        toast("Item Removed", {
          description: "The item has been removed from your cart.",
        });
        // The page will re-render due to revalidatePath in the action
      }
    });
  };

  const isPending = isPendingUpdate || isPendingRemove;

  return (
    <div className="flex items-center gap-2">
      {/* Quantity Input */}
      <Input
        type="number"
        min="1"
        // Consider adding a max based on available stock if easily accessible
        value={quantity}
        onChange={(e) => handleQuantityChange(e.target.value)}
        className="w-16 h-9 text-center"
        disabled={isPending} // Disable input during transitions
        aria-label="Item quantity"
      />

      {/* Remove Button */}
      <Button
        variant="outline"
        size="icon"
        onClick={handleRemoveItem}
        disabled={isPending}
        className="h-9 w-9"
        aria-label="Remove item"
      >
        {isPendingRemove ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
      </Button>
      {/* Display loader during quantity update if needed */}
      {isPendingUpdate && (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      )}
    </div>
  );
}
