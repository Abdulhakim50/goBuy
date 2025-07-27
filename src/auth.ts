import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";
import { nextCookies } from "better-auth/next-js";
import { sendEmailAction } from "./actions/sendEmail";

const prisma = new PrismaClient();
export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  emailVerification: {
    sendOnSignUp: true,
    expiresIn: 60 * 60,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      // const baseUrl =process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
      // const link = new URL(url, baseUrl); // 🔥 the fix
      // link.searchParams.set("callbackURL", "/auth/verify");

      await sendEmailAction({
        to: user.email,
        subject: "Verify your email address",
        meta: {
          description:
            "Please verify your email address to complete the registration process.",
          link: url,
        },
      });
    },
  },

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  plugins: [nextCookies()],
  //  plugins: [
  //       customSession(async ({ user, session }) => {
  //           const roles = findUserRoles(session.session.userId);
  //           return {
  //               roles,
  //               user: {
  //                   ...user,
  //                   newField: "newField",
  //               },
  //               session
  //           };
  //       }),
  //   ],
});

export type ErrorCode = keyof typeof auth.$ERROR_CODES | "UNKNOWN";
