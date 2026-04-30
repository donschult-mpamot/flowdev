// Integration tests against a live flowdev-postgres (local) or the GH Actions
// `postgres` service container (CI). Verifies AC1 (REVOKE + trigger enforcement),
// AC2 (commit semantics), and AC3 (rollback semantics).
//
// Local prereqs: `npm run db:up` then `npm run db:migrate --workspace=packages/db`
// CI: provided by .github/workflows/ci.yml (services.postgres + Run migrations).
//
// Gating: integration tests skip cleanly when DATABASE_URL is unset so unit
// tests still pass in environments without a DB. CI sets DATABASE_URL at the
// job level; locally, devs export it (or source .env) before running tests.
//
// Test isolation: this suite uses the unique-marker pattern (each test stamps
// rows with a random `context.testId` and queries by that). The rollback
// pattern from `_bmad-output/implementation-artifacts/1-1-...md` doesn't fit
// here because audit_logs is append-only — the AC1 REVOKE/trigger tests
// deliberately commit a row first so there's something to attempt to mutate.
// See story §Dev Notes "Testing standards" for the project-wide convention.

import { describe, expect, it } from "vitest";
import { prisma } from "@flowdev/db";
import { appendAudit } from "./append.js";

const hasDb = Boolean(process.env.DATABASE_URL);

if (!hasDb) {
  // Surface the reason for skipping so devs running locally without `.env`
  // sourced see why integration coverage is missing instead of a silent skip.
  console.warn(
    "[append.integration.test] DATABASE_URL not set — integration tests skipped. " +
      "Local: `npm run db:up && export DATABASE_URL=...` (see .env.example). CI: set at job level.",
  );
}

describe.skipIf(!hasDb)("appendAudit / audit_logs (integration)", () => {
  it("AC2 — appendAudit participates in the caller's transaction (savepoint rollback test)", async () => {
    // This test distinguishes "shares the caller's tx" from "opens its own
    // inner tx" — if appendAudit committed independently, the SAVEPOINT
    // rollback below could not undo the second insert.
    const persistedTestId = `commit-persisted-${Date.now()}-${Math.random()}`;
    const rolledBackTestId = `commit-rolledback-${Date.now()}-${Math.random()}`;

    await prisma.$transaction(async (tx) => {
      await appendAudit(tx, {
        actorId: "test-actor-persisted",
        op: "system.setting.update",
        context: { testId: persistedTestId },
      });

      await tx.$executeRawUnsafe(`SAVEPOINT sp_audit`);

      await appendAudit(tx, {
        actorId: "test-actor-rolled-back",
        op: "system.setting.update",
        context: { testId: rolledBackTestId },
      });

      await tx.$executeRawUnsafe(`ROLLBACK TO SAVEPOINT sp_audit`);
    });

    const persisted = await prisma.auditLog.findMany({
      where: { context: { path: ["testId"], equals: persistedTestId } },
    });
    expect(persisted).toHaveLength(1);
    expect(persisted[0]).toMatchObject({
      actorId: "test-actor-persisted",
      op: "system.setting.update",
    });
    expect(persisted[0]?.occurredAt).toBeInstanceOf(Date);

    const rolledBack = await prisma.auditLog.findMany({
      where: { context: { path: ["testId"], equals: rolledBackTestId } },
    });
    expect(rolledBack).toHaveLength(0);
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

  it("AC1 — Postgres rejects UPDATE on audit_logs (immutability trigger fires)", async () => {
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
    ).rejects.toThrow(
      /audit_logs is append-only|permission denied|insufficient.privilege|42501/i,
    );
  });

  it("AC1 — Postgres rejects DELETE on audit_logs (immutability trigger fires)", async () => {
    // Insert a row first so the BEFORE-DELETE FOR-EACH-ROW trigger has
    // something to fire on. (A no-match DELETE wouldn't trigger the row
    // guard; the FOR EACH STATEMENT companion trigger catches that case.)
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
    ).rejects.toThrow(
      /audit_logs is append-only|permission denied|insufficient.privilege|42501/i,
    );
  });

  it("AC1 — Postgres rejects no-row UPDATE on audit_logs (statement-level trigger fires)", async () => {
    // Verifies the FOR EACH STATEMENT companion trigger blocks WHERE 1=0
    // patterns that wouldn't fire the FOR EACH ROW trigger.
    await expect(
      prisma.$executeRawUnsafe(`UPDATE audit_logs SET op = 'hacked' WHERE 1=0`),
    ).rejects.toThrow(
      /audit_logs is append-only|permission denied|insufficient.privilege|42501/i,
    );
  });

  it("AC1 — Postgres rejects no-row DELETE on audit_logs (statement-level trigger fires)", async () => {
    await expect(
      prisma.$executeRawUnsafe(`DELETE FROM audit_logs WHERE 1=0`),
    ).rejects.toThrow(
      /audit_logs is append-only|permission denied|insufficient.privilege|42501/i,
    );
  });

  it("AC1 — Postgres rejects TRUNCATE on audit_logs", async () => {
    await expect(
      prisma.$executeRawUnsafe(`TRUNCATE TABLE audit_logs`),
    ).rejects.toThrow(
      /audit_logs is append-only|permission denied|insufficient.privilege|42501/i,
    );
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
