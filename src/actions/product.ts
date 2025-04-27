// src/actions/product.ts
"use server";

import { z } from "zod";
import prisma from "@/app/lib/prisma";
import { auth } from "@/app/lib/auth";
import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Zod schema for product validation
const ProductSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters." }),
  description: z.string().optional(),
  price: z.coerce // Coerce input string to number
    .number({ invalid_type_error: "Price must be a number." })
    .positive({ message: "Price must be positive." }),
  // Basic image handling: Expect comma-separated URLs for now
  images: z
    .string()
    .optional()
    .transform((val) =>
      val
        ? val
            .split(",")
            .map((url) => url.trim())
            .filter((url) => url)
        : []
    ),
  stock: z.coerce // Coerce input string to number
    .number({ invalid_type_error: "Stock must be a number." })
    .int({ message: "Stock must be a whole number." })
    .min(0, { message: "Stock cannot be negative." }),
});

interface ProductActionResult {
  error?: string | null;
  fieldErrors?: Record<string, string>; // For field-specific errors
  success?: boolean;
}

export async function createProductAction(
  prevState: ProductActionResult | undefined,
  formData: FormData
): Promise<ProductActionResult> {
  // 1. Check Authentication & Authorization
  const session = await auth();
  if (!session?.user || session.user.role !== UserRole.ADMIN) {
    return { error: "Unauthorized: Admin access required." };
  }

  // 2. Validate form data
  const validatedFields = ProductSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    // Collect field-specific errors
    const fieldErrors: Record<string, string> = {};
    validatedFields.error.errors.forEach((err) => {
      if (err.path[0]) {
        fieldErrors[err.path[0]] = err.message;
      }
    });
    return { error: "Invalid input.", fieldErrors };
  }

  const { name, description, price, images, stock } = validatedFields.data;

  try {
    // 3. Create product slug (simple example, consider libraries like 'slugify')
    const slug = name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    // Check if slug already exists (add random suffix if it does - simple approach)
    const existingSlug = await prisma.product.findUnique({ where: { slug } });
    const finalSlug = existingSlug
      ? `${slug}-${Math.random().toString(36).substring(2, 7)}`
      : slug;

    // 4. Create product in database
    // Convert price to cents if that's your storage strategy
    // const priceInCents = Math.round(price * 100);

    await prisma.product.create({
      data: {
        name,
        slug: finalSlug,
        description,
        price: price, // Store as float for now, or priceInCents
        images: images,
        stock,
        // categoryId: ... // Add if using categories
      },
    });

    console.log(`Admin ${session.user.email} created product: ${name}`);
  } catch (error: any) {
    console.error("Error creating product:", error);
    // Handle potential slug collisions or database errors more robustly
    if (error.code === "P2002" && error.meta?.target?.includes("slug")) {
      return {
        error: "Product slug already exists. Try a slightly different name.",
      };
    }
    return { error: "Database error: Could not create product." };
  }

  // 5. Revalidate product paths & Redirect on success
  revalidatePath("/admin/products"); // Revalidate admin product list
  revalidatePath("/products"); // Revalidate public product list
  // Optional: Revalidate homepage if it shows products
  // revalidatePath('/');
  redirect("/admin/products"); // Redirect back to the product list

  // return { success: true }; // Redirect takes precedence
}

export async function updateProductAction(
  productId: string, // Add productId as an argument
  prevState: ProductActionResult | undefined,
  formData: FormData
): Promise<ProductActionResult> {


    let finalSlug;
  // 1. Check Authentication & Authorization
  const session = await auth();
  if (!session?.user || session.user.role !== UserRole.ADMIN) {
    return { error: "Unauthorized: Admin access required." };
  }

  // 2. Validate form data
  const validatedFields = ProductSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    const fieldErrors: Record<string, string> = {};
    validatedFields.error.errors.forEach((err) => {
      if (err.path[0]) fieldErrors[err.path[0]] = err.message;
    });
    return { error: "Invalid input.", fieldErrors };
  }

  const { name, description, price, images, stock } = validatedFields.data;

  try {
    // 3. Find the existing product
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!existingProduct) {
      return { error: "Product not found." };
    }

    // 4. Generate slug (only if name changed, simple check)
    finalSlug = existingProduct.slug;
    if (name !== existingProduct.name) {
      const newSlugBase = name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
      // Check if new slug (excluding current product) exists
      const conflictingSlug = await prisma.product.findFirst({
        where: { slug: newSlugBase, NOT: { id: productId } },
      });
      finalSlug = conflictingSlug
        ? `${newSlugBase}-${Math.random().toString(36).substring(2, 7)}`
        : newSlugBase;
    }

    // 5. Update product in database
    await prisma.product.update({
      where: { id: productId },
      data: {
        name,
        slug: finalSlug,
        description,
        price: price, // Or priceInCents
        images: images,
        stock,
      },
    });

    console.log(`Admin ${session.user.email} updated product: ${productId}`);
  } catch (error: any) {
    console.error("Error updating product:", error);
    if (error.code === "P2002" && error.meta?.target?.includes("slug")) {
      return {
        error:
          "Product slug conflicts with another product. Try a slightly different name.",
      };
    }
    return { error: "Database error: Could not update product." };
  }

  // 6. Revalidate relevant paths & Redirect
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}/edit`);
  revalidatePath("/products"); // Public product list
  revalidatePath(`/products/${finalSlug}`); // Public product detail page (use finalSlug)
  // revalidatePath('/'); // Optional: Homepage

  redirect("/admin/products"); // Redirect back to the product list

  // return { success: true }; // Redirect takes precedence
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


export async function deleteProductAction(
    productId: string
    // No prevState needed usually, but can return ActionResult for consistency/feedback
): Promise<ProductActionResult> {

    // 1. Check Authentication & Authorization
    const session = await auth();
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
        return { error: "Unauthorized: Admin access required." };
    }

    if (!productId) {
         return { error: "Invalid Product ID." };
    }

    try {
        // 2. Find the product to ensure it exists before attempting delete
        const existingProduct = await prisma.product.findUnique({
            where: { id: productId },
            select: { id: true, slug: true } // Select only needed fields
        });

        if (!existingProduct) {
            // Don't throw an error if it's already deleted, just return success potentially
            console.log(`Product ${productId} not found for deletion (might be already deleted).`);
            // Revalidate just in case UI was stale
             revalidatePath('/admin/products');
             revalidatePath('/products');
            return { success: true }; // Treat as success if already gone
            // Or return { error: "Product not found." }; if strict feedback needed
        }

        // 3. Delete the product
        await prisma.product.delete({
            where: { id: productId },
        });

        console.log(`Admin ${session.user.email} deleted product: ${productId}`);

        // --- Important Considerations for Production ---
        // - Soft Deletes: Instead of actually deleting, you might set an `isDeleted` or `deletedAt` flag.
        //   This preserves data and allows recovery. Requires schema changes and filtering queries.
        // - Related Data: What happens to OrderItems linked to this product?
        //   Your Prisma schema (`onDelete: Restrict`) currently prevents deleting a product
        //   if it's linked in an OrderItem. This is often desired. You might need to:
        //      a) Disallow deletion if orders exist.
        //      b) Implement soft delete.
        //      c) Archive the product instead (set status to 'ARCHIVED').
        //   For now, Prisma's Restrict will throw an error if deletion violates constraints.


    } catch (error: any) {
        console.error("Error deleting product:", error);
        // Handle specific Prisma error for restricted deletion
        if (error.code === 'P2014' || (error.code === 'P2003' && error.meta?.field_name?.includes('OrderItem'))) {
             // Error code might vary slightly based on DB and Prisma version
             // P2014: The change you are trying to make would violate the required relation '{relation_name}' between the {model_a_name} and {model_b_name} models.
             // P2003: Foreign key constraint failed
             return { error: "Cannot delete product: It is associated with existing orders." };
        }
        return { error: "Database error: Could not delete product." };
    }

    // 4. Revalidate relevant paths
    revalidatePath('/admin/products'); // Admin list
    revalidatePath('/products');       // Public list
    // Revalidate the specific product page (it should 404 now)
    // Use the slug fetched BEFORE deletion for the path
    if (existingProduct?.slug) {
         revalidatePath(`/products/${existingProduct.slug}`);
    }
    // revalidatePath('/'); // Optional: Homepage

    return { success: true }; // Indicate success
}