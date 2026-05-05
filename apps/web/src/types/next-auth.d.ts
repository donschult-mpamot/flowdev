// Module augmentation: extend the Auth.js Session, User, and JWT types so
// callers don't need to cast through `as { role?: string }` every time they
// read the session role.

import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      role?: string;
    } & DefaultSession["user"];
  }

  interface User {
    role?: string;
  }
}

// next-auth/jwt re-exports JWT from @auth/core/jwt; both module paths must be
// augmented because TS resolves the JWT callback's `token` parameter against
// the @auth/core path internally while user code imports from next-auth/jwt.
declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    role?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
  }
}
