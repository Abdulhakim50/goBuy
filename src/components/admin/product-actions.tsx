// src/components/admin/product-actions.tsx
"use client"; // Required for dropdown and future actions

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteProductAction } from "@/actions/product";
import { useTransition } from "react";

interface ProductActionsProps {
  productId: string;
}

export default function ProductActions({ productId }: ProductActionsProps) {
  const [isPendingDelete, startDeleteTransition] = useTransition();

  const handleDelete = () => {
    if (
      !confirm(
        "Are you sure you want to delete this product? This action cannot be undone."
      )
    ) {
      return;
    }

    // Wrap the server action call in startTransition
    startDeleteTransition(async () => {
      const result = await deleteProductAction(productId);

      if (result?.error) {
        toast("Error Deleting Product", {
          description: result.error,
        });
      } else if (result?.success) {
        toast("Success!", {
          description: "Product deleted successfully.",
        });
        // Revalidation happens server-side in the action via revalidatePath.
        // The list page should update automatically on next render/navigation.
      } else {
        // Fallback generic error
        toast("Error", {
          description: "Something went wrong during deletion.",
        });
      }
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`/admin/products/${productId}/edit`}>
            {" "}
            {/* Link to future edit page */}
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleDelete}
          disabled={isPendingDelete}
          className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
        >
          {/* {isPendingDelete && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} */}
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
