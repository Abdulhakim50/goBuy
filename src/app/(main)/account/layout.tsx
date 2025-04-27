// src/app/(main)/account/layout.tsx
import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/app/lib/auth'; // Server-side auth helper
import AccountNav from '@/components/AccountNav';

export default async function AccountLayout({
    children,
}: {
    children: ReactNode;
}) {
    const session = await auth();

    // Protect all routes within this layout
    if (!session?.user?.id) {
        // Redirect to login, passing the intended destination
        redirect('/login?callbackUrl=/account/orders'); // Redirect to orders by default
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Optional Sidebar Navigation */}
                <aside className="md:col-span-1">
                    <AccountNav />
                </aside>

                {/* Page Content */}
                <main className="md:col-span-3">
                    {children}
                </main>
            </div>
        </div>
    );
}

