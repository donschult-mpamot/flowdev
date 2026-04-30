# Story 1.7: Persist immutable audit log

Status: ready-for-dev

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

- [ ] **1.1** — Open `packages/db/prisma/schema.prisma`. Append the model below verbatim from architecture §9 lines 669–682. Map the table name explicitly to `audit_logs` (snake_case at the DB level matches the AC text literal `audit_logs`).
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
- [ ] **1.2** — Update the schema's header comment (currently lists Story 1.7 as a future story) to reflect that the model now lands; keep the list of remaining models for reference.
- [ ] **1.3** — Run `npm run db:generate --workspace=packages/db` and confirm `AuditLog` appears in the generated client types (no errors).

### Task 2 — Author the first real Prisma migration with embedded REVOKE (AC: #1)

- [ ] **2.1** — Ensure local Postgres is up: `npm run db:up` (uses `flowdev-postgres` per Story 1.1). Verify `DATABASE_URL` in `.env` matches `.env.example`.
- [ ] **2.2** — From `packages/db/`, run `npx prisma migrate dev --name 1_7_audit_log --create-only`. Prisma writes a SQL file at `packages/db/prisma/migrations/<timestamp>_1_7_audit_log/migration.sql` and does **not** apply it yet (`--create-only`).
- [ ] **2.3** — Open the generated `migration.sql`. After Prisma's `CREATE TABLE "audit_logs"` and the three index statements, append:
  ```sql
  -- Story 1.7 (NFR-S6): audit log is immutable. Revoke UPDATE/DELETE/TRUNCATE
  -- from CURRENT_USER (the runtime DB user in FlowDev's deployment topology).
  -- INSERT + SELECT remain so the append helper and the audit search UI (Story 1.8)
  -- can do their jobs. If a future deployment splits DDL and runtime users,
  -- this REVOKE must be re-targeted at the runtime role explicitly.
  REVOKE UPDATE, DELETE, TRUNCATE ON TABLE "audit_logs" FROM CURRENT_USER;
  GRANT INSERT, SELECT ON TABLE "audit_logs" TO CURRENT_USER;
  ```
- [ ] **2.4** — Apply: from `packages/db/`, run `npx prisma migrate dev` (no flags). Prisma applies the SQL and re-generates the client. Confirm by listing `audit_logs` privileges in psql:
  ```bash
  docker exec flowdev-postgres psql -U flowdev -d flowdev -c "\dp audit_logs"
  ```
  Expected output: `flowdev=arw/flowdev` (a=INSERT, r=SELECT, w=UPDATE absent, d=DELETE absent).
- [ ] **2.5** — Commit the migration file (`packages/db/prisma/migrations/<timestamp>_1_7_audit_log/migration.sql` and `migration_lock.toml` if generated). The committed SQL is the contract every environment runs.

### Task 3 — Wire migration scripts and update db:up flow (AC: #1)

- [ ] **3.1** — In `packages/db/package.json`, replace the `db:push` script with two migration scripts:
  - `"db:migrate:dev": "prisma migrate dev"` — local, prompts on drift
  - `"db:migrate:deploy": "prisma migrate deploy"` — CI/prod, idempotent and non-interactive
  - Keep `db:generate` and `db:studio`.
- [ ] **3.2** — In root `package.json`, add `db:migrate` as a delegating script: `"db:migrate": "npm run db:migrate:dev --workspace=packages/db"`. Keep `db:up`/`db:down` pointing at compose. (Do NOT auto-run migrations on `db:up` — keep them as explicit operator actions; document the order in the dev runbook section below.)
- [ ] **3.3** — Update the AuditLog schema header comment in `packages/db/prisma/schema.prisma` to remove the "production switches to migrations once the first model lands" line from Story 1.1 — the switch has now happened.

### Task 4 — Add `@flowdev/db` as a dependency of `@flowdev/shared` (AC: #1, #2)

- [ ] **4.1** — In `packages/shared/package.json`, add `"@flowdev/db": "*"` to `dependencies`. Verify by running `npm install` at root — npm should symlink the workspace and report no peer-dep warnings.
- [ ] **4.2** — Document in dev notes: dependency direction is `shared → db` only. `@flowdev/db` must never import from `@flowdev/shared` (would create a build cycle).

### Task 5 — Author `packages/shared/src/audit/append.ts` (AC: #1, #2, #3)

- [ ] **5.1** — Delete `packages/shared/src/audit/.gitkeep`. Create `packages/shared/src/audit/append.ts` exporting a single typed function:
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
- [ ] **5.2** — Re-export from `packages/shared/src/index.ts`:
  ```ts
  export { cn } from "./cn.js";
  export { appendAudit, type AuditEvent, type AuditOp } from "./audit/append.js";
  ```
- [ ] **5.3** — Run `npm run build --workspace=packages/shared` and confirm `dist/audit/append.js` and `dist/audit/append.d.ts` (or equivalent) emit. Per Story 1.1 review patches, packages now ship compiled JS + source-as-types.

### Task 6 — Add ESLint rule banning audit-log mutation/upsert calls (AC: #1)

- [ ] **6.1** — Open `eslint.config.mjs` (root). Add a `no-restricted-syntax` rule with two AST selectors that catch `<expr>.auditLog.update(...)`, `updateMany`, `delete`, `deleteMany`, and `upsert`:
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
- [ ] **6.2** — Confirm the rule fires by adding a deliberate offending line to a scratch file, running `npm run lint`, seeing the error, then removing the scratch file.
- [ ] **6.3** — Confirm the rule does NOT fire on `appendAudit()` calls or on `auditLog.create()` / `auditLog.findMany()` / `auditLog.count()` (those are allowed).

### Task 7 — Wire `postgres:15-alpine` service container into CI (AC: #1, #2, #3)

- [ ] **7.1** — Update `.github/workflows/ci.yml`. Add a `services` block to the `build` job:
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
- [ ] **7.2** — Add `DATABASE_URL` to the job-level `env` so every step (and vitest) can read it: `DATABASE_URL: postgresql://flowdev:flowdev@localhost:5432/flowdev?schema=public`.
- [ ] **7.3** — Add a new step **after** `Generate Prisma client` and **before** `Build`: `Run migrations` running `npm run db:migrate:deploy --workspace=packages/db`. The Build-before-Test reordering Don landed during Story 1.1 review stays intact.
- [ ] **7.4** — Confirm CI logs show: postgres healthy → prisma generate → migrate deploy applies the 1_7_audit_log migration → tests run with a populated DB.

### Task 8 — Tests (AC: #1, #2, #3)

- [ ] **8.1** — **Unit test** at `packages/shared/src/audit/append.test.ts`. Mock the `db.auditLog.create` callable; assert that `appendAudit({...}, event)` calls it once with the expected `data` shape (every field mapped, defaults applied, `context` defaults to `Prisma.JsonNull` when omitted). Three test cases minimum: minimal event (`actorId` + `op` only), full event (all optional fields populated), system event (`actorId: null`).
- [ ] **8.2** — **Integration test** at `packages/shared/src/audit/append.integration.test.ts` (named `*.integration.test.ts` so it can be opted into CI deliberately; vitest picks up by default). Use the `prisma` singleton from `@flowdev/db`. Three tests:
  - **Commit semantics (AC2):** wrap a mutation + `appendAudit(tx, ...)` in `prisma.$transaction(async (tx) => { ... })`; after commit, query `auditLog.findMany()` and assert one row exists matching the event.
  - **Rollback semantics (AC3):** open a `$transaction(async (tx) => { await appendAudit(tx, ...); throw new Error('boom'); })`; catch the throw; query `auditLog.findMany()` and assert zero rows exist (no orphan).
  - **REVOKE enforcement (AC1):** call `prisma.$executeRawUnsafe(\`UPDATE audit_logs SET op='hacked' WHERE id = (SELECT id FROM audit_logs LIMIT 1)\`)`; expect a Postgres error with SQLSTATE `42501` (insufficient privilege). Same for `DELETE FROM audit_logs`. (If table is empty, INSERT one first via `appendAudit` so there's a row to attempt to mutate.)
- [ ] **8.3** — Add `packages/shared/vitest.config.ts` test-include glob if necessary so `*.integration.test.ts` is picked up. Default vitest globs include it; verify.
- [ ] **8.4** — Reset the test DB between tests: add a `beforeEach` that runs `await prisma.auditLog.deleteMany()` — but that would conflict with the REVOKE on production runtime user! Use `prisma.$executeRawUnsafe('TRUNCATE audit_logs RESTART IDENTITY')` from a privileged setup user, OR run tests in transactions that roll back. **Recommended:** wrap each integration test in its own transaction that's rolled back at the end, eliminating the need for cleanup. Document this as the test-isolation pattern for the rest of the project.

### Task 9 — Verification + PR

- [ ] **9.1** — Local gates: `npm run typecheck`, `npm run lint`, `npm run test` (with `db:up` running), `npm run build`. All exit 0.
- [ ] **9.2** — Open a feature branch `feat/story-1-7-audit-log` from `main`. Stage the migration file, the helper, the schema change, the eslint config update, the package.json updates, and the ci.yml update. Suggested commit message: `feat(story-1.7): persist immutable audit log infrastructure (AuditLog model, append helper, table-level REVOKE, lint rule, CI postgres service)`.
- [ ] **9.3** — Push branch, open PR against `main`. Confirm CI runs end-to-end: postgres comes up → migrate deploy → tests (including all three integration tests) pass.
- [ ] **9.4** — Update File List in §Dev Agent Record. Set Status → `review`.

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
- **Per-test isolation** — wrap each integration test in `prisma.$transaction(async (tx) => { ...; throw new Error('rollback'); })` and catch the deliberate throw; the rollback ensures no test leaks state. The REVOKE-enforcement test is the only exception — it deliberately attempts UPDATE/DELETE outside a transaction and expects them to fail, so it doesn't need rollback isolation.

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

_(populated by dev agent at implementation time — record exact model + version)_

### Debug Log References

_(populated by dev agent — note any non-obvious blockers and how they were resolved)_

### Completion Notes List

_(populated by dev agent at story completion)_

### File List

_(populated by dev agent — group by workspace; list every file created/modified)_

### Change Log

| Date | Change | Commit |
|---|---|---|
| 2026-04-30 | Story 1.7 contexted (`bmad-create-story`); status → `ready-for-dev`. | _(this commit)_ |
