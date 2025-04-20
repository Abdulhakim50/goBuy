// src/app/products/page.tsx
import prisma from "@/app/lib/prisma";
import ProductCard from "@/components/product-card"; // Create this component
import { Metadata } from "next";
import { Product } from "@prisma/client";

export const metadata: Metadata = {
  title: "Products | MyShop",
  description: "Browse our collection of products.",
};

type SafeProduct = Omit<Product, "description"> & {
  description: string | null;
};
// This component fetches data on the server
export default async function ProductsPage() {
  // TODO: Add pagination, filtering, sorting based on searchParams
  const products = await prisma.product.findMany({
    // Select specific fields if needed
    // select: { id: true, name: true, slug: true, price: true, images: true },
  
    orderBy: { createdAt: 'desc' },
    take: 20, // Example: Limit results   
  });

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Products</h1>
      {products.length === 0 ? (
        <p>No products found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product: Product ) => (
            <ProductCard key={product.id} product ={product} />
          ))}
        </div>
      )}
      {/* TODO: Add Pagination controls */}
    </div>
  );
}
// Optional: Revalidate data periodically or on demand
// export const revalidate = 3600; // Revalidate every hour