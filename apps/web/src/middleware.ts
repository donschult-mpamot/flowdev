import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

// Edge-runtime middleware. Uses authConfig only — must NOT import auth.ts
// (which depends on Prisma + bcrypt and won't run on the Edge).
export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
