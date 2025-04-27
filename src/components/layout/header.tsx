// src/components/layout/header.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import UserNav from "@/components/user-nav"; // You'll create this for login/logout/profile links
import CartIcon from "@/components/cart-icon"; // You'll create this
import { ModeToggle } from "../theme-changer";
import { auth } from "@/app/lib/auth";

 
export default async function Header() {
  const session = await auth();
  
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          {/* <YourLogoComponent /> */}
          <span className="font-bold inline-block">MyShop</span>
        </Link>
        
        <nav className="flex items-center space-x-6 text-sm font-medium">
          <Link href="/products">Products</Link>
          {/* Add other nav links */}
        </nav>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <CartIcon />
          <UserNav />
          <ModeToggle/>
        </div>
      </div>
    </header>
  );
  
}