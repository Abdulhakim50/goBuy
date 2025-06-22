// src/actions/user.ts
"use server";

import prisma from "@/app/lib/prisma";
import { UserRole } from "@prisma/client"; // Import enum
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { headers } from "next/headers"; // For getting request headers
import { redirect } from "next/navigation";

interface UserActionResult {
  error?: string | null;
  success?: boolean;
}

// --- UPDATE USER ROLE ACTION ---
export async function updateUserRoleAction(
  userId: string,
  newRole: UserRole
): Promise<UserActionResult> {
  // 1. Check Authentication & Authorization (Admin Only)
  const session = await auth.api.getSession({
    headers: await headers(), // you need to pass the headers object.
  });

    const userData = await prisma.user.findUnique({
       where: { id: session?.user.id },
       select: { role: true } // Fetch only the role
     });
   
     if (!session?.user || userData?.role !== "ADMIN") {
       redirect("/"); 
     }

  if (!session?.user || userData?.role !== UserRole.ADMIN) {
    return { error: "Unauthorized: Admin access required." };
  }

  // 2. Validate Inputs
  if (!userId) return { error: "Invalid User ID." };
  if (!Object.values(UserRole).includes(newRole))
    return { error: "Invalid role value provided." };

  // 3. Prevent Admin from changing their OWN role to USER
  if (session.user.id === userId && newRole === UserRole.USER) {
    return { error: "Cannot change your own role to USER." };
  }

  try {
    // 4. Find the user
    const userToUpdate = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true }, // Just need ID to confirm existence
    });
    if (!userToUpdate) return { error: "User not found." };

    // 5. Update the user's role
    await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
    });

    console.log(
      `Admin ${session.user.email} updated role for user ${userId} to ${newRole}`
    );
  } catch (error: any) {
    console.error(`Error updating role for user ${userId}:`, error);
    return { error: "Database error: Could not update user role." };
  }

  // 6. Revalidate admin users path
  revalidatePath("/admin/users");

  return { success: true };
}

// --- DELETE USER ACTION ---
// WARNING: Hard deleting users can cause data integrity issues (e.g., orphaned orders).
// Soft delete (setting an `isActive` flag) is strongly recommended in production.
// This basic implementation might fail if the user has related records (like Orders)
// due to foreign key constraints.
export async function deleteUserAction(
  userId: string
): Promise<UserActionResult> {
  // 1. Check Authentication & Authorization (Admin Only)
  const session = await auth.api.getSession({
    headers: await headers(), // you need to pass the headers object.
  });
  const user = await prisma.user.findUnique({
    where : {id:session?.user.id},
   
  })
  if (!session?.user || user?.role !== UserRole.ADMIN) {
    return { error: "Unauthorized: Admin access required." };
  }

  // 2. Validate Inputs
  if (!userId) return { error: "Invalid User ID." };

  // 3. Prevent Admin from deleting themselves
  if (session.user.id === userId) {
    return { error: "Cannot delete your own account." };
  }

  try {
    // 4. Check for related orders (example constraint check)
    // Depending on your schema's onDelete behavior, this check might be redundant
    // if Prisma prevents deletion anyway, but explicit check is clearer.
    const orderCount = await prisma.order.count({ where: { userId: userId } });
    if (orderCount > 0) {
      return {
        error: `Cannot delete user: User has ${orderCount} associated order(s). Consider deactivating instead.`,
      };
    }

    // 5. Find user to confirm existence before delete attempt
    const userToDelete = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!userToDelete) return { error: "User not found." }; // Or treat as success if already gone

    // 6. Delete the user
    // This might cascade delete related data like Cart, Session, Account depending on schema relations.
    // Be VERY careful with cascading deletes in production.
    await prisma.user.delete({
      where: { id: userId },
    });

    console.log(`Admin ${session.user.email} deleted user: ${userId}`);
  } catch (error: any) {
    console.error(`Error deleting user ${userId}:`, error);
    // Handle potential foreign key constraint errors if checks above weren't exhaustive
    if (error.code === "P2014" || error.code === "P2003") {
      return {
        error:
          "Cannot delete user due to existing related records (e.g., orders).",
      };
    }
    return { error: "Database error: Could not delete user." };
  }

  // 7. Revalidate path
  revalidatePath("/admin/users");

  return { success: true };
}
