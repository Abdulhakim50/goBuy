"use client"; // This component needs interactivity

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useCartStore } from "@/stores/cart-store"; //
import { addToCartAction } from "@/actions/cart"; // Import the Server Action
import { Loader2 } from "lucide-react"; // Icon for loading state
import { Product } from "@prisma/client";

interface AddToCartButtonProps {
  productId: string;
  // Add availableStock if needed for client-side validation/feedback
}

export default function AddToCartButton({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1);
  const [isPending, startTransition] = useTransition(); // Hook for loading state with Server Actions
  const addItemToCart = useCartStore((state) => state.addItem);
  const {updateQuantity,items,totalItems} = useCartStore(); // Destructure to access store state/actions if needed
  const isLoading = useCartStore((state) => state.isLoading);
  // const { setCount } = useCartStore();
  // const { incrementCount } = useCartStore();




   const handleQuantityChange = async (newQuantityStr: string) => {
    const item = items.find((i)=>i.id === product.id)
    console.log("itemmmmmmmmmmmmm", item?.stock)
  
      if(item?.stock < parseInt(newQuantityStr)) {
        toast("Insufficient stock available")
        return;
        }

    const newQuantity = item?.stock  < parseInt(newQuantityStr)? item?.stock : parseInt(newQuantityStr, 10);
   
    setQuantity(newQuantity); // Ensure quantity does not exceed stock

   const res = await updateQuantity(product.id, newQuantity);

   

    if (res?.success === false) {
      toast(res.message, {});
      return;
    }

    // const newQuantity = parseInt(newQuantityStr, 10);

    // if (isNaN(newQuantity) || newQuantity === quantity) return; // No change or invalid input

    // // Optimistic UI update (optional but improves perceived performance)
    // const previousQuantity = quantity;
    // setQuantity(newQuantity); // Update local state immediately

    // startUpdateTransition(async () => {
    //   const result = await updateCartItemQuantityAction(
    //     cartItemId,
    //     newQuantity
    //   );

    //   if (result?.error) {
    //     // Revert optimistic update on error
    //     setQuantity(previousQuantity);
    //     toast("Update Failed", {
    //       description: result.error,
    //     });
    //   } else {
    //     // Success message (optional)
    //     // toast({ title: "Quantity updated" });
    //     // No need to setQuantity again, revalidation will fetch the latest state
    //   }
    // });
  };


  const handleAddToCart = async () => {
    const res = await addItemToCart(product, quantity);

    if (res?.success === false) {
      toast(res.message, {});
      return;
    }

    // Use startTransition to wrap the Server Action call
    // startTransition(async () => {
    //   const result = await addToCartAction(productId, quantity);

    //   if (result?.error) {
    //     toast("Error", {
    //       description: result.error,
    //     });
    //     // Handle specific errors, e.g., redirect to login if 401
    //     if (result.status === 401) {
    //       // Maybe show login modal or redirect
    //       // window.location.href = '/login'; // Simple redirect example
    //     }
    //   } else if (result?.success) {

    //     toast("Success!", {
    //       description: result.message || "Item added to cart.",
    //     });
    //     // Optionally reset quantity or provide other feedback
    //     // setQuantity(1);
    //     incrementCount(quantity); // Just add the quantity

    //   } else {
    //     // Fallback generic error
    //     toast("Error", {
    //       description: "Something went wrong. Please try again.",
    //     });
    //   }
    // });
  };

  return (
    <div className="flex items-center gap-4">
      <Input
        type="number"
        min="0"
        // max={availableStock} // Add max based on stock if passed
        value={totalItems}
        onChange={(e)=>handleQuantityChange(e.target.value)}
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
