// src/components/admin/user-role-selector.tsx
'use client';

import { useState, useTransition } from 'react';
import { UserRole } from '@prisma/client';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';
import { updateUserRoleAction } from '@/actions/user';
import { Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react'; // Import useSession to get current user

interface UserRoleSelectorProps {
    userId: string;
    currentRole: UserRole;
}

const availableRoles: UserRole[] = [UserRole.USER, UserRole.ADMIN];

export default function UserRoleSelector({ userId, currentRole }: UserRoleSelectorProps) {
    const { data: session } = useSession(); // Get current session
    const [isPending, startTransition] = useTransition();

    // No need for local state for selectedValue if triggering action directly onValueChange

    const handleRoleChange = (newRoleValue: string) => {
        const newRole = newRoleValue as UserRole;
        if (newRole === currentRole) return; // No change

        // Prevent changing own role via UI selector (double check, action has primary check)
        if (session?.user?.id === userId && newRole === UserRole.USER) {
             toast.error('Action Denied',{ description: 'You cannot change your own role to USER.' });
             return;
        }

        startTransition(async () => {
            const result = await updateUserRoleAction(userId, newRole);
            if (result?.error) {
                toast.error('Update Failed',{ description: result.error });
            } else {
                toast.success('Update Failed',{ description: `User role changed to ${newRole}.` });
                // Revalidation happens in action, page will update on next fetch/nav
            }
        });
    };

    // Disable selector if it's the current admin's own record (prevent self-demotion via UI)
    const isCurrentUser = session?.user?.id === userId;
    const isDisabled = isPending || isCurrentUser;

    return (
         <Select
            defaultValue={currentRole} // Use defaultValue for uncontrolled Select
            onValueChange={handleRoleChange}
            disabled={isDisabled}
        >
            <SelectTrigger className={`w-[120px] h-8 text-xs ${isPending ? 'opacity-50' : ''} ${isCurrentUser ? 'cursor-not-allowed' : ''}`} aria-label="User role">
                {isPending ? <Loader2 className='h-3 w-3 animate-spin' /> : <SelectValue placeholder="Role..." />}
            </SelectTrigger>
            <SelectContent>
                {availableRoles.map((role) => (
                    <SelectItem key={role} value={role} className="text-xs">
                        {role}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}