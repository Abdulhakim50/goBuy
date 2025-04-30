import React from 'react'
import { auth } from '@/app/lib/auth'
import { redirect } from 'next/navigation';

const dashBoard = async () => {
 const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/"); 
  }
  return (
    <div>dashBoard</div>
  )
}

export default dashBoard