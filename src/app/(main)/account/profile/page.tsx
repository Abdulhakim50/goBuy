import EditProfile from "@/components/edit-prodfile";
import React from "react";
import prisma from "@/app/lib/prisma";
import { fetchProfileForEdit } from "@/actions/profile";
import { User } from "@prisma/client";

const page = async () => {
  const profile  = await fetchProfileForEdit();
  console.log(profile)

  return (
    <div>
      <EditProfile profile ={profile} />
    </div>
  );
};

export default page;
