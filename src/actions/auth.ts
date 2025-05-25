// src/actions/auth.ts
"use server";

import { z } from "zod"; // For validation - npm install zod
import prisma from "@/app/lib/prisma";
import { hash } from "bcryptjs"; // npm install bcryptjs @types/bcryptjs
import { redirect } from "next/navigation";
import { AuthError } from "next-auth"; // Import AuthError
import { signIn } from "@/app/lib/auth"; // Import signIn for post-signup login
import { auth,ErrorCode } from "@/auth";
import { headers } from "next/headers";
import { APIError } from "better-auth/api";
import { revalidatePath } from "next/cache";

// Define validation schema using Zod
const SignupSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters." }),
});

 const SigninSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters." }),
});

interface ActionResult {
  error?: {} | null;
  success?: boolean;
  type?: String;
}



export async function signupAction(
  prevState: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  // 1. Validate form data
  const validatedFields = SignupSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    // Aggregate Zod errors into a single message (or handle field-specific errors)
    const errorMessage = validatedFields.error.errors.map((e) => {
      return {from: e.path[0], msg: e.message };
    });

    console.log(errorMessage);

    return { error: errorMessage };
  }

  const { name, email, password } = validatedFields.data;

  try {
    // 2. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email },
    });

    if (existingUser) {
      return { error: "An account with this email already exists." };
    }

    // 3. Hash the password
    // const hashedPassword = await hash(password, 10); // Salt rounds: 10-12 is typical

    // 4. Create the user in the database
    await auth.api.signUpEmail({
      body: {
        name,
        email,
        password,
      },
    });

    console.log(`User created: ${email}`); // Server log for confirmation

    // 5. OPTIONAL: Automatically sign in the user after successful signup
    // try {
    //   await signIn("credentials", {
    //     email,
    //     password, // Use the original password for signIn
    //     // IMPORTANT: Redirect should typically be false here if handling redirect below,
    //     // but NextAuth v5 handles this slightly differently with Server Actions.
    //     // Redirecting *after* the action completes is often cleaner.
    //     // redirectTo: '/', // Let's redirect manually below instead
    //   });
    //   // If signIn doesn't throw an error, it will typically handle the redirect based on its config
    //   // or the default behavior. However, explicit redirect after ensures flow control.
    // } catch (error) {
    //   if (error instanceof AuthError) {
    //     // Handle potential sign-in errors specifically after signup
    //     console.error("Sign in after signup failed:", error);
    //     // Don't block signup success, just log the sign-in issue
    //     // Maybe return success but with a note about manual login?
    //   } else {
    //     // Rethrow unexpected errors during sign-in
    //     throw error;
    //   }
    // }

    // 6. Redirect on success (if signIn doesn't handle it)
    // This redirect might not be reached if signIn successfully redirects first.
    // Consider removing automatic signIn if you want guaranteed control here.
  } catch (error: any) {
    console.error("Signup Error:", error);
    // Handle potential database errors or other unexpected issues
    if (error.code === "P2002" && error.meta?.target?.includes("email")) {
      // Handle potential race condition if user created between check and create
      return { error: "An account with this email already exists." };
    }
    return {
      error: "An unexpected error occurred during signup. Please try again.",
    };
  }

  // Redirect to homepage (or a welcome page) AFTER successful user creation and sign-in attempt
  redirect("/"); // Or '/account' or '/welcome'
  // We return success: true mainly for type consistency, the redirect takes precedence.
  // return { success: true };
}

// Action for simple Credentials sign-in (can be used by Login page)
export async function credentialsSignInAction(
  prevState: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {


 const validatedFields = SigninSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    // Aggregate Zod errors into a single message (or handle field-specific errors)
    const errorMessage = validatedFields.error.errors.map((e) => {
      return {from: e.path[0], msg: e.message };
    });

    console.log(errorMessage);

    return { error: errorMessage };
  }

  const {  email, password } = validatedFields.data;
  

  try {
    // signIn throws an error if authentication fails
      await auth.api.signInEmail({
      headers: await headers(),
      body: {
        email,
        password,
      },
    });
   
    redirect("/"); 
    return { success: true }; 
  
  } catch (err) {
    if (err instanceof APIError) {
      const errCode = err.body ? (err.body.code as ErrorCode) : "UNKNOWN";
      console.dir(err, { depth: 5 });
      switch (errCode) {
        case "EMAIL_NOT_VERIFIED":
          redirect("/auth/verify?error=email_not_verified");
        default:
          return { error: err.message };
      }
    }

    return { error: "Internal Server Error" };
  };
    
}
