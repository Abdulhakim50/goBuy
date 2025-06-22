// src/components/layout/cart-icon.tsx
'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client'; // Use session to trigger initial fetch
import { useCartStore } from '@/stores/cart-store';

export default function CartIcon() {
    // Subscribe to the cart store
    // const itemCount = useCartStore((state) => state.itemCount);
    // const fetchInitialCount = useCartStore((state) => state.fetchInitialCount);
    // const resetCount = useCartStore((state) => state.resetCount); // Get reset action

   const totalItems = useCartStore((state)=> state.totalItems)
   const clearCart = useCartStore((state) => state.clearCart); // Action to clear cart

    const { 
        data: session, 
        isPending, //loading state
        error, //error object
        refetch //refetch the session
    } = authClient.useSession() 

    // Fetch initial count when component mounts *and* session is loaded (authenticated or unauthenticated)
    // Only fetch if the count hasn't been potentially set already (basic check)
    // useEffect(() => {
    //     if (isPending) { // Ensure session status is determined
    //         console.log("CartIcon: Session status resolved, attempting initial fetch.");
    //         fetchInitialCount();
    //     }

    //     // Optional: Listen for sign-out events to reset count?
    //     // NextAuth might trigger session updates, which could re-run this effect.
    //     // If using NextAuth event listeners, you could call resetCount there.

    // }, [isPending, fetchInitialCount]); // Depend on session status


     // Reset count on sign out (using session status change)
     useEffect(() => {
        if (error) {
            console.log("CartIcon: User unauthenticated, resetting cart count.");
            clearCart();
        }
    }, [error, clearCart]);


    return (
        <Button variant="outline" size="icon" className="relative h-9 w-9" asChild>
            <Link href="/cart" aria-label={`Shopping cart with ${totalItems} items`}>
                <ShoppingCart className="h-4 w-4" />
                 {/* Badge to show item count */}
                 {(
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  {totalItems}
                    </span>
                 )}
            </Link>
        </Button>
    );
}