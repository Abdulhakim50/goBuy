"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Product } from "@prisma/client";
import { useCartStore } from "@/stores/cart-store";
import {toast} from "sonner"; // For notifications
interface ProductCardProps {
  // Adjust prop type based on what data you select/pass
  product:Product
}
export default function ProductCard({ product }: ProductCardProps) {
  const { items,addItem,error } = useCartStore();

  if (!product) {
    return <div className="p-4 text-gray-500">Product not found</div>;
  }
  const handleAddToCart = async () => {
    // if(error || error  !== "") {
    //   toast.error(error, 
    //    { description: "Please try again later.",}
    //   )
    // }
    
   const res = await addItem(product, 1);

   if(res) {
    toast.error('Error adding item to cart', 
      { description: res.message}
    )
   }
  };
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
        <strong>{product.price}</strong>
        <button
          onClick={()=>product.stock > 0  && handleAddToCart()}
          className=" border-2 p-3 m-5 rounded-md text-green-500"
        >
           {product.stock > 0 ? (
              <span className="  cursor-pointer font-medium border-2 border-green-600 p-3 m-5 rounded-md text-green-500">
                addtoCart
              </span>
            ) : (
              <span className="text-red-600 font-medium  cursor-not-allowed border-2 border-red-500 p-3 m-5 rounded-md">Out of Stock</span>
            )}
        </button>
      </div>
    </div>
  );
}
