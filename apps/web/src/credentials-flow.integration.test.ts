// Integration tests for the credentials provider's authorize() function.
// Verifies AC2 (credentials fallback verifies bcrypt hashes) and AC3 (sign-in
// success / failure events are written to audit_logs).
//
// Local prereqs: `npm run db:up && npm run db:migrate --workspace=packages/db`
// CI: provided by .github/workflows/ci.yml.
//
// Gating: skips when DATABASE_URL is unset, mirroring the Story 1.7 pattern.

import bcrypt from "bcryptjs";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@flowdev/db";

import { authorizeCredentials } from "./auth.credentials";

const hasDb = Boolean(process.env.DATABASE_URL);

if (!hasDb) {
  console.warn(
    "[credentials-flow.integration.test] DATABASE_URL not set — integration tests skipped. " +
      "Local: `npm run db:up && export DATABASE_URL=...` (see .env.example).",
  );
}

const TEST_EMAIL = `credentials-flow-test-${Date.now()}@flowdev.local`;
const TEST_PASSWORD = "test-password-not-real-correct-horse";

describe.skipIf(!hasDb)("credentials authorize() (integration)", () => {
  beforeEach(async () => {
    const passwordHash = await bcrypt.hash(TEST_PASSWORD, 12);
    await prisma.user.upsert({
      where: { email: TEST_EMAIL },
      create: {
        email: TEST_EMAIL,
        name: "Credentials Test User",
        passwordHash,
        role: "ADMIN",
        status: "ACTIVE",
      },
      update: {
        passwordHash,
        role: "ADMIN",
        status: "ACTIVE",
      },
    });
  });

  afterEach(async () => {
    await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });
  });

  it("returns the user shape on valid credentials", async () => {
    const result = await authorizeCredentials({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });
    expect(result).not.toBeNull();
    expect(result).toMatchObject({ email: TEST_EMAIL, role: "ADMIN" });
    expect(result?.id).toEqual(expect.any(String));
  });

  it("returns null and writes auth.signin.failure on bad password", async () => {
    const before = await countAuditOp("auth.signin.failure");

    const result = await authorizeCredentials({
      email: TEST_EMAIL,
      password: "wrong-password",
    });

    expect(result).toBeNull();
    const after = await countAuditOp("auth.signin.failure");
    expect(after).toBe(before + 1);

    const latest = await prisma.auditLog.findFirst({
      where: { op: "auth.signin.failure" },
      orderBy: { occurredAt: "desc" },
    });
    expect(latest?.context).toMatchObject({
      reason: "bad_password",
      provider: "credentials",
    });
  });

  it("returns null and writes auth.signin.failure on unknown email", async () => {
    const before = await countAuditOp("auth.signin.failure");
    const result = await authorizeCredentials({
      email: `does-not-exist-${Date.now()}@flowdev.local`,
      password: "irrelevant",
    });
    expect(result).toBeNull();
    const after = await countAuditOp("auth.signin.failure");
    expect(after).toBe(before + 1);
  });

  it("returns null and writes auth.signin.failure on malformed input", async () => {
    const before = await countAuditOp("auth.signin.failure");
    const result = await authorizeCredentials({
      email: "not-a-valid-email",
      password: "",
    });
    expect(result).toBeNull();
    const after = await countAuditOp("auth.signin.failure");
    expect(after).toBe(before + 1);

    const latest = await prisma.auditLog.findFirst({
      where: { op: "auth.signin.failure" },
      orderBy: { occurredAt: "desc" },
    });
    expect(latest?.context).toMatchObject({
      reason: "invalid_input",
      provider: "credentials",
    });
  });

  it("does NOT write auth.signin.success on the failure path", async () => {
    const before = await countAuditOp("auth.signin.success");
    await authorizeCredentials({
      email: TEST_EMAIL,
      password: "wrong-password",
    });
    const after = await countAuditOp("auth.signin.success");
    expect(after).toBe(before);
  });

  it("returns null when user.status is INVITED (must promote via invite flow first)", async () => {
    await prisma.user.update({
      where: { email: TEST_EMAIL },
      data: { status: "INVITED" },
    });

    const before = await countAuditOp("auth.signin.failure");
    const result = await authorizeCredentials({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    expect(result).toBeNull();
    const after = await countAuditOp("auth.signin.failure");
    expect(after).toBe(before + 1);

    const latest = await prisma.auditLog.findFirst({
      where: { op: "auth.signin.failure" },
      orderBy: { occurredAt: "desc" },
    });
    expect(latest?.context).toMatchObject({
      reason: "user_not_found_or_inactive",
    });
  });

  it("returns null when user.status is REMOVED (soft-deleted)", async () => {
    await prisma.user.update({
      where: { email: TEST_EMAIL },
      data: { status: "REMOVED", removedAt: new Date() },
    });

    const result = await authorizeCredentials({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    expect(result).toBeNull();
  });
});

async function countAuditOp(op: string): Promise<number> {
  return prisma.auditLog.count({ where: { op } });
}
