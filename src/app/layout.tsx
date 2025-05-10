import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider"; // Assuming Shadcn setup
import SessionProviderWrapper from "@/components/session-provider-wrapper"; // See below
import Header from "@/components/layout/header"; // Create this component
import Footer from "@/components/layout/footer"; // Create this component
import { Toaster } from "@/components/ui/sonner"; // From Shadcn

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  // Provides default values + template for titles
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'), // Set your base URL!
  title: {
    default: 'MyShop - Your Awesome E-commerce Store', // Default title
    template: '%s | MyShop', // Template for page titles (e.g., "Products | MyShop")
  },
  description: 'Discover amazing products at MyShop. Quality items, great prices.',
  keywords: ['ecommerce', 'shop', 'online store', 'products'], // Add relevant keywords
  // Optional: Open Graph / Social Media defaults
  openGraph: {
      title: 'MyShop - Your Awesome E-commerce Store',
      description: 'Discover amazing products at MyShop.',
      // images: [ { url: '/default-og-image.png', width: 1200, height: 630 } ], // Add a default OG image
      siteName: 'MyShop',
      type: 'website',
      locale: 'en_US',
  },
  // Optional: Twitter Card defaults
  // twitter: { card: 'summary_large_image', title: '...', description: '...', images: ['...'] },
  // Optional: Robots meta tag
  robots: { index: true, follow: true }, // Allow indexing by default
};

 export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        {/* SessionProvider needs to be in a Client Component */}
        <SessionProviderWrapper>
          {/* ThemeProvider for Shadcn dark/light mode */}
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <div className="flex flex-col min-h-screen">
              <Header /> {/* Your site header */}
              <main className="flex-grow container mx-auto px-4 py-8">
                {children}
              </main>
              <Footer /> {/* Your site footer */}
            </div>
            <Toaster richColors /> {/* For Shadcn toast notifications */}
          </ThemeProvider>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}