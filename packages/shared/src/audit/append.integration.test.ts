// Integration tests against a live flowdev-postgres (local) or the GH Actions
// `postgres` service container (CI). Verifies AC1 (REVOKE enforcement),
// AC2 (commit semantics), and AC3 (rollback semantics).
//
// Local prereqs: `npm run db:up` then `npm run db:migrate --workspace=packages/db`
// CI: provided by .github/workflows/ci.yml (services.postgres + Run migrations).
//
// Gating: integration tests skip cleanly when DATABASE_URL is unset so unit
// tests still pass in environments without a DB. CI sets DATABASE_URL at the
// job level; locally, devs export it (or source .env) before running tests.

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { appendAudit } from "./append.js";

const hasDb = Boolean(process.env.DATABASE_URL);

// `prisma` is initialized in beforeAll, which only runs when the describe.skipIf
// block is active. The definite-assignment assertion (!) tells TS the variable
// is set before any test body reads it.
let prisma!: PrismaClient;

beforeAll(async () => {
  prisma = new PrismaClient();
  await prisma.$connect();
});

afterAll(async () => {
  if (prisma) await prisma.$disconnect();
});

describe.skipIf(!hasDb)("appendAudit / audit_logs (integration)", () => {
  it("AC2 — commits the audit row in the caller's transaction", async () => {
    const testId = `commit-${Date.now()}-${Math.random()}`;

    await prisma.$transaction(async (tx) => {
      await appendAudit(tx, {
        actorId: "test-actor-commit",
        op: "system.setting.update",
        context: { testId },
      });
    });

    const found = await prisma.auditLog.findMany({
      where: { context: { path: ["testId"], equals: testId } },
    });
    expect(found).toHaveLength(1);
    expect(found[0]).toMatchObject({
      actorId: "test-actor-commit",
      op: "system.setting.update",
    });
    expect(found[0]?.occurredAt).toBeInstanceOf(Date);
  });

  it("AC3 — rolls back the audit row when the caller's transaction throws", async () => {
    const testId = `rollback-${Date.now()}-${Math.random()}`;

    await expect(
      prisma.$transaction(async (tx) => {
        await appendAudit(tx, {
          actorId: "test-actor-rollback",
          op: "system.setting.update",
          context: { testId },
        });
        throw new Error("intentional rollback");
      }),
    ).rejects.toThrow("intentional rollback");

    const found = await prisma.auditLog.findMany({
      where: { context: { path: ["testId"], equals: testId } },
    });
    expect(found).toHaveLength(0);
  });

  it("AC1 — Postgres rejects UPDATE on audit_logs with insufficient_privilege (42501)", async () => {
    const testId = `revoke-update-${Date.now()}-${Math.random()}`;
    await appendAudit(prisma, {
      actorId: "test-actor-revoke",
      op: "system.setting.update",
      context: { testId },
    });

    await expect(
      prisma.$executeRawUnsafe(
        `UPDATE audit_logs SET op = 'hacked' WHERE context->>'testId' = $1`,
        testId,
      ),
    ).rejects.toThrow(/permission denied|insufficient.privilege|42501/i);
  });

  it("AC1 — Postgres rejects DELETE on audit_logs with insufficient_privilege (42501)", async () => {
    // Insert a row first so the BEFORE-DELETE FOR-EACH-ROW trigger fires.
    // (A no-match DELETE wouldn't trigger the guard.)
    const testId = `revoke-delete-${Date.now()}-${Math.random()}`;
    await appendAudit(prisma, {
      actorId: "test-actor-revoke-delete",
      op: "system.setting.update",
      context: { testId },
    });

    await expect(
      prisma.$executeRawUnsafe(
        `DELETE FROM audit_logs WHERE context->>'testId' = $1`,
        testId,
      ),
    ).rejects.toThrow(/permission denied|insufficient.privilege|42501/i);
  });

  it("AC1 — Postgres rejects TRUNCATE on audit_logs with insufficient_privilege (42501)", async () => {
    await expect(
      prisma.$executeRawUnsafe(`TRUNCATE TABLE audit_logs`),
    ).rejects.toThrow(/permission denied|insufficient.privilege|42501/i);
  });

  it("AC1 — appendAudit succeeds outside a transaction (INSERT remains permitted)", async () => {
    const testId = `insert-ok-${Date.now()}-${Math.random()}`;

    await expect(
      appendAudit(prisma, {
        actorId: "test-actor-insert",
        op: "system.setting.update",
        context: { testId },
      }),
    ).resolves.toBeUndefined();

    const row = await prisma.auditLog.findFirst({
      where: { context: { path: ["testId"], equals: testId } },
    });
    expect(row).not.toBeNull();
  });

  it("AC1 — SELECT remains permitted via Prisma findMany", async () => {
    await expect(prisma.auditLog.findMany({ take: 1 })).resolves.toBeInstanceOf(
      Array,
    );
  });
});
