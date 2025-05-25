// src/app/products/[slug]/page.tsx
import prisma from "@/app/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import AddToCartButton from "@/components/add-to-cart-button";

type Props = {
  params: { slug: string };
};

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = params;

  const product = await prisma.product.findUnique({
    where: { slug },
  });

  if (!product) {
    notFound();
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* Breadcrumb */}
      <nav className="text-sm text-muted-foreground mb-4">
        <span className="hover:underline cursor-pointer">Home</span> / 
        <span className="hover:underline cursor-pointer ml-1">Products</span> / 
        <span className="ml-1 text-foreground">{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-10">
        {/* Image Section */}
        <div className="relative group">
          {product.imagePath ? (
            <Image
              src={product.imagePath}
              alt={product.name}
              width={600}
              height={600}
              className="rounded-2xl object-cover w-full shadow-lg group-hover:scale-105 transition-transform duration-300 ease-in-out"
              priority
            />
          ) : (
            <div className="w-full h-[500px] bg-secondary rounded-xl flex items-center justify-center text-muted-foreground text-lg">
              No Image Available
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold tracking-tight">{product.name}</h1>
            {product.stock > 10 && (
              <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-full">
                Best Seller
              </span>
            )}
          </div>

          <p className="text-muted-foreground leading-relaxed">{product.description}</p>

          {/* Price */}
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold text-primary">${product.price.toFixed(2)}</span>
            <span className="bg-primary/10 text-primary px-2 py-1 text-xs rounded-md">
              Limited Time Offer
            </span>
          </div>

          {/* Stock Info */}
          <div>
            {product.stock > 0 ? (
              <span className="text-green-600 font-medium">
                In Stock — {product.stock} left
              </span>
            ) : (
              <span className="text-red-600 font-medium">Out of Stock</span>
            )}
          </div>

          {/* Add to Cart Button */}
          {product.stock > 0 && (
            <div className="mt-4">
              <AddToCartButton productId={product.id} />
            </div>
          )}

          {/* Category or Tags (if you add it to schema) */}
          {product.category && (
            <div className="text-sm text-muted-foreground mt-2">
              Category: <span className="text-foreground font-medium">{product.category}</span>
            </div>
          )}
        </div>
      </div>

      {/* --- Related Products or Suggestion Section (Stub) --- */}
      {/* You can fetch more products here and show cards */}
      {/* <RelatedProducts currentProductId={product.id} /> */}
    </div>
  );
}

