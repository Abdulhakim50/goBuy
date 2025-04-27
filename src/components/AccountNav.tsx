// --- Optional: Account Navigation Component ---
// src/components/account-nav.tsx
'use client'; // Needs usePathname for active links

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Package, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
    { href: '/account/orders', label: 'My Orders', icon: Package },
    { href: '/account', label: 'Profile Settings', icon: User }, // Future page
    // Add more items like Addresses, etc.
];

export default function AccountNav() {
    const pathname = usePathname();

    return (
        <nav className="flex flex-col space-y-1 border rounded-lg p-3 sticky top-20">
            {navItems.map((item) => (
                <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                        'flex items-center px-3 py-2 rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground',
                        pathname === item.href ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
                    )}
                >
                    <item.icon className="mr-2 h-4 w-4" />
                    <span>{item.label}</span>
                </Link>
            ))}
        </nav>
    );
}