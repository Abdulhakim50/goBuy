// src/app/(auth)/signup/page.tsx
"use client"; // This page needs client-side hooks for form state

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom"; // React experimental hooks
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signupAction } from "@/actions/auth"; // Import the server action
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import { useActionState } from "react";
import { redirect } from "next/navigation";
import { authClient } from "@/lib/auth-client";

// Separate component for the submit button to use useFormStatus
function SubmitButton({ pending }: { pending: boolean }) {
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      {pending ? "Creating Account..." : "Create Account"}
    </Button>
  );
}

export default function SignupPage() {
  // useFormState takes the action and initial state
  const [state, formAction, pending] = useActionState(signupAction, undefined); // Initial state is undefined
  const router = useRouter();

  const {
    data: session,
    isPending, //loading state
    error, //error object
    refetch, //refetch the session
  } = authClient.useSession();

  if (session) {
    redirect("/");
  }


  useEffect(() => {
    if (state?.error) {
      toast("Signup Failed", {
        description:Array.isArray(state.error) &&  state.error?.map((e : any)=> e.msg),
      });
    }
    // You could potentially show a success toast here too, but redirect is usually sufficient
    // if (state?.success) { ... }
  }, [state, toast]);

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
      {" "}
      {/* Adjust height as needed */}
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Sign Up</CardTitle>
          <CardDescription>
            Enter your information to create an account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* The form element calls the server action */}
          <form action={formAction} className="grid gap-4">
            {/* Display general form error messages if not using toasts */}
            {/* {state?.error && (
                            <p className="text-sm font-medium text-destructive bg-red-50 p-3 rounded-md">{state.error}</p>
                         )} */}

            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="Your Name"
                defaultValue={"a"}
                required
              />
              <p className=" text-red-600">
                {Array.isArray(state?.error) &&
                  state.error.map((e: any, idx: number) =>
                    e.from === "name" ? <div key={idx}>{e.msg}</div> : null
                  )}{" "}
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email" // Name attribute is crucial for FormData
                type="text"
                defaultValue={"jgggjkjkhlhioouiuiii"}
                placeholder="m@example.com"
                required
              />
              <p className=" text-red-600">
                {Array.isArray(state?.error) &&
                  state.error.map((e: any, idx: number) =>
                    e.from === "email" ? <div key={idx}>{e.msg}</div> : null
                  )}{" "}
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                defaultValue={"hghghgiyu787879879"}
                required
                minLength={6}
              />
            </div>

            {/* Use the separate submit button component */}
            <SubmitButton pending={pending} />
          </form>
          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link href="/login" className="underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
