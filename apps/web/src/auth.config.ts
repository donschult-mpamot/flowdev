import type { NextAuthConfig } from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";

type Provider = NonNullable<NextAuthConfig["providers"]>[number];

// Edge-safe config consumed by middleware. Must NOT import @flowdev/db,
// bcryptjs, or anything that pulls Node-only modules — middleware runs in the
// Edge runtime. The Credentials provider lives in auth.ts (Node runtime).

// Only register the Microsoft Entra ID provider when all three env vars are
// populated. Auth.js v5 validates every configured provider at request time,
// so leaving this provider in the list with empty-string credentials breaks
// the credentials sign-in path too (Configuration error). This is the runtime
// surface of deferred item D-1.2.2 — supersedes its earlier "click-to-500"
// description because the failure mode actually blocks all of /api/auth.
export const microsoftEntraEnabled =
  Boolean(process.env.AZURE_AD_CLIENT_ID) &&
  Boolean(process.env.AZURE_AD_CLIENT_SECRET) &&
  Boolean(process.env.AZURE_AD_TENANT_ID);

const providers: Provider[] = [];

if (microsoftEntraEnabled) {
  providers.push(
    MicrosoftEntraID({
      clientId: process.env.AZURE_AD_CLIENT_ID,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
      issuer: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0`,
    }),
  );
}

export const authConfig: NextAuthConfig = {
  pages: { signIn: "/sign-in" },
  providers,
  session: { strategy: "jwt" },
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const path = request.nextUrl.pathname;
      if (isPublicPath(path)) return true;
      if (!isLoggedIn) {
        const signInUrl = new URL("/sign-in", request.nextUrl);
        signInUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
        return Response.redirect(signInUrl);
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        // user.id can be undefined when the user has just been deleted; keep
        // the existing token if so. user.role comes from our augmentation.
        if (user.id) token.id = user.id;
        if (user.role) token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // token.id / token.role are typed as `unknown` on @auth/core's JWT
        // (the interface is open-ended); narrow with typeof checks before
        // assigning into our augmented Session.user shape.
        if (typeof token.id === "string") {
          session.user.id = token.id;
        }
        if (typeof token.role === "string") {
          session.user.role = token.role;
        }
      }
      return session;
    },
  },
};

// Exported for test reuse; mirrors the path checks in callbacks.authorized.
export function isPublicPath(path: string): boolean {
  return (
    path === "/sign-in" ||
    path.startsWith("/api/auth/") ||
    path.startsWith("/_next/") ||
    path === "/favicon.ico"
  );
}
