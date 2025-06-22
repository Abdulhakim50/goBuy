// src/app/(main)/page.tsx
import Link from 'next/link';
import Image from 'next/image';
import { Metadata } from 'next';
import prisma from '@/app/lib/prisma';
import { Button, buttonVariants } from '@/components/ui/button'; // Import buttonVariants
import ProductCard from '@/components/product-card';
import { ArrowRight, ShoppingBag, Zap, ShieldCheck, Truck, Star, MessageSquare, Palette, Layers } from 'lucide-react'; // Added Palette, Layers
import { cn } from '@/lib/utils'; // For conditional classes

export const metadata: Metadata = {
    description: 'Experience MyShop: Curated collections, latest trends, and exceptional quality. Your journey to style starts here.',
};

export const dynamic = 'force-dynamic';

export default async function HomePage() {
    const newArrivals = await prisma.product.findMany({
        orderBy: { createdAt: 'desc' },
        take: 4,
        select: { id: true, name: true, slug: true, price: true, imagePath: true, stock: true,description : true },
    });

    // --- Data with Unsplash Image URLs ---
    const heroData = {
        // Split hero concept
        mainTitle: "Define Your Space",
        mainSubtitle: "Handpicked decor and lifestyle essentials for a home that tells your story.",
        mainButtonText: "Discover Home",
        mainButtonLink: "/products?category=home-goods",
        mainImageUrl: "https://images.unsplash.com/photo-1616046229478-9901c5536a45?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80", // Cozy interior
        secondaryTitle: "Style That Speaks",
        secondarySubtitle: "Unleash your confidence with our latest fashion-forward apparel.",
        secondaryButtonText: "Shop Fashion",
        secondaryButtonLink: "/products?category=apparel",
        secondaryImageUrl: "https://images.unsplash.com/photo-1445205170230-053b83016050?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1771&q=80", // Stylish model
    };

    const featuredCategories = [
        { name: "Smart Living", slug: "electronics", imageUrl: "https://images.unsplash.com/photo-1585331505473-7586f59ugcc52?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=735&q=80", Icon: Zap, description: "Innovate your daily routine." },
        { name: "Artisan Crafted", slug: "handmade", imageUrl: "https://images.unsplash.com/photo-1506800747751-0c7050a5a0f6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=735&q=80", Icon: Palette, description: "Unique pieces, full of character." },
        { name: "Outdoor Adventures", slug: "outdoor", imageUrl: "https://images.unsplash.com/photo-1500530855697-b586789ba39e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=735&q=80", Icon: Layers, description: "Gear up for your next escape." },
    ];

    const shopTheLookData = {
        title: "Curated For You: The Urban Edit",
        description: "Achieve effortless city style with these handpicked essentials. Perfect for work, weekends, and everything in between.",
        mainImageUrl: "https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1169&q=80", // Stylish person in urban setting
        // These would be actual product slugs linked to the image hotspots or listed below
        products: [
            { id: "prod_1", name: "Minimalist Trench Coat", slug: "minimalist-trench-coat", position: { top: '20%', left: '30%' } },
            { id: "prod_2", name: "Leather Crossbody Bag", slug: "leather-crossbody-bag", position: { top: '50%', left: '60%' } },
            { id: "prod_3", name: "Classic White Sneakers", slug: "classic-white-sneakers", position: { top: '75%', left: '40%' } },
        ],
        ctaLink: "/collections/urban-edit" // Link to a collection page
    };

    const promoData = { /* ... same as before ... */ };
    const testimonials = [ /* ... same as before ... */ ];

    return (
        <div className="space-y-20 md:space-y-32 pb-20 md:pb-32 overflow-x-hidden"> {/* Prevent horizontal scroll from animations */}

            {/* 1. Enhanced Hero Section - Split Layout */}
            <section className="grid grid-cols-1 md:grid-cols-2 min-h-[80vh] md:min-h-screen">
                {/* Left Side - Main Hero */}
                <div className="relative group flex flex-col items-center justify-center text-center p-8 md:p-12 bg-gradient-to-br from-slate-900 to-slate-800 text-white order-2 md:order-1">
                    <div className="absolute inset-0 overflow-hidden opacity-20">
                        <Image src={heroData.mainImageUrl} alt="Background" fill className="object-cover transition-transform duration-1000 ease-out group-hover:scale-110"/>
                    </div>
                    <div className="relative z-10">
                        <h1 className="text-5xl lg:text-7xl font-extrabold mb-6 drop-shadow-lg animate-fade-in-down delay-100">{heroData.mainTitle}</h1>
                        <p className="text-xl lg:text-2xl mb-10 max-w-md mx-auto drop-shadow-sm animate-fade-in-up delay-300">{heroData.mainSubtitle}</p>
                        <Button size="lg"  className={cn(buttonVariants({variant: 'default', size: 'lg'}), "rounded-full px-12 py-4 text-lg animate-fade-in-up delay-500 transform hover:scale-105 transition-transform")}>
                            <Link href={heroData.mainButtonLink}>{heroData.mainButtonText} <ArrowRight className="ml-3 h-5 w-5" /></Link>
                        </Button>
                    </div>
                </div>
                {/* Right Side - Secondary Hero/Image */}
                <div className="relative min-h-[50vh] md:min-h-full group order-1 md:order-2">
                     <Image src={heroData.secondaryImageUrl} alt={heroData.secondaryTitle} fill className="object-cover transition-transform duration-1000 ease-out group-hover:scale-110"/>
                     <div className="absolute inset-0 bg-black/30 hover:bg-black/10 transition-colors duration-500 flex flex-col items-start justify-end p-8 md:p-12">
                        <h2 className="text-3xl lg:text-4xl font-bold text-white mb-3 drop-shadow-md">{heroData.secondaryTitle}</h2>
                        <Button variant="outline" size="lg"  className="text-white border-white hover:bg-white hover:text-black rounded-full px-8">
                            <Link href={heroData.secondaryButtonLink}>{heroData.secondaryButtonText}</Link>
                        </Button>
                     </div>
                </div>
            </section>


            {/* 2. Refined Featured Categories */}
            <section className="container mx-auto px-4">
                <div className="text-center mb-12 md:mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold mb-3">Curated For You</h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Discover collections tailored to your lifestyle, from everyday essentials to statement pieces.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {featuredCategories.map((category, index) => (
                        <Link
                            key={category.slug}
                            href={`/products?category=${category.slug}`}
                            className="group relative flex flex-col justify-between bg-card p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 ease-out transform hover:-translate-y-2 overflow-hidden min-h-[350px]"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            <div>
                                <category.Icon className="h-10 w-10 text-primary mb-4 opacity-80 group-hover:opacity-100 transition-opacity" />
                                <h3 className="text-2xl font-semibold mb-2 text-card-foreground">{category.name}</h3>
                                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{category.description}</p>
                            </div>
                            <div className="mt-auto">
                                <span className={cn(buttonVariants({variant: 'link'}), "p-0 h-auto text-primary group-hover:underline")}>
                                    Shop Now <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                                </span>
                            </div>
                            {/* Subtle background image */}
                            <Image src={category.imageUrl} alt="" fill className="object-cover absolute inset-0 -z-10 opacity-10 group-hover:opacity-20 transition-opacity duration-500"/>
                        </Link>
                    ))}
                </div>
            </section>


             {/* 3. "Shop the Look" / Curated Collection Section */}
             <section className="bg-gradient-to-b from-slate-50 to-background dark:from-slate-800 dark:to-background py-16 md:py-24">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        {/* Image Side */}
                        <div className="relative aspect-[3/4] rounded-xl overflow-hidden shadow-2xl group">
                            <Image src={shopTheLookData.mainImageUrl} alt={shopTheLookData.title} fill className="object-cover transition-transform duration-700 ease-out group-hover:scale-105" />
                            {/* Image Hotspots (Conceptual - requires JS for tooltips/links) */}
                            {shopTheLookData.products.map(p => (
                                <Link key={p.id} href={`/products/${p.slug}`}
                                      className="absolute w-4 h-4 bg-primary rounded-full ring-2 ring-white ring-offset-2 ring-offset-transparent hover:ring-offset-primary transition-all animate-ping-slow group-hover:animate-none"
                                      style={{ top: p.position.top, left: p.position.left }}
                                      title={p.name} // Simple title for now
                                >
                                     <span className="sr-only">{p.name}</span>
                                </Link>
                            ))}
                        </div>
                        {/* Text Side */}
                        <div className="text-center lg:text-left">
                            <Layers className="h-12 w-12 text-primary mb-4 mx-auto lg:mx-0" />
                            <h2 className="text-4xl md:text-5xl font-bold mb-6">{shopTheLookData.title}</h2>
                            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">{shopTheLookData.description}</p>
                            <Button size="lg" asChild className={cn(buttonVariants({variant: 'default', size: 'lg'}), "rounded-full px-10 py-3")}>
                                <Link href={shopTheLookData.ctaLink}>Explore The Edit</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </section>


            {/* 4. New Arrivals / Trending Products (With subtle hover effect for cards) */}
            {newArrivals.length > 0 && (
                <section className="container mx-auto px-4">
                    {/* ... (header section as before) ... */}
                    <div className="flex flex-col md:flex-row justify-between items-center mb-10 md:mb-14 gap-4">
                         <h2 className="text-3xl md:text-4xl font-bold text-center md:text-left">Just Landed</h2>
                         <Button variant="ghost"  className="text-primary hover:text-primary/80">
                            <Link href="/products?sort=newest">Discover All <ArrowRight className="ml-2 h-5 w-5" /></Link>
                         </Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10 md:gap-x-8">
                        {newArrivals.map((product) => (
                            // ProductCard might need a `group` class if hover effects are internal
                            <div key={product.id} className="group transition-all duration-300 hover:shadow-xl hover:-translate-y-1 rounded-lg overflow-hidden">
                                <ProductCard product={product} />
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* 5. Promotional Banner (as before, or refine with more dynamic content) */}
            {/* ... Promo section ... */}

            {/* 6. Customer Testimonials (as before) */}
            {/* ... Testimonials section ... */}

            {/* 7. Brand Trust (as before) */}
            {/* ... Brand Trust section ... */}

        </div>
    );
}