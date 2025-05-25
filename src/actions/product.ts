// src/actions/product.ts
'use server';

import { z } from 'zod';
import prisma from '@/app/lib/prisma';
import { UserRole } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import fs from 'node:fs/promises'; // Node.js file system module
import path from 'node:path'; // Node.js path module
import { Product } from '@prisma/client';
import { auth } from '@/auth';
import { headers } from 'next/headers'; // For getting request headers

// --- Updated Zod schema for single image upload ---
// Input validation now expects potentially a File object
const fileSchema = z.instanceof(File, { message: "Image is required." })
    .refine(file => file.size === 0 || file.type.startsWith("image/"), { message: "File must be an image." })
    .refine(file => file.size < 4 * 1024 * 1024, { message: "Image must be less than 4MB." }); // Example size limit

const ProductSchema = z.object({
    name: z.string().min(3, { message: "Name must be at least 3 characters." }),
    description: z.string().optional(),
    price: z.coerce.number().positive(),
    stock: z.coerce.number().int().min(0),
    // Image is now optional on schema level, required check happens below
    image: fileSchema.optional(),
});

// --- Edit schema allows image to be optional (if not changing) ---
const EditProductSchema = ProductSchema.extend({
    image: fileSchema.optional(), // Allow empty file upload if not changing image
});


interface ProductActionResult {
    error?: string | null;
    fieldErrors?: Record<string, string>;
    success?: boolean;
}


// --- Helper function to save file ---
async function saveFile(file: File): Promise<string> {
    // Generate a unique filename (e.g., timestamp + original name)
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const extension = path.extname(file.name);
    const filename = `${uniqueSuffix}${extension}`;

    // Define the upload directory (relative to project root)
    // IMPORTANT: Ensure this directory exists! Create it manually or in code.
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'products');
    await fs.mkdir(uploadDir, { recursive: true }); // Ensure directory exists

    const filePath = path.join(uploadDir, filename);

    // Convert File to Buffer and write to disk
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filePath, buffer);

    // Return the *relative* path for storing in DB and accessing via URL
    return `/uploads/products/${filename}`;
}

// --- Helper function to delete file ---
async function deleteFile(relativePath: string | null | undefined) {
    if (!relativePath) return;
    try {
         const filePath = path.join(process.cwd(), 'public', relativePath);
         await fs.unlink(filePath); // Delete the file
         console.log(`Deleted file: ${filePath}`);
    } catch (error: any) {
         // Ignore error if file doesn't exist (e.g., already deleted)
         if (error.code !== 'ENOENT') {
             console.error(`Error deleting file ${relativePath}:`, error);
         }
    }
}


// --- CREATE ACTION (Updated) ---
export async function createProductAction(
    prevState: ProductActionResult | undefined,
    formData: FormData
): Promise<ProductActionResult> {
     const session = await auth.api.getSession({
    headers: await headers() // you need to pass the headers object.
})

    if (!session?.user || session.user.role !== UserRole.ADMIN) { /* ... auth check ... */ }

    // Extract file separately BEFORE Zod validation if needed, or let Zod handle it
    const rawData = Object.fromEntries(formData.entries());
    const imageFile = rawData.image instanceof File ? rawData.image : undefined;

    // Validate text fields + file metadata with Zod
    const validatedFields = ProductSchema.safeParse(rawData);

    if (!validatedFields.success) { /* ... handle Zod errors ... */ }

    // Explicit check if image file exists for creation
    if (!imageFile || imageFile.size === 0) {
         return { error: "Product image is required.", fieldErrors: { image: "Product image is required." } };
    }
     // Re-validate file specifically (Zod might have validated metadata but not content)
    const fileValidation = fileSchema.safeParse(imageFile);
    if (!fileValidation.success) {
         return { error: "Invalid image file.", fieldErrors: { image: fileValidation.error.errors[0]?.message } };
    }

    const { name, description, price, stock } = validatedFields.data;
    let imagePath: string | undefined = undefined;

    try {
        // 1. Save the image file
        imagePath = await saveFile(imageFile);

        // 2. Generate slug (as before)
        const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const existingSlug = await prisma.product.findUnique({ where: { slug }});
        const finalSlug = existingSlug ? `${slug}-${Math.random().toString(36).substring(2, 7)}` : slug;

        // 3. Create product in database with imagePath
        await prisma.product.create({
            data: {
                name, slug: finalSlug, description, price, stock,
                imagePath: imagePath, // Save the relative path
            },
        });

        // ... (logging) ...

    } catch (error: any) {
        console.error("Error creating product:", error);
        // --- Cleanup: Delete uploaded file if DB operation failed ---
        if (imagePath) {
            await deleteFile(imagePath);
        }
        // ... (handle DB specific errors) ...
        return { error: "Database error: Could not create product." };
    }

    // ... (Revalidation and Redirect as before) ...
    revalidatePath('/admin/products');
    revalidatePath('/products');
    redirect('/admin/products');
}


let finalSlug;

// --- UPDATE ACTION (Updated) ---
export async function updateProductAction(
    productId: string,
    prevState: ProductActionResult | undefined,
    formData: FormData
): Promise<ProductActionResult> {
     const session = await auth.api.getSession({
        headers: await headers() // you need to pass the headers object.
    })

     const userData = await prisma.user.findUnique({
        where: { id: session?.user.id },
        select: { role: true } // Fetch only the role
      });
    
      if (!session?.user || userData?.role !== "ADMIN") {
        redirect("/"); 
      }
    
    if (!session?.user || userData.role !== UserRole.ADMIN) { /* ... auth check ... */ }

    const rawData = Object.fromEntries(formData.entries());
    const imageFile = rawData.image instanceof File ? rawData.image : undefined; // Get potential new image

    // Use Edit schema allowing optional image
    const validatedFields = EditProductSchema.safeParse(rawData);

    if (!validatedFields.success) { /* ... handle Zod errors ... */ }

    const { name, description, price, stock } = validatedFields.data;
    let newImagePath: string | undefined = undefined;
    let oldImagePath: string | null | undefined = undefined;


    try {
        // 1. Find the existing product to get old image path
        const existingProduct = await prisma.product.findUnique({
            where: { id: productId },
            select: { id: true, name: true, slug: true, imagePath: true } // Select old path
        });
        if (!existingProduct) return { error: "Product not found." };
        oldImagePath = existingProduct.imagePath; // Store for potential deletion later

        // 2. Handle image update (if a new file was provided)
        if (imageFile && imageFile.size > 0) {
            // Validate the new file
            const fileValidation = fileSchema.safeParse(imageFile);
            if (!fileValidation.success) {
                 return { error: "Invalid image file.", fieldErrors: { image: fileValidation.error.errors[0]?.message } };
            }
            // Save the new file
            newImagePath = await saveFile(imageFile);
        }

        // 3. Generate slug (only if name changed, as before)
        finalSlug = existingProduct.slug;
        // ... (slug generation logic as before) ...

        // 4. Update product in database
        await prisma.product.update({
            where: { id: productId },
            data: {
                name, slug: finalSlug, description, price, stock,
                // Only update imagePath if a new image was uploaded
                ...(newImagePath && { imagePath: newImagePath }),
            },
        });

        // 5. --- Cleanup: Delete OLD image *after* successful DB update ---
        if (newImagePath && oldImagePath) {
             await deleteFile(oldImagePath);
        }

        // ... (logging) ...

    } catch (error: any) {
        console.error("Error updating product:", error);
        // --- Cleanup: Delete NEWLY uploaded file if DB update failed ---
        if (newImagePath) {
            await deleteFile(newImagePath);
        }
        // ... (handle DB specific errors) ...
        return { error: "Database error: Could not update product." };
    }

    // ... (Revalidation and Redirect as before, make sure to revalidate using finalSlug) ...
     revalidatePath('/admin/products');
     revalidatePath(`/admin/products/${productId}/edit`);
     revalidatePath('/products');
     revalidatePath(`/products/${finalSlug}`); // Use potentially updated slug
     redirect('/admin/products');
}

// --- DELETE ACTION (Updated to delete image) ---
export async function deleteProductAction(productId: string): Promise<ProductActionResult> {
     const session = await auth.api.getSession({
    headers: await headers() // you need to pass the headers object.
})
      const userData = await prisma.user.findUnique({
         where: { id: session?.user.id },
         select: { role: true } // Fetch only the role
       });
     
       if (!session?.user || userData?.role !== "ADMIN") {
         redirect("/"); 
       }
    if (!session?.user || userData.role !== UserRole.ADMIN) { /* ... */ }
    if (!productId) { /* ... */ }

    let productToDelete: { id: string, slug: string, imagePath: string | null } | null = null;

    try {
        // Find product including image path for deletion
        productToDelete = await prisma.product.findUnique({
            where: { id: productId },
            select: { id: true, slug: true, imagePath: true } // Need imagePath
        });

        if (!productToDelete) { /* ... handle already deleted ... */ return { success: true }; }

        // --- Delete DB Record FIRST ---
        await prisma.product.delete({ where: { id: productId } });

        // --- Delete Image File AFTER successful DB deletion ---
        if (productToDelete.imagePath) {
             await deleteFile(productToDelete.imagePath);
        }

        // ... (logging) ...

    } catch (error: any) {
        // ... (handle DB errors, including restricted delete) ...
        return { error: "..." };
    }

    // ... (Revalidation, using productToDelete.slug) ...
    revalidatePath('/admin/products');
    revalidatePath('/products');
    if (productToDelete?.slug) {
         revalidatePath(`/products/${productToDelete.slug}`);
    }
    return { success: true };
}

export async function fetchProductForEdit(productId: string): Promise<Product | null> {
  // NOTE: Authentication/Authorization should ideally happen here too,
  // but the middleware already protects the route, and the update action re-validates.
  // For strictness, add admin check here as well.
  const product = await prisma.product.findUnique({
      where: { id: productId },
  });
  return product;
}