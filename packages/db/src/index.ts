import { PrismaClient } from "@prisma/client";

// FlowDesk pattern: reuse a global PrismaClient in dev to avoid HMR connection storms.
// In production each container gets a fresh process, so the global is ignored.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Default to error-only logs. Verbose query logging only when NODE_ENV is
    // explicitly "development" — protects ACA Jobs (where NODE_ENV may be unset)
    // from leaking SQL parameters to Log Analytics.
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
