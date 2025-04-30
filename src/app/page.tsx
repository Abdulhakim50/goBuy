// src/app/(main)/page.tsx
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import prisma from '@/app/lib/prisma';
import ProductCard from '@/components/product-card';
import { Metadata } from 'next';

export const metadata: Metadata = {
    // Use the default title from the root layout's template
    // title: 'Home', // Override default if needed
    description: 'Welcome to MyShop! Find the best products online.', // More specific description
};

// Revalidate homepage periodically or use tags
// export const revalidate = 3600; // Revalidate every hour
export const dynamic = 'force-dynamic';

export default async function HomePage() {
    // Fetch a few recent products to feature
    const recentProducts = await prisma.product.findMany({
        orderBy: { createdAt: 'desc' },
        take: 4, // Get latest 4 products
        where: {
            // Optionally filter featured products if you add an 'isFeatured' flag
            // isFeatured: true,
            stock: { gt: 0 }, // Only show in-stock products on homepage
            imagePath: { not: null } // Only show products with images
        },
        select: { id: true, name: true, slug: true, price: true, imagePath: true, stock: true },
    });

    return (
        <div className="space-y-16">
            {/* Hero Section */}
            <section className="relative h-[50vh] min-h-[300px] max-h-[500px] w-full flex items-center justify-center text-center bg-secondary rounded-lg overflow-hidden">
                 {/* Optional: Background Image */}
                 {/* <Image src="/hero-background.jpg" alt="Hero background" layout="fill" objectFit="cover" className="opacity-30" /> */}
                <div className="relative z-10 p-6">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                        Welcome to MyShop
                    </h1>
                    <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                        Discover amazing deals on the latest tech gadgets, fashion, and more. Quality guaranteed.
                    </p>
                    <Button size="lg" asChild>
                        <Link href="/products">Shop All Products</Link>
                    </Button>
                </div>
            </section>

             {/* Featured/Recent Products Section */}
             <section>
                <h2 className="text-3xl font-bold text-center mb-8">
                    New Arrivals
                </h2>
                 {recentProducts.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {recentProducts.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                 ) : (
                    <p className="text-center text-muted-foreground">No new products to display right now.</p>
                 )}
                 <div className="text-center mt-8">
                     <Button variant="outline" asChild>
                        <Link href="/products">View All Products</Link>
                    </Button>
                 </div>
            </section>

            {/* Optional: Categories Section */}
            {/* <section>
                <h2 className="text-3xl font-bold text-center mb-8">Shop by Category</h2>
                // Add category links/cards here if categories are implemented
            </section> */}

             {/* Optional: Call to Action Section */}
             {/* <section className="bg-primary text-primary-foreground p-12 rounded-lg text-center">
                 <h2 className="text-3xl font-bold mb-4">Sign Up for Deals!</h2>
                 <p className="mb-6">Get exclusive offers and updates delivered straight to your inbox.</p>
                 // Add newsletter signup form here
             </section> */}
        </div>
    );
}