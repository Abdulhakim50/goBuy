import { create } from 'zustand';
import { Product } from '@prisma/client'; // Assuming you have this type from Prisma

// Define a type for the return value of actions, perfect for toast notifications
export interface CartActionResult {
  success: boolean;
  message: string;
}

export interface CartItemClient extends Product { // Extends Product to include all product details
  productId: string; // Explicitly ensure productId is here for clarity
  quantity: number;
  priceAtPurchase: number; // Price when added to cart
}

interface CartState {
  items: CartItemClient[];
  isLoading: boolean;
  error: string | null; // For persistent errors, not transient toasts
  totalItems: number;
  totalPrice: number;
  cartId: string | null;

  // Actions now return a promise with a result object
  addItem: (product: Product, quantity: number) => Promise<CartActionResult>;
  removeItem: (productId: string) => Promise<CartActionResult>;
  updateQuantity: (productId: string, quantity: number) => Promise<CartActionResult>;
  clearCart: () => Promise<CartActionResult>;
  loadCart: () => Promise<void>; // Load doesn't need a result, it just populates state
  setCartId: (id: string | null) => void;
}

// --- Helper Functions for DRY principle ---

const calculateTotals = (items: CartItemClient[]) => {
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.priceAtPurchase * item.quantity, 0);
  return { totalItems, totalPrice };
};

// Helper to map server cart data to client state format
const mapServerCartToClientState = (serverCart: any) => {
  if (!serverCart || !serverCart.items) {
    return { items: [], totalItems: 0, totalPrice: 0, cartId: null };
  }
  const clientItems: CartItemClient[] = serverCart.items.map((item: any) => ({
    ...item.product, // Spread all product details
    productId: item.productId,
    quantity: item.quantity,
    priceAtPurchase: item.priceAtPurchase,
  }));
  return {
    items: clientItems,
    ...calculateTotals(clientItems),
    cartId: serverCart.id,
  };
};

// --- Zustand Store Implementation ---

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  isLoading: false,
  error: null,
  totalItems: 0,
  totalPrice: 0,
  cartId: null,

  setCartId: (id) => set({ cartId: id }),

  addItem: async (product, quantity) => {
    set({ isLoading: true, error: null });
    const existingItem = get().items.find(item => item.id === product.id);
    const newQuantity = (existingItem?.quantity || 0) + quantity;

    // **IMPROVED: Comprehensive stock check**
    if (product.stock < newQuantity) {
      const message = existingItem
        ? `Cannot add more. You already have ${existingItem.quantity} in cart, and only ${product.stock} are available.`
        : `Not enough stock. Only ${product.stock} available.`;
      set({ isLoading: false }); // No need for an error in state, the return value handles it
      return { success: false, message };
    }

    try {
      // Optimistic update
      let updatedItems: CartItemClient[];
      if (existingItem) {
        updatedItems = get().items.map(item =>
          item.id === product.id
            ? { ...item, quantity: newQuantity, priceAtPurchase: product.price }
            : item
        );
      } else {
        updatedItems = [
          ...get().items,
          { ...product, productId: product.id, quantity, priceAtPurchase: product.price },
        ];
      }
      set({ items: updatedItems, ...calculateTotals(updatedItems) });

      const response = await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, quantity }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add item to cart');
      }

      const { cart: updatedCart } = await response.json();
      set({ ...mapServerCartToClientState(updatedCart), isLoading: false });
      return { success: true, message: `${product.name} added to cart!` };

    } catch (error: any) {
      console.error("Error adding item:", error);
      // Revert optimistic update by reloading the cart from the server
      await get().loadCart();
      set({ isLoading: false }); // loadCart will handle loading state
      return { success: false, message: error.message };
    }
  },

  removeItem: async (productId) => {
    set({ isLoading: true, error: null });
    const originalItems = get().items;
    const itemToRemove = originalItems.find(item => item.productId === productId);

    if (!itemToRemove) {
      return { success: false, message: "Item not found in cart." };
    }

    // Optimistic update
    const updatedItems = originalItems.filter(item => item.productId !== productId);
    set({ items: updatedItems, ...calculateTotals(updatedItems) });

    try {
      const response = await fetch('/api/cart/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });

      if (!response.ok) throw new Error('Failed to remove item');

      const { cart: updatedCart } = await response.json();
      set({ ...mapServerCartToClientState(updatedCart), isLoading: false });
      return { success: true, message: `${itemToRemove.name} removed from cart.` };

    } catch (error: any) {
      set({ items: originalItems, ...calculateTotals(originalItems), error: error.message, isLoading: false });
      return { success: false, message: error.message };
    }
  },

  updateQuantity: async (productId, quantity) => {
    if (quantity <= 0) {
      return get().removeItem(productId);
    }

    set({ isLoading: true, error: null });
    const originalItems = get().items;
    const itemToUpdate = originalItems.find(item => item.productId === productId);

    if (!itemToUpdate) {
        set({ isLoading: false });
        return { success: false, message: "Item not found in cart." };
    }

    // **IMPROVED: Stock check on update**
    if (itemToUpdate.stock < quantity) {
        set({ isLoading: false });
        const message = `Cannot update quantity. Only ${itemToUpdate.stock} available.`;
        return { success: false, message };
    }

    // Optimistic update
    const updatedItems = originalItems.map(item =>
      item.productId === productId ? { ...item, quantity } : item
    );
    set({ items: updatedItems, ...calculateTotals(updatedItems) });

    try {
      const response = await fetch('/api/cart/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity }),
      });

      if (!response.ok) throw new Error('Failed to update quantity');

      const { cart: updatedCart } = await response.json();
      set({ ...mapServerCartToClientState(updatedCart), isLoading: false });
      return { success: true, message: `Cart updated.` };

    } catch (error: any) {
      set({ items: originalItems, ...calculateTotals(originalItems), error: error.message, isLoading: false });
      return { success: false, message: error.message };
    }
  },

  clearCart: async () => {
    set({ isLoading: true, error: null });
    const originalItems = get().items;
    set({ items: [], totalItems: 0, totalPrice: 0 }); // Optimistic

    try {
      const response = await fetch('/api/cart/clear', { method: 'POST' });
      if (!response.ok) throw new Error('Failed to clear cart');
      set({ isLoading: false, cartId: null });
      return { success: true, message: "Cart cleared successfully." };
    } catch (error: any) {
      set({ items: originalItems, ...calculateTotals(originalItems), error: error.message, isLoading: false });
      return { success: false, message: error.message };
    }
  },

  loadCart: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/cart');
      if (response.status === 404) {
        set({ ...mapServerCartToClientState(null), isLoading: false });
        return;
      }
      if (!response.ok) throw new Error('Failed to load cart from server');

      const cartData = await response.json();
      set({ ...mapServerCartToClientState(cartData), isLoading: false });

    } catch (error: any) {
      console.error("Error loading cart:", error);
      set({ error: error.message, isLoading: false, items: [], totalItems: 0, totalPrice: 0, cartId: null });
    }
  },
}));