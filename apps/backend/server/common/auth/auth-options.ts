import { PrismaClient } from "@prisma/client";
import log4js from "log4js";
import Credentials from "@auth/express/providers/credentials";
import bcrypt from "bcrypt";
import type { ExpressAuthConfig } from "@auth/express";

const logger = log4js.getLogger("auth.logger");

const prisma = new PrismaClient();

export const authOptions: ExpressAuthConfig = {
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: {
          label: "Email",
          type: "text",
        },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Add logic here to look up the user from the credentials supplied
        const user = await prisma.user.findUnique({
          where: { email: credentials?.email as string },
        });

        if (!user?.password) {
          return null;
        }

        // Compare the provided password with the hashed password in the database
        const isMatch = await bcrypt.compare(
          credentials?.password as string,
          user.password
        );

        if (!isMatch) {
          return null;
        }

        if (user) {
          logger.debug(
            `User with email ${credentials?.email} authenticated successfully.`
          );
          return user;
        } else {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async redirect({ url }) {
      // TODO: Proper redirect-checks to allow for relative urls etc.
      return url;
    },
  },
  cookies: {
    csrfToken: {
      name:
        process.env.nodeEnv === "production"
          ? "__Host-authjs.csrf-token"
          : "authjs.csrf-token",
      options: {
        httpOnly: true,
        secure: process.env.nodeEnv === "production",
        sameSite: "lax",
        path: "/",
      },
    },
  },
};
