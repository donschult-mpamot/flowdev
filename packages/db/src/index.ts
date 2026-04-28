import { PrismaClient } from "@prisma/client";

// FlowDesk pattern: reuse a global PrismaClient in dev to avoid HMR connection storms.
// In production each container gets a fresh process, so the global is ignored.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "production"
        ? ["error"]
        : ["query", "error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
