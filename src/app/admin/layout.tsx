// src/app/admin/layout.tsx
import { ReactNode } from 'react';
import Link from 'next/link';
import { Package, Home, Users } from 'lucide-react'; // Example icons
// Middleware already protects this layout, no need for auth() check here again
export default function AdminLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex min-h-screen w-full">
            {/* Sidebar Navigation */}
            <aside className="sticky top-0 h-screen w-64 hidden border-r bg-background p-4 md:block">
                <nav className="flex flex-col gap-2">
                    <h2 className="mb-2 text-lg font-semibold tracking-tight">Admin Panel</h2>
                    <Link href="/admin/dashboard" className="flex items-center gap-2 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary">
                        <Home className="h-4 w-4" />
                        Dashboard
                    </Link>
                    <Link href="/admin/products" className="flex items-center gap-2 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary">
                        <Package className="h-4 w-4" />
                        Products
                    </Link>
                    <Link href="/admin/orders" className="flex items-center gap-2 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary">
                        <Package className="h-4 w-4" /> {/* Change icon maybe */}
                        Orders
                    </Link>
                    {/* Add more links (Users, Settings, etc.) */}
                     <Link href="/admin/users" className="flex items-center gap-2 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary">
                        <Users className="h-4 w-4" />
                        Users
                    </Link>
                </nav>
            </aside>

            {/* Main Content Area */}
            <div className="flex flex-1 flex-col">
                {/* Optional Admin Header */}
                {/* <AdminHeader /> */}
                <main className="flex-1 p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}