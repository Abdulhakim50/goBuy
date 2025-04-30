

import { auth } from "@/app/lib/auth";
import AddProduct from "@/components/admin/AddProduct";
import { redirect } from "next/navigation";


export default async function AddProductPage() {
 
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/"); 
  }

  return <AddProduct />;
}
