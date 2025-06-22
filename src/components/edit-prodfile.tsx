"use client";

import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { editProfile } from "@/actions/profile";
import { User } from "@prisma/client";
import Image from "next/image";
import { useEffect } from "react";
import { toast } from "sonner";




interface SubmitUpdateButtonProps {
  pending: boolean;
}

function SubmitUpdateButton({ pending }: SubmitUpdateButtonProps) {
  return (
    <Button type="submit" disabled={pending} className="w-full md:w-auto">
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      {pending ? "Saving Changes..." : "Save Changes"}
    </Button>
  );
}

const EditProfile = ({ profile }: {profile : User}) => {
  const [state, formAction, pending] = useActionState(editProfile, undefined);

  useEffect(() => {
    if (state?.error && !state.fieldErrors) {
      toast("Error Updating User", { description: state.error });
    } else if (state?.success){
      toast.success("User Updated Successfully", {
        description: state?.success,
      });
    }
  }, [state, toast]);

  if (!profile) {
    // This case should ideally be handled by the parent server component,
    // but added as a safeguard.
    return <p className="text-destructive">Profile not found.</p>;
  }

  return (
    <form action={formAction} className="grid gap-6">
      {state?.error && !state.fieldErrors && (
        <p className="text-sm font-medium text-destructive">{state.error}</p>
      )}

      {/* Name */}
      <div className="grid gap-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" defaultValue={profile.name || ""} className=" w-96" required />
        {state?.fieldErrors?.name && (
          <p className="text-sm font-medium text-destructive">
            {state.fieldErrors.name}
          </p>
        )}
      </div>

      {/* Description */}
      <div className="grid gap-2">
        <Label htmlFor="description">Email</Label>
        <Input id="email" name="email" defaultValue={profile.email || ""} className=" w-96" required />

        {state?.fieldErrors?.description && (
          <p className="text-sm font-medium text-destructive">
            {state.fieldErrors.description}
          </p>
        )}
      </div>

      <div className="flex justify-start">
        <SubmitUpdateButton pending={pending} />
      </div>
    </form>
  );
};

export default EditProfile;
