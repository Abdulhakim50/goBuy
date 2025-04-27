
// src/app/admin/products/[productId]/edit/page.tsx
'use client'; // Form state requires client component

import { useFormState, useFormStatus } from 'react-dom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { updateProductAction } from '@/actions/product'; // Import the UPDATE action
import { Loader2, ArrowLeft } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from "sonner";
import { Button } from '../ui/button';
import { useActionState } from 'react';


interface EditProductPageProps {
    product: Product | null; // Product data passed from parent server component
    productId: string;
}


interface SubmitUpdateButtonProps {
    pending: boolean;
  }

function SubmitUpdateButton({pending } : SubmitUpdateButtonProps){

    
    return (
        <Button type="submit" disabled={pending} className="w-full md:w-auto">
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {pending ? 'Saving Changes...' : 'Save Changes'}
        </Button>
    );
}

// The actual form component (Client Component)
export default function EditProductForm({ product, productId }: EditProductPageProps) {


     // Bind the productId to the action
     const updateActionWithId = updateProductAction.bind(null, productId);
      const [state, formAction, pending ] = useActionState(updateActionWithId, undefined);
     

    useEffect(() => {
        if (state?.error && !state.fieldErrors) {
            toast('Error Updating Product',{  description: state.error });

        }
        // Success toast? Redirect usually handles it.
    }, [state, toast]);

    if (!product) {
         // This case should ideally be handled by the parent server component,
         // but added as a safeguard.
         return <p className='text-destructive'>Product not found.</p>;
    }

    return (
        <form action={formAction} className="grid gap-6">
            {state?.error && !state.fieldErrors && <p className="text-sm font-medium text-destructive">{state.error}</p>}

            {/* Name */}
            <div className="grid gap-2">
                <Label htmlFor="name">Product Name</Label>
                <Input id="name" name="name" defaultValue={product.name} required />
                {state?.fieldErrors?.name && <p className="text-sm font-medium text-destructive">{state.fieldErrors.name}</p>}
            </div>

            {/* Description */}
            <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" defaultValue={product.description ?? ''} />
                {state?.fieldErrors?.description && <p className="text-sm font-medium text-destructive">{state.fieldErrors.description}</p>}
            </div>

            {/* Price */}
            <div className="grid gap-2">
                <Label htmlFor="price">Price (USD)</Label>
                <Input id="price" name="price" type="number" step="0.01" defaultValue={product.price} required />
                {state?.fieldErrors?.price && <p className="text-sm font-medium text-destructive">{state.fieldErrors.price}</p>}
            </div>

            {/* Stock */}
            <div className="grid gap-2">
                <Label htmlFor="stock">Stock Quantity</Label>
                <Input id="stock" name="stock" type="number" step="1" defaultValue={product.stock} required />
                {state?.fieldErrors?.stock && <p className="text-sm font-medium text-destructive">{state.fieldErrors.stock}</p>}
            </div>

            {/* Images */}
            <div className="grid gap-2">
                <Label htmlFor="images">Image URLs (comma-separated)</Label>
                {/* Join the array back into a comma-separated string for the textarea */}
                <Textarea id="images" name="images" defaultValue={product.images.join(', ')} />
                <p className="text-xs text-muted-foreground">Enter full URLs separated by commas.</p>
                {state?.fieldErrors?.images && <p className="text-sm font-medium text-destructive">{state.fieldErrors.images}</p>}
            </div>

            <div className="flex justify-end">
                <SubmitUpdateButton pending={pending}/>
            </div>
        </form>
    );
}
