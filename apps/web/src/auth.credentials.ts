import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@flowdev/db";
import { appendAudit } from "@flowdev/shared";

// Story 1.2 Decision 5: credentials provider is enabled in dev (NODE_ENV !==
// "production") OR when CREDENTIALS_FALLBACK_ENABLED === "true" in production.
export const credentialsEnabled =
  process.env.NODE_ENV !== "production" ||
  process.env.CREDENTIALS_FALLBACK_ENABLED === "true";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export interface AuthorizedCredentialsUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

// Extracted into its own module so vitest can exercise it without pulling the
// NextAuth init path (which imports next/server and breaks the vitest ESM
// resolver). Returns the user shape on success or null on any failure path.
// Audit rows fire on every failure so compliance has an authoritative view of
// attempted sign-ins (NFR-S6 + AC3 intent).
export async function authorizeCredentials(
  raw: unknown,
): Promise<AuthorizedCredentialsUser | null> {
  const parsed = credentialsSchema.safeParse(raw);
  if (!parsed.success) {
    await appendAudit(prisma, {
      actorId: null,
      op: "auth.signin.failure",
      context: { reason: "invalid_input", provider: "credentials" },
    });
    return null;
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.passwordHash || user.status !== "ACTIVE") {
    await appendAudit(prisma, {
      actorId: user?.id ?? null,
      op: "auth.signin.failure",
      context: {
        reason: "user_not_found_or_inactive",
        provider: "credentials",
        email,
      },
    });
    return null;
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    await appendAudit(prisma, {
      actorId: user.id,
      op: "auth.signin.failure",
      context: { reason: "bad_password", provider: "credentials" },
    });
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}
