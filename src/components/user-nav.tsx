// src/components/layout/user-nav.tsx
'use client'; // Needs client hooks for session and dropdown interaction

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react'; // Use client-side hooks
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, User, Package } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton'; // For loading state

export default function UserNav() {
    // useSession provides session data and status ('loading', 'authenticated', 'unauthenticated')
    const { data: session, status } = useSession();

    // Display Skeleton while session is loading
    if (status === "loading") {
        return <Skeleton className="h-10 w-24 rounded-md" />; // Adjust size as needed
    }

    // Show Login/Signup buttons if unauthenticated
    if (status === "unauthenticated" || !session?.user) {
        return (
            <div className="flex items-center gap-2">
                 <Button variant="outline" asChild>
                    <Link href="/login">Login</Link>
                </Button>
                 <Button asChild>
                    <Link href="/signup">Sign Up</Link>
                </Button>
            </div>
        );
    }

    // Display User Dropdown if authenticated
    const user = session.user;
    const userInitials = user.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-9 w-9">
                        {/* Use user image if available */}
                        <AvatarImage src={user.image ?? undefined} alt={user.name ?? 'User'} />
                        {/* Fallback to initials */}
                        <AvatarFallback>{userInitials}</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                         <Link href="/account"> {/* Create this page later */}
                            <User className="mr-2 h-4 w-4" />
                            <span>Profile</span>
                         </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href="/account/orders"> {/* Create this page later */}
                             <Package className="mr-2 h-4 w-4" />
                             <span>Orders</span>
                        </Link>
                    </DropdownMenuItem>
                    {/* Add other links like Settings if needed */}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/' })} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}