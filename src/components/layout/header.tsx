// src/components/layout/header.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import UserNav from "../user-nav";
// import CartIcon from "./cart-icon";
import SearchForm from "@/components/search-form"; // Import the new component
import CartIcon from "../cart-icon";
import { ModeToggle } from "../theme-changer";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full  border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center px-10">
        {/* Logo/Brand */}
        <Link href="/" className="mr-6 flex items-center space-x-2">
          {/* <YourLogoComponent /> */}
          <span className="font-bold inline-block">MyShop</span>
        </Link>

        {/* Main Navigation */}
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium mr-6">
          <Link href="/products">Products</Link>
          {/* Add other nav links */}
        </nav>

        {/* Search Form */}
        <div className="flex flex-1 items-center justify-center px-4 md:px-0">
          {" "}
          {/* Center search on mobile maybe */}
          <SearchForm />
        </div>

        {/* Right Aligned Icons/User Nav */}
        <div className="flex items-center justify-end space-x-4">
          <CartIcon />
          <UserNav />
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
