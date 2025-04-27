// src/app/(auth)/login/page.tsx
'use client';

import Link from 'next/link';
import { useFormState, useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useActionState } from 'react';
import { credentialsSignInAction } from '@/actions/auth'; // Import the server action
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { useSession } from "next-auth/react";
import { toast } from 'sonner';// Optional: Import client-side signIn if you want buttons for OAuth providers
import { redirect } from 'next/navigation';
// import { signIn } from "next-auth/react";
// import { FaGoogle, FaGithub } from "react-icons/fa"; // Example icons

function LoginSubmitButton({pending}:any) {
    
    return (
        <Button type="submit" className="w-full" disabled={pending}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {pending ? 'Signing In...' : 'Sign In'}
        </Button>
    );
}

// Optional: Component for OAuth buttons
// function OAuthButtons() {
//     const handleOAuthSignIn = (provider: 'google' | 'github') => {
//         signIn(provider, { callbackUrl: '/' }); // Redirect to home after OAuth login
//     };

//     return (
//         <>
//             <div className="relative my-4">
//                 <div className="absolute inset-0 flex items-center">
//                     <span className="w-full border-t" />
//                 </div>
//                 <div className="relative flex justify-center text-xs uppercase">
//                     <span className="bg-background px-2 text-muted-foreground">
//                         Or continue with
//                     </span>
//                 </div>
//             </div>
//             <div className="grid grid-cols-2 gap-2">
//                 <Button variant="outline" onClick={() => handleOAuthSignIn('google')}>
//                     <FaGoogle className="mr-2 h-4 w-4" /> Google
//                 </Button>
//                 <Button variant="outline" onClick={() => handleOAuthSignIn('github')}>
//                     <FaGithub className="mr-2 h-4 w-4" /> GitHub
//                 </Button>
//             </div>
//         </>
//     );
// }


export default function LoginPage() {
    const [state, formAction, pending ] = useActionState(credentialsSignInAction, undefined);
    const { data: session, status } = useSession();

 
  
    if (session) {
      redirect('/')
    }


    useEffect(() => {
        if (state?.error) {
            toast('Login Failed',{
                description: state.error,
                
            });
        }
    }, [state, toast]);


    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
            <Card className="mx-auto max-w-sm w-full">
                <CardHeader>
                    <CardTitle className="text-2xl">Login</CardTitle>
                    <CardDescription>
                        Enter your email below to login to your account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     {/* Credentials Form */}
                    <form action={formAction} className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="m@example.com"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <div className="flex items-center">
                                <Label htmlFor="password">Password</Label>
                                {/* Optional: Forgot password link */}
                                {/* <Link href="#" className="ml-auto inline-block text-sm underline">
                                    Forgot your password?
                                </Link> */}
                            </div>
                            <Input id="password" name="password" type="password" required />
                        </div>
                        <LoginSubmitButton pending ={pending} />
                    </form>

                    {/* Optional: Divider and OAuth Buttons */}
                    {/* <OAuthButtons /> */}

                    <div className="mt-4 text-center text-sm">
                        Don't have an account?{' '}
                        <Link href="/signup" className="underline">
                            Sign up
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}