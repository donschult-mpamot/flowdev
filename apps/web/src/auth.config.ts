import type { NextAuthConfig } from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";

// Edge-safe config consumed by middleware. Must NOT import @flowdev/db,
// bcryptjs, or anything that pulls Node-only modules — middleware runs in the
// Edge runtime. The Credentials provider lives in auth.ts (Node runtime).

export const authConfig: NextAuthConfig = {
  pages: { signIn: "/sign-in" },
  providers: [
    MicrosoftEntraID({
      clientId: process.env.AZURE_AD_CLIENT_ID,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
      issuer: process.env.AZURE_AD_TENANT_ID
        ? `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0`
        : undefined,
    }),
  ],
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
