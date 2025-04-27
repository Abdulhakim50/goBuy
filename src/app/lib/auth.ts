import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
// import Google from "next-auth/providers/google"; // Example: Add other providers
import prisma from "./prisma";
import { compare } from 'bcryptjs'; // npm install bcryptjs @types/bcryptjs
import { UserRole } from "@prisma/client";
import { DefaultSession } from "next-auth";



declare module "next-auth" {
  interface Session extends DefaultSession {
      user?: {
          id: string;
          role: UserRole; // Add role here
      } & DefaultSession["user"]; // Keep existing properties like name, email, image
  }

  // Optional: If you want role on the user object passed to JWT callback
  interface User {
      role: UserRole;
  }
}
declare module "next-auth" {
/** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
interface JWT {
  id: string;
  role: UserRole; // Add role to the JWT token itself
}
}


export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    // Example: Google Provider (uncomment and configure .env)
    // Google({
    //   clientId: process.env.AUTH_GOOGLE_ID,
    //   clientSecret: process.env.AUTH_GOOGLE_SECRET,
    // }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.password) {
          // No user found or user signed up with OAuth possibly
          return null;
        }

        const isValidPassword = await compare(
          credentials.password as string,
          user.password
        );

        if (!isValidPassword) {
          return null;
        }

        // Return user object without password
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      },
    }),
  ],
  session: {
    strategy: "jwt", // Use JWT for session strategy (recommended with Credentials)
  },
  callbacks: {
    // Include user id and role (if you add one) in the session token
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role; // Add role if you have it in your User model
      }
      return token;
    },
    // Make user id and role available in the session object (used client-side)
    async session({ session, token }) {
      if (session.user && token.id && token.role) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole; // <-- Add role to session user
      }
      return session;
    },
  },
  pages: {
    signIn: '/login', // Redirect users to /login if required to sign in
    // error: '/auth/error', // Optional: Error code passed in query string as ?error=
    // newUser: '/welcome' // Optional: Redirect new users to a welcome page
  },
  // debug: process.env.NODE_ENV === 'development', // Optional: Enable debug messages
  secret: process.env.NEXTAUTH_SECRET, // MUST provide a secret
});