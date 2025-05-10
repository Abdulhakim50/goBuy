"use server";

import { User } from "@prisma/client";
import prisma from "@/app/lib/prisma";
import { auth } from "@/app/lib/auth";
import { revalidatePath } from "next/cache";

interface editProfileResult {
  error?: string | null;
  fieldErrors?: Record<string, string>;
  success?: boolean;
}

export async function editProfile(
  prevState: any,
  formData: FormData
): Promise<editProfileResult> {
  const session = await auth();

  const userId = session?.user?.id;

  const rawData = Object.fromEntries(formData.entries());
  const name = formData.get("name");
  const email = formData.get("email");

  try {
    const existingProduct = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!existingProduct) {
      return { error: "user not Found" };
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        email,
      },
    });

    revalidatePath("/account/profile");
  } catch (error) {
    return { error: "Database error: Could not update the user." };
  }
  return { success: true };
}

export async function fetchProfileForEdit(): Promise<User | null> {
  const session = await auth();

  const userId = session?.user?.id;
  // NOTE: Authentication/Authorization should ideally happen here too,
  // but the middleware already protects the route, and the update action re-validates.
  // For strictness, add admin check here as well.
  const product = await prisma.user.findUnique({
    where: { id: userId },
  });
  return product;
}
