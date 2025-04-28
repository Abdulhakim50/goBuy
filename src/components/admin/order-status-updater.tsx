// src/components/admin/order-status-updater.tsx
'use client';

import { useState, useTransition } from 'react';
import { OrderStatus } from '@prisma/client'; // Import enum
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"; // Shadcn Select component
import { toast } from "sonner";
import { updateOrderStatusAction } from '@/actions/order'; // Import action (create next)
import { Loader2 } from 'lucide-react';

interface OrderStatusUpdaterProps {
    orderId: string;
    currentStatus: OrderStatus;
}

// Define the possible statuses an admin can typically change *to*
const availableStatuses: OrderStatus[] = [
    OrderStatus.PENDING,
    OrderStatus.PAID, // May be set automatically by webhook, but allow manual override
    OrderStatus.SHIPPED,
    OrderStatus.DELIVERED,
    OrderStatus.CANCELED,
    OrderStatus.FAILED, // Allow manual marking as failed
];

export default function OrderStatusUpdater({ orderId, currentStatus }: OrderStatusUpdaterProps) {
    const [selectedStatus, setSelectedStatus] = useState<OrderStatus>(currentStatus);
    const [isPending, startTransition] = useTransition();
    

    const handleUpdateStatus = () => {
        if (selectedStatus === currentStatus) {
            toast('No Change', {description: 'Selected status is the same as the current status.'});
            return;
        }

        startTransition(async () => {
            const result = await updateOrderStatusAction(orderId, selectedStatus);

            if (result?.error) {
                toast.error('No Change', {  description: result.error});
                 // Optionally revert local state if needed, though re-fetch on navigation is better
                 // setSelectedStatus(currentStatus);
            } else if (result?.success) {
                 toast.success('Status Updated',{  description: `Order status changed to ${selectedStatus}.` });
                 // The page should refetch data due to revalidatePath in the action
            } else {
                toast('Error',{ description: 'An unexpected error occurred.'});
            }
        });
    };

    return (
        <div className="space-y-4">
            <div>
                <label htmlFor="order-status" className="block text-sm font-medium text-muted-foreground mb-1">
                    Change Order Status
                </label>
                <Select
                    value={selectedStatus}
                    onValueChange={(value) => setSelectedStatus(value as OrderStatus)}
                    disabled={isPending}
                >
                    <SelectTrigger id="order-status">
                        <SelectValue placeholder="Select status..." />
                    </SelectTrigger>
                    <SelectContent>
                        {availableStatuses.map((status) => (
                            <SelectItem key={status} value={status}>
                                {status}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <Button
                onClick={handleUpdateStatus}
                disabled={isPending || selectedStatus === currentStatus}
                className="w-full"
            >
                 {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                 {isPending ? 'Updating...' : 'Update Status'}
            </Button>
        </div>
    );
}