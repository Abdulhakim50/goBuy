import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Product } from "@prisma/client";

interface ProductCardProps {
  // Adjust prop type based on what data you select/pass
  product: Pick<Product, "id" | "name" | "slug" | "price" | "imagePath">;
}
export default function ProductCard({ product }: ProductCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 transition hover:shadow-lg">
      <div className="relative w-full h-64">
        <Link href={`/products/${product.slug}`}>
          <Image
            src={product.imagePath ?? "/placeholder-image.png"}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 100vw"
          />
        </Link>
      </div>
      <div className="p-4 space-y-2">
        <h2 className="text-lg font-semibold text-gray-800">{product.name}</h2>
        <p className="text-sm text-gray-600">{product.description}</p>
      </div>
    </div>
  );
}
