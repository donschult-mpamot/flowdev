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
