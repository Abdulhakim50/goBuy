// src/app/(main)/page.tsx
import Link from 'next/link';
import Image from 'next/image';
import { Metadata } from 'next';
import prisma from '@/app/lib/prisma';
import { Button, buttonVariants } from '@/components/ui/button';
import ProductCard from '@/components/product-card';
import { ArrowRight, ShoppingBag, Zap, ShieldCheck, Truck, Star, MessageSquare, Palette, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
    description: 'Experience MyShop: Curated collections, latest trends, and exceptional quality. Your journey to style starts here.',
};

export const dynamic = 'force-dynamic';

export default async function HomePage() {
    const newArrivals = await prisma.product.findMany({
        where: { stock: { gt: 0 } },
        orderBy: { createdAt: 'desc' },
        take: 4,
    });

    // --- Data with Unsplash Image URLs ---
    const heroData = {
        mainTitle: "Define Your Space",
        mainSubtitle: "Handpicked decor and lifestyle essentials for a home that tells your story.",
        mainButtonText: "Discover Home",
        mainButtonLink: "/products?category=home-goods",
        mainImageUrl: "https://images.unsplash.com/photo-1616046229478-9901c5536a45?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
        secondaryTitle: "Style That Speaks",
        secondarySubtitle: "Unleash your confidence with our latest fashion-forward apparel.",
        secondaryButtonText: "Shop Fashion",
        secondaryButtonLink: "/products?category=apparel",
        secondaryImageUrl: "https://images.unsplash.com/photo-1445205170230-053b83016050?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1771&q=80",
    };

    const featuredCategories = [
        { name: "Smart Living", slug: "electronics", imageUrl: "https://images.unsplash.com/photo-1585331505473-7586f59ugcc52?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=735&q=80", Icon: Zap, description: "Innovate your daily routine." },
        { name: "Artisan Crafted", slug: "handmade", imageUrl: "https://images.unsplash.com/photo-1506800747751-0c7050a5a0f6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=735&q=80", Icon: Palette, description: "Unique pieces, full of character." },
        { name: "Outdoor Adventures", slug: "outdoor", imageUrl: "https://images.unsplash.com/photo-1500530855697-b586789ba39e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=735&q=80", Icon: Layers, description: "Gear up for your next escape." },
    ];

    const shopTheLookData = {
        title: "Curated For You: The Urban Edit",
        description: "Achieve effortless city style with these handpicked essentials. Perfect for work, weekends, and everything in between.",
        mainImageUrl: "https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1169&q=80",
        products: [
            { id: "prod_1", name: "Minimalist Trench Coat", slug: "minimalist-trench-coat", position: { top: '20%', left: '30%' } },
            { id: "prod_2", name: "Leather Crossbody Bag", slug: "leather-crossbody-bag", position: { top: '50%', left: '60%' } },
            { id: "prod_3", name: "Classic White Sneakers", slug: "classic-white-sneakers", position: { top: '75%', left: '40%' } },
        ],
        ctaLink: "/collections/urban-edit"
    };

    const promoData = { /* ... */ };
    const testimonials = [ /* ... */ ];

    return (
        <div className="space-y-24 md:space-y-36 pb-24 md:pb-36 overflow-x-hidden bg-background">

            {/* 1. Enhanced Hero Section - Split Layout */}
            <section className="grid grid-cols-1 md:grid-cols-2 min-h-[90vh] md:min-h-screen">
                {/* Left Side - Main Hero */}
                <div className="relative group flex flex-col items-center justify-center text-center p-8 md:p-12 bg-neutral-900 text-white order-2 md:order-1">
                    <div className="absolute inset-0 overflow-hidden opacity-10 group-hover:opacity-20 transition-opacity duration-700">
                        <Image src={heroData.mainImageUrl} alt="Cozy living room background" fill className="object-cover transition-transform duration-1000 ease-out group-hover:scale-105" />
                    </div>
                    <div className="relative z-10 flex flex-col items-center">
                        <h1 className="text-5xl lg:text-7xl font-extrabold mb-6 drop-shadow-lg animate-fade-in-down tracking-tighter">{heroData.mainTitle}</h1>
                        <p className="text-xl lg:text-2xl mb-10 max-w-lg mx-auto text-neutral-300 drop-shadow-sm animate-fade-in-up delay-200">{heroData.mainSubtitle}</p>
                        <Button
                            size="lg"
                            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-full px-12 py-7 text-lg animate-fade-in-up delay-300 transform hover:scale-105 transition-all duration-300 ease-in-out shadow-lg hover:shadow-2xl hover:shadow-indigo-500/30"
                            asChild
                        >
                            <Link href={heroData.mainButtonLink}>
                                {heroData.mainButtonText} <ArrowRight className="ml-3 h-5 w-5" />
                            </Link>
                        </Button>
                    </div>
                </div>
                {/* Right Side - Secondary Hero/Image */}
                <div className="relative min-h-[50vh] md:min-h-full group order-1 md:order-2">
                    <Image src={heroData.secondaryImageUrl} alt={heroData.secondaryTitle} fill className="object-cover transition-transform duration-1000 ease-out group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent transition-colors duration-500 flex flex-col items-start justify-end p-8 md:p-12">
                        <h2 className="text-4xl lg:text-5xl font-extrabold text-white mb-4 drop-shadow-md tracking-tight">{heroData.secondaryTitle}</h2>
                        {/* Enhanced "glassmorphism" button */}
                        <Button
                            variant="outline"
                            size="lg"
                            className="bg-white/10 text-white border-white/50 hover:bg-white/20 hover:border-white/80 backdrop-blur-sm rounded-full px-10 py-6 transition-all duration-300"
                            asChild
                        >
                            <Link href={heroData.secondaryButtonLink}>{heroData.secondaryButtonText}</Link>
                        </Button>
                    </div>
                </div>
            </section>

            {/* 2. Refined Featured Categories */}
            <section className="container mx-auto px-4">
                <div className="text-center mb-12 md:mb-16 animate-fade-in-up">
                    <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tighter">Curated For You</h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Discover collections tailored to your lifestyle, from everyday essentials to statement pieces.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {featuredCategories.map((category, index) => (
                        <Link
                            key={category.slug}
                            href={`/products?category=${category.slug}`}
                            className="group relative flex flex-col justify-between bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800 p-8 rounded-2xl shadow-md hover:shadow-2xl hover:shadow-indigo-500/10 dark:hover:shadow-indigo-500/20 transition-all duration-500 ease-in-out transform hover:-translate-y-2 overflow-hidden animate-fade-in-up"
                            style={{ animationDelay: `${index * 150}ms` }}
                        >
                             <div className="absolute inset-0 overflow-hidden -z-10">
                                <Image src={category.imageUrl} alt="" fill className="object-cover opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-700 ease-out"/>
                             </div>
                            <div>
                                <category.Icon className="h-12 w-12 text-indigo-500 mb-4 transition-transform duration-300 group-hover:scale-110" />
                                <h3 className="text-2xl font-semibold mb-2 text-card-foreground">{category.name}</h3>
                                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{category.description}</p>
                            </div>
                            <div className="mt-auto">
                                <span className={cn(buttonVariants({ variant: 'link' }), "p-0 h-auto text-indigo-500 font-semibold group-hover:text-indigo-400")}>
                                    Shop Now <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1.5" />
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            {/* 3. "Shop the Look" / Curated Collection Section */}
            <section className="bg-gradient-to-b from-white to-neutral-50 dark:from-neutral-900 dark:to-black py-20 md:py-32">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        {/* Image Side */}
                        <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl group animate-fade-in">
                            <Image src={shopTheLookData.mainImageUrl} alt={shopTheLookData.title} fill className="object-cover transition-transform duration-700 ease-in-out group-hover:scale-105" />
                            {shopTheLookData.products.map(p => (
                                <Link key={p.id} href={`/products/${p.slug}`}
                                    className="absolute w-4 h-4 bg-white rounded-full ring-4 ring-indigo-500/70 hover:scale-125 hover:bg-indigo-400 transition-all duration-300 animate-ping-slow group-hover:animate-none"
                                    style={{ top: p.position.top, left: p.position.left }}
                                    title={p.name}
                                >
                                    <span className="sr-only">{p.name}</span>
                                </Link>
                            ))}
                        </div>
                        {/* Text Side */}
                        <div className="text-center lg:text-left animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                            <Layers className="h-12 w-12 text-indigo-500 mb-6 mx-auto lg:mx-0" />
                            <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tighter">{shopTheLookData.title}</h2>
                            <p className="text-lg text-muted-foreground mb-10 leading-relaxed">{shopTheLookData.description}</p>
                            <Button size="lg" asChild className="text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 rounded-full px-12 py-7 text-lg transform hover:scale-105 transition-all duration-300 ease-in-out shadow-lg hover:shadow-2xl hover:shadow-indigo-500/30">
                                <Link href={shopTheLookData.ctaLink}>Explore The Edit</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* 4. New Arrivals / Trending Products */}
            {newArrivals.length > 0 && (
                <section className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-10 md:mb-14 gap-4">
                        <h2 className="text-3xl md:text-4xl font-bold text-center md:text-left tracking-tight">Just Landed</h2>
                        <Button variant="ghost" className="text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-full group">
                            <Link href="/products?sort=newest">
                                Discover All <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                            </Link>
                        </Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12 md:gap-x-8">
                        {newArrivals.map((product, index) => (
                             // Added staggered animation for a professional cascading effect
                            <div
                                key={product.id}
                                className="group transition-all duration-500 ease-in-out hover:shadow-xl hover:-translate-y-2 rounded-lg overflow-hidden animate-fade-in-up"
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                <ProductCard product={product} />
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* ... other sections ... */}

        </div>
    );
}