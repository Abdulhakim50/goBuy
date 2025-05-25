

import AddProduct from "@/components/admin/AddProduct";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/auth";
import prisma from "@/app/lib/prisma";

export default async function AddProductPage() {
 
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

  return <AddProduct />;
}
