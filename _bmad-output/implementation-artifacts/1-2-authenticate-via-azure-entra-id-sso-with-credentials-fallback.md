# Story 1.2: Authenticate via Azure Entra ID SSO with credentials fallback

Status: ready-for-dev

<!-- Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an **operator**,
I want to **sign in with my Azure Entra ID account (and a credentials fallback in development)**,
so that **I can access FlowDev with my existing organisational identity**.

This is the **third Epic 1 story to be implemented** (after 1.1 + 1.7). It introduces the Auth.js v5 layer, the FlowDesk-inherited `User` / `Account` / `Session` / `VerificationToken` Prisma models, the FlowDev `User` extensions (`passwordHash`, `status`, `removedAt`, `role`), the `Role` + `UserStatus` enums, the Edge-runtime middleware gate, the dev-only `/sign-in` credentials page, and the first three audit ops that consume Story 1.7's `appendAudit()` helper (`auth.signin.success`, `auth.signin.failure`, `auth.session.create`). Stories 1.3 (server-side RBAC) and 1.5/1.6 (user management, DEVELOPER scope) build directly on the schema and helpers shipped here.

This story does **not** ship the FlowDesk shell — Story 1.4 owns that. The post-sign-in destination `/portfolio` is rendered as a minimum-viable placeholder (the AC requires the redirect to land somewhere protected; the page itself is Story 1.4's territory).

## Decisions resolved (locked in 2026-05-05 by Don)

These are pinned before dev start so the dev agent does **not** revisit them.

| # | Decision | Resolution | Implication |
|---|---|---|---|
| 1 | Auth.js v5 entry point location | **`apps/web/src/auth.ts`** (exports `auth`, `handlers`, `signIn`, `signOut` from `NextAuth({...})`) + **`apps/web/src/auth.config.ts`** (Edge-safe provider config consumed by middleware) | FlowDesk pattern: split config from instantiation so the middleware can import the lightweight `auth.config.ts` without dragging Prisma into the Edge runtime. |
| 2 | Azure provider source | **`next-auth/providers/microsoft-entra-id`** (Auth.js v5 built-in OIDC provider) | The tech-stack pins `@azure/msal-node@^5.0.6` for **app-only** Azure flows used by later connectors (Stories 2.x — `AZURE_ARM`, `AZURE_COST_MGMT`). Browser-redirect SSO does not need msal-node; Auth.js handles the OIDC dance natively. msal-node is **not** added to `apps/web` in this story. |
| 3 | Session strategy | **JWT** (`session: { strategy: "jwt" }`) | AC requires Edge middleware to use `getToken()` from `next-auth/jwt`. Database sessions cannot be read at the Edge without crossing the runtime boundary. PrismaAdapter still owns `User` / `Account` / `VerificationToken` writes; `Session` rows are not used at runtime but the table is created for adapter compatibility. |
| 4 | Password hashing | **`bcryptjs@^2.4.3`** (pure-JS, no native build step) | FlowDesk parity. Pure JS keeps ACA Container App images architecture-agnostic. Cost factor 12 (FlowDesk default). |
| 5 | Credentials provider gate | Provider conditionally included when `process.env.NODE_ENV !== "production"` **OR** `process.env.CREDENTIALS_FALLBACK_ENABLED === "true"` | AC text. Two-channel gate so a production environment can deliberately enable the fallback when SSO is unreachable, without running in dev mode. |
| 6 | First post-sign-in destination | **`/portfolio`** — minimal placeholder page (auth-gated, returns the user's email + role for now) | AC requires the redirect destination to exist and be protected. The visual treatment is Story 1.4's scope. |
| 7 | Audit-op extensions | Add `auth.signin.success`, `auth.signin.failure`, `auth.session.create` to the `AuditOp` union in `packages/shared/src/audit/append.ts` | Closed-set discipline from Story 1.7. New ops land with the story that uses them. |
| 8 | Where audit calls fire | **`events.signIn`** for `auth.signin.success` + `auth.session.create` (set `auth.session.create` only on `isNewUser` or first session of the day to avoid noise — pin: fire **once per sign-in event**, same call site as `auth.signin.success`); **`authorize()` early-return path** for `auth.signin.failure` on credentials; **`signIn` callback** returning `false` for SSO failures (rejected tenant / disabled user) → log `auth.signin.failure` before returning `false` | Auth.js v5's `events.*` are the canonical hooks for fire-and-forget side effects. Failures need direct call sites because `events.signIn` only fires on success. |
| 9 | User extension migration shape | Single migration `1_2_auth` adds: `Role` enum, `UserStatus` enum, `User` table (Auth.js base columns + `passwordHash` nullable, `status` default `INVITED`, `removedAt` nullable, `role` default `DEVELOPER`), `Account`, `Session`, `VerificationToken`. **Default role is `DEVELOPER`** — the lowest-privilege starting point; ADMIN promotes via Story 1.5. | One migration keeps Auth.js + FlowDev extensions atomic. Default `DEVELOPER` is safer than defaulting to `ADMIN`. |
| 10 | Dev seed for credentials fallback | **`packages/db/prisma/seed.ts`** (idempotent) creates one `ADMIN` user from `DEV_ADMIN_EMAIL` + `DEV_ADMIN_PASSWORD` env vars. No-op if env vars unset. Wired via `prisma.seed` in `packages/db/package.json`. | Without a seed, the credentials provider has nothing to verify against and dev-mode acceptance is untestable. |
| 11 | Middleware public-route allowlist | `/sign-in`, `/api/auth/*`, `/_next/*`, `/favicon.ico`, public assets. Everything else requires a valid JWT or redirects to `/sign-in?callbackUrl=<original>`. | Webhook routes (`/webhooks/*`) are introduced in Story 2.13 with their own HMAC auth (NFR-S2 forbids wrapping them in session auth) — they will be added to the allowlist when that story lands, **not now**. |
| 12 | Live SSO acceptance — credential-bound | Live Azure Entra ID end-to-end test is **gated** behind a `[describe.runIf]` check on `AZURE_AD_TENANT_ID` + `AZURE_AD_CLIENT_ID` + `AZURE_AD_CLIENT_SECRET` being present. Without those, the test suite skips with a warn line. CI uses placeholder values; live verification happens in staging. | Same pattern as Story 1.7's `DATABASE_URL`-gated integration tests. Code-complete-with-stubs: this story ships everything except the tenant configuration, which Don supplies before merge. |

## Acceptance Criteria

Transcribed verbatim from `_bmad-output/planning-artifacts/epics-and-stories.md` lines 422–448.

### AC1 — Azure Entra ID SSO redirect, session shape, Edge middleware

**Given** a user with a valid Azure Entra ID account in the FlowDesk tenant
**When** they navigate to `/`
**Then** Auth.js v5 redirects to Azure Entra; on successful sign-in, the user lands at `/portfolio` with a session cookie
**And** the session token contains the user's `id`, `email`, and `role` (loaded from the `User` table in Postgres via `@auth/prisma-adapter`)
**And** Edge middleware uses `getToken()` (NOT `auth()`) to gate every protected route per FlowDesk pattern.

### AC2 — Credentials fallback for local development

**Given** local development without Azure Entra access
**When** a developer signs in via the credentials provider on `/sign-in`
**Then** Auth.js verifies their credentials against `User.passwordHash` (bcrypt) and issues the same session shape
**And** the credentials provider is gated behind `NODE_ENV !== 'production'` OR a `CREDENTIALS_FALLBACK_ENABLED=true` env flag
**And** sign-in failures render an inline error per the FlowDesk auth pattern.

### AC3 — Sign-in events recorded in immutable audit log

**Given** a sign-in succeeds
**When** the session is established
**Then** an `AuditLog` row records `op: 'auth.signin'` with the actor and timestamp.

> **Implementation refinement (Decision #7 + #8):** The closed-set `AuditOp` union splits the AC's `auth.signin` into the more useful `auth.signin.success` / `auth.signin.failure` / `auth.session.create`. AC3's intent — "sign-in success is auditable" — is satisfied by `auth.signin.success`; the additional ops are defense-in-depth for AC2's failure UX and observability. Documented in dev notes for traceability.

**Touchpoints:** FR61, FR62, NFR-S2, AR15
**UX components:** Auth pages inherit FlowDesk style guide §14
**Architecture entities:** `User`, `Account`, `Session`, `VerificationToken`, `AuditLog`

---

## Tasks / Subtasks

### Task 1 — Extend Prisma schema with Auth.js + FlowDev User models (AC: #1, #2)

- [ ] **1.1** — Open `packages/db/prisma/schema.prisma`. Add the `Role` and `UserStatus` enums above the model definitions:
  ```prisma
  enum Role {
    ADMIN
    MANAGER
    DEVELOPER
  }

  enum UserStatus {
    INVITED
    ACTIVE
    REMOVED
  }
  ```
- [ ] **1.2** — Add the four Auth.js Prisma adapter models (`User`, `Account`, `Session`, `VerificationToken`) with the FlowDev `User` extensions baked in. Match Auth.js v5 column shape exactly so the adapter recognises them:
  ```prisma
  model User {
    id            String    @id @default(cuid())
    name          String?
    email         String    @unique
    emailVerified DateTime?
    image         String?

    // FlowDev extensions
    passwordHash  String?      // null when SSO-only; populated for credentials fallback users
    status        UserStatus   @default(INVITED)
    role          Role         @default(DEVELOPER)
    removedAt     DateTime?

    accounts      Account[]
    sessions      Session[]

    createdAt     DateTime  @default(now())
    updatedAt     DateTime  @updatedAt

    @@index([status])
    @@index([role])
    @@map("users")
  }

  model Account {
    id                String  @id @default(cuid())
    userId            String
    type              String
    provider          String
    providerAccountId String
    refresh_token     String? @db.Text
    access_token      String? @db.Text
    expires_at        Int?
    token_type        String?
    scope             String?
    id_token          String? @db.Text
    session_state     String?

    user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

    @@unique([provider, providerAccountId])
    @@index([userId])
    @@map("accounts")
  }

  model Session {
    id           String   @id @default(cuid())
    sessionToken String   @unique
    userId       String
    expires      DateTime
    user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

    @@index([userId])
    @@map("sessions")
  }

  model VerificationToken {
    identifier String
    token      String   @unique
    expires    DateTime

    @@unique([identifier, token])
    @@map("verification_tokens")
  }
  ```
- [ ] **1.3** — Update the schema header comment: change the `User / Account / Session → Story 1.2` line to mark the models as landed in this migration.
- [ ] **1.4** — From `packages/db/`, run `npx prisma migrate dev --name 1_2_auth --create-only`. Inspect the generated SQL — confirm the `audit_logs` REVOKE from migration `1_7_audit_log` is **not** disturbed (this migration touches different tables).
- [ ] **1.5** — Apply: `npx prisma migrate dev` (no flags). Verify with `docker exec flowdev-postgres psql -U flowdev -d flowdev -c "\d users"` that the `passwordHash`, `status`, `role`, `removedAt` columns exist with the expected defaults.
- [ ] **1.6** — Commit the new migration directory under `packages/db/prisma/migrations/<timestamp>_1_2_auth/`.

### Task 2 — Add `bcryptjs` dependency + idempotent seed (AC: #2)

- [ ] **2.1** — In `packages/db/package.json`, add `"bcryptjs": "^2.4.3"` and `"@types/bcryptjs": "^2.4.6"` (the latter as a `devDependency`). Run `npm install` at root.
- [ ] **2.2** — Add `"prisma": { "seed": "tsx prisma/seed.ts" }` to `packages/db/package.json` and `"tsx": "^4.19.2"` as a devDependency.
- [ ] **2.3** — Author `packages/db/prisma/seed.ts`. Idempotent contract: read `DEV_ADMIN_EMAIL` + `DEV_ADMIN_PASSWORD` from env. If unset, log a warn and exit 0. If set, upsert (by email) one `ADMIN`-role, `ACTIVE`-status user with bcrypt-hashed password (cost 12). Do **not** error if the user exists — overwrite the password hash and `updatedAt` stamp.
- [ ] **2.4** — Update `.env.example` — uncomment the auth block and add the seed env vars:
  ```
  AUTH_SECRET=                          # 32+ char random string. Generate with: openssl rand -base64 32
  AZURE_AD_CLIENT_ID=
  AZURE_AD_CLIENT_SECRET=
  AZURE_AD_TENANT_ID=
  CREDENTIALS_FALLBACK_ENABLED=true
  DEV_ADMIN_EMAIL=
  DEV_ADMIN_PASSWORD=
  ```
- [ ] **2.5** — Add a root script alias `"db:seed": "npm run db:seed --workspace=packages/db"` and a workspace script `"db:seed": "prisma db seed"` in `packages/db/package.json`.

### Task 3 — Author Auth.js v5 config (AC: #1, #2)

- [ ] **3.1** — Add to `apps/web/package.json` dependencies: `"next-auth": "5.0.0-beta.30"`, `"@auth/prisma-adapter": "^2.11.1"`, `"bcryptjs": "^2.4.3"`, `"zod": "^3.23.8"`. Run `npm install`.
- [ ] **3.2** — Author `apps/web/src/auth.config.ts` — Edge-safe configuration. **No** Prisma import here; **no** bcrypt import here. Just the providers list, the `pages.signIn` setting, and the `callbacks.authorized` route gate. The Microsoft Entra ID provider goes here; the Credentials provider's `authorize` hook stays in `auth.ts` (which is Node-runtime).
  ```ts
  import type { NextAuthConfig } from "next-auth";
  import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";

  export const authConfig: NextAuthConfig = {
    pages: { signIn: "/sign-in" },
    providers: [
      MicrosoftEntraID({
        clientId: process.env.AZURE_AD_CLIENT_ID,
        clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
        issuer: process.env.AZURE_AD_TENANT_ID
          ? `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0`
          : undefined,
      }),
      // Credentials provider added in auth.ts (Node runtime)
    ],
    session: { strategy: "jwt" },
    callbacks: {
      authorized({ auth, request }) {
        const isLoggedIn = !!auth?.user;
        const path = request.nextUrl.pathname;
        const isPublic =
          path === "/sign-in" ||
          path.startsWith("/api/auth/") ||
          path.startsWith("/_next/") ||
          path === "/favicon.ico";
        if (isPublic) return true;
        return isLoggedIn;
      },
      async jwt({ token, user }) {
        if (user) {
          token.id = user.id;
          token.role = (user as { role?: string }).role;
        }
        return token;
      },
      async session({ session, token }) {
        if (session.user && token.id) {
          session.user.id = token.id as string;
          (session.user as { role?: string }).role = token.role as string | undefined;
        }
        return session;
      },
    },
  };
  ```
- [ ] **3.3** — Author `apps/web/src/auth.ts` — full Node-runtime config. Imports `prisma` from `@flowdev/db`, `appendAudit` from `@flowdev/shared`, `bcrypt` from `bcryptjs`. Spreads `authConfig`, adds the `PrismaAdapter`, conditionally adds the Credentials provider, wires the `events.signIn` audit call, wires the credentials `authorize` failure-path audit call.
  ```ts
  import NextAuth from "next-auth";
  import Credentials from "next-auth/providers/credentials";
  import { PrismaAdapter } from "@auth/prisma-adapter";
  import bcrypt from "bcryptjs";
  import { z } from "zod";
  import { prisma } from "@flowdev/db";
  import { appendAudit } from "@flowdev/shared";
  import { authConfig } from "./auth.config";

  const credentialsEnabled =
    process.env.NODE_ENV !== "production" ||
    process.env.CREDENTIALS_FALLBACK_ENABLED === "true";

  const credentialsSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
  });

  export const { auth, handlers, signIn, signOut } = NextAuth({
    ...authConfig,
    adapter: PrismaAdapter(prisma),
    providers: [
      ...authConfig.providers,
      ...(credentialsEnabled
        ? [
            Credentials({
              credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
              },
              async authorize(raw) {
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
                    context: { reason: "user_not_found_or_inactive", provider: "credentials" },
                  });
                  return null;
                }
                const ok = await bcrypt.compare(password, user.passwordHash);
                if (!ok) {
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
              },
            }),
          ]
        : []),
    ],
    events: {
      async signIn({ user, account }) {
        if (!user.id) return;
        await appendAudit(prisma, {
          actorId: user.id,
          op: "auth.signin.success",
          context: { provider: account?.provider ?? "unknown" },
        });
        await appendAudit(prisma, {
          actorId: user.id,
          op: "auth.session.create",
          context: { provider: account?.provider ?? "unknown" },
        });
      },
    },
  });
  ```
- [ ] **3.4** — Add `apps/web/src/middleware.ts`. Use the Edge-runtime export of `next-auth`:
  ```ts
  import NextAuth from "next-auth";
  import { authConfig } from "./auth.config";
  export const { auth: middleware } = NextAuth(authConfig);
  export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
  ```
  This matcher runs middleware on every request **except** Next.js static assets, and the `authorized` callback in `authConfig` handles the public-route allowlist.
- [ ] **3.5** — Add `apps/web/src/app/api/auth/[...nextauth]/route.ts`:
  ```ts
  export { GET, POST } from "@/auth";
  ```
  (Or use a relative path — `apps/web/tsconfig.json` may not have `@/*` configured; check before authoring.)
- [ ] **3.6** — Extend `packages/shared/src/audit/append.ts` `AuditOp` union to include the three new ops: `"auth.signin.success" | "auth.signin.failure" | "auth.session.create"`. Re-export remains via `packages/shared/src/index.ts` (no change there).

### Task 4 — Author the `/sign-in` page (AC: #2)

- [ ] **4.1** — Author `apps/web/src/app/sign-in/page.tsx`. Server Component that:
  - Reads the `error` and `callbackUrl` query params via the `searchParams` prop.
  - Renders a heading, a primary "Sign in with Microsoft" button (POSTs to `/api/auth/signin/microsoft-entra-id`), and — only when `credentialsEnabled` (computed from `process.env`) — a credentials form (email + password) that POSTs to `/api/auth/signin/credentials`.
  - Inline error rendering when `error` query param is present (default-render error message: `"Invalid email or password."` for credentials; `"Sign-in failed. Please try again."` for SSO).
  - Style: minimum-viable per style guide §14 — centred card, `--color-brand-purple` primary button, Inter font (already wired in `layout.tsx`). Defer full FlowDesk auth-page polish to Story 1.4.
- [ ] **4.2** — Add `apps/web/src/app/portfolio/page.tsx` as a minimum-viable protected destination (Server Component using `auth()` from `@/auth` to read the session; renders `Hi {email} — role: {role}`). Story 1.4 replaces this with the real shell.

### Task 5 — Tests (AC: #1, #2, #3)

- [ ] **5.1** — `apps/web/src/auth.test.ts` (vitest, **unit**) — covers:
  - `credentialsEnabled` evaluates to `true` when `NODE_ENV !== 'production'` and when `CREDENTIALS_FALLBACK_ENABLED === 'true'`.
  - `credentialsEnabled` evaluates to `false` when `NODE_ENV === 'production'` and the env flag is absent.
  - bcrypt round-trip: `bcrypt.compare(plain, await bcrypt.hash(plain, 12))` is `true`.
- [ ] **5.2** — `apps/web/src/middleware.test.ts` (vitest, **unit**) — covers the public-route allowlist logic in `authConfig.callbacks.authorized` against fixture `NextAuthRequest` shapes (mock `auth` object, mock `request.nextUrl.pathname`).
- [ ] **5.3** — `apps/web/src/credentials-flow.integration.test.ts` (vitest, **integration**, `describe.runIf(!!process.env.DATABASE_URL)`):
  - Seeds an `ACTIVE` user with bcrypt-hashed password directly via `prisma.user.create`.
  - Calls the credentials provider's `authorize` function (extracted as a testable export — refactor `auth.ts` to expose `authorizeCredentials` for testability) with valid + invalid creds.
  - Asserts: valid creds return the user shape; invalid creds return `null`.
  - Asserts: an `AuditLog` row with `op: "auth.signin.failure"` is committed for the bad-password path; a row with `op: "auth.signin.success"` is **not** committed for the failure path.
  - Cleans up between tests (`afterEach`: delete seeded user + all audit_logs rows from this test run).
- [ ] **5.4** — `apps/web/src/sso-live.integration.test.ts` (vitest, integration, `describe.runIf(!!process.env.AZURE_AD_TENANT_ID && !!process.env.AZURE_AD_CLIENT_ID && !!process.env.AZURE_AD_CLIENT_SECRET)`):
  - Stub: a single `it.todo("performs OIDC handshake against the live tenant")` line. Real implementation requires Playwright (deferred to Story 10.11). The `runIf` gate documents the contract that this test will exist when creds are available.
  - Add a `console.warn` notice when the suite is skipped, mirroring Story 1.7's pattern.

### Task 6 — Wire CI + verify all gates green (AC: #1, #2, #3)

- [ ] **6.1** — `.github/workflows/ci.yml` — confirm the existing Postgres service container from Story 1.7 stays intact. Add the auth env vars to the workflow's `env:` block as **placeholder** values so the build/typecheck/lint passes don't fail on undefined references:
  ```yaml
  env:
    AUTH_SECRET: ci-placeholder-32-chars-minimum-length-xxxxxxxx
    CREDENTIALS_FALLBACK_ENABLED: "true"
    DEV_ADMIN_EMAIL: ci-admin@flowdev.local
    DEV_ADMIN_PASSWORD: ci-placeholder-password-not-real
  ```
  AZURE_AD_* vars are **deliberately left unset** so the `sso-live.integration.test.ts` skip path executes — flagging in CI logs that live SSO verification is deferred to staging.
- [ ] **6.2** — Run locally: `npm run build && npm run typecheck && npm run lint && DATABASE_URL=... npm run test`. All four green. Test count should grow by ≥ 5 (the new auth tests).
- [ ] **6.3** — Run `npm run db:seed` with `DEV_ADMIN_EMAIL` + `DEV_ADMIN_PASSWORD` set. Confirm the seed user is upserted by querying `users` directly. Re-run the seed; assert it's idempotent (same `id`, updated `updatedAt`).
- [ ] **6.4** — Manual smoke (dev server): `npm --workspace=apps/web run dev`. Visit `http://localhost:3000/portfolio`. Confirm the redirect to `/sign-in?callbackUrl=...`. Sign in with the seed admin's credentials. Land at `/portfolio` and see the `Hi {email} — role: ADMIN` placeholder. Confirm two `audit_logs` rows: `auth.signin.success` + `auth.session.create`. Sign out (POST to `/api/auth/signout`), confirm redirect back to `/sign-in`. Try a bad password; confirm the inline error and a `auth.signin.failure` audit row.

### Task 7 — Update APP-PROGRESS.md + sprint-status.yaml (AC: #1, #2, #3)

- [ ] **7.1** — Move sprint-status entry `1-2-authenticate-via-azure-entra-id-sso-with-credentials-fallback` from `backlog` to `ready-for-dev` at story creation, then to `in-progress` on dev start, then `review` on completion.
- [ ] **7.2** — On completion, update APP-PROGRESS.md §Current state with the PR number, branch name, squash commit hash, and any substantive carry-forward (new env vars, new audit ops, schema additions).

---

## Dev notes

### Risks & gotchas

1. **`AUTH_SECRET` in CI must be ≥ 32 chars.** Auth.js v5 errors out on short secrets. The CI placeholder above is 48 chars.
2. **`getToken()` requires `AUTH_SECRET`** — the Edge-runtime middleware can't decode the JWT without it. Same secret used everywhere. `auth.config.ts` does not need to import the secret directly; Auth.js reads it from `process.env.AUTH_SECRET`.
3. **Prisma + Edge runtime are incompatible.** `auth.config.ts` MUST NOT import `@flowdev/db`. The split-config pattern enforces this — keep it disciplined.
4. **`microsoft-entra-id` provider name.** The endpoint is `/api/auth/signin/microsoft-entra-id` (note the kebab case from the provider's `id`). Sign-in form `action`s must match.
5. **Audit rows fire even on failure.** The `authorize` failure path writes an audit row and returns `null` — the row persists in its own implicit transaction (no enclosing `prisma.$transaction` here). This is intentional: failed sign-ins are exactly the events compliance cares about.
6. **No `prisma.$transaction` wrapping the audit + auth event.** Story 1.7's helper supports both `PrismaClient` and `Prisma.TransactionClient`. For sign-in events, there is no underlying mutation to wrap — Auth.js handles user/account/session writes through the adapter, outside our reach. We're auditing the **fact of** sign-in, not co-committing with a mutation. AC2/AC3 of Story 1.7 (transactional commit/rollback) don't apply because there is no transaction.
7. **Default role `DEVELOPER`** means a freshly self-provisioned SSO user lands at `/portfolio` with the lowest role. ADMIN must explicitly promote them via Story 1.5. This is the safe default.
8. **First-time SSO sign-in creates a `User` row via PrismaAdapter** with `status` defaulting to `INVITED`. AC1 says the user "lands at `/portfolio`" — but a route guarded only by `isLoggedIn` (per `authConfig.callbacks.authorized`) accepts an `INVITED` user. Story 1.5 will add a status check; for now the AC is met. Document this as a known carry-forward.
9. **Same-LLM CR caveat carries forward.** This story is implemented and reviewed in Opus 4.7. The CR cannot run cross-LLM in the autonomous loop the user authorised. Same caveat header as Story 1.7's Review Findings.

### Files expected to change / be created

```
NEW:
  packages/db/prisma/migrations/<timestamp>_1_2_auth/migration.sql
  packages/db/prisma/seed.ts
  apps/web/src/auth.ts
  apps/web/src/auth.config.ts
  apps/web/src/middleware.ts
  apps/web/src/app/api/auth/[...nextauth]/route.ts
  apps/web/src/app/sign-in/page.tsx
  apps/web/src/app/portfolio/page.tsx
  apps/web/src/auth.test.ts
  apps/web/src/middleware.test.ts
  apps/web/src/credentials-flow.integration.test.ts
  apps/web/src/sso-live.integration.test.ts

MODIFIED:
  packages/db/prisma/schema.prisma          (+enums +User/Account/Session/VerificationToken)
  packages/db/package.json                  (+bcryptjs +@types/bcryptjs +tsx +prisma.seed +db:seed)
  apps/web/package.json                     (+next-auth +@auth/prisma-adapter +bcryptjs +zod)
  packages/shared/src/audit/append.ts       (+3 auth.* ops in AuditOp union)
  .env.example                              (uncomment auth block; add seed env vars)
  .github/workflows/ci.yml                  (+auth env placeholders)
  package.json                              (+db:seed root alias)
  APP-PROGRESS.md                           (post-completion update)
  _bmad-output/implementation-artifacts/sprint-status.yaml (status flips)
```

### Source-of-truth references

- `_bmad-output/planning-artifacts/PRD.md` — FR61, FR62, NFR-S2 (lines 525–528, 583–586)
- `_bmad-output/planning-artifacts/architecture.md` — `User` extensions (line 382), §9 schema sketch
- `_bmad-output/planning-artifacts/tech-stack.md` — Auth.js v5, `@auth/prisma-adapter@2.11.1`, `@azure/msal-node@5.0.6` (deferred to Azure connectors), bcryptjs
- `_bmad-output/planning-artifacts/style-guide.md` — §14 auth pages
- Story 1.7 — established the `appendAudit()` contract and audit op closed-set discipline this story extends
- APP-PROGRESS.md §Resume tomorrow — Story 1.2 prompt template

### Definition of done

- All Acceptance Criteria (AC1, AC2, AC3) pass via the test suite + manual smoke.
- 4 gates green locally and in CI: `build`, `typecheck`, `lint`, `test`.
- Sprint-status flipped to `review`.
- File List populated above.
- Branch `feat/story-1-2-auth` pushed to origin; **draft** PR opened against `main` (NOT marked ready-for-review until Don supplies real `AZURE_AD_*` creds and runs the live SSO smoke).
- APP-PROGRESS.md updated with the in-progress / review status (final `done` flip happens post-merge, same pattern as Story 1.7).
