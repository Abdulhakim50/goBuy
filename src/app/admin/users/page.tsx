// src/app/admin/users/page.tsx
import prisma from '@/app/lib/prisma';
import { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
    Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import PaginationControls from '@/components/admin/pagination-controls';
import UserRoleSelector from '@/components/admin/user-role-selector';// Import client component
import UserActions from '@/components/admin/user-actions'; // Import client component

export const metadata: Metadata = {
    title: 'Manage Users | Admin Panel',
    description: 'View and manage store users.',
};

export const dynamic = 'force-dynamic'; // Ensure fresh data

const USERS_PER_PAGE = 15;

export default async function AdminUsersPage({
    searchParams,
}: {
    searchParams?: { [key: string]: string | string[] | undefined };
}) {
    // --- Pagination Logic ---
    const page = Number(searchParams?.page ?? '1');
    const take = USERS_PER_PAGE;
    const skip = (page - 1) * take;

    // --- Fetch Paginated Users AND Total Count ---
    // TODO: Add filtering/searching later if needed
    const whereClause = {}; // Placeholder

    const [users, totalUsers] = await prisma.$transaction([
        prisma.user.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            skip: skip,
            take: take,
            select: { // Select only necessary fields
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
                emailVerified: true, // Useful to see if user verified email (if using verification)
                image: true, // For avatar
            },
        }),
        prisma.user.count({ where: whereClause }),
    ]);

    const totalPages = Math.ceil(totalUsers / take);
    // --- End Pagination Logic ---

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Manage Users</h1>
                {/* Optional: Add 'Invite User' button? */}
            </div>

            {users.length === 0 && page === 1 ? (
                <div className="text-center py-10 border rounded-lg bg-secondary">
                    <p className="text-muted-foreground">No users found.</p>
                </div>
            ) : users.length === 0 && page > 1 ? (
                 <div className="text-center py-10 border rounded-lg bg-secondary">
                    <p className="text-muted-foreground">No users found on this page.</p>
                     <Button variant="outline" asChild><Link href="/admin/users?page=1">Go to First Page</Link></Button>
                </div>
            ) : (
                <>
                    {/* Users Table */}
                    <div className="border rounded-lg overflow-hidden mb-6">
                        <Table>
                             <TableCaption>Showing page {page} of {totalPages}. Total users: {totalUsers}.</TableCaption>
                            <TableHeader>
                                <TableRow>
                                    {/* Optional Avatar? */}
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Joined</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">{user.name ?? 'N/A'}</TableCell>
                                        <TableCell>{user.email ?? 'N/A'}</TableCell>
                                        <TableCell>
                                            {/* Role Selector Client Component */}
                                            <UserRoleSelector userId={user.id} currentRole={user.role} />
                                        </TableCell>
                                        <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right">
                                            {/* User Actions (Delete) Client Component */}
                                             <UserActions userId={user.id} />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination Controls */}
                    <PaginationControls
                        currentPage={page}
                        totalPages={totalPages}
                        baseUrl="/admin/users"
                        // preserveQuery={{ /* add if filters exist */ }}
                    />
                </>
            )}
        </div>
    );
}