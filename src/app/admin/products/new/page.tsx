

import { auth } from "@/app/lib/auth";
import AddProduct from "@/components/admin/AddProduct";
import { redirect } from "next/navigation";

// Submit button using useFormStatus

export default async function AddProductPage() {
 
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/"); // Or homepage
  }

  return <AddProduct />;
}
