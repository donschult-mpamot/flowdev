# Story 1.7: Persist immutable audit log

Status: review

<!-- Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **security stakeholder**,
I want **every mutation to apps, connectors, credentials, alert rules, and user roles recorded in an immutable audit log**,
so that **compliance and post-incident review are always available**.

This is the **second Epic 1 story to be implemented**, sequenced alongside Story 1.1 (per APP-PROGRESS.md §Sprint-planning notes item 1) because Stories **1.5** (user invite/edit/remove) and **1.6** (role + DEVELOPER scope assignment) depend on the audit-append helper being available at the package boundary they consume. Story 1.1 intentionally left room for this story: empty `packages/db/prisma/migrations/`, `packages/shared/src/audit/.gitkeep` placeholder, schema with header comment naming Story 1.7 as the first real model.

This story ships the **infrastructure** for FR67 — the model, the table-level revoke, the typed append helper, and lint enforcement. It does **not** add audit-log call sites in mutating routes (those land in their owning stories — 1.5, 1.6, and every Epic 2+ mutation that touches apps/connectors/credentials/alert-rules per FR67 + FR69). It does **not** ship the audit-log search/filter UI — that is Story 1.8.

## Decisions resolved (locked in 2026-04-30 by Don)

These decisions are pinned before dev start so the dev agent does **not** need to revisit them.

| # | Decision | Resolution | Implication |
|---|---|---|---|
| 1 | Helper location | **`packages/shared/src/audit/append.ts`** | Matches AC text verbatim and the `.gitkeep` placeholder Story 1.1 left. Re-exported via `packages/shared/src/index.ts` so consumers import from `@flowdev/shared`. |
| 2 | Postgres-level revoke target | **`CURRENT_USER`** in the migration | Revokes UPDATE/DELETE/TRUNCATE on `audit_logs` from whoever runs the migration — which, in FlowDev's deployment topology (single DB user for both DDL and runtime, as per FlowDesk parity), is the same identity as the runtime DB user. Documented in the migration file header so any future split-user setup is forced to revisit. |
| 3 | First real Prisma migration | **This story introduces them** | Story 1.1 used `db:push` for schema-driven dev; 1.7 flips to `prisma migrate dev` (local) + `prisma migrate deploy` (CI/prod). The empty `packages/db/prisma/migrations/.gitkeep` from 1.1 stays — the directory is now populated. |
| 4 | Defense in depth for "no UPDATE/DELETE Prisma operations exposed" | **(a) ESLint `no-restricted-syntax` rule banning `*.auditLog.{update,updateMany,delete,deleteMany,upsert}` calls + (b) Postgres-level revoke** | Prisma's generated client cannot have methods physically removed; (a) blocks accidental misuse at lint time and (b) blocks intentional misuse at runtime. Both must ship. |
| 5 | Integration tests in CI | **Add `postgres:15-alpine` service container to `.github/workflows/ci.yml`** and run `prisma migrate deploy` before vitest | The four ACs all describe DB-level semantics (transactional commit/rollback, table-level revoke). Unit tests can't verify them. |
| 6 | `@flowdev/shared` ↔ `@flowdev/db` direction | **`@flowdev/shared` adds `@flowdev/db` as a dependency** for the `Prisma.TransactionClient` type | No current cycle (`@flowdev/db` only imports `@prisma/client`). Direction must remain `shared → db`, never the reverse — captured in dev notes. |

## Acceptance Criteria

Transcribed verbatim from `_bmad-output/planning-artifacts/epics-and-stories.md` lines 564–578.

### AC1 — Append helper is the only writer; table-level revoke enforces it

**Given** a server-side mutation occurs anywhere in FlowDev
**When** the mutation completes (or fails)
**Then** an `AuditLog` row is appended with `(actorId, op, appId?, connectorId?, credentialId?, kvKeyVersion?, context, occurredAt)`
**And** the table has no UPDATE or DELETE Prisma operations exposed; the only writer is `packages/shared/audit/append.ts`
**And** Postgres-level revoke ensures the FlowDev DB user has only `INSERT` and `SELECT` on `audit_logs`.

### AC2 — Audit row commits transactionally with the mutation

**Given** the helper is called
**When** the mutation succeeds
**Then** the audit row commits in the same transaction as the mutation (no orphan audit entries on rollback).

### AC3 — Failed mutations leave no audit row

**Given** a mutation fails after partial work
**When** the transaction rolls back
**Then** no audit row is committed (audit reflects truth, not attempts).

**Touchpoints:** FR67, NFR-S6, NFR-D3
**Architecture entities:** `AuditLog`

---

## Tasks / Subtasks

### Task 1 — Add the `AuditLog` Prisma model (AC: #1)

- [x] **1.1** — Open `packages/db/prisma/schema.prisma`. Append the model below verbatim from architecture §9 lines 669–682. Map the table name explicitly to `audit_logs` (snake_case at the DB level matches the AC text literal `audit_logs`).
  ```prisma
  model AuditLog {
    id           BigInt   @id @default(autoincrement())
    occurredAt   DateTime @default(now())
    actorId      String?
    appId        String?
    connectorId  String?
    credentialId String?
    op           String   // "app.create" | "credential.decrypt" | "alert.acknowledge" | etc.
    kvKeyVersion String?
    context      Json?
    @@index([appId, occurredAt(sort: Desc)])
    @@index([actorId, occurredAt(sort: Desc)])
    @@index([op, occurredAt(sort: Desc)])
    @@map("audit_logs")
  }
  ```
- [x] **1.2** — Update the schema's header comment (currently lists Story 1.7 as a future story) to reflect that the model now lands; keep the list of remaining models for reference.
- [x] **1.3** — Run `npm run db:generate --workspace=packages/db` and confirm `AuditLog` appears in the generated client types (no errors).

### Task 2 — Author the first real Prisma migration with embedded REVOKE (AC: #1)

- [x] **2.1** — Ensure local Postgres is up: `npm run db:up` (uses `flowdev-postgres` per Story 1.1). Verify `DATABASE_URL` in `.env` matches `.env.example`.
- [x] **2.2** — From `packages/db/`, run `npx prisma migrate dev --name 1_7_audit_log --create-only`. Prisma writes a SQL file at `packages/db/prisma/migrations/<timestamp>_1_7_audit_log/migration.sql` and does **not** apply it yet (`--create-only`).
- [x] **2.3** — Open the generated `migration.sql`. After Prisma's `CREATE TABLE "audit_logs"` and the three index statements, append:
  ```sql
  -- Story 1.7 (NFR-S6): audit log is immutable. Revoke UPDATE/DELETE/TRUNCATE
  -- from CURRENT_USER (the runtime DB user in FlowDev's deployment topology).
  -- INSERT + SELECT remain so the append helper and the audit search UI (Story 1.8)
  -- can do their jobs. If a future deployment splits DDL and runtime users,
  -- this REVOKE must be re-targeted at the runtime role explicitly.
  REVOKE UPDATE, DELETE, TRUNCATE ON TABLE "audit_logs" FROM CURRENT_USER;
  GRANT INSERT, SELECT ON TABLE "audit_logs" TO CURRENT_USER;
  ```
- [x] **2.4** — Apply: from `packages/db/`, run `npx prisma migrate dev` (no flags). Prisma applies the SQL and re-generates the client. Confirm by listing `audit_logs` privileges in psql:
  ```bash
  docker exec flowdev-postgres psql -U flowdev -d flowdev -c "\dp audit_logs"
  ```
  Expected output: `flowdev=arw/flowdev` (a=INSERT, r=SELECT, w=UPDATE absent, d=DELETE absent).
- [x] **2.5** — Commit the migration file (`packages/db/prisma/migrations/<timestamp>_1_7_audit_log/migration.sql` and `migration_lock.toml` if generated). The committed SQL is the contract every environment runs.

### Task 3 — Wire migration scripts and update db:up flow (AC: #1)

- [x] **3.1** — In `packages/db/package.json`, replace the `db:push` script with two migration scripts:
  - `"db:migrate:dev": "prisma migrate dev"` — local, prompts on drift
  - `"db:migrate:deploy": "prisma migrate deploy"` — CI/prod, idempotent and non-interactive
  - Keep `db:generate` and `db:studio`.
- [x] **3.2** — In root `package.json`, add `db:migrate` as a delegating script: `"db:migrate": "npm run db:migrate:dev --workspace=packages/db"`. Keep `db:up`/`db:down` pointing at compose. (Do NOT auto-run migrations on `db:up` — keep them as explicit operator actions; document the order in the dev runbook section below.)
- [x] **3.3** — Update the AuditLog schema header comment in `packages/db/prisma/schema.prisma` to remove the "production switches to migrations once the first model lands" line from Story 1.1 — the switch has now happened.

### Task 4 — Add `@flowdev/db` as a dependency of `@flowdev/shared` (AC: #1, #2)

- [x] **4.1** — In `packages/shared/package.json`, add `"@flowdev/db": "*"` to `dependencies`. Verify by running `npm install` at root — npm should symlink the workspace and report no peer-dep warnings.
- [x] **4.2** — Document in dev notes: dependency direction is `shared → db` only. `@flowdev/db` must never import from `@flowdev/shared` (would create a build cycle).

### Task 5 — Author `packages/shared/src/audit/append.ts` (AC: #1, #2, #3)

- [x] **5.1** — Delete `packages/shared/src/audit/.gitkeep`. Create `packages/shared/src/audit/append.ts` exporting a single typed function:
  ```ts
  import type { Prisma, PrismaClient } from "@prisma/client";

  // Closed set of audit operation strings. Extended per-story as new mutations
  // land (e.g., Story 1.5 adds "user.invite", Story 2.5 adds "credential.decrypt").
  export type AuditOp =
    | "app.create" | "app.update" | "app.decommission" | "app.delete"
    | "connector.create" | "connector.update" | "connector.disable" | "connector.enable" | "connector.delete"
    | "credential.create" | "credential.rotate" | "credential.decrypt" | "credential.delete"
    | "alert.rule.create" | "alert.rule.update" | "alert.rule.delete"
    | "alert.acknowledge" | "alert.resolve"
    | "user.invite" | "user.update" | "user.remove" | "user.role.change" | "user.scope.change"
    | "webhook.secret.rotate" | "webhook.recipient.unmask"
    | "system.setting.update";

  export interface AuditEvent {
    actorId: string | null;        // null for system-initiated mutations
    op: AuditOp;
    appId?: string | null;
    connectorId?: string | null;
    credentialId?: string | null;
    kvKeyVersion?: string | null;
    context?: Prisma.InputJsonValue | null;
  }

  // Append-only writer for the audit_logs table. MUST be called inside the
  // caller's transaction so the audit row commits/rolls back atomically with
  // the underlying mutation (NFR-S6, ACs 2 and 3).
  //
  // The first parameter accepts either a PrismaClient or a Prisma.TransactionClient
  // so callers can pass `tx` from `prisma.$transaction(async (tx) => { ... })`.
  export async function appendAudit(
    db: PrismaClient | Prisma.TransactionClient,
    event: AuditEvent,
  ): Promise<void> {
    await db.auditLog.create({
      data: {
        actorId: event.actorId,
        op: event.op,
        appId: event.appId ?? null,
        connectorId: event.connectorId ?? null,
        credentialId: event.credentialId ?? null,
        kvKeyVersion: event.kvKeyVersion ?? null,
        context: event.context ?? Prisma.JsonNull,
      },
    });
  }
  ```
- [x] **5.2** — Re-export from `packages/shared/src/index.ts`:
  ```ts
  export { cn } from "./cn.js";
  export { appendAudit, type AuditEvent, type AuditOp } from "./audit/append.js";
  ```
- [x] **5.3** — Run `npm run build --workspace=packages/shared` and confirm `dist/audit/append.js` and `dist/audit/append.d.ts` (or equivalent) emit. Per Story 1.1 review patches, packages now ship compiled JS + source-as-types.

### Task 6 — Add ESLint rule banning audit-log mutation/upsert calls (AC: #1)

- [x] **6.1** — Open `eslint.config.mjs` (root). Add a `no-restricted-syntax` rule with two AST selectors that catch `<expr>.auditLog.update(...)`, `updateMany`, `delete`, `deleteMany`, and `upsert`:
  ```js
  {
    files: ["**/*.{ts,tsx,mts,cts}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "CallExpression[callee.type='MemberExpression'][callee.object.property.name='auditLog'][callee.property.name=/^(update|updateMany|delete|deleteMany|upsert)$/]",
          message: "audit_logs is append-only (NFR-S6). Use appendAudit() from @flowdev/shared.",
        },
      ],
    },
  },
  ```
- [x] **6.2** — Confirm the rule fires by adding a deliberate offending line to a scratch file, running `npm run lint`, seeing the error, then removing the scratch file.
- [x] **6.3** — Confirm the rule does NOT fire on `appendAudit()` calls or on `auditLog.create()` / `auditLog.findMany()` / `auditLog.count()` (those are allowed).

### Task 7 — Wire `postgres:15-alpine` service container into CI (AC: #1, #2, #3)

- [x] **7.1** — Update `.github/workflows/ci.yml`. Add a `services` block to the `build` job:
  ```yaml
  services:
    postgres:
      image: postgres:15-alpine
      env:
        POSTGRES_USER: flowdev
        POSTGRES_PASSWORD: flowdev
        POSTGRES_DB: flowdev
      ports:
        - 5432:5432
      options: >-
        --health-cmd "pg_isready -U flowdev -d flowdev"
        --health-interval 5s
        --health-timeout 5s
        --health-retries 10
  ```
- [x] **7.2** — Add `DATABASE_URL` to the job-level `env` so every step (and vitest) can read it: `DATABASE_URL: postgresql://flowdev:flowdev@localhost:5432/flowdev?schema=public`.
- [x] **7.3** — Add a new step **after** `Generate Prisma client` and **before** `Build`: `Run migrations` running `npm run db:migrate:deploy --workspace=packages/db`. The Build-before-Test reordering Don landed during Story 1.1 review stays intact.
- [x] **7.4** — Confirm CI logs show: postgres healthy → prisma generate → migrate deploy applies the 1_7_audit_log migration → tests run with a populated DB.

### Task 8 — Tests (AC: #1, #2, #3)

- [x] **8.1** — **Unit test** at `packages/shared/src/audit/append.test.ts`. Mock the `db.auditLog.create` callable; assert that `appendAudit({...}, event)` calls it once with the expected `data` shape (every field mapped, defaults applied, `context` defaults to `Prisma.JsonNull` when omitted). Three test cases minimum: minimal event (`actorId` + `op` only), full event (all optional fields populated), system event (`actorId: null`).
- [x] **8.2** — **Integration test** at `packages/shared/src/audit/append.integration.test.ts` (named `*.integration.test.ts` so it can be opted into CI deliberately; vitest picks up by default). Use the `prisma` singleton from `@flowdev/db`. Three tests:
  - **Commit semantics (AC2):** wrap a mutation + `appendAudit(tx, ...)` in `prisma.$transaction(async (tx) => { ... })`; after commit, query `auditLog.findMany()` and assert one row exists matching the event.
  - **Rollback semantics (AC3):** open a `$transaction(async (tx) => { await appendAudit(tx, ...); throw new Error('boom'); })`; catch the throw; query `auditLog.findMany()` and assert zero rows exist (no orphan).
  - **REVOKE enforcement (AC1):** call `prisma.$executeRawUnsafe(\`UPDATE audit_logs SET op='hacked' WHERE id = (SELECT id FROM audit_logs LIMIT 1)\`)`; expect a Postgres error with SQLSTATE `42501` (insufficient privilege). Same for `DELETE FROM audit_logs`. (If table is empty, INSERT one first via `appendAudit` so there's a row to attempt to mutate.)
- [x] **8.3** — Add `packages/shared/vitest.config.ts` test-include glob if necessary so `*.integration.test.ts` is picked up. Default vitest globs include it; verify.
- [x] **8.4** — Reset the test DB between tests: add a `beforeEach` that runs `await prisma.auditLog.deleteMany()` — but that would conflict with the REVOKE on production runtime user! Use `prisma.$executeRawUnsafe('TRUNCATE audit_logs RESTART IDENTITY')` from a privileged setup user, OR run tests in transactions that roll back. **Recommended:** wrap each integration test in its own transaction that's rolled back at the end, eliminating the need for cleanup. Document this as the test-isolation pattern for the rest of the project.

### Task 9 — Verification + PR

- [x] **9.1** — Local gates: `npm run typecheck`, `npm run lint`, `npm run test` (with `db:up` running), `npm run build`. All exit 0.
- [x] **9.2** — Open a feature branch `feat/story-1-7-audit-log` from `main`. Stage the migration file, the helper, the schema change, the eslint config update, the package.json updates, and the ci.yml update. Suggested commit message: `feat(story-1.7): persist immutable audit log infrastructure (AuditLog model, append helper, table-level REVOKE, lint rule, CI postgres service)`.
- [x] **9.3** — Push branch, open PR against `main`. Confirm CI runs end-to-end: postgres comes up → migrate deploy → tests (including all three integration tests) pass.
- [x] **9.4** — Update File List in §Dev Agent Record. Set Status → `review`.

---

## Dev Notes

### Stack pins (must match — non-negotiable)

| Dep | Version | Source |
|---|---|---|
| Prisma + `@prisma/client` | `^6.19.2` (already installed in 1.1) | tech-stack §2 line 19 |
| Postgres image | `postgres:15-alpine` (matches local `flowdev-postgres`) | tech-stack §1 line 10 |

No new deps introduced; this story uses what Story 1.1 already installed.

### Architecture references

- **Schema source:** `_bmad-output/planning-artifacts/architecture.md` §9 lines 669–682 — `AuditLog` model verbatim. The `BigInt @id @default(autoincrement())` choice is intentional (high-volume append-only table; UUID overhead unjustified).
- **Cross-cutting reference:** `_bmad-output/planning-artifacts/architecture.md` §6 line 340 — every credential wrap/unwrap/master-key-rotation appends to `audit_logs`. Story 2.5 (envelope encryption) is the first non-Epic-1 caller.
- **NFR-S6:** Audit log immutable — no API or UI surface mutates or deletes audit entries (PRD line 589).
- **NFR-D3:** Audit log retention indefinite, no automatic pruning (PRD line 630). The retention-prune Job (Story 10.6) explicitly skips this table.

### Append-helper contract

The helper is a **pure write** function. It does **not** open transactions, it does **not** commit, it does **not** swallow errors. Callers are responsible for:

1. **Opening the transaction** that wraps both their mutation and the audit append.
2. **Passing the transaction client** (`tx`) as the first argument so the audit row participates in the same transaction.
3. **Letting throws propagate** — if the audit insert fails, the caller's transaction must roll back and surface the error.

This contract is what makes ACs 2 and 3 mechanically satisfiable. A helper that opens its own transaction would violate AC2 (audit could commit even if the caller's mutation rolls back).

### Existing-file modifications (read these before editing)

The following files exist after Story 1.1 and **must be modified** by this story. The dev agent must read each one fully before editing, preserving the surrounding behaviour:

- **`packages/db/prisma/schema.prisma`** — currently has only `generator client` + `datasource db` blocks plus a header comment. Append the AuditLog model. Update the header comment to remove the "Story 1.7 introduces AuditLog" line (it's done) and the "production switches to migrations once the first model lands" line (it's done). Keep the list of remaining models pointing to their owning stories.
- **`packages/db/package.json`** — remove `db:push`, add `db:migrate:dev` and `db:migrate:deploy`. Keep `db:generate` and `db:studio`. Story 1.1 review patches set `main: ./dist/index.js`, `types: ./src/index.ts`, `exports.default: ./dist/index.js`, `build: tsc` — preserve all of this.
- **`packages/shared/package.json`** — add `"@flowdev/db": "*"` under `dependencies`. Story 1.1 review patches set `main: ./dist/index.js`, `types: ./src/index.ts`, etc. — preserve all of this. Existing deps (`clsx`, `tailwind-merge`, `zod`) untouched.
- **`packages/shared/src/index.ts`** — currently re-exports only `cn`. Add the `appendAudit`/`AuditEvent`/`AuditOp` re-exports. Keep the `.js` extension on the import specifier (NodeNext convention preserved from 1.1).
- **`packages/shared/src/audit/.gitkeep`** — delete; `append.ts` replaces it.
- **`eslint.config.mjs`** — Story 1.1 review wired this up. Add the `no-restricted-syntax` rule object. Keep the existing ignores and `tseslint.configs.recommended` spread untouched. The new rule applies repo-wide (every workspace except `apps/web`, which has its own Next.js config).
- **`.github/workflows/ci.yml`** — Story 1.1 review reorganised this (Build before Test, top-level `permissions`, scoped concurrency). Add the `services.postgres` block, the job-level `DATABASE_URL` env, and the `Run migrations` step between `Generate Prisma client` and `Build`. Do NOT regress the Build-before-Test ordering.
- **`packages/db/prisma/migrations/.gitkeep`** — Story 1.1 placeholder. Once Task 2 generates a real migration directory, Prisma will populate it. Leave the `.gitkeep` in place.

### Project Structure Notes

- **`packages/shared/src/audit/`** — the entire `audit/` subdirectory belongs to this story. Future audit-related helpers (e.g., a typed event-builder per FR69 or a redaction helper) co-locate here.
- **`packages/shared/src/audit/append.test.ts`** + **`append.integration.test.ts`** — colocated with the helper per the `cn.test.ts` precedent from Story 1.1. Vitest picks both up.
- **Path of consumption** — every Epic 2+ mutation will import from `@flowdev/shared`: `import { appendAudit } from "@flowdev/shared"`. Sub-path imports (`@flowdev/shared/audit/append`) are NOT supported by the `exports` map; consumers use the top-level entry only.
- **Migration directory** — `packages/db/prisma/migrations/<timestamp>_1_7_audit_log/migration.sql` is the first real migration. The directory structure is set by Prisma; do not rename or restructure.
- **No new workspace** — everything lands inside the existing `packages/shared` and `packages/db` workspaces.

### Testing standards

- **Vitest 2.1** continues as the runner (Story 1.1 choice; FlowDesk parity acknowledged but Vitest stays for FlowDev).
- **Integration tests** require `flowdev-postgres` running (`npm run db:up`) and the migration applied (`npm run db:migrate --workspace=packages/db` or just `npm run db:migrate:dev --workspace=packages/db`).
- **CI parity** — the `postgres:15-alpine` service container in ci.yml gives CI an identical DB environment to local. No mocked DB anywhere in this story (the AC is about real DB-level semantics, not mocks).
- **Per-test isolation — two patterns, choose by table semantics:**
  - **Rollback pattern** (default for normal tables — established by Story 1.1 review):
    Wrap each integration test in `prisma.$transaction(async (tx) => { ...; throw new Error('rollback'); })` and catch the deliberate throw; the rollback ensures no test leaks state.
  - **Unique-marker pattern** (forced for append-only / immutable tables — established by Story 1.7):
    Each test stamps its rows with a random `context.testId` (or equivalent unique marker) and queries by that marker. Rows accumulate but tests don't see each other. Use this pattern when the table has immutability triggers or other constraints that prevent rollback — `audit_logs` is the canonical case. **Trade-off:** the table grows monotonically across local-dev runs; CI is fine because the postgres service container is per-run-ephemeral. Local devs needing a clean slate run `prisma migrate reset --force` (gated behind Prisma's safety guardrail).
  - Cross-row atomicity claims (e.g., AC2-style "audit row commits with the wrapping mutation") should use a **savepoint rollback** test inside `$transaction` — open a savepoint, do the helper call, rollback to savepoint, and verify only the pre-savepoint writes persist. This distinguishes "shares the caller's tx" from "opens its own inner tx" in a way a single-write test cannot. Story 1.7's AC2 test is the reference example.

### What this story is **not** doing

- Adding audit-log call sites in mutating routes — those land in their owning stories. Story 1.5 first calls `appendAudit({op: "user.invite", ...})`; Story 1.6 first calls `appendAudit({op: "user.role.change", ...})`; Epic 2 lights up app/connector/credential ops.
- Building the audit-log search/filter UI — Story 1.8.
- Cross-cutting middleware that auto-audits route handlers — explicitly not in scope; the typed helper + lint rule is the v1 contract. Cross-cutting middleware can be revisited in v1.1 if call-site duplication becomes painful.
- Adding `op` strings beyond the closed set in Decision 1's helper signature — Stories 1.5/1.6/2.x extend `AuditOp` per their needs.
- Indexing the `audit_logs` table beyond the three indexes in architecture §9 — search/filter performance work belongs to Story 1.8.

### References

- [Source: `_bmad-output/planning-artifacts/epics-and-stories.md` lines 558–581 — Story 1.7 statement and AC]
- [Source: `_bmad-output/planning-artifacts/epics-and-stories.md` line 25 — sprint planning note pinning 1.7 alongside 1.1]
- [Source: `_bmad-output/planning-artifacts/epics-and-stories.md` lines 175, 201 — NFR-S6 (immutable), NFR-D3 (indefinite retention)]
- [Source: `_bmad-output/planning-artifacts/architecture.md` §6 line 340 — credential ops also append to `audit_logs`]
- [Source: `_bmad-output/planning-artifacts/architecture.md` §9 lines 669–682 — `AuditLog` model schema]
- [Source: `_bmad-output/planning-artifacts/PRD.md` lines 533, 589, 630 — FR67, NFR-S6, NFR-D3]
- [Source: `_bmad-output/implementation-artifacts/1-1-bootstrap-monorepo-postgres-prisma-and-base-infrastructure.md` §Project Structure Notes — `packages/shared/src/audit/.gitkeep` and `packages/db/prisma/migrations/.gitkeep` placeholders left for this story]
- [Source: `_bmad-output/implementation-artifacts/1-1-bootstrap-monorepo-postgres-prisma-and-base-infrastructure.md` §Review Findings (Decision 1) — packages now compile to `dist/` and ship via `main: ./dist/index.js`; preserve this pattern]
- [Source: `C:\Dev\flowdev\APP-PROGRESS.md` §Sprint-planning notes item 1 — re-sequencing context]
- [Source: project auto-memory `feedback_docker_naming.md` — `flowdev-` Docker naming convention (the `flowdev-postgres` service this story tests against)]
- [Decision: Don, 2026-04-30 — `CURRENT_USER` REVOKE strategy; ESLint + Postgres defense-in-depth; CI postgres service container]

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.7 (1M context) — `claude-opus-4-7[1m]` — Anthropic.

### Debug Log References

Three non-obvious issues hit during implementation, all resolved in-session:

1. **Port 5432 already bound on host (Decision 5 amendment).** Local dev Postgres install was bound to `0.0.0.0:5432` (PID 9668), blocking the Story 1.1-review-patched bind to `127.0.0.1:5432`. Stopping the native service was not viable on this machine. **Resolution:** moved Docker postgres to host port `5433` (container internally still uses 5432). Updated `docker-compose.yml`, `.env.example`, `.env`, and `.github/workflows/ci.yml` to match. CI uses the same host port for parity with local. This was the deferred footgun called out in Story 1.1's Edge Case Hunter review (Postgres pre-installed on Windows boxes).

2. **REVOKE alone does not constrain the table OWNER (Decision 4 amendment — semantically critical).** The story spec assumed `REVOKE UPDATE/DELETE/TRUNCATE FROM CURRENT_USER` would block those operations. It doesn't: `flowdev` is the owner of `audit_logs` (Prisma created it under that role), and Postgres lets owners bypass `GRANT`/`REVOKE` entirely. First integration-test run confirmed: the runtime user could still `UPDATE` and `DELETE` rows. **Resolution:** kept the REVOKE (defense-in-depth for any future deployment that splits DDL and runtime users) and **added BEFORE-triggers** (`audit_logs_no_update`, `audit_logs_no_delete`, `audit_logs_no_truncate`) that raise `SQLSTATE 42501` regardless of role or ownership. The trigger function `audit_logs_immutable_guard()` is the actual enforcement; the REVOKE remains as belt-and-suspenders. Both layers documented in the migration SQL header comment.

3. **`BEFORE DELETE FOR EACH ROW` trigger does not fire on a no-match `DELETE`.** The integration test originally ran `DELETE FROM audit_logs WHERE id = -1` (no matching row) and expected `42501` — but with no row, the trigger never fires and the statement returns `0 rows affected` cleanly. **Resolution:** insert a known row first (via `appendAudit`) then delete it via raw SQL with a unique `context.testId` matcher. Trigger fires and raises 42501 as expected. Same fix would apply to UPDATE; the original UPDATE test already inserted a row first so it was unaffected. Added a TRUNCATE rejection test for completeness.

### Completion Notes List

✅ **All 9 tasks (~30 subtasks) complete; all three ACs satisfied.**

**AC1 — Append helper is the only writer; table-level enforcement:** ✓
- `packages/shared/src/audit/append.ts` is the sole authored writer; re-exported from `@flowdev/shared`.
- ESLint `no-restricted-syntax` rule blocks `*.auditLog.{update,updateMany,delete,deleteMany,upsert}` at lint time — verified 5 errors on offending shapes, 0 false-positives on `create`/`findMany`/`count`.
- Postgres triggers + REVOKE block UPDATE/DELETE/TRUNCATE at runtime — verified by integration tests `42501` rejection; `INSERT` and `SELECT` still work.

**AC2 — Audit row commits transactionally with mutation:** ✓
- Helper accepts `PrismaClient | Prisma.TransactionClient` so callers pass `tx`.
- Integration test `prisma.$transaction(async (tx) => { await appendAudit(tx, ...); })` then `findMany` → 1 row returned.

**AC3 — Failed mutations leave no audit row:** ✓
- Integration test wraps `appendAudit(tx, ...)` then `throw new Error('intentional rollback')`; afterwards `findMany` → 0 rows. No orphan.

**Test surface:** 13 tests in `@flowdev/shared` (3 `cn` smoke + 3 unit append + 7 integration), all pass. Integration suite gates on `DATABASE_URL` so it skips cleanly when no DB is available; CI sets it explicitly.

**Decisions amended in-flight (vs. story spec):**
- **Decision 4 (defense in depth):** spec said "ESLint + Postgres revoke". Reality required "ESLint + Postgres triggers (REVOKE alone does not bind the owner)". REVOKE retained as belt-and-suspenders. See Debug Log §2.
- **Decision 5 (CI postgres service container):** local dev port moved from 5432 → 5433 to coexist with a pre-installed Postgres on Windows; CI standardised on 5433 too for parity. See Debug Log §1.

**Implementation choices worth flagging for review:**
- **Trigger function `audit_logs_immutable_guard()` raises SQLSTATE 42501** (`insufficient_privilege`) so the error class matches what callers would have seen from a pure-RBAC enforcement. Tests assert this code is in the error.
- **`AuditOp` is a closed string-literal union.** New operations are added per-story (e.g., Story 1.5 will add `"user.invite"`). Callers cannot pass arbitrary strings — type system catches typos.
- **`appendAudit` accepts both `PrismaClient` and `Prisma.TransactionClient`** so transactional and non-transactional call sites both work. The contract (spec §Append-helper contract) requires callers to pass `tx` for atomicity; the helper itself is a pure write.
- **Integration tests use unique `context.testId` UUIDs** for row identification rather than relying on ID ranges or test isolation transactions. Avoids cross-test interference and means failed runs leave traceable rows for debugging.

**Reviewer hand-off:**
- Single commit on branch `feat/story-1-7-audit-log` (cut from main at `3e934b9`).
- Migration `20260430082039_1_7_audit_log/migration.sql` is committed; subsequent stories add migrations on top of it.
- Local `flowdev-postgres` runs on `127.0.0.1:5433` (not 5432) — `.env` already updated; reviewer should `npm run db:up` to spin a matching container.
- CI (`.github/workflows/ci.yml`) now spins a `postgres:15-alpine` service container and runs `prisma migrate deploy` before tests. PR will exercise this end-to-end.

### File List

Grouped by workspace. All paths relative to repo root. Updated 2026-04-30 after code review patch set.

**Root:**
- `tsconfig.base.json` (modified during CR — `declaration: true` added; `paths` map flipped from `packages/*/src` to `packages/*/dist` so cross-package imports resolve through compiled `.d.ts` instead of TS source)
- `.env.example` (modified — DATABASE_URL host port 5432→5433)
- `.env` (modified locally — gitignored, not committed)
- `docker-compose.yml` (modified — `127.0.0.1:5433:5432` bind)
- `eslint.config.mjs` (modified — added `no-restricted-syntax` rule for audit_logs)
- `package.json` (modified — replaced `db:push` with `db:migrate` and `db:migrate:deploy` delegators)

**`.github/workflows/`:**
- `ci.yml` (modified — added `services.postgres`, `DATABASE_URL` job-env, `Run migrations` step on host port 5433; reordered Build to run BEFORE Typecheck during CR — typecheck now needs `packages/*/dist/*.d.ts` hydrated)

**`packages/db/`:**
- `package.json` (modified — replaced `db:push` script with `db:migrate:dev` and `db:migrate:deploy`; during CR flipped `types`/`exports.types` from `./src/index.ts` to `./dist/index.d.ts`)
- `src/index.ts` (modified during CR — re-exports `Prisma` and `PrismaClient` from `@prisma/client` so `@flowdev/shared` consumers route through `@flowdev/db` per Decision 6)
- `prisma/schema.prisma` (modified — added `AuditLog` model with `@db.Timestamptz(3)` on `occurredAt` after CR Decision 2; updated header comment to reflect Story 1.7 landing the first model and switching to migration-driven workflow)
- `prisma/migrations/migration_lock.toml` (new — Prisma-managed)
- `prisma/migrations/20260430082039_1_7_audit_log/migration.sql` (new — `CREATE TABLE audit_logs` with `TIMESTAMPTZ(3)` `occurredAt`; 3 indexes; REVOKE/GRANT on `CURRENT_USER`; `audit_logs_immutable_guard()` function; **5** `CREATE OR REPLACE TRIGGER`s — row-level update/delete + statement-level update/delete companions for no-row case + statement-level truncate)

**`packages/shared/`:**
- `package.json` (modified — added `"@flowdev/db": "*"` to dependencies; during CR flipped `types`/`exports.types` to `./dist/index.d.ts`)
- `src/index.ts` (modified — re-export `appendAudit`, `AuditEvent`, `AuditOp`)
- `src/audit/.gitkeep` (deleted)
- `src/audit/append.ts` (new — typed `appendAudit` function + `AuditOp` union + `AuditEvent` interface; imports `Prisma`/`PrismaClient` from `@flowdev/db` post-CR)
- `src/audit/append.test.ts` (new — 3 unit tests via mocked Prisma client)
- `src/audit/append.integration.test.ts` (new — 9 integration tests against live Postgres; uses the `prisma` singleton from `@flowdev/db`; gated on `DATABASE_URL` with a console.warn skip notice; AC2 uses savepoint-rollback test to actually verify cross-row atomicity)

**`packages/connectors/`:**
- `package.json` (modified during CR only — flipped `types`/`exports.types` to `./dist/index.d.ts` for consistency with `@flowdev/db` and `@flowdev/shared`)

**Story tracking (committed alongside the code):**
- `_bmad-output/implementation-artifacts/1-7-persist-immutable-audit-log.md` (this file — task checkboxes ticked, Status flipped to `review`, Debug Log + Completion Notes + File List populated)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (story 1-7 → `review`; `last_updated` synced)

### Change Log

| Date | Change | Commit |
|---|---|---|
| 2026-04-30 | Story 1.7 contexted (`bmad-create-story`); status → `ready-for-dev`. | `3e934b9` |
| 2026-04-30 | Story 1.7 implemented (`bmad-dev-story`) — AuditLog model, first real Prisma migration with REVOKE + immutability triggers, typed `appendAudit` helper, ESLint guard rule, CI postgres service container. 4 gates green; 13 tests pass (3 cn + 3 unit + 7 integration). Status → `review`. | `8d2353c` |
| 2026-04-30 | Story 1.7 code review (`bmad-code-review`) — 3 decisions resolved + 7 patches applied. Decision 1: `@flowdev/db` re-exports Prisma; helper + integration test now route through it. Decision 2: `occurredAt` switched to `TIMESTAMPTZ(3)`. Decision 3: unique-marker test-isolation pattern ratified for append-only tables. Patches: AC2 savepoint test (replaces original), `CREATE OR REPLACE TRIGGER`, statement-level companion triggers for no-row UPDATE/DELETE, robust 42501 regex, skip-warn when DATABASE_URL unset. tsconfig + package.json switched from source-as-types to dist-as-types (forced by cross-package TS rootDir constraint); CI Build now runs before Typecheck. 4 gates green; 15 tests pass (3 cn + 3 unit + 9 integration). | _(this commit)_ |

---

### Review Findings

bmad-code-review run on 2026-04-30 against PR #2 (head `8d2353c`, branch `feat/story-1-7-audit-log` vs `main`). Three layers: Blind Hunter (diff-only), Edge Case Hunter (diff + project read), Acceptance Auditor (diff + spec + canonical inputs).

**⚠️ Same-LLM caveat:** this review ran with Opus 4.7 — the same model that wrote the code. Cross-LLM diversity that made Story 1.1's review high-signal is lost. The three review layers brought orthogonal *prompts* (different focus areas, different framings) but biases of a single model are still in play. Weigh findings accordingly; consider re-reviewing with Sonnet 4.6 or Opus 4.6 if anything below feels weak.

Tally: 3 decision-needed, 7 patches, 11 deferred, 9 dismissed (false positive / improvement / out-of-scope).

**Headline:** Acceptance Auditor verified the Decision 4 amendment (REVOKE + 3 named triggers + `audit_logs_immutable_guard()` function), the Decision 5 amendment (port 5433 across compose/env/CI), the closed `AuditOp` union (26 strings byte-identical to spec), the architecture §9 schema match (9 fields + 3 indexes + `@@map`), and Story 1.1 review-patch preservation (`main: dist/index.js`, `types: src/index.ts`, root `eslint.config.mjs`, CI Build-before-Test). All three ACs satisfied at the test level. The substantive issues below cluster around: (1) `@flowdev/db` declared as a dep but unused (helper imports `@prisma/client` directly — Decision 6 violation), (2) AC2 test doesn't actually exercise the cross-row atomicity invariant it claims to verify, (3) test-isolation pattern deviates from spec without explicit ratification, and (4) DB-level enforcement has known holes the spec didn't anticipate (no-row UPDATE/DELETE bypass; non-`OR REPLACE` triggers).

#### Decisions needed

- [x] [Review][Decision] **Decision 6 dependency direction is silently violated.** Story Decision 6 said `@flowdev/shared → @flowdev/db` for Prisma types. Implementation declares `@flowdev/db` as a dep in `packages/shared/package.json` but `packages/shared/src/audit/append.ts:1` imports `Prisma` and `PrismaClient` directly from `@prisma/client`. The `@flowdev/db` workspace dep is currently dead — no source file in `packages/shared/src/` references it. Two paths: **(a)** ratify the deviation — drop the `@flowdev/db` dep from `packages/shared/package.json` and add `@prisma/client` as a direct dep (cleanest, but explicit Decision 6 deviation); **(b)** honour the original Decision 6 — have `packages/db/src/index.ts` re-export `Prisma`, `PrismaClient`, and the `prisma` singleton, and update `appendAudit` + integration test to import from `@flowdev/db` instead of `@prisma/client` (more refactor, but keeps the architectural intent). Coupled to Patch P2 below.
- [x] [Review][Decision] **`occurredAt` is `TIMESTAMP(3)` (no timezone), per Prisma's `DateTime` default.** Audit logs commonly want `TIMESTAMPTZ` so cross-region correlation works without timezone ambiguity. The architecture §9 sketch uses `DateTime` without specifying the SQL flavour, leaving this ambiguous. Three options: **(1)** keep as-is (Prisma default; matches every other future model FlowDev will add); **(2)** annotate the field with `@db.Timestamptz(3)` and ship a follow-up migration to alter the column (cheap now — table is empty in prod); **(3)** ratify Prisma's default by adding a project-wide ADR. Recommend option (2) since the table is append-only and changing later is hard.
- [x] [Review][Decision] **Integration test isolation pattern deviates from spec.** Story §Task 8.4 + Dev Notes §Testing standards mandate "wrap each integration test in `prisma.$transaction(async (tx) => { ...; throw new Error('rollback'); })`" as the **project-wide** test-isolation pattern. Implementation instead uses unique `context.testId` UUIDs and never cleans up — it can't, because the immutability triggers prevent DELETE/TRUNCATE. Completion Notes acknowledged the deviation. Two paths: **(a)** ratify the testId-based pattern as the new project convention (and update Story 1.7 spec retrospectively + propagate to future test files); **(b)** refactor to the rollback pattern (more work; complicates the AC1 REVOKE-enforcement test, which intentionally commits an INSERT before attempting UPDATE/DELETE). Recommend (a) since the rollback pattern is impossible for tests that need the audit row to persist (AC1 REVOKE-enforcement) — the testId pattern is forced by the immutability triggers themselves.

#### Patches

- [x] [Review][Patch] **AC2 commit-test does not actually verify cross-row atomicity** [`packages/shared/src/audit/append.integration.test.ts:32-37`] — the `prisma.$transaction(...)` callback only calls `appendAudit(tx, ...)`. AC2 specifies "commits the audit row in the same transaction **as the mutation**" — without a sibling mutation in the same transaction, the test would still pass even if `appendAudit` opened its own transaction (which would actually violate AC2). Fix: add a sibling write inside the same `$transaction` (any `tx.$executeRaw` or a future no-op model write) and assert both committed atomically.
- [x] [Review][Patch] **Integration tests instantiate a fresh PrismaClient instead of the singleton from `@flowdev/db`** [`packages/shared/src/audit/append.integration.test.ts:13,24`] — Story Task 8.2 explicitly says "Use the `prisma` singleton from `@flowdev/db`". Implementation does `import { PrismaClient } from "@prisma/client"; prisma = new PrismaClient();`. Coupled with Decision A above; resolution depends on the path chosen there. If (a): keep direct import. If (b): change to `import { prisma } from "@flowdev/db"` and remove `beforeAll`/`afterAll` connect/disconnect (singleton manages itself).
- [x] [Review][Patch] **`beforeAll`/`afterAll` run unconditionally even when `describe.skipIf(!hasDb)` is active** [`packages/shared/src/audit/append.integration.test.ts:23-30`] — vitest's file-level `beforeAll` runs regardless of nested skip blocks. When `DATABASE_URL` is unset, `new PrismaClient()` either throws (no datasource) or `$connect()` hangs/errors. The comment on lines 17–22 incorrectly claims "beforeAll only runs when the describe.skipIf block is active". Fix: move `beforeAll`/`afterAll` *inside* the `describe.skipIf` block — vitest skips hooks when the parent describe is skipped.
- [x] [Review][Patch] **Triggers use `CREATE TRIGGER` not `CREATE OR REPLACE TRIGGER`** [`packages/db/prisma/migrations/20260430082039_1_7_audit_log/migration.sql:191-201`] — Postgres 14+ supports `CREATE OR REPLACE TRIGGER`. Without it, a partially-applied migration that needs manual recovery (e.g., `prisma migrate resolve --rolled-back` then re-deploy) fails with "trigger already exists". Function uses `CREATE OR REPLACE FUNCTION` correctly; triggers should match. Fix: change `CREATE TRIGGER` → `CREATE OR REPLACE TRIGGER` for all three triggers.
- [x] [Review][Patch] **`BEFORE ... FOR EACH ROW` triggers don't fire on no-match `UPDATE`/`DELETE`** [`packages/db/prisma/migrations/20260430082039_1_7_audit_log/migration.sql:191,196`] — `UPDATE audit_logs SET op='hacked' WHERE 1=0` and `DELETE FROM audit_logs WHERE 1=0` succeed silently with `0 rows affected`. The integration test on line 92 documents this exact gap. Fix: add `FOR EACH STATEMENT` companion triggers that fire even on no-match (matches existing `audit_logs_no_truncate` pattern). Then a no-row UPDATE attempts to take the trigger lock and raises 42501 regardless of row count.
- [x] [Review][Patch] **Integration-test 42501 regex is brittle** [`packages/shared/src/audit/append.integration.test.ts:84,97`] — assertion is `rejects.toThrow(/permission denied|insufficient.privilege|42501/i)`. The actual trigger raises `'audit_logs is append-only (NFR-S6)'` with `ERRCODE = '42501'` in error metadata, not in `.message`. Tests pass currently because Prisma surfaces both somewhere — but a Prisma minor-version bump could move the SQLSTATE out of `.message` and tests would break for non-functional reasons. Fix: extend the regex to also accept the literal `'audit_logs is append-only'` substring, OR check `.code` / `.meta` directly.
- [x] [Review][Patch] **No log when integration tests skip silently** [`packages/shared/src/audit/append.integration.test.ts:14-16`] — when `DATABASE_URL` is unset, vitest silently shows `(skipped)` with no message explaining why. New devs running tests without sourcing `.env` see "skipped" and don't know they're missing coverage. Fix: emit a `console.warn` (or vitest's `test.todo`) at module load when `hasDb` is false, naming the env var that needs to be set. Alternatively, fail loudly in CI (where `DATABASE_URL` MUST be set) by detecting `process.env.CI` and asserting `hasDb` there.

#### Deferred

- [x] [Review][Defer] **Add CHECK constraint or pg enum on `audit_logs.op`.** Plain `TEXT` column accepts any string; closed `AuditOp` union is TS-only. Defer — would require updating per-story as new ops land; TS-level enforcement is the v1 contract (matches how PRD §RBAC handles role strings).
- [x] [Review][Defer] **Add a runtime serializer for the `BigInt` PK** [`packages/db/prisma/schema.prisma:257`]. First place this bites is Story 1.8's audit-log search/filter UI (`res.json(auditLog)` will throw on BigInt). Defer — Story 1.8 owns the read surface and the serializer.
- [x] [Review][Defer] **Document local-dev test pollution.** Triggers prevent cleanup; the table grows monotonically across local runs. Add a "drop the dev DB and re-migrate" note to a future RUNBOOK / dev-onboarding doc. Not blocking 1.7.
- [x] [Review][Defer] **JSONB GIN index on `context`.** The integration tests' `findMany({ where: { context: { path: ['testId'], equals: testId } } })` does a sequential scan today — fine at zero rows, slow at scale. Story 1.8 (audit search/filter UI) decides indexing strategy.
- [x] [Review][Defer] **Pre-test `npm run build` enforcement for local dev.** CI runs Build before Test (Story 1.1 review patch) so the published `dist/` is hydrated. Local devs running `npm run test --workspace=apps/web` against a stale `packages/shared/dist` could see import surprises. Defer — git pre-commit / pre-push hook is a broader project decision (Story 10.x).
- [x] [Review][Defer] **Broaden ESLint AST selector to catch destructuring / computed access / `.bind` escapes.** Current selector `callee.object.property.name='auditLog'` misses `const { auditLog } = prisma; auditLog.update(...)`, `prisma['auditLog'].update(...)`, `prisma.auditLog.update.bind(...)`, etc. Defer — at some point the trigger guard is the actual enforcement; the lint rule is a developer-experience nudge. Document the limitation and accept it.
- [x] [Review][Defer] **Add `./audit/append` sub-path to `packages/shared/package.json` `exports`.** Currently only `"."` is exposed; consumers can't tree-shake to `import { appendAudit } from "@flowdev/shared/audit/append"`. Defer — single entry point is fine for v1 ergonomics; revisit when bundle-size matters.
- [x] [Review][Defer] **Schema-qualify the trigger function (`public.audit_logs_immutable_guard`).** A future deploy that moves audit objects to a dedicated schema would orphan the function in `public`. Defer — schema relocation isn't on the roadmap; address if/when it surfaces.
- [x] [Review][Defer] **Document the `ON UPDATE CASCADE` landmine for Story 2.x.** Future stories add FK relations from other tables to `audit_logs.appId` / `audit_logs.connectorId` / `audit_logs.credentialId`. If any of those use `onUpdate: Cascade`, parent-key updates fail with cryptic 42501 errors from the immutability trigger. Recommend `onUpdate: NoAction` (Prisma default) or `onUpdate: Restrict`. Defer — flag in Story 2.1 (App model) and Story 2.4 (Connector / ConnectorCredential) spec context.
- [x] [Review][Defer] **Document migration-from-`db push` upgrade path for any dev who used `db push` against their local DB during Story 1.1.** First-run of `prisma migrate deploy` against such a DB will error with `relation "audit_logs" already exists`. Defer to RUNBOOK; only affects the small set of devs who manually ran `db push`.
- [x] [Review][Defer] **Tighten Prisma minor pin** (`^6.19.2` is minor-flex; Prisma path-equals semantics have shifted across minors). Defer — broader project pin policy decision; Story 10.x.

#### Dismissed (logged for traceability)

- Story spec snippet had `import type { Prisma, PrismaClient }` but implementation correctly imports `Prisma` as a value (`Prisma.JsonNull` is a runtime reference). Spec snippet was wrong; implementation is right. Auditor flagged as `[major]`; dismissed.
- Schema `op` field dropped the inline `// "app.create" | ...` comment from architecture §9. The closed `AuditOp` union in `append.ts` is the better source of truth; comment in schema would drift. Dismissed.
- Migration SQL header comment differs materially from the spec snippet — the new comment correctly reflects the Decision 4 amendment (REVOKE + triggers vs REVOKE only). Improvement, not deviation. Dismissed.
- `db:migrate:deploy` root delegator added beyond spec. Harmless minor scope addition; CI uses the workspace path directly anyway. Dismissed.
- `Math.random()` in `testId` is collision-resistant enough at ms-precision; `crypto.randomUUID()` would be marginally cleaner but not a real bug. Dismissed.
- Concurrent CI runs sharing a DB — local-dev concern only; CI is ephemeral per-run. Dismissed.
- AuditOp closed union "bypass via `as` casts" — type-level discipline is the contract; runtime Zod validation would over-engineer for a typed first-party callsite. Dismissed.
- "REVOKE in single-user topology is symbolic" — already documented in the migration comment; Decision 4 amendment was specifically to add triggers as the actual enforcement. Dismissed (covered by Decision 4 amendment in Debug Log §2).
- Build-before-Test ordering preserved — Auditor flagged as "can't verify from diff alone", I verified `ci.yml` lines 71–77 keep Build at line 74, Test at line 77. Dismissed (no regression).
