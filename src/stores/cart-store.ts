// src/stores/cart-store.ts
import { create } from 'zustand';

// Define the state structure and actions
interface CartState {
    itemCount: number;
    fetchInitialCount: () => Promise<void>; // Action to get count on initial load/login
    incrementCount: (by?: number) => void; // Action when adding items
    decrementCount: (by?: number) => void; // Action when removing items
    setCount: (count: number) => void; // Action to set count directly (e.g., after full cart fetch)
    resetCount: () => void; // Action on logout or cart clear
}

// --- Mock Fetch Function (Replace with actual API/Server Action call) ---
// This function needs to securely get the item count for the logged-in user
// or potentially read from localStorage for guests.
// It's complex because it needs to run client-side but get server/session data.
// A dedicated Route Handler or using useSession + fetch might be needed.
// For simplicity, we'll start with a placeholder.
async function fetchUserCartItemCount(): Promise<number> {
    console.log("Attempting to fetch initial cart count...");
    // Option 1: Route Handler (Example)
    // try {
    //     const response = await fetch('/api/cart/count'); // Create this API endpoint
    //     if (!response.ok) throw new Error('Failed to fetch count');
    //     const data = await response.json();
    //     return data.itemCount ?? 0;
    // } catch (error) {
    //     console.error("Error fetching cart count:", error);
    //     return 0;
    // }

    // Option 2: Placeholder (replace!)
    // Simulate fetching - replace with real logic using useSession/fetch or Route Handler
    // This requires careful handling of auth state client-side.
    await new Promise(resolve => setTimeout(resolve, 50)); // Simulate delay
    // In a real app, this would involve checking session, calling an API/action
    const simulatedCount = 0; // Replace with actual fetch result
    console.log(`Simulated fetch returned count: ${simulatedCount}`);
    return simulatedCount;

    // Option 3: Read from localStorage (for guest cart count) - Combine with Option 1/2 for logged-in users
}
// --- End Mock Fetch ---


export const useCartStore = create<CartState>((set, get) => ({
    itemCount: 0, // Initial state

    // Fetches the initial count (e.g., on app load or login)
    fetchInitialCount: async () => {
        // Avoid multiple fetches if count is already > 0 maybe? Or check session status.
        // if (get().itemCount > 0) return;
        const count = await fetchUserCartItemCount();
        set({ itemCount: count });
    },

    // Increment count (usually by 1 item type added)
    incrementCount: (by = 1) => set((state) => ({ itemCount: state.itemCount + by })),

    // Decrement count (usually by 1 item type removed)
    decrementCount: (by = 1) => set((state) => ({ itemCount: Math.max(0, state.itemCount - by) })), // Ensure count doesn't go below 0

    // Set count directly (e.g., after adding/removing/updating quantity on cart page)
    setCount: (count) => set({ itemCount: Math.max(0, count) }),

    // Reset count (e.g., on logout or after successful order placement)
    resetCount: () => set({ itemCount: 0 }),
}));

// --- Optional: Trigger initial fetch ---
// This attempts to fetch count when the store is first initialized (on client)
// Be mindful of timing with session loading. Might be better to call this explicitly
// from a layout or main component once the session is ready.
// useCartStore.getState().fetchInitialCount();
// console.log("Initial cart count fetch triggered from store definition.");