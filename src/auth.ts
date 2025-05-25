import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
// If your Prisma file is located elsewhere, you can change the path
import { PrismaClient } from "@prisma/client";
import { customSession } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";

const prisma = new PrismaClient();
export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql", 
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    nextCookies()
  ]
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
