// src/components/product-card.tsx
"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Product } from "@prisma/client";
import { useCartStore } from "@/stores/cart-store";
import { toast } from "sonner";
import { Button } from "./ui/button"; // Import the ShadCN Button
import { ShoppingBag } from "lucide-react"; // A fitting icon
import { cn } from "@/lib/utils";

// A small utility to format the price nicely. You could move this to a `lib/utils.ts` file.
const formatPrice = (price: number) => {
    // Formats the number with commas and appends the currency.
    return `${new Intl.NumberFormat('en-US').format(price)} ETB`;
};

interface ProductCardProps {
    product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
    const { addItem } = useCartStore();

    if (!product) {
        // A simple fallback, though this should ideally be handled before rendering
        return (
            <div className="flex h-[450px] w-full items-center justify-center rounded-lg bg-muted text-muted-foreground">
                Product not found
            </div>
        );
    }

    const handleAddToCart = async (e: React.MouseEvent<HTMLButtonElement>) => {
        // Prevent the link navigation when the button is clicked
        e.preventDefault();
        e.stopPropagation();

        const res = await addItem(product, 1);

        if (!res.success) {
            toast.error("Could not add item", { description: res.message });
        } else {
            toast.success("Item added to your bag!", {
                description: `"${product.name}" is ready for checkout.`,
            });
        }
    };

    const isOutOfStock = product.stock === 0;

    return (
        // The `group` class is essential for the hover effects on child elements
        <div className="group relative flex h-full w-full flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow duration-300 hover:shadow-lg dark:border-neutral-800">
            {/* Out of Stock Badge */}
            {isOutOfStock && (
                <div className="absolute left-3 top-3 z-10 rounded-full bg-neutral-900/70 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                    Out of Stock
                </div>
            )}

            {/* Image Container with Link and Zoom Effect */}
            <Link href={`/products/${product.slug}`} aria-label={`View details for ${product.name}`}>
                <div className="relative h-64 w-full overflow-hidden sm:h-72">
                    <Image
                        src={product.imagePath ?? "/placeholder-image.png"}
                        alt={product.name}
                        fill
                        className={cn(
                            "object-cover transition-transform duration-500 ease-in-out group-hover:scale-105",
                            isOutOfStock ? "grayscale" : "" // Grayscale image if out of stock
                        )}
                        sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw"
                    />
                </div>
            </Link>

            {/* Content Area */}
            <div className="flex flex-1 flex-col p-4">
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-card-foreground">
                        <Link href={`/products/${product.slug}`} className="hover:underline">
                            {product.name}
                        </Link>
                    </h3>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {product.description}
                    </p>
                </div>
                
                {/* Price (always visible) */}
                <p className="mt-4 text-xl font-bold text-card-foreground">
                    {formatPrice(product.price)}
                </p>
            </div>

            {/* Add to Cart Button - Appears on hover */}
            <div className="absolute bottom-0 left-0 w-full p-4">
                <Button
                    onClick={handleAddToCart}
                    disabled={isOutOfStock}
                    aria-label={isOutOfStock ? "Item out of stock" : `Add ${product.name} to cart`}
                    size="lg"
                    className={cn(
                        "w-full bg-black/70 text-white backdrop-blur-sm transition-all duration-300 ease-in-out hover:bg-black/90 dark:bg-white/80 dark:text-black dark:hover:bg-white",
                        "opacity-0 group-hover:opacity-100", // Fade in on hover
                        "translate-y-4 group-hover:translate-y-0" // Slide up on hover
                    )}
                >
                    <ShoppingBag className="mr-2 h-5 w-5" />
                    {isOutOfStock ? "Out of Stock" : "Add to Bag"}
                </Button>
            </div>
        </div>
    );
}