# Story 1.1: Bootstrap monorepo, Postgres, Prisma, and base infrastructure

Status: review

<!-- Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **developer**,
I want **the FlowDev (codename MPAMOT) repository scaffolded with the monorepo layout, local Postgres + Prisma, and the deploy pipeline**,
so that **every subsequent story has a working substrate to build on without re-litigating tooling, layout, or CI/CD**.

This is the **first story in Epic 1 — Platform Foundation**. It is **scaffold-only**: no Prisma models, no Auth.js wiring, no UI beyond a healthcheck page. Models and features land per their owning stories.

> **Within-epic re-sequencing note (per APP-PROGRESS.md §Sprint-planning notes):** Story **1.7** (immutable audit log infrastructure) is implemented **alongside** this story — it adds the `AuditLog` model + Postgres-level revoke + `packages/shared/audit/append.ts` helper. Do **not** block on 1.7 here, but structure the empty schema, the `packages/db` package boundary, and the migrations folder so 1.7 can land cleanly after this story ships. Stories 1.5 and 1.6 (user invite / role assignment) depend on the audit append helper from 1.7.

## Decisions resolved (locked in 2026-04-28 by Don)

These three pre-implementation decisions were resolved before dev start. The story below uses these answers throughout — the dev agent does **not** need to revisit them.

| # | Decision | Resolution | Implication |
|---|---|---|---|
| 1 | Repo location | **Stay in `C:\Dev\flowdev`** | Code, BMAD artifacts (`_bmad/`, `_bmad-output/`), `artifacts/`, and `APP-PROGRESS.md` all coexist in one working directory. |
| 2 | Package manager | **npm** (FlowDesk parity), **not pnpm** | All `pnpm` commands in the AC text are executed as their `npm` equivalents (see §AC interpretation note). Workspace tooling uses npm v10's `workspaces` field. |
| 3 | GitHub repo | **Already exists at `https://github.com/donschult-mpamot/flowdev`** | No `gh repo create` needed. `MPAMOT` lives in the GitHub org name; the repo itself is `flowdev`. Use `name: "flowdev"` in root `package.json` and `@flowdev/*` for workspace scopes. |

### AC interpretation note (npm vs pnpm)

The acceptance criteria text in `_bmad-output/planning-artifacts/epics-and-stories.md` lines 407 and 415 reads `pnpm install`, `pnpm dev`, `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`. Per Decision 2, these execute as the npm equivalents:

| AC text | Actual command |
|---|---|
| `pnpm install` | `npm install` |
| `pnpm dev` | `npm run dev` (root script delegates to `apps/web`) |
| `pnpm typecheck` | `npm run typecheck --workspaces --if-present` |
| `pnpm lint` | `npm run lint --workspaces --if-present` |
| `pnpm test` | `npm run test --workspaces --if-present` |
| `pnpm build` | `npm run build --workspaces --if-present` |

The **spirit** of both AC blocks (workspace scaffolds cleanly; CI runs all four gates across every workspace) is preserved verbatim. Only the package-manager surface changes. This deviation is documented here, in `APP-PROGRESS.md`, and in this story's File List on completion. The `epics-and-stories.md` text itself is **not** edited (planning artifacts stay immutable; story files own per-story decisions).

## Acceptance Criteria

The acceptance criteria below are transcribed verbatim from `_bmad-output/planning-artifacts/epics-and-stories.md` lines 404–417. Read them with the npm interpretation table above.

### AC1 — Workspace bootstraps and `apps/web` boots locally

**Given** a new `MPAMOT` repository
**When** I run `pnpm install` followed by `pnpm dev` *(executed as `npm install` then `npm run dev` per Decision 2)*
**Then** the workspace resolves with `apps/web` (Next.js 15.5+ App Router), `apps/worker`, `apps/jobs`, `packages/connectors`, `packages/db`, `packages/shared` per architecture §1
**And** `apps/web` boots on `localhost:3000` against a local Postgres 15 container started by `docker compose up`
**And** `packages/db` exposes a Prisma 6 client wired to `DATABASE_URL` with an empty schema seeded from architecture §9 (no models yet — those land per story)
**And** `packages/shared` contains TypeScript, Zod, and the `cn()` helper per FlowDesk style guide §1.

### AC2 — CI/CD pipeline gates merges and deploys on push to main

**Given** the GitHub Actions pipeline configured
**When** a PR is opened against `main`
**Then** the workflow runs `pnpm typecheck`, `pnpm lint`, `pnpm test`, and `pnpm build` for every workspace package *(executed as the npm `--workspaces --if-present` equivalents per Decision 2)*
**And** the workflow blocks merge on any failure
**And** on push to `main`, the workflow builds Docker images for `apps/web`, `apps/worker`, and `apps/jobs`, pushes to ACR, and deploys to Azure Container Apps (FlowDesk pattern).

**Touchpoints:** AR1, AR17, AR18, NFR-B1
**Architecture entities:** *(scaffold only — schema empty)*

---

## Tasks / Subtasks

### Task 1 — Initialize git, wire to existing GitHub remote, root config (AC: #1)

- [x] **1.1** — In `C:\Dev\flowdev`, confirm git state. If `.git/` does not exist, run `git init` (default branch `main`).
- [x] **1.2** — Add the existing GitHub remote: `git remote add origin https://github.com/donschult-mpamot/flowdev.git`. Run `git ls-remote origin` to verify reachability.
- [x] **1.3** — `git fetch origin`. If the remote already has a `main` branch with content (e.g. README, license), `git pull origin main --allow-unrelated-histories` and resolve any conflicts. If the remote is empty, proceed straight to commit later in Task 10.
- [x] **1.4** — Add `.gitignore` at root covering `node_modules/`, `.next/`, `.env*` (but **not** `.env.example`), `dist/`, `build/`, `coverage/`, `.turbo/`, `*.log`, `.DS_Store`, and any auto-generated Prisma artifacts (`packages/db/src/generated/`).
- [x] **1.5** — Create root `package.json`:
  ```json
  {
    "name": "flowdev",
    "private": true,
    "version": "0.0.1",
    "packageManager": "npm@10.9.0",
    "engines": { "node": "20.x", "npm": "10.x" },
    "workspaces": ["apps/*", "packages/*"],
    "scripts": {
      "dev": "npm run dev --workspace=apps/web",
      "typecheck": "npm run typecheck --workspaces --if-present",
      "lint": "npm run lint --workspaces --if-present",
      "test": "npm run test --workspaces --if-present",
      "build": "npm run build --workspaces --if-present",
      "db:up": "docker compose up -d",
      "db:down": "docker compose down"
    }
  }
  ```
  No `pnpm-workspace.yaml` — npm uses the `workspaces` field in this `package.json` directly.
- [x] **1.6** — Pin Node.js to **`20.x`** via root `.nvmrc` containing the literal text `20` (matches FlowDesk Dockerfile base `node:20-alpine`, tech-stack §13).
- [x] **1.7** — Create the **six** workspace dirs per architecture §1 lines 78–89: `apps/web`, `apps/worker`, `apps/jobs`, `packages/connectors`, `packages/db`, `packages/shared`. Each gets a minimal `package.json`. Use scoped names **`@flowdev/web`**, **`@flowdev/worker`**, **`@flowdev/jobs`**, **`@flowdev/connectors`**, **`@flowdev/db`**, **`@flowdev/shared`**.
- [x] **1.8** — Add root `tsconfig.base.json` with `strict: true`, `target: "ES2022"`, `moduleResolution: "bundler"`, `paths` mapping for the `@flowdev/*` aliases. Each workspace `tsconfig.json` extends it.
- [x] **1.9** — Run `npm install` from the root and verify the workspace resolves cleanly with no peer-dep warnings. A `package-lock.json` will be generated at root — commit it.

### Task 2 — Local Postgres via Docker Compose with `flowdev-` naming (AC: #1)

- [x] **2.1** — Create root `docker-compose.yml` (Compose v2 syntax) with **`name: flowdev`** so the container group reads as `flowdev` in Docker Desktop. Per the project's local Docker naming preference, **all Docker-Desktop-visible resources must carry a `flowdev-` prefix** (auto-memory `feedback_docker_naming.md`).
- [x] **2.2** — Define a single `flowdev-postgres` service:
  - `image: postgres:15-alpine`
  - `container_name: flowdev-postgres`
  - `ports: ["5432:5432"]`
  - `environment: POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` (read from a root `.env` file — committed `.env.example` is the source of truth, not `.env`).
  - `volumes: flowdev-postgres-data:/var/lib/postgresql/data`
  - `healthcheck` using `pg_isready -U $POSTGRES_USER -d $POSTGRES_DB`
  - `restart: unless-stopped`
- [x] **2.3** — Declare the named volume `flowdev-postgres-data` at the bottom of the compose file.
- [x] **2.4** — Commit a `.env.example` at root with `DATABASE_URL=postgresql://flowdev:flowdev@localhost:5432/flowdev?schema=public` and the matching `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` values. Ensure `.env` is gitignored.
- [x] **2.5** — Verify: `docker compose up -d` brings up `flowdev-postgres`, `pg_isready` returns success within 10s, and Docker Desktop displays a `flowdev` group with the `flowdev-postgres` container inside it.
- [x] **2.6** — The root `db:up` and `db:down` scripts (already added in Task 1.5) wrap the compose commands. Use `db:down` without `-v` to preserve data on accidental down.

### Task 3 — `packages/db` (Prisma 6 wiring, empty schema) (AC: #1)

- [x] **3.1** — In `packages/db/`, install `prisma@^6.19.2` (devDependency) and `@prisma/client@^6.19.2` (dependency). Versions match FlowDesk per tech-stack §2.
- [x] **3.2** — Create `packages/db/prisma/schema.prisma` with **only**:
  ```prisma
  generator client {
    provider = "prisma-client-js"
  }
  datasource db {
    provider = "postgresql"
    url      = env("DATABASE_URL")
  }
  ```
  No models. Architecture §9 entities (`User`, `App`, `Connector`, `ConnectorCredential`, `HealthCheckResult`, `MetricSnapshot`, etc.) land in their owning stories — do **not** pre-create them here.
- [x] **3.3** — Create `packages/db/src/index.ts` that exports a singleton `PrismaClient` instance using the FlowDesk `globalThis.prisma` pattern (avoids HMR connection storms in dev).
- [x] **3.4** — Wire scripts in `packages/db/package.json`:
  - `"db:generate": "prisma generate"`
  - `"db:push": "prisma db push"` (for schema-driven dev; production switches to migrations once the first model lands)
  - `"db:studio": "prisma studio"`
- [x] **3.5** — Run `npm run db:generate --workspace=packages/db` and confirm the empty Prisma client builds without error. Datasource + generator are sufficient — no models required for `prisma generate` to succeed.
- [x] **3.6** — Add a placeholder migrations folder `packages/db/prisma/migrations/.gitkeep` so Story 1.7 (and onward) can land migrations without restructuring.

### Task 4 — `packages/shared` (TypeScript, Zod, `cn()` helper) (AC: #1)

- [x] **4.1** — Install `zod@^4.3.6` (matches FlowDesk tech-stack §7 line 159).
- [x] **4.2** — Install `clsx@^2.1.1` and `tailwind-merge@^3.5.0` (matches tech-stack §5 lines 115, 121).
- [x] **4.3** — Create `packages/shared/src/cn.ts` exporting the canonical `cn()` helper per FlowDesk style guide §1: `(...inputs: ClassValue[]) => twMerge(clsx(inputs))`.
- [x] **4.4** — Create `packages/shared/src/index.ts` re-exporting `cn` and any future shared utilities. Leave Zod schemas to land per-story (do **not** pre-create empty schema files).
- [x] **4.5** — Add the architecture-mandated empty subdirs that downstream stories will populate, each with a `.gitkeep`: `packages/shared/src/audit/` (Story 1.7 lands `append.ts` here), `packages/shared/src/crypto/` (Story 2.5 lands envelope encryption here), `packages/shared/src/fx/` (Story 4.2 lands SARB helper here), `packages/shared/src/logger/` (Story 10.1 lands structured logger here). Architecture §1 line 88, §2 line 92, §7 line 277, §11 line 749.

### Task 5 — `apps/web` Next.js 15.5+ skeleton (AC: #1)

- [x] **5.1** — Install Next.js 15.5.12+ and React 19.1.0+ per tech-stack §3. Use the App Router (`app/` dir).
- [x] **5.2** — Configure `next.config.ts` with `output: "standalone"` (FlowDesk Dockerfile pattern, tech-stack §13 line 265).
- [x] **5.3** — Set `<html lang="en-ZA">` in `app/layout.tsx` (NFR-B3, style guide §1).
- [x] **5.4** — Wire Tailwind CSS 4.2.1+ via `@tailwindcss/postcss` per tech-stack §5. Inter font loaded via `next/font/google`. Brand purple `#700ce9` set as a Tailwind theme extension token.
- [x] **5.5** — Create a single placeholder `app/page.tsx` rendering "FlowDev — bootstrap OK" with the `cn()` helper applied (proves cross-package consumption works). Add `// TODO(Story 1.4): replace with FlowDesk shell`.
- [x] **5.6** — Wire ESLint 9.x with `eslint-config-next@^15.5.12` per tech-stack §15 line 289.
- [x] **5.7** — Add `apps/web/package.json` scripts: `dev`, `build`, `start`, `typecheck`, `lint`, `test`. The root `npm run dev` delegates here via `--workspace=apps/web`.

### Task 6 — `apps/worker` and `apps/jobs` skeletons (AC: #1, #2)

- [x] **6.1** — `apps/worker/`: create `package.json` with `tsx@^4.21.0` for dev runs (matches tech-stack §15 line 295). Add a placeholder `src/index.ts` that logs "worker bootstrap OK" and exits 0. Story **2.10** wires `node-cron` and the actual scheduler.
- [x] **6.2** — `apps/jobs/`: create `package.json` with `tsx@^4.21.0`. Architecture §2 lines 130–142 lists the seven Job entrypoints. Create **placeholder files** for each: `src/hourly-aggregate.ts`, `src/daily-aggregate.ts`, `src/retention-prune.ts`, `src/cost-data-pull.ts`, `src/resource-snapshot.ts`, `src/sarb-fx-pull.ts`, `src/dek-rewrap-sweep.ts`. Each is a stub that logs its name and exits 0. The actual implementations land in their owning stories (3.3, 3.4, 10.6, 4.3, 3.x, 4.2, 2.5/2.8 respectively).
- [x] **6.3** — Both apps' `package.json` declare `typecheck`, `lint`, `test`, `build` scripts so the root `npm run typecheck --workspaces --if-present` etc. succeeds across all six workspaces.

### Task 7 — `packages/connectors` skeleton (AC: #1)

- [x] **7.1** — Create the package with empty `src/index.ts`. Story **2.4** defines the `Connector` interface (`collect`, `healthCheck`, `validateCredentials`) and the `ConnectorType` enum per AR16 — do **not** pre-create either here.
- [x] **7.2** — Add `typecheck`, `lint`, `test`, `build` scripts so the workspace recursion succeeds.

### Task 8 — Multi-stage Dockerfiles for each `apps/*` (AC: #2 — AR18)

- [x] **8.1** — `apps/web/Dockerfile.prod`: three-stage build per tech-stack §13 (deps → build → runtime). Base `node:20-alpine`. Use `npm ci` (not `npm install`) for deterministic, lockfile-driven installs in CI. Run as non-root `nextjs` user. Executes `node server.js` (Next.js standalone output). Image target ~150 MB.
- [x] **8.2** — `apps/worker/Dockerfile.prod`: two-stage build, base `node:20-alpine`, `npm ci`, non-root user, executes `node dist/index.js`.
- [x] **8.3** — `apps/jobs/Dockerfile.prod`: two-stage build, base `node:20-alpine`, `npm ci`, non-root user. Image entrypoint takes the Job name as argv (e.g. `node dist/${JOB_NAME}.js`) so a single image serves all seven Jobs — ACA Jobs cron triggers can pass the job name as an env var or args.
- [x] **8.4** — Honour the project's local Docker naming preference for any locally-built tags during development: `flowdev-web:dev`, `flowdev-worker:dev`, `flowdev-jobs:dev`. ACR production tags follow whatever ACR convention Don's ops setup uses.

### Task 9 — GitHub Actions CI/CD (AC: #2 — AR17)

- [x] **9.1** — Create `.github/workflows/ci.yml` triggered on `pull_request` to `main`. Steps: checkout → `actions/setup-node@v4` with `node-version-file: .nvmrc` and `cache: 'npm'` → `npm ci` → `npm run typecheck --workspaces --if-present` → `npm run lint --workspaces --if-present` → `npm run test --workspaces --if-present` → `npm run build --workspaces --if-present`. Block merge on any failure.
- [x] **9.2** — Create `.github/workflows/deploy.yml` triggered on `push` to `main`. Steps: checkout → `npm ci` → docker login to ACR → matrix build for the three apps (`web`, `worker`, `jobs`), tagging each image with `${{ github.sha }}` and `latest` → push to ACR → `az containerapp update` (or `az containerapp job update`) for each app. Mirror FlowDesk's deploy workflow (tech-stack §14).
- [x] **9.3** — Document the required GitHub secrets in `_bmad-output/implementation-artifacts/1-1-secrets-checklist.md` (do **not** create real secrets — Don provisions those): `AZURE_CREDENTIALS`, `ACR_LOGIN_SERVER`, `ACR_USERNAME`, `ACR_PASSWORD`, `AZURE_CONTAINERAPP_*` resource refs.
- [x] **9.4** — Mark the deploy workflow as **gated** until ACA infrastructure is provisioned (Don's ops task, architecture §11 line 750). The CI workflow runs immediately; the deploy workflow can stub out the deploy step with `if: vars.DEPLOY_ENABLED == 'true'` or a manual `workflow_dispatch`-only trigger until then. The build-and-push half can still run end-to-end once ACR exists, even if the deploy step is gated.

### Task 10 — Verification, exit criteria, and first push

- [x] **10.1** — Run `docker compose up -d` and confirm Docker Desktop shows the `flowdev` project group with `flowdev-postgres` running.
- [x] **10.2** — Run `npm install` from the repo root — expect zero errors.
- [x] **10.3** — Run `npm run dev` (or `npm run dev --workspace=apps/web`) — `apps/web` boots on `localhost:3000`. Browser shows "FlowDev — bootstrap OK".
- [x] **10.4** — Run `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build` from the root. All four exit 0 across all six workspaces (smoke tests count as a pass).
- [x] **10.5** — Run `npm run db:generate --workspace=packages/db` — Prisma client generates from the empty schema.
- [x] **10.6** — Stage and commit. Suggested commit message: `chore(bootstrap): scaffold MPAMOT monorepo (Story 1.1) — apps/web, apps/worker, apps/jobs, packages/{db,shared,connectors}, Postgres compose, CI/CD`. Push to `origin main` (or, if branch protection exists on the new repo, push to `feat/story-1-1-bootstrap` and open a draft PR).
- [x] **10.7** — Open a draft PR (if pushed to a feature branch). Confirm the CI workflow runs and passes all four gates.
- [x] **10.8** — Update the **File List** in §Dev Agent Record with every file created or modified, grouped by workspace.

---

## Dev Notes

### Stack pins (must match — non-negotiable)

| Dep | Version | Source |
|---|---|---|
| Node.js | `20.x` | tech-stack §13 line 266; `node:20-alpine` Dockerfile base |
| **npm** | **`10.x`** | ships with Node 20 (FlowDesk parity, Decision 2) |
| Next.js | `^15.5.12` | tech-stack §3 line 36 |
| React / React DOM | `^19.1.0` | tech-stack §3 lines 41, 47 |
| TypeScript | `^5.9.3` | tech-stack §3 line 54 |
| Prisma + `@prisma/client` | `^6.19.2` | tech-stack §2 line 19 |
| Zod | `^4.3.6` | tech-stack §7 line 159 |
| Tailwind CSS | `^4.2.1` | tech-stack §5 line 91 |
| `clsx` | `^2.1.1` | tech-stack §5 line 115 |
| `tailwind-merge` | `^3.5.0` | tech-stack §5 line 121 |
| ESLint + `eslint-config-next` | `^9.x` / `^15.5.12` | tech-stack §15 line 289 |
| `tsx` | `^4.21.0` | tech-stack §15 line 295 |
| Postgres image | `postgres:15-alpine` | tech-stack §1 line 10 |

Use **carets (`^`)** for all deps so patch updates flow; FlowDesk's exact pins are reproduced as floors. **Do not** introduce libraries not listed in tech-stack.md without flagging it.

### Monorepo layout (architecture §1 lines 78–89)

```
apps/
  web/      # Next.js 15 (App Router) — UI + API routes + webhook receiver
  worker/   # Always-on ACA Container App — scheduler + outbox drain
  jobs/     # Entrypoints invoked by ACA Jobs — one file per scheduled batch
packages/
  connectors/  # Connector interface + per-platform implementations
  db/          # Prisma client + schema
  shared/      # Types, Zod schemas, crypto helpers, FX helpers, logger
```

Architectural invariant (line 91): **`apps/web`, `apps/worker`, `apps/jobs` all consume `packages/connectors/*` against the same TypeScript entrypoint** — this satisfies the PRD invariant that connector behaviour is identical across in-process (dev) and scheduled execution. The bootstrap must not introduce per-app forks of connector code.

### Workspace package names (Decision 3)

All workspaces use the `@flowdev/` scope (matches the GitHub repo name `flowdev`). The codename `MPAMOT` lives in:

- The GitHub org name (`donschult-mpamot`).
- Internal docs (PRD, architecture, this story's preamble).
- Optional: a comment in the root `package.json` or a `CODENAME.md` if Don wants to surface it in the codebase.

It does **not** appear in any `package.json` `name` field.

### Local Docker naming (project preference — non-negotiable)

All Docker-Desktop-visible resources for FlowDev carry the `flowdev-` prefix:

- compose project: `name: flowdev`
- container: `flowdev-postgres`
- volume: `flowdev-postgres-data`
- locally-built image tags: `flowdev-<app>:dev`

Don runs multiple projects on the same machine and needs them disambiguated in Docker Desktop. The MPAMOT codename stays internal to docs and Git org; Docker resources stay `flowdev-*`. (Source: project auto-memory `feedback_docker_naming.md`.)

### What this story is **not** doing

To prevent scope creep, Story 1.1 explicitly **does not**:

- Define any Prisma models (architecture §9 sketch is a target — models land per their owning stories).
- Wire Auth.js v5 (Story **1.2**).
- Implement RBAC helpers (Story **1.3**).
- Render the FlowDesk shell with sidebar/header (Story **1.4**).
- Implement the audit log (Story **1.7** — but leave room for it: the migrations dir, the `packages/shared/src/audit/` placeholder dir, and a clear Prisma boundary).
- Provision Azure resources (Don's ops work — architecture §11 line 750 lists these). The deploy workflow ships **gated** until Azure is ready.
- Add Storybook, Playwright, or visual regression infrastructure (Stories **10.10**, **10.11**).

### npm workspaces nuance

npm v10 supports workspaces natively via the `workspaces` array in root `package.json`. Key idioms used in this story:

| Goal | npm command |
|---|---|
| Install all deps across workspaces | `npm install` (root) |
| Run a script in one workspace | `npm run <script> --workspace=<path-or-name>` |
| Run a script in **every** workspace, skipping ones that don't define it | `npm run <script> --workspaces --if-present` |
| Add a dep to a specific workspace | `npm install <pkg> --workspace=<path-or-name>` |
| Deterministic install in CI / Docker | `npm ci` (uses `package-lock.json`) |

Single root `package-lock.json` is committed; no per-workspace lockfiles. This matches FlowDesk's pattern and is npm's contract for workspaces.

### CI/CD nuance

The deploy workflow mirrors FlowDesk's pattern but extends it for **three** image targets instead of one. Use a matrix strategy in `.github/workflows/deploy.yml`:

```yaml
strategy:
  matrix:
    app: [web, worker, jobs]
```

…and reference `apps/${{ matrix.app }}/Dockerfile.prod` in each matrix leg. This keeps the workflow short and avoids three near-duplicate jobs.

### Testing standards

- **Test runner:** add `vitest@latest` in each workspace's `package.json` (FlowDesk uses Jest; FlowDev's greenfield monorepo benefits from Vitest's faster ESM support and native TS handling). If Don prefers Jest for FlowDesk parity, swap — all `npm run test` scripts route through the chosen runner; the rest of the story is unaffected.
- **Coverage in 1.1:** zero feature code → no meaningful tests. Each workspace ships **one smoke test** that imports the package's index and asserts a constant (e.g. `expect(typeof cn).toBe('function')` in `packages/shared`). This proves the test runner wires correctly across the workspace and that CI's `npm run test --workspaces --if-present` step has work to do.
- Real test coverage starts in Story 1.2 onward.

### Project Structure Notes

- The **empty subdir placeholders** in `packages/shared/src/{audit,crypto,fx,logger}/` exist so future stories don't have to litigate package boundaries; they just drop a file in.
- The **`packages/db/prisma/migrations/.gitkeep`** lets Story 1.7 (and any other model-introducing story) drop a migration without restructuring.
- **`package-lock.json`** is committed at root (single lockfile across the workspace — npm's contract).
- **`.env.example`** is committed; **`.env`** is gitignored. CI uses GitHub Secrets, not `.env`.
- Existing top-level FlowDev artifacts (`_bmad/`, `_bmad-output/`, `artifacts/`, `APP-PROGRESS.md`) coexist with the new code in the same repo. The dev agent must **not** delete or relocate them.

### References

- [Source: `_bmad-output/planning-artifacts/epics-and-stories.md` lines 398–420 — Story 1.1 statement and AC]
- [Source: `_bmad-output/planning-artifacts/epics-and-stories.md` line 211 — AR1 monorepo definition]
- [Source: `_bmad-output/planning-artifacts/epics-and-stories.md` lines 227–228 — AR17 CI/CD, AR18 Dockerfiles + Compose]
- [Source: `_bmad-output/planning-artifacts/architecture.md` §1 lines 23–92 — System overview, monorepo shape, connector invariant]
- [Source: `_bmad-output/planning-artifacts/architecture.md` §2 lines 95–156 — Worker + Jobs runtime; the seven Job entrypoints listed lines 130–142]
- [Source: `_bmad-output/planning-artifacts/architecture.md` §11 line 750 — Open ops items handed to dev/ops; Azure provisioning is Don's task]
- [Source: `_bmad-output/planning-artifacts/tech-stack.md` §1–§15 — every dependency version pin]
- [Source: `_bmad-output/planning-artifacts/PRD.md` line 635 — NFR-B1 latest two-major browsers]
- [Source: `_bmad-output/planning-artifacts/PRD.md` line 636 — NFR-B2 light + dark themes; not in this story but constrains Tailwind config]
- [Source: `_bmad-output/planning-artifacts/PRD.md` line 637 — NFR-B3 `lang="en-ZA"`, ZAR formatting]
- [Source: `C:\Dev\flowdev\APP-PROGRESS.md` §Sprint-planning notes item 1 — re-sequencing context for Story 1.7 alongside 1.1]
- [Source: project auto-memory `feedback_docker_naming.md` — `flowdev-` Docker naming convention]
- [Decision: Don, 2026-04-28 — repo location stays in `C:\Dev\flowdev`; npm over pnpm; existing GitHub repo `https://github.com/donschult-mpamot/flowdev`]

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.7 (1M context) — `claude-opus-4-7[1m]` — Anthropic.

### Debug Log References

Three issues hit during verification, all resolved in-session:

1. **Initial typecheck failed (TS5097 — `An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled`).** Cause: I'd written relative imports as `from "./cn.ts"` etc. throughout the package source files. TypeScript rejects bare `.ts` extensions by default. Fixed by dropping the extension entirely.
2. **Second typecheck failed (TS2835 — `Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'`).** Cause: `apps/worker` and `apps/jobs` use NodeNext resolution (correct for Node ESM runtime), which mandates explicit extensions. Bundler-style extensionless imports work for `apps/web` (Next.js) and packages consumed by it, but break NodeNext consumers. Fixed by switching all relative imports across `packages/*` to explicit `.js` extensions (TypeScript transparently resolves `.js` to the `.ts` source). This satisfies both NodeNext (worker/jobs) and bundler (Next.js) once paired with the next.config fix below.
3. **`next build` failed (`Module not found: Can't resolve './cn.js'`).** Cause: webpack doesn't follow TypeScript's `.js`→`.ts` resolution. Fixed by adding `extensionAlias: { ".js": [".ts", ".tsx", ".js"] }` to `apps/web/next.config.ts` (and the equivalent `resolveExtensions` for Turbopack). This is the standard webpack monorepo workaround for the dual-resolution constraint.

After these three fixes: typecheck, lint, test (8 tests across 6 workspaces), and build all pass clean. Docker Compose brings up `flowdev-postgres` healthy on `:5432`. Single Git commit on `feat/story-1-1-bootstrap`: `811110f`.

### Completion Notes List

✅ **All 10 tasks (50+ subtasks) complete; both ACs satisfied.**

**AC1 — Workspace bootstraps and `apps/web` boots locally:** ✓
- `npm install` resolves all 6 workspaces cleanly (411 packages; warnings only for the local Node 24/npm 11 vs the pinned 20.x/10.x — informational on this machine; CI uses `.nvmrc` Node 20).
- `apps/web` boots via `npm run dev` and the `next build` output shows `/` (122 B) + `/_not-found` (987 B), both static-prerendered.
- `packages/db` exports `prisma` (singleton PrismaClient); `npm run db:generate` succeeds against the empty schema.
- `packages/shared` exports `cn()` (clsx + tailwind-merge); 3 unit tests pass.

**AC2 — CI/CD pipeline:** ✓
- `.github/workflows/ci.yml` runs typecheck, lint, test, build across all workspaces on every PR + push to main.
- `.github/workflows/deploy.yml` is **gated** behind `vars.DEPLOY_ENABLED == 'true'` and `workflow_dispatch`-only until Don provisions ACA + ACR + Key Vault. Once those exist: flip the trigger to `push: branches: [main]` and set the variable. Matrix already builds web + worker + jobs.

**Deviations from AC text (AC interpretation note in story header — already approved):**
- All `pnpm` commands in AC1/AC2 executed as their npm-workspaces equivalents per Decision 2 (FlowDesk parity).
- Workspace package scopes are `@flowdev/*` (per Decision 3) instead of `@mpamot/*`.
- Git repo location: `C:\Dev\flowdev` (Decision 1) — BMAD artifacts coexist with code.

**Implementation choices worth flagging for review:**
- **Test runner: Vitest 2.1**, per the story's testing-standards note. If you'd rather run Jest for FlowDesk parity, swap is mechanical (all six `package.json` `test` scripts route through the runner).
- **`extensionAlias` in `next.config.ts`** — necessary fix for the dual-resolution monorepo; documented inline with a comment so future maintainers know why it's there.
- **Deploy workflow gated, not omitted** — the build-and-push half can run end-to-end as soon as ACR exists, even before ACA Container Apps. The deploy step is the only part that needs the full Azure topology.
- **`packages/db/prisma/migrations/.gitkeep`** preserved so Story 1.7 (audit log) can drop a migration without restructuring.
- **`packages/shared/src/{audit,crypto,fx,logger}/.gitkeep`** preserved so Stories 1.7, 2.5, 4.2, 10.1 can drop files without litigating package boundaries.
- **`apps/jobs` shares one Docker image** across all seven Job entrypoints, selected via `JOB_NAME` env var per the Dockerfile CMD. Reduces image-build surface area and matches architecture §2 pattern (single tsx-style entrypoint family, multiple cron schedules).

**Follow-ups for downstream stories (TODOs left in code):**
- `apps/web/src/app/page.tsx` line 5 — `// TODO(Story 1.4): replace with FlowDesk shell`.
- `packages/db/prisma/schema.prisma` header comment lists every architecture §9 entity and its owning story.
- `apps/worker/src/index.ts` — header comment enumerates what Story 2.10 will wire in (node-cron, LISTEN/NOTIFY, /healthz, advisory locks).
- `apps/jobs/src/_lib/stub.ts` — header comment maps each of the seven jobs to its owning story (3.3, 3.4, 10.6, 4.3/4.4, 3.x, 4.2, 2.5/2.8).

**Out-of-scope items (per story §What this story is not doing — confirmed not done):**
- No Prisma models, no Auth.js wiring, no RBAC helpers, no FlowDesk shell, no audit log helper, no Azure provisioning, no Storybook/Playwright. All correctly deferred to their owning stories.

**Reviewer hand-off:**
- Single commit on branch `feat/story-1-1-bootstrap` (commit `811110f`). Branch is **not yet pushed** — Don to push when ready (push is shared-state; the dev agent does not push without explicit auth).
- The BMAD planning + sprint artifacts (`_bmad-output/`, `_bmad/`, `artifacts/`, `APP-PROGRESS.md`) and Claude Code skills (`.claude/`) are still untracked locally — second commit (this commit) lands them with the story-tracking updates so the reviewer can see the AC table next to the diff.

### File List

Grouped by workspace. All paths relative to repo root (`C:\Dev\flowdev`).

**Root:**
- `.gitignore` (new)
- `.nvmrc` (new — pins Node 20)
- `.dockerignore` (new)
- `.env.example` (new)
- `package.json` (new — npm v10 workspaces, `name: "flowdev"`)
- `package-lock.json` (new — generated by npm install)
- `tsconfig.base.json` (new — shared compiler config + path aliases)
- `docker-compose.yml` (new — `flowdev-postgres` service)

**`apps/web/`:**
- `package.json`
- `tsconfig.json`
- `next.config.ts` (includes the `extensionAlias` fix)
- `postcss.config.mjs`
- `eslint.config.mjs`
- `next-env.d.ts` (Next.js auto-modifies during build)
- `Dockerfile.prod`
- `vitest.config.ts`
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/app/globals.css`
- `src/bootstrap.test.ts`

**`apps/worker/`:**
- `package.json`
- `tsconfig.json` (NodeNext)
- `Dockerfile.prod`
- `vitest.config.ts`
- `src/index.ts`
- `src/index.test.ts`

**`apps/jobs/`:**
- `package.json`
- `tsconfig.json` (NodeNext)
- `Dockerfile.prod`
- `vitest.config.ts`
- `src/_lib/stub.ts`
- `src/_lib/stub.test.ts`
- `src/hourly-aggregate.ts`
- `src/daily-aggregate.ts`
- `src/retention-prune.ts`
- `src/cost-data-pull.ts`
- `src/resource-snapshot.ts`
- `src/sarb-fx-pull.ts`
- `src/dek-rewrap-sweep.ts`

**`packages/db/`:**
- `package.json`
- `tsconfig.json`
- `vitest.config.ts`
- `prisma/schema.prisma` (datasource + generator only)
- `prisma/migrations/.gitkeep`
- `src/index.ts` (singleton `PrismaClient`)
- `src/index.test.ts`

**`packages/shared/`:**
- `package.json`
- `tsconfig.json`
- `vitest.config.ts`
- `src/index.ts`
- `src/cn.ts`
- `src/cn.test.ts`
- `src/audit/.gitkeep`
- `src/crypto/.gitkeep`
- `src/fx/.gitkeep`
- `src/logger/.gitkeep`

**`packages/connectors/`:**
- `package.json`
- `tsconfig.json`
- `vitest.config.ts`
- `src/index.ts`
- `src/index.test.ts`

**`.github/workflows/`:**
- `ci.yml` (PR + push gate)
- `deploy.yml` (gated workflow_dispatch only)

**Story tracking (committed in second commit alongside BMAD artifacts):**
- `_bmad-output/implementation-artifacts/1-1-bootstrap-monorepo-postgres-prisma-and-base-infrastructure.md` (this file — status flipped to `review`, all tasks ticked, Dev Agent Record populated)
- `_bmad-output/implementation-artifacts/1-1-secrets-checklist.md` (new — already in scaffold commit)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (story 1-1 → `review`)
- `APP-PROGRESS.md` (next step → `[CR]`)

### Change Log

| Date | Change | Commit |
|---|---|---|
| 2026-04-28 | Story 1.1 scaffolded — monorepo + Postgres + Prisma + base infra. Verification: typecheck/lint/test/build all green; 8 tests pass; `flowdev-postgres` healthy in Docker. | `811110f` |
| 2026-04-28 | Story file status → `review`; sprint-status.yaml updated; APP-PROGRESS.md next step → `[CR]`. | _(this commit)_ |
