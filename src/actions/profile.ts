"use server";

import { User } from "@prisma/client";
import prisma from "@/app/lib/prisma";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/auth";

interface editProfileResult {
  error?: string | null;
  fieldErrors?: Record<string, string>;
  success?: boolean;
}

export async function editProfile(
  prevState: any,
  formData: FormData
): Promise<editProfileResult> {
  const session = await auth.api.getSession({
     headers: await headers() // you need to pass the headers object.
 })
 

  if (!session) {
    return { error: "unautorized" };
  }

  const userId = session?.user?.id;

  const rawData = Object.fromEntries(formData.entries());
  const name = rawData.name;
  const email = rawData.email;

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
  const session = await auth.api.getSession({
    headers: await headers() // you need to pass the headers object.
})


  const userId = session?.user?.id;
  // NOTE: Authentication/Authorization should ideally happen here too,
  // but the middleware already protects the route, and the update action re-validates.
  // For strictness, add admin check here as well.
  const product = await prisma.user.findUnique({
    where: { id: userId },
  });
  return product;
}
