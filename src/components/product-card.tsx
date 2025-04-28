import React from "react";
import Image from "next/image";
import Link from "next/link";

interface Product {
  id: string;
  name: string;
  slug : String;
  description: string;
  images: string[];
}

const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 transition hover:shadow-lg">
      <div className="relative w-full h-64">
      <Link href={`/products/${product.slug}`}>
        <Image
          src={product.images?.[0] || "/placeholder.png"} // Fallback if image is missing
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
};

export default ProductCard;
