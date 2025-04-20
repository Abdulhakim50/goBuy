// src/app/products/[slug]/page.tsx
import prisma from "@/app/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Metadata } from "next";
import AddToCartButton from "@/components/add-to-cart-button"; // Client component below

type Props = {
  params: { slug: string };
};

// Function to generate metadata dynamically
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    select: { name: true, description: true },
  });

  if (!product) {
    return { title: "Product Not Found" };
  }

  return {
    title: `${product.name} | MyShop`,
    description: product.description?.substring(0, 160) || "Check out this amazing product.",
  };
}

// This component fetches data on the server based on the slug
export default async function ProductDetailPage({ params }: Props) {
  const { slug } = params;

  const product = await prisma.product.findUnique({
    where: { slug: slug },
  });

  if (!product) {
    notFound(); // Triggers the not-found.tsx UI if it exists
  }

  // Convert price from cents if stored as integer
  // const displayPrice = (product.price / 100).toFixed(2);

  return (
    <div className="grid md:grid-cols-2 gap-8">
      {/* Image Gallery */}
      <div>
        {product.images && product.images.length > 0 ? (
          <Image
            src={product.images[0]} // Basic: Show first image
            alt={product.name}
            width={500}
            height={500}
            className="w-full h-auto object-cover rounded-lg shadow-md"
            priority // Prioritize loading LCP image
          />
        ) : (
          <div className="w-full h-[500px] bg-secondary rounded-lg flex items-center justify-center text-muted-foreground">
            No Image Available
          </div>
        )}
        {/* TODO: Add image thumbnails/carousel for multiple images */}
      </div>

      {/* Product Info & Actions */}
      <div>
        <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
        <p className="text-2xl text-primary font-semibold mb-4">
          ${product.price.toFixed(2)} {/* Format price appropriately */}
        </p>
        <p className="text-muted-foreground mb-6">{product.description}</p>

        {/* Stock Info */}
        <div className="mb-6">
          {product.stock > 0 ? (
            <span className="text-green-600">In Stock ({product.stock} available)</span>
          ) : (
            <span className="text-red-600">Out of Stock</span>
          )}
        </div>

        {/* Add to Cart (Client Component) */}
        {product.stock > 0 && (
           <AddToCartButton productId={product.id} />
        )}
      </div>
    </div>
  );
}

// Optional: Generate static paths if you have a known, limited number of products
// export async function generateStaticParams() {
//   const products = await prisma.product.findMany({ select: { slug: true } });
//   return products.map((product) => ({
//     slug: product.slug,
//   }));
// }