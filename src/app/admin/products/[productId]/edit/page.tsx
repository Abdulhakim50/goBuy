
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Product } from '@prisma/client'; // Import Product type
import { fetchProductForEdit } from '@/actions/product'; // We need to create this fetching action
import { ArrowLeft } from 'lucide-react';
import EditProductForm from '@/components/admin/EditProductForm';

// Define props including the product data

// Fetching Action (can be in actions/product.ts or a separate file)
// This runs server-side but is called from the Page component below
// We create this simple wrapper to ensure only necessary data is fetched server-side
// and handles the "not found" case cleanly before rendering the client component.
// (Put this function definition in `src/actions/product.ts`)
/*

*/


// Submit button using useFormStatus


// --- The Page Component (Server Component Wrapper) ---
// This component fetches data server-side and passes it to the client form component.
export default async function EditProductPage({ params }: { params: { productId: string } }) {
    const productId = params.productId;

    // Fetch product data server-side BEFORE rendering the client component
    // Use the helper action we defined (add it to src/actions/product.ts)
    const product = await fetchProductForEdit(productId);

    // Handle product not found server-side
    if (!product) {
        return ( // Or use Next.js notFound() utility
             <div className="p-6">
                 <Button variant="outline" size="sm" asChild className="mb-4">
                    <Link href="/admin/products"><ArrowLeft className="mr-2 h-4 w-4" />Back</Link>
                 </Button>
                 <Card><CardHeader><CardTitle>Error</CardTitle></CardHeader><CardContent><p className="text-destructive">Product with ID '{productId}' not found.</p></CardContent></Card>
             </div>
        );
    }

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
                    <CardTitle>Edit Product</CardTitle>
                    <CardDescription>Update the details for '{product.name}'.</CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Render the client form component, passing product data */}
                    <EditProductForm product={product} productId={productId} />
                </CardContent>
            </Card>
        </div>
    );
}