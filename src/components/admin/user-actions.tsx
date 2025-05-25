// src/components/admin/user-actions.tsx
'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { deleteUserAction } from '@/actions/user';
import { useSession } from 'next-auth/react'; // Get current user session
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"; // Use Alert Dialog for confirmation
import { authClient } from '@/lib/auth-client';
interface UserActionsProps {
    userId: string;
}

export default function UserActions({ userId }: UserActionsProps) {
    const { 
        data: session, 
        error, //error object
        refetch //refetch the session
    } = authClient.useSession() 
    const [isPending, startTransition] = useTransition();
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handleDelete = () => {
        // Action has primary check, but disable button if it's the current user
        if (session?.user?.id === userId) {
             toast.error( 'Action Denied',{ description: 'You cannot delete your own account.'});
             return;
        }

        startTransition(async () => {
            const result = await deleteUserAction(userId);
             setIsDialogOpen(false); // Close dialog after action attempt
            if (result?.error) {
                toast.error('Deletion Failed',{ description: result.error });
            } else {
                toast.success( 'User Deleted',{ description: 'The user has been deleted.' });
            }
        });
    };

    // Prevent rendering delete button for the current admin user
    if (session?.user?.id === userId) {
        return null; // Or render a disabled placeholder if preferred
    }

    return (
         <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <AlertDialogTrigger asChild>
                 <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" disabled={isPending}>
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                     <span className="sr-only">Delete User</span>
                 </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the user account.
                        Make sure this user has no critical associated data (like orders you wish to keep record of).
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={isPending} className="bg-destructive hover:bg-destructive/90">
                        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Yes, Delete User
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}