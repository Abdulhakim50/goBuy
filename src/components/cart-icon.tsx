// src/components/layout/cart-icon.tsx
'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/stores/cart-store'; // Import the store hook
import { useSession } from 'next-auth/react'; // Use session to trigger initial fetch

export default function CartIcon() {
    // Subscribe to the cart store
    const itemCount = useCartStore((state) => state.itemCount);
    const fetchInitialCount = useCartStore((state) => state.fetchInitialCount);
    const resetCount = useCartStore((state) => state.resetCount); // Get reset action
    const { status } = useSession(); // Get session status

    // Fetch initial count when component mounts *and* session is loaded (authenticated or unauthenticated)
    // Only fetch if the count hasn't been potentially set already (basic check)
    useEffect(() => {
        if (status !== 'loading') { // Ensure session status is determined
            console.log("CartIcon: Session status resolved, attempting initial fetch.");
            fetchInitialCount();
        }

        // Optional: Listen for sign-out events to reset count?
        // NextAuth might trigger session updates, which could re-run this effect.
        // If using NextAuth event listeners, you could call resetCount there.

    }, [status, fetchInitialCount]); // Depend on session status


     // Reset count on sign out (using session status change)
     useEffect(() => {
        if (status === 'unauthenticated') {
            console.log("CartIcon: User unauthenticated, resetting cart count.");
            resetCount();
        }
    }, [status, resetCount]);


    return (
        <Button variant="outline" size="icon" className="relative h-9 w-9" asChild>
            <Link href="/cart" aria-label={`Shopping cart with ${itemCount} items`}>
                <ShoppingCart className="h-4 w-4" />
                 {/* Badge to show item count */}
                 {itemCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                        {itemCount}
                    </span>
                 )}
            </Link>
        </Button>
    );
}