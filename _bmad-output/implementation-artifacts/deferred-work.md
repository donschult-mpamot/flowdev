# Deferred Work

Deferred items from BMAD reviews and other artifact-pass scans. Each section is dated and points back to the source.

## Deferred from: code review of 1-1-bootstrap-monorepo-postgres-prisma-and-base-infrastructure (2026-04-30)

- Add `.npmrc` with `engine-strict=true` so the `engines: node: "20.x", npm: "10.x"` pin in root `package.json` is enforced. Reason for deferring: cosmetic on a single-developer scaffold; revisit when more devs join.
- Add `.gitattributes` to force LF on Dockerfiles and shell scripts (Windows dev box; CRLF breaks alpine `sh` invocations like `apps/jobs/Dockerfile.prod` `CMD ["sh", "-c", ...]`). Reason for deferring: not biting today; add when a non-alpine base or a POSIX-shell script lands.
- CODEOWNERS, branch protection rules, and `dependabot.yml`. Reason for deferring: 1.1 ships scaffold only; ops hardening lives in Story 10.x.
- `flowdev-postgres-data` volume credential drift — changing `POSTGRES_*` env after first init produces auth-fail errors with no obvious clue. Reason for deferring: document in dev runbook from Story 1.2 onward.
- `.dockerignore` doesn't exclude `*.tsbuildinfo`, `*.test.ts`, `vitest.config.ts`, `eslint.config.mjs`, `.env.example` — image bloat plus Windows path traces baked into tsbuildinfo. Reason for deferring: not blocking; tighten before the first ACR push.
- No `wait-on tcp:5432` (or equivalent) between `db:up` and `dev` — first request after a fresh up hits ECONNREFUSED. Reason for deferring: Story 1.2 is when Auth.js actually queries the DB on boot.
- Vitest extension-alias parity across workspaces — only `apps/web` has the dual-resolution fix. Reason for deferring: cross-package vitest tests don't exist yet.
- `apps/web/Dockerfile.prod` has no `RUN test -d /app/apps/web/.next/standalone` guard before COPY — risk of a silent server-less image if `output: "standalone"` ever fails to emit. Reason for deferring: add when the deploy gate flips on (Don's ops task).

## Deferred from: code review of 1-7-persist-immutable-audit-log (2026-04-30)

- Add CHECK constraint or pg enum on `audit_logs.op` so the closed `AuditOp` union is enforced at the DB layer too. Reason for deferring: requires per-story migrations as new ops land; TS-level enforcement is the v1 contract.
- Add a runtime serializer for `AuditLog.id` (BigInt) so `res.json(row)` doesn't throw `Do not know how to serialize a BigInt`. Reason for deferring: first read site is Story 1.8 (audit-log search/filter UI) — ship the serializer there.
- Document local-dev test-DB pollution. Immutability triggers prevent cleanup; `audit_logs` grows monotonically across local runs. Add to RUNBOOK / dev-onboarding.
- JSONB GIN index on `audit_logs.context` so `findMany({ where: { context: { path: [...], equals: ... } } })` doesn't seq-scan at scale. Reason for deferring: Story 1.8 owns audit search/filter; let it pick the indexing strategy.
- Pre-test `npm run build` enforcement for local dev so consumers don't import a stale `packages/shared/dist/`. Reason for deferring: pre-commit / pre-push hook is a project-wide policy decision (Story 10.x).
- Broaden ESLint AST selector to catch destructured / computed-access / `.bind` escapes around `auditLog.{update,...}`. Reason for deferring: trigger guard is the actual enforcement; the lint rule is a developer-experience nudge. Document the limitation; revisit if call-site bypasses appear.
- Add `./audit/append` (or other) sub-paths to `packages/shared/package.json` `exports` map. Reason for deferring: single root entry point is fine for v1 ergonomics; revisit when bundle-size matters.
- Schema-qualify `audit_logs_immutable_guard()` as `public.audit_logs_immutable_guard()` so future schema relocations don't orphan it. Reason for deferring: schema relocation isn't on the roadmap; address if/when surfaces.
- Document the `ON UPDATE CASCADE` landmine for Story 2.x — FK relations from other tables to `audit_logs.{appId,connectorId,credentialId}` must use `onUpdate: NoAction` or `Restrict` so parent-key updates don't trip the immutability triggers with cryptic 42501 errors. Reason for deferring: flag in Story 2.1 (App) and Story 2.4 (Connector / ConnectorCredential) story specs when they're contexted.
- Document the `db push` → `migrate deploy` upgrade path for any dev who ran `db push` against their local DB during Story 1.1. First-run `migrate deploy` errors with `relation "audit_logs" already exists`. Reason for deferring: only affects the small set of devs who manually ran `db push`; document in RUNBOOK.
- Tighten Prisma minor-version pin (`^6.19.2` is minor-flex; path-equals semantics have shifted across Prisma minors before). Reason for deferring: broader project pin policy lives in Story 10.x.
