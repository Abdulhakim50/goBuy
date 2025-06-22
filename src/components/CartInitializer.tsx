// components/CartInitializer.tsx
'use client';

import { useCartStore } from '@/stores/cart-store';
import { useEffect, useRef } from 'react';

// This component ensures cart is loaded from DB on initial app load/hydration
// It only runs once.
export function CartInitializer() {
  const loadCart = useCartStore((state) => state.loadCart);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (!isInitialized.current) {
      loadCart();
      isInitialized.current = true;
    }
  }, [loadCart]);

  return null; // This component doesn't render anything
}
