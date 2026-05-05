import NextAuth, { type NextAuthResult } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@flowdev/db";
import { appendAudit } from "@flowdev/shared";

import { authConfig } from "./auth.config";
import {
  authorizeCredentials,
  credentialsEnabled,
} from "./auth.credentials";

export {
  authorizeCredentials,
  credentialsEnabled,
  type AuthorizedCredentialsUser,
} from "./auth.credentials";

// Explicit NextAuthResult annotation: TS can't infer a portable type for the
// destructured exports without a reference to internal next-auth modules.
const nextAuth: NextAuthResult = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    ...authConfig.providers,
    ...(credentialsEnabled
      ? [
          Credentials({
            credentials: {
              email: { label: "Email", type: "email" },
              password: { label: "Password", type: "password" },
            },
            authorize: authorizeCredentials,
          }),
        ]
      : []),
  ],
  events: {
    async signIn({ user, account }) {
      if (!user.id) return;
      await appendAudit(prisma, {
        actorId: user.id,
        op: "auth.signin.success",
        context: { provider: account?.provider ?? "unknown" },
      });
      await appendAudit(prisma, {
        actorId: user.id,
        op: "auth.session.create",
        context: { provider: account?.provider ?? "unknown" },
      });
    },
  },
});

export const { auth, handlers, signIn, signOut } = nextAuth;
