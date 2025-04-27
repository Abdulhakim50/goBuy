// src/app/admin/products/new/page.tsx
'use client';

import { useFormState, useFormStatus } from 'react-dom';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea'; // For description
import { createProductAction } from '@/actions/product'; // Import the action
import { Loader2, ArrowLeft } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from "sonner";
import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
// Submit button using useFormStatus
function SubmitProductButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} className="w-full md:w-auto">
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {pending ? 'Creating Product...' : 'Create Product'}
        </Button>
    );
}


export default function AddProduct() {
        const [state, formAction, pending ] = useActionState(createProductAction, undefined);
    
   
      
    useEffect(() => {
        if (state?.error && !state.fieldErrors) { // Show general errors as toast
            toast('Error Creating Product',{
                description: state.error,
            });
        }
        // Success toast is optional as redirect handles success feedback
        // if (state?.success) { toast({ title: "Product Created!" }); }
    }, [state, toast]);

    return (
        <div>
            <Button variant="outline" size="sm" asChild className="mb-4">
                <Link href="/admin/products">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Products
                </Link>
            </Button>

            <Card>
                <CardHeader>
                    <CardTitle>Add New Product</CardTitle>
                    <CardDescription>Fill in the details for the new product.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={formAction} className="grid gap-6">
                         {/* Display general non-field error if needed */}
                         {state?.error && !state.fieldErrors && (
                             <p className="text-sm font-medium text-destructive">{state.error}</p>
                         )}

                        {/* Name */}
                        <div className="grid gap-2">
                            <Label htmlFor="name">Product Name</Label>
                            <Input id="name" name="name" placeholder="e.g., Wireless Headphones" required />
                            {state?.fieldErrors?.name && <p className="text-sm font-medium text-destructive">{state.fieldErrors.name}</p>}
                        </div>

                        {/* Description */}
                        <div className="grid gap-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" name="description" placeholder="Describe the product..." />
                            {state?.fieldErrors?.description && <p className="text-sm font-medium text-destructive">{state.fieldErrors.description}</p>}
                        </div>

                        {/* Price */}
                         <div className="grid gap-2">
                            <Label htmlFor="price">Price (USD)</Label>
                            <Input id="price" name="price" type="number" step="0.01" placeholder="199.99" required />
                            {state?.fieldErrors?.price && <p className="text-sm font-medium text-destructive">{state.fieldErrors.price}</p>}
                        </div>

                        {/* Stock */}
                        <div className="grid gap-2">
                            <Label htmlFor="stock">Stock Quantity</Label>
                            <Input id="stock" name="stock" type="number" step="1" placeholder="100" required />
                             {state?.fieldErrors?.stock && <p className="text-sm font-medium text-destructive">{state.fieldErrors.stock}</p>}
                        </div>

                         {/* Images (Basic URL input) */}
                        <div className="grid gap-2">
                            <Label htmlFor="images">Image URLs (comma-separated)</Label>
                            <Textarea id="images" name="images" placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg" />
                            <p className="text-xs text-muted-foreground">Enter full URLs separated by commas. Proper image upload coming soon!</p>
                            {state?.fieldErrors?.images && <p className="text-sm font-medium text-destructive">{state.fieldErrors.images}</p>}
                        </div>


                         {/* Submit Button */}
                        <div className="flex justify-end">
                            <SubmitProductButton />
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}