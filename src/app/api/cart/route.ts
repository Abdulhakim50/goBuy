import { NextResponse } from 'next/server';
import { getOrCreateCart } from './cart-utils'; // (move getOrCreateCart to a shared utils file)
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const cart = await getOrCreateCart(request);
    if (!cart) {
      // This case means no session ID was found and no user logged in.
      // The middleware should prevent this for browser requests.
      // For direct API calls, this might indicate an issue.
      // Returning 404 is reasonable if no cart is expected to exist.
      return NextResponse.json({ message: 'Cart not found or session not established' }, { status: 404 });
    }
    return NextResponse.json(cart);
  } catch (error) {
    console.error('Failed to get cart:', error);
    return NextResponse.json({ message: 'Failed to retrieve cart', error: (error as Error).message }, { status: 500 });
  }
}