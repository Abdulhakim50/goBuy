// src/lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Price Formatting Helper
export function formatPrice(
    price: number,
    options: {
        currency?: 'USD' | 'EUR' | 'GBP' | 'BDT'; // Add more as needed
        notation?: Intl.NumberFormatOptions['notation'];
    } = {}
) {
    const { currency = 'USD', notation = 'compact' } = options;

    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        notation, // 'compact' shortens (e.g., $1K), standard is default
        maximumFractionDigits: 2,
    }).format(price);
}