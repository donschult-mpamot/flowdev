---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
  - step-04-final-validation
status: complete
completedAt: '2026-04-28'
storyCount: 89
epicCount: 10
v1FrCoverage: 51 of 51
nfrCoverage: 36 of 36
deferredFrs:
  - FR24
  - FR29
  - FR30
  - FR31
  - FR40
  - FR41
  - FR45
  - FR49
  - FR52
  - FR53
sprintPlanningNotes:
  - 'Epic 1: implement Story 1.7 (audit log infra) alongside Story 1.1 bootstrap'
  - 'Epic 2: implement Stories 2.18, 2.19, 2.11 before Stories 2.6 and 2.17'
  - 'Epic 3: implement Stories 3.6, 3.7 before Story 3.5'
  - 'Epic 8: implement Stories 8.9, 8.10 alongside Story 8.4'
inputDocuments:
  - _bmad-output/planning-artifacts/PRD.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/webhook-contract-v1.md
  - _bmad-output/planning-artifacts/UX-design.md
  - _bmad-output/planning-artifacts/product-brief.md
  - _bmad-output/planning-artifacts/tech-stack.md
  - _bmad-output/planning-artifacts/style-guide.md
project_name: FlowDev
user_name: Don
date: '2026-04-28'
scope: 'v1 MVP only; v1.1 and v2 capabilities deferred per PRD §Product Scope'
---

# FlowDev — Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for FlowDev (codename **MPAMOT**), decomposing v1 requirements from the PRD, UX Design, Webhook Contract, and Architecture into implementable stories. Per PM direction, the **connector framework epic is sequenced first** because every other capability (uptime, cost, adoption, alerting) depends on it.

Scope is **v1 MVP only**. Items tagged `(v1.1)` or `(v2)` in the PRD are explicitly deferred and listed at the end of the document for backlog continuity.

## Requirements Inventory

### Functional Requirements

The PRD authors FR1–FR69 with explicit IDs and version tags. The list below preserves those IDs verbatim and labels each FR's release phase. **v1 stories cover only items not tagged `(v1.1)` or `(v2)`.**

**App Registry & Lifecycle**

- **FR1.** ADMIN can register a new app in the portfolio with metadata: name, description, owner, environment (dev/staging/prod), hosting platform, primary URL, tech stack tags, repository link, runbook link.
- **FR2.** ADMIN can edit any field of a registered app's metadata.
- **FR3.** ADMIN can mark an app as decommissioned, retaining its historical data without continuing active monitoring.
- **FR4.** ADMIN can permanently delete a decommissioned app (subject to data-retention policy), with the action recorded in the audit log.
- **FR5.** System maintains lifecycle status (`active`, `decommissioned`) per app and exposes it on every UI surface that references the app.

**Connector Management**

- **FR6.** ADMIN can attach one or more connectors to a registered app, selecting from available connector types.
- **FR7.** ADMIN can supply per-connector credentials, which the system encrypts at rest and never displays in plaintext after save.
- **FR8.** ADMIN can validate a connector's configuration — verifying credential validity and reachability — before activation.
- **FR9.** ADMIN can rotate or replace connector credentials without losing continuity of historical data.
- **FR10.** ADMIN can disable a connector temporarily and re-enable it without losing prior data.
- **FR11.** ADMIN can remove a connector permanently, with the action recorded in the audit log.
- **FR12.** System runs each enabled connector on its configured schedule, independently of UI request handling.
- **FR13.** System surfaces each connector's last-successful-run timestamp and current status (`healthy / degraded / failing / disabled / unknown`) per the FR13 state machine.
- **FR14.** System isolates connector failures — a failed connector run does not block other connectors, the request path, or dashboard rendering.
- **FR14a.** HMAC-validation failures on the webhook receiver do **not** count toward a connector's consecutive-failure threshold (FR13).
- **FR15.** A monitored app can push events to its unique authenticated webhook URL; the system validates each request via per-app HMAC + per-app secret.
- **FR16.** ADMIN can rotate a per-app webhook secret, invalidating prior signatures and providing a new secret for distribution.

**Operational Telemetry**

- **FR17.** System probes each registered app's HTTP health endpoint on a configurable schedule (default 60s), recording status code, response time, success/fail outcome.
- **FR18.** System computes per-app uptime percentages over rolling windows (24h, 7d, 30d, 90d, custom).
- **FR19.** ADMIN/MANAGER/DEVELOPER (assigned apps) can view per-app uptime trends over a selected time range.
- **FR20.** System collects database performance metrics (CPU %, active connections, storage used, slow query count) for apps whose connectors include PostgreSQL metrics.
- **FR21.** System collects HTTP response-time series from probe results.
- **FR22.** System captures resource-growth snapshots daily — DB storage size + configured table row counts (v1).
- **FR23.** ADMIN/MANAGER/DEVELOPER (assigned apps) can view resource-growth trends over a selected time range.
- **FR24.** *(v1.1)* Server CPU/memory metrics where the host platform exposes them.

**Adoption & Activity Tracking**

- **FR25.** System records login activity events per app, sourced from the per-app webhook receiver, capturing user identifier, timestamp, per-app metadata.
- **FR26.** System computes per-app login count and DAU/WAU/MAU on rolling daily/weekly/monthly windows.
- **FR27.** System maintains last-active-at per known user identifier per app.
- **FR28.** ADMIN/MANAGER/DEVELOPER (assigned apps) can view adoption trends and active-user counts over a selected time range.
- **FR29.** *(v1.1)* Cumulative user-growth charts per app and across the portfolio.
- **FR30.** *(v1.1)* Third-party integration-call events per app via the webhook contract.
- **FR31.** *(v1.1)* Per-integration health views per registered app.

**Cost Intelligence**

- **FR32.** System collects per-app cost data from each cloud-platform billing connector on an hourly cadence.
- **FR33.** System attributes per-app cost by cloud-platform service line (compute, storage, database, email, etc.).
- **FR34.** System displays all cost values in ZAR, applying the configured FX source for USD-billed platforms, and discloses the source currency + FX rate.
- **FR35.** ADMIN/MANAGER can view per-app month-to-date cost.
- **FR36.** ADMIN/MANAGER can view monthly cost trend per app over a selected time range.
- **FR37.** ADMIN/MANAGER can view portfolio-wide cost rollup over a selected time range.
- **FR38.** System computes a forecast of total cost for the current billing period per app and for the portfolio, with data-freshness disclosure (count of complete days of data + last refresh timestamp).
- **FR39.** DEVELOPER can view cost data when ADMIN has enabled the global "DEVELOPERs see cost" toggle (v1).
- **FR40.** *(v1.1)* Budget thresholds + breach alerts per app.
- **FR41.** *(v1.1)* Manual cost-share attribution rules for shared resources.

**Communication & Email Monitoring**

- **FR42.** System collects outbound email metrics (volume, delivery, bounce, complaint) per app via Azure Communication Services connectors (v1). *(v1.1: Resend; AWS SES via AWS suite.)*
- **FR43.** ADMIN/MANAGER/DEVELOPER (assigned apps) can view email-volume and delivery-rate trends over a selected time range.
- **FR44.** System masks email recipient addresses by default in the UI; un-masking is an explicit user action recorded in the audit log.
- **FR45.** *(v1.1)* Recent-sends log search per app.

**Dashboards & Reporting**

- **FR46.** ADMIN/MANAGER/DEVELOPER (and v2 VIEWER) can view a portfolio dashboard showing every app within their access scope, with per-app current health, today's spend, today's logins, and current alert count.
- **FR47.** ADMIN/MANAGER/DEVELOPER can drill into an app-detail dashboard showing uptime, cost, adoption, resource growth, communications, integration health, and recent alerts on the FlowDesk Detail Page (2/3 + 1/3) layout.
- **FR48.** Users with dashboard access can change the time range applied to dashboard charts via a consistent time-range selector (24h, 7d, 30d, 90d, custom).
- **FR49.** *(v1.1)* Cross-cutting portfolio dashboards (cost / uptime / adoption trend).
- **FR50.** ADMIN/MANAGER can generate on-demand reports — uptime, cost, adoption, or combined portfolio — over a selected date range, scoped to single app or whole portfolio.
- **FR51.** ADMIN/MANAGER can export any generated report as CSV.
- **FR52.** *(v1.1)* Scheduled recurring reports via email.
- **FR53.** *(v2)* PDF report export.

**Alerting**

- **FR54.** ADMIN/MANAGER (in scope) can configure alert rules. v1 rule types: uptime-threshold, cost-MTD-threshold, email-bounce-rate.
- **FR55.** System evaluates active alert rules against incoming telemetry and creates an alert event when conditions are met.
- **FR56.** System maintains alert lifecycle state per event: `firing → acknowledged → resolved`.
- **FR57.** ADMIN/MANAGER/DEVELOPER (assigned apps) can acknowledge a `firing` alert, with the action recorded in the audit log.
- **FR58.** ADMIN/MANAGER/DEVELOPER (assigned apps) can resolve a `firing` or `acknowledged` alert, with the action recorded in the audit log.
- **FR59.** System delivers alert notifications via in-app notification bell + Azure Communication Services email (v1). *(v2: Teams, SMS.)*
- **FR60.** ADMIN/MANAGER/DEVELOPER receive in-app alert notifications scoped to their role and assigned apps.

**Identity, Access & Audit**

- **FR61.** A team member can authenticate via Azure Entra ID single sign-on.
- **FR62.** A team member can authenticate via local credentials when SSO is unavailable (development / fallback path).
- **FR63.** ADMIN can invite, modify, or remove FlowDev users.
- **FR64.** ADMIN can assign a role (ADMIN, MANAGER, DEVELOPER) to each user. *(v2: VIEWER role.)*
- **FR65.** ADMIN can assign DEVELOPER users to one or more apps for scoped access.
- **FR66.** System enforces role-based access control on every route handler and data-access path, not only in the UI.
- **FR67.** System records every mutation to apps, connectors, credentials, alert rules, and user roles in an immutable audit log.
- **FR68.** ADMIN can search and filter the audit log by actor, action type, target entity, and time range.
- **FR69.** System logs audit events for credential un-masking, alert acknowledgement and resolution, webhook secret rotation, and user-role changes.

### NonFunctional Requirements

PRD authors NFR-P, NFR-R, NFR-S, NFR-SC, NFR-A, NFR-I, NFR-O, NFR-D, NFR-B groups.

- **NFR-P1.** Portfolio dashboard < 2s warm-cache for ≤ 50 apps.
- **NFR-P2.** App detail dashboard < 2.5s warm-cache.
- **NFR-P3.** Webhook receiver: 202 within 50ms p95 at 50 RPS sustained for valid; 401 within 50ms p99 for invalid HMAC.
- **NFR-P4.** HTTP probes execute within ±10s of scheduled time at p95.
- **NFR-P5.** On-demand combined-portfolio one-month report < 60s.
- **NFR-P6.** Time-range selector switch re-fetch < 1s warm-cache.
- **NFR-P7.** Client-side interaction lag < 100ms perception threshold.
- **NFR-R1.** FlowDev availability ≥ 99.5%.
- **NFR-R2.** FlowDev outage must never degrade any monitored app (no inline dependencies).
- **NFR-R3.** Connector failures isolated.
- **NFR-R4.** Worker retry: initial 30s, factor 2, max 30min, max 5 attempts; transition to `failing` on ≥5 consecutive failures OR no success in last 30min.
- **NFR-R5.** Postgres backups via Azure Flexible Server managed backup; RPO ≤ 24h.
- **NFR-S1.** Connector credentials encrypted at rest with Azure Key Vault key; plaintext never logged; decrypted only in-process at moment of use.
- **NFR-S2.** Auth on every route handler via Edge middleware `getToken()`; webhook route MUST NOT be wrapped in session auth.
- **NFR-S3.** RBAC enforced server-side on every route handler and data-access path.
- **NFR-S4.** Webhook auth: per-app secret + HMAC + signed timestamp; replay window 5 min.
- **NFR-S5.** Email recipient addresses masked by default in UI; un-masking audit-logged.
- **NFR-S6.** Audit log immutable.
- **NFR-S7.** TLS on all inbound/outbound HTTP; HSTS enabled; cert auto-managed by ACA.
- **NFR-S8.** No anonymous public exposure: global noindex/nofollow; deny-all robots.txt.
- **NFR-S9.** User passwords from monitored apps are never stored, transmitted, or processed by FlowDev.
- **NFR-S10.** Pen-test or threat-model review passes before v1 GA.
- **NFR-SC1.** v1 supports 50 apps, 200 connectors, 90 days raw retention at stated SLO.
- **NFR-SC2.** *(v2 target)* 200 apps, 1000 connectors.
- **NFR-SC3.** New cloud platform = new connector module only; no changes outside the connector module.
- **NFR-SC4.** Time-series queries against hourly/daily aggregate tables stay under 500ms p95 at v1 scale; raw-table queries scoped to ≤24h windows.
- **NFR-SC5.** Worker job throughput: all scheduled connector runs complete within their nominal cadence.
- **NFR-A1.** WCAG 2.1 AA conformance across all surfaces.
- **NFR-A2.** Keyboard navigation operates end-to-end for J1–J5.
- **NFR-A3.** Focus visible on every interactive element via `--ring` token.
- **NFR-A4.** No information conveyed by colour alone — every state pill carries colour AND text.
- **NFR-A5.** Recharts visualisations paired with screen-reader-friendly tabular fallbacks.
- **NFR-A6.** Accessibility audit (manual + automated) before v1 GA.
- **NFR-I1.** All outbound platform-API calls execute from the worker, never on the request path.
- **NFR-I2.** Outbound API calls implement rate-limit + retry handling per platform's documented limits.
- **NFR-I3.** Webhook contract versioned via `X-FlowDev-Webhook-Version` header from v1.
- **NFR-I4.** All outbound emails sent via Azure Communication Services; SMTP not used.
- **NFR-O1.** Structured JSON logs from API routes and worker.
- **NFR-O2.** Correlation IDs propagated browser → API → worker job.
- **NFR-O3.** Connector run results (success/failure, duration, records collected) logged + retained ≥30 days.
- **NFR-O4.** Webhook validation failures logged (without payload contents) for security review.
- **NFR-D1.** Default retention: raw 90d / hourly 1y / daily indefinite.
- **NFR-D2.** ADMIN can configure per-app retention overrides within bounds (cannot reduce audit-log retention).
- **NFR-D3.** Audit log retention indefinite, no automatic pruning.
- **NFR-D4.** Each `CostRecord` snapshot captures FX rate, source, source currency, source amount; historical reports use rate captured at snapshot time; if source unreachable >24h → `is_stale: true` + UI badge.
- **NFR-B1.** Latest two major versions of Chrome, Edge, Firefox, Safari supported.
- **NFR-B2.** Light and dark themes both pass functional + a11y checks.
- **NFR-B3.** HTML `lang="en-ZA"`; dates via date-fns en-ZA; ZAR via `formatZAR()` helper; USD-source values display ZAR primary + USD sub-label.

### Additional Requirements

Drawn from `architecture.md` (technical foundation that conditions every story) and `webhook-contract-v1.md` (sender-facing contract). These are not FRs in the PRD but are mandatory implementation requirements.

- **AR1.** Greenfield monorepo with three runtime apps (`apps/web` Next.js 15, `apps/worker` always-on ACA Container App, `apps/jobs` ACA Jobs entrypoints) and three packages (`packages/connectors`, `packages/db`, `packages/shared`). Connectors are invokable from all three apps against the same TypeScript entrypoint. *(arch §1)*
- **AR2.** Postgres 15 (Azure Flexible Server) provisioned alongside FlowDesk infrastructure (separate database, same server class). Prisma 6 schema authored from the §9 sketch; BRIN indexes on `recorded_at` and partial indexes on `WebhookEventRaw.processedAt IS NULL` applied via SQL migrations outside Prisma's DSL. *(arch §3, §9)*
- **AR3.** Postgres `LISTEN/NOTIFY` triggers on `apps`/`connectors` tables to drive worker schedule reload (with 60s reload-poll fallback). *(arch §2)*
- **AR4.** Azure Key Vault key `flowdev-creds-mk` (RSA-4096, soft-delete + purge protection on) provisioned; both `apps/web` and `apps/worker` and Job containers authenticate via Azure Managed Identity (no KV credentials in app config). *(arch §7)*
- **AR5.** Envelope encryption helper at `packages/shared/crypto/envelope.ts` exposing `useCredential(credentialId, fn)`. ESLint rule bans direct `prisma.connectorCredential.findUnique()` calls outside this helper. *(arch §7)*
- **AR6.** ACA Jobs cron expressions (hourly aggregate roll-up, daily aggregate roll-up, retention prune, cost-data pull every 15 min, daily resource snapshot, daily SARB FX pull, idle DEK re-wrap sweep) declared in IaC (Bicep or Terraform). *(arch §2, §8)*
- **AR7.** `apps/worker` uses `node-cron` for sub-hourly jobs (60s probe, 5s outbox drain) with `pg_try_advisory_lock(hashtext(app_id || ':' || connector_id))` to prevent overlap. Liveness via `/healthz` (200 if scheduler tick fired in last 90s). *(arch §2)*
- **AR8.** Webhook receiver uses outbox pattern: route handler reads raw body, validates `Content-Length ≤ 16KB`, version header, HMAC, timestamp, idempotency, persists to `webhook_events_raw`, returns 202; worker drains `webhook_events_raw → activity_events / integration_call_events / custom_metric_events`. *(arch §4, webhook-contract §1–§7)*
- **AR9.** SARB FX-rate connector at `packages/shared/fx/sarb.ts`; daily ACA Job pulls ZAR/USD; per-`CostRecord` snapshot captures rate-at-time. *(arch §5)*
- **AR10.** Class-scoped Service Principals (option (b)) provisioned in Azure: `flowdev-prod-readonly-metrics`, `flowdev-prod-cost-mgmt`, etc. (target six SPs in the initial set). Per-app data isolation via Azure RBAC at resource-group scope. *(arch §6)*
- **AR11.** Operator scripts at `scripts/rotate-credentials.ts` and `scripts/revoke-credentials.ts` for manual credential rotation/revocation. Master-key rotation uses a manual ACA Job (`re-wrap-deks`). *(arch §6, §7)*
- **AR12.** Webhook contract published as versioned artefact `webhook-contract-v1.md` with HMAC fixture committed at `packages/shared/__fixtures__/webhook/login.json` (generated by `scripts/webhook-fixture.ts`). *(arch §4, webhook-contract §9)*
- **AR13.** App Insights query-duration emission for time-series-sensitive queries (`query_name`, `query_duration_ms`); alert configured for `p95 of raw-table-query > 500ms over 1h window` (NFR-SC4 tripwire / TimescaleDB re-evaluation gate). *(arch §3)*
- **AR14.** Aggregate idempotency: `INSERT ... ON CONFLICT (app_id, metric_id, bucket_start) DO UPDATE` for hourly + daily roll-ups; prune Job batched 10k rows per delete with 30min budget. *(arch §3, §8)*
- **AR15.** Auth.js v5 with Azure Entra ID + credentials provider (FlowDesk pattern: `getToken()` in Edge middleware, NOT `auth()`); `/webhooks/*` route group excluded from Auth.js middleware. *(arch §4, NFR-S2)*
- **AR16.** Connector framework defines a TypeScript interface (`collect()`, `healthCheck()`, `validateCredentials()`) that v1 connectors implement: HTTP_PROBE, AZURE_ARM, AZURE_COST_MGMT, AZURE_PG_METRICS, AZURE_COMMUNICATION_EMAIL, DIGITALOCEAN, POSTGRES_DIRECT, WEBHOOK_RECEIVER. *(brief §5.2, arch §1)*
- **AR17.** GitHub Actions CI/CD pipeline: build → test → push to ACR → deploy to ACA on push to `main`. Same pattern as FlowDesk. *(tech-stack §14, brief §8.1)*
- **AR18.** Dockerfile multi-stage build for each `apps/*`; Docker Compose for local dev with Postgres + worker. *(tech-stack §13)*

### UX Design Requirements

Drawn from `UX-design.md` §Component Strategy, §UX Consistency Patterns, §Responsive Design & Accessibility, and the J3/J4 mechanics. Each UX-DR is testable and granular enough to generate stories.

- **UX-DR1.** `<AppHealthPill>` component (`UP / DEGRADED / DOWN / UNKNOWN`) with `sm` and `default` sizes, optional leading dot, `aria-label`, ≥4.5:1 contrast in both themes, used wherever an app is referenced. *(UX §Component Strategy)*
- **UX-DR2.** `<SparklineCell>` component — Recharts `<LineChart>` at 24px × ~80px (table density) + 40px (tile density), `default` and `uptime` accent variants, `loading` skeleton, `no-data` "—" treatment, `aria-label` describing the trend, paired screen-reader `<table>` fallback (NFR-A5). *(UX §Component Strategy)*
- **UX-DR3.** `<ConnectorStatusRow>` component — single-line flex (icon + name + relative timestamp + status pill + action menu); states `healthy / degraded / failing / disabled / unknown` with diagnostic line on degraded/failing; `default` and `compact` sizes. *(UX §Component Strategy)*
- **UX-DR4.** `<TimeRangeSelector>` component — `<Tabs>` with `24h / 7d / 30d / 90d / Custom` + custom-range `<Popover>` with two `<Calendar>`s; selected range URL-encoded; `default` and `compact` sizes; coordinated chart re-fetch via SWR `mutate`. *(UX §Component Strategy)*
- **UX-DR5.** `<CostDisplay>` component — three variants (`inline`, `card`, `primary`); ZAR primary via `formatZAR()`; USD source + FX rate + freshness; stale-rate badge when FX > 24h; `forecast` flag adds freshness disclosure (FR38). *(UX §Component Strategy, NFR-D4)*
- **UX-DR6.** `<AlertStatePill>` and `<ConnectorStatusPill>` — sister components to `<AppHealthPill>` sharing the visual grammar (green / amber / red / slate / grey + text label). *(UX §Visual Foundation)*
- **UX-DR7.** `<PortfolioTable>` composite — `<Table>` + `<AppHealthPill>` + `<SparklineCell>` + `<CostDisplay variant="inline">` + login count + alert badge; sortable columns; filter pills (platform/owner/lifecycle); search input with 150ms debounce; URL-encoded filter/sort/search state. *(UX §Defining Interaction, §Component Strategy)*
- **UX-DR8.** `<AppDetailLayout>` — Detail Page (2/3 + 1/3) split: main column with metadata header + chart cards (uptime, cost, adoption, resource growth, communications); sidebar with connector status list + recent alerts + alert rules summary. *(UX §Component Strategy, style guide §8)*
- **UX-DR9.** `<AlertDetailLayout>` — mobile-portrait optimised; above-fold context (state pill + app + fired-at + duration); sticky-bottom full-width `[Acknowledge]` (or `[Resolve]`) button at `h-12 text-base`; SWR optimistic mutation; toast confirmation. *(UX J4 mechanics)*
- **UX-DR10.** Notification bell extension — bell badge becomes red dot when ≥1 firing alert in scope; popover gains "Active alerts" section above the existing notification list with per-alert `<AlertStatePill>` + app + fired-at + `[Acknowledge]`. *(UX §Component Strategy)*
- **UX-DR11.** Sidebar nav with FlowDev items: Portfolio (`LayoutDashboard`), Apps (`Boxes`), Costs (`Wallet`, ADMIN/MANAGER), Adoption (`Users`), Alerts (`Bell` w/ red-dot), Reports (`BarChart3`, ADMIN/MANAGER), Settings (`Settings`, ADMIN), Help (`HelpCircle`). Role-gated visibility enforced server-side. *(UX §Component Strategy)*
- **UX-DR12.** Connector onboarding inline panel pattern — slides into App detail main column (NOT a modal); type chooser → connector-specific form → `[Test connection]` outline button (validate before save) → save → encrypted-at-rest → `<ConnectorStatusRow>` appears with `unknown` state → first probe within ≤60s flips to `healthy`. Webhook secret displayed exactly once with `[Copy]`. *(UX J3 mechanics)*
- **UX-DR13.** Empty-state variants for: Portfolio (no apps), App detail (no connectors), Alerts (calm "monitoring all apps"), Filtered table (no results), Audit log (no matches), Reports (none generated). Each carries appropriate Lucide icon + next-action. *(UX §Component Strategy)*
- **UX-DR14.** Loading-state patterns — Skeleton rows (`~48px`) for Portfolio table; Skeleton 24×80 for Sparkline cells; Skeleton for stat values; chart-card skeleton block; button-disable + `<Loader2 animate-spin>` for in-flight mutations. **Forbidden:** full-screen blocking spinners. *(UX §Component Strategy)*
- **UX-DR15.** Search/filter/sort patterns — search input with `Search` icon, 150ms debounce; filter pills as `<Badge>` clickable multi-select; column sort cycles `unsorted → asc → desc`; all state encoded in URL search params (bookmarkable). *(UX §Component Strategy)*
- **UX-DR16.** Mobile responsive shell — `md:` (768px) primary breakpoint; sidebar collapses to `<Sheet>` slide-out below `md`; Portfolio horizontal-scrolls on mobile (v1.1: simplified single-column variant); App detail stacks 2/3+1/3 vertically; Alert detail is mobile-portrait production-grade with `h-12 w-full text-base` ack button. *(UX §Responsive)*
- **UX-DR17.** Theme parity — every FlowDev component built with explicit dark-mode treatment (`.dark` class); Storybook story exports a "both themes" frame; visual regression blocks merge if pixels shift unexpectedly. *(UX §Visual Foundation, NFR-B2)*
- **UX-DR18.** Accessibility implementation — semantic HTML (no `<div>` soup); ARIA only where semantic insufficient; `--ring` focus visible; skip-to-main-content link; `prefers-reduced-motion` respected; touch targets ≥44×44px on mobile; chart screen-reader `<table>` fallbacks. *(UX §Responsive & Accessibility)*
- **UX-DR19.** ACS email template for alerts — inline CSS only (mobile email client compatibility); layout mirrors in-app `<AlertDetailLayout>` (state pill, app name, fired-at, last-good-probe, primary CTA); link goes to `/alerts/[id]`. *(UX J4 §Critical micro-decisions)*
- **UX-DR20.** Webhook delivery diagnostic view — `/apps/[id]/webhook-deliveries` (ADMIN-only) showing last 50 deliveries with `received_at`, `status_code`, HMAC result, idempotency outcome, body size, processError. *(arch §4, webhook-contract §12)*
- **UX-DR21.** SSO transparent redirect — Edge middleware (`getToken()`) handles missing session; redirect to Azure Entra and back, preserving the deep-link target (e.g. `/alerts/[id]`); user perceives one tap from email link to landing on the destination page. *(UX J4)*
- **UX-DR22.** Toast feedback patterns — success toasts on mutations (J3 save, J4 ack/resolve, J5 export); destructive variant on transient failures; **no toast on healthy state** (explicit prohibition). *(UX §Consistency Patterns)*
- **UX-DR23.** Storybook + visual regression infrastructure — every FlowDev component has `.stories.tsx` co-located; theme-parity snapshots; visual-diff gate on merge. *(UX §Component Implementation Strategy)*
- **UX-DR24.** Playwright E2E test infrastructure — covers J1 (portfolio glance < 2s), J3 (connector onboarding), J4 (alert ack from email link), J5 (report generation < 60s); axe-core a11y assertions on every page visit (zero violations gate merge). *(UX §Testing Strategy)*
- **UX-DR25.** Real-device mobile testing — J4 ack flow validated on iOS Safari + Android Chrome (latest 2 versions each); viewport sizes 360×640, 375×812, 414×896. *(UX §Testing Strategy)*

### FR Coverage Map

| FR | Epic | Brief description |
|---|---|---|
| FR1 | Epic 2 | ADMIN registers app with metadata |
| FR2 | Epic 2 | ADMIN edits app metadata |
| FR3 | Epic 2 | ADMIN decommissions app (retain history) |
| FR4 | Epic 2 | ADMIN deletes decommissioned app (audited) |
| FR5 | Epic 2 | Lifecycle status surfaced everywhere |
| FR6 | Epic 2 | ADMIN attaches connectors |
| FR7 | Epic 2 | Per-connector credentials encrypted at rest |
| FR8 | Epic 2 | Connector validation before activation |
| FR9 | Epic 2 | Credential rotation without history loss |
| FR10 | Epic 2 | Disable / re-enable connector |
| FR11 | Epic 2 | Permanent connector removal (audited) |
| FR12 | Epic 2 | Scheduled connector runs out-of-band |
| FR13 | Epic 2 | Connector failure-state machine + status display |
| FR14 | Epic 2 | Connector failure isolation |
| FR14a | Epic 2 | HMAC failures excluded from failure threshold |
| FR15 | Epic 2 | Webhook receiver: HMAC + per-app secret |
| FR16 | Epic 2 | Webhook secret rotation |
| FR17 | Epic 3 | HTTP probe collection (status, latency, success) |
| FR18 | Epic 3 | Per-app uptime % over rolling windows |
| FR19 | Epic 3 | View uptime trends over selected range |
| FR20 | Epic 3 | DB performance metric collection (CPU, conns, storage, slow queries) |
| FR21 | Epic 3 | HTTP response-time series |
| FR22 | Epic 3 | Daily resource-growth snapshots (DB storage + table rows) |
| FR23 | Epic 3 | View resource-growth trends |
| FR25 | Epic 5 | Login activity events from webhook |
| FR26 | Epic 5 | Per-app login count + DAU/WAU/MAU |
| FR27 | Epic 5 | Last-active-at per user/app |
| FR28 | Epic 5 | View adoption trends |
| FR32 | Epic 4 | Hourly cost-data collection |
| FR33 | Epic 4 | Per-app cost attribution by service line |
| FR34 | Epic 4 | ZAR display + FX disclosure |
| FR35 | Epic 4 | Per-app MTD cost view |
| FR36 | Epic 4 | Monthly cost trend per app |
| FR37 | Epic 4 | Portfolio-wide cost rollup |
| FR38 | Epic 4 | Cost forecast with freshness disclosure |
| FR39 | Epic 4 | DEVELOPER cost-visibility global toggle |
| FR42 | Epic 6 | Email metrics collection (ACS) |
| FR43 | Epic 6 | View email volume + delivery trends |
| FR44 | Epic 6 | Recipient masking with audit-logged unmask |
| FR46 | Epic 7 | Portfolio dashboard (per-app health/spend/logins/alerts) |
| FR47 | Epic 7 | App detail dashboard (2/3 + 1/3 layout) |
| FR48 | Epic 7 | Time-range selector consistent across pages |
| FR50 | Epic 9 | On-demand report generation |
| FR51 | Epic 9 | CSV export |
| FR54 | Epic 8 | Alert rule configuration (uptime, cost MTD, bounce rate) |
| FR55 | Epic 8 | Alert rule evaluation engine |
| FR56 | Epic 8 | Alert lifecycle state machine |
| FR57 | Epic 8 | Alert acknowledge action (audited) |
| FR58 | Epic 8 | Alert resolve action (audited) |
| FR59 | Epic 8 | In-app bell + ACS email channels |
| FR60 | Epic 8 | Role-scoped in-app alert notifications |
| FR61 | Epic 1 | Azure Entra SSO authentication |
| FR62 | Epic 1 | Local credentials fallback |
| FR63 | Epic 1 | ADMIN user invitation/edit/remove |
| FR64 | Epic 1 | Role assignment (ADMIN / MANAGER / DEVELOPER) |
| FR65 | Epic 1 | DEVELOPER scoped to assigned apps |
| FR66 | Epic 1 | Server-side RBAC on every route + data path |
| FR67 | Epic 1 | Immutable audit log of all mutations |
| FR68 | Epic 1 | ADMIN audit-log search/filter |
| FR69 | Epic 1 | Specific audit events (unmask, ack/resolve, secret rotation, role changes) |

**Deferred (v1.1 / v2):** FR24, FR29, FR30, FR31, FR40, FR41, FR45, FR49, FR52, FR53.

## Epic List

### Epic 1: Platform Foundation — Identity, RBAC, Shell & Audit
Operators sign in via Azure Entra SSO (with credentials fallback for development), see the role-appropriate FlowDesk shell, and ADMIN can manage users and roles. Every mutation across the platform writes to an immutable audit log. Repository, Postgres, Prisma, and the FlowDesk visual shell are bootstrapped here so every subsequent epic composes onto a known base.
**FRs covered:** FR61, FR62, FR63, FR64, FR65, FR66, FR67, FR68, FR69
**Architecture entities:** `User`, `Role`, `Account`, `Session` (Auth.js inheritance), `AuditLog`
**UX components:** Sidebar nav (UX-DR11), shell (style guide §4–§5), dark-mode toggle, theme parity (UX-DR17)

### Epic 2: Connector Framework & Application Registry — *stories sequenced first per PM direction*
ADMIN can register an app, attach connectors against the unified `collect/healthCheck/validateCredentials` interface, store credentials encrypted at rest via Key Vault envelope encryption, and see the first HTTP probe land within 60 seconds. The webhook receiver (HMAC + outbox + idempotency) ships here as the inbound side of the framework. Journey 3 lands end-to-end.
**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6, FR7, FR8, FR9, FR10, FR11, FR12, FR13, FR14, FR14a, FR15, FR16
**Architecture entities:** `App`, `Connector`, `ConnectorCredential`, `WebhookEventRaw`, `AuditLog`, `HealthCheckResult` (HTTP probe)
**UX components:** `<ConnectorStatusRow>` (UX-DR3), connector onboarding inline panel (UX-DR12), webhook diagnostic view (UX-DR20), `<AppHealthPill>` (UX-DR1, first appearance on portfolio)

### Epic 3: Uptime, Performance & Resource Growth Monitoring
ADMIN, MANAGER, and DEVELOPER (assigned apps) can see uptime trends, DB performance metrics, and resource-growth snapshots per app over a selected time range. Hourly + daily aggregate tables ship here so portfolio queries stay under SLO.
**FRs covered:** FR17, FR18, FR19, FR20, FR21, FR22, FR23
**Architecture entities:** `HealthCheckResult`, `MetricSnapshot`, `MetricHourlyAggregate`, `MetricDailyAggregate`, `ResourceSnapshot`
**UX components:** `<SparklineCell>` (UX-DR2, table use), `<TimeRangeSelector>` (UX-DR4, first appearance), Recharts trend charts on App detail (UX-DR8 sub-cards)
**Connectors added:** Azure ARM, Azure PG Metrics, Postgres-direct.

### Epic 4: Cost Intelligence with ZAR/FX & Forecast
ADMIN/MANAGER can see per-app + portfolio cost in ZAR with USD source disclosure, monthly trends, and a current-period forecast with data-freshness disclosure. SARB FX daily Job lands here; per-`CostRecord` snapshot semantics make historical reports stable.
**FRs covered:** FR32, FR33, FR34, FR35, FR36, FR37, FR38, FR39
**Architecture entities:** `CostRecord`, `FxRate`
**UX components:** `<CostDisplay>` all three variants (UX-DR5), forecast freshness disclosure pattern
**Connectors added:** Azure Cost Management, Digital Ocean.

### Epic 5: Adoption Analytics via Webhook Events
Operators can see DAU/WAU/MAU and login activity per app, fed by `login` events that monitored apps push to their per-app webhook URL. Worker drains `webhook_events_raw` → typed events out-of-band; portfolio tile's "today's logins" updates within seconds of a real login.
**FRs covered:** FR25, FR26, FR27, FR28
**Architecture entities:** `ActivityEvent` (drained from `WebhookEventRaw`)
**UX components:** Adoption trend chart cards on App detail (composes UX-DR2/UX-DR4); login count cell on portfolio table (UX-DR7 column)

### Epic 6: Email Communication Monitoring (Azure Communication Services)
Operators can see outbound email volume, delivery rate, and bounce rate per app for ACS-using apps. Recipient addresses masked by default with audit-logged unmask.
**FRs covered:** FR42, FR43, FR44
**Architecture entities:** `EmailEvent`
**UX components:** Email trend chart card on App detail; masked-recipient pattern with explicit unmask action
**Connector added:** Azure Communication Services.

### Epic 7: Portfolio & App Detail Dashboards
The Morning Glance — operators land at `/portfolio` and read every app's health, today's spend, today's logins, and alert count without clicking. App detail page composes uptime, cost, adoption, resource, and email charts on the FlowDesk Detail Page split. Sub-2s warm-cache load (NFR-P1).
**FRs covered:** FR46, FR47, FR48
**Architecture entities:** *(read-only — composes data from Epics 3–6)*
**UX components:** `<PortfolioTable>` (UX-DR7), `<AppDetailLayout>` (UX-DR8), `<AppHealthPill>` integrations, search/filter/sort with URL state (UX-DR15), empty states (UX-DR13), loading states (UX-DR14), responsive shell (UX-DR16)

### Epic 8: Alerting — Rules, Engine, Lifecycle & Channels
ADMIN/MANAGER configure alert rules; the engine evaluates them against telemetry; firing alerts deliver via in-app bell + ACS email; DEVELOPERs (including on phone) can ack/resolve in one tap. Journey 4 (mobile alert ack < 10s from email) lands here.
**FRs covered:** FR54, FR55, FR56, FR57, FR58, FR59, FR60
**Architecture entities:** `AlertRule`, `AlertEvent`
**UX components:** `<AlertStatePill>` (UX-DR6), `<AlertDetailLayout>` mobile-portrait (UX-DR9), notification bell extension (UX-DR10), ACS email template (UX-DR19), SSO deep-link redirect (UX-DR21), toast feedback (UX-DR22)

### Epic 9: Reporting & CSV Export
ADMIN/MANAGER can generate on-demand reports — uptime, cost, adoption, or combined portfolio — over a selected date range and export as CSV with ZAR + USD parallel columns. Combined one-month portfolio report completes < 60s (NFR-P5).
**FRs covered:** FR50, FR51
**Architecture entities:** *(no new entities — composes existing aggregates + `CostRecord`)*
**UX components:** `/reports` form pattern, `<TimeRangeSelector>` (UX-DR4 reuse), date-range picker, generate-and-download flow

### Epic 10: Production Hardening & Observability
v1 GA gate. Structured JSON logs + correlation IDs across web/worker/jobs; App Insights query-duration emission for the NFR-SC4 TimescaleDB tripwire; retention prune Job + per-app retention overrides; pen-test / threat-model review; accessibility audit; cross-browser + theme-parity test infrastructure; real-device mobile testing for J4.
**FRs covered:** *(none — NFR-driven epic)*
**Architecture entities:** Aggregate roll-up + retention prune jobs (operate across all time-series tables)
**UX components:** Accessibility audit (UX-DR18), Storybook visual regression (UX-DR23), Playwright E2E + axe-core (UX-DR24), real-device mobile validation (UX-DR25)

---

## Epic 1: Platform Foundation — Identity, RBAC, Shell & Audit

Operators sign in with their existing identity, see the role-appropriate FlowDesk shell, ADMIN can manage users and roles, and every mutation writes to an immutable audit log. Repository scaffold, Postgres + Prisma, Auth.js, and the FlowDesk shell are bootstrapped here so every subsequent epic composes onto a known base.

### Story 1.1: Bootstrap monorepo, Postgres, Prisma, and base infrastructure

As a developer,
I want the FlowDev repository scaffolded with the monorepo layout, Postgres + Prisma, and the deploy pipeline,
So that every subsequent story has a working substrate to build on.

**Acceptance Criteria:**

**Given** a new `MPAMOT` repository
**When** I run `pnpm install` followed by `pnpm dev`
**Then** the workspace resolves with `apps/web` (Next.js 15.5+ App Router), `apps/worker`, `apps/jobs`, `packages/connectors`, `packages/db`, `packages/shared` per architecture §1
**And** `apps/web` boots on `localhost:3000` against a local Postgres 15 container started by `docker compose up`
**And** `packages/db` exposes a Prisma 6 client wired to `DATABASE_URL` with an empty schema seeded from architecture §9 (no models yet — those land per story)
**And** `packages/shared` contains TypeScript, Zod, and the `cn()` helper per FlowDesk style guide §1.

**Given** the GitHub Actions pipeline configured
**When** a PR is opened against `main`
**Then** the workflow runs `pnpm typecheck`, `pnpm lint`, `pnpm test`, and `pnpm build` for every workspace package
**And** the workflow blocks merge on any failure
**And** on push to `main`, the workflow builds Docker images for `apps/web`, `apps/worker`, and `apps/jobs`, pushes to ACR, and deploys to Azure Container Apps (FlowDesk pattern).

**Touchpoints:** AR1, AR17, AR18, NFR-B1
**Architecture entities:** *(scaffold only — schema empty)*

### Story 1.2: Authenticate via Azure Entra ID SSO with credentials fallback

As an operator,
I want to sign in with my Azure Entra ID account (and a credentials fallback in development),
So that I can access FlowDev with my existing organisational identity.

**Acceptance Criteria:**

**Given** a user with a valid Azure Entra ID account in the FlowDesk tenant
**When** they navigate to `/`
**Then** Auth.js v5 redirects to Azure Entra; on successful sign-in, the user lands at `/portfolio` with a session cookie
**And** the session token contains the user's `id`, `email`, and `role` (loaded from the `User` table in Postgres via `@auth/prisma-adapter`)
**And** Edge middleware uses `getToken()` (NOT `auth()`) to gate every protected route per FlowDesk pattern.

**Given** local development without Azure Entra access
**When** a developer signs in via the credentials provider on `/sign-in`
**Then** Auth.js verifies their credentials against `User.passwordHash` (bcrypt) and issues the same session shape
**And** the credentials provider is gated behind `NODE_ENV !== 'production'` OR a `CREDENTIALS_FALLBACK_ENABLED=true` env flag
**And** sign-in failures render an inline error per the FlowDesk auth pattern.

**Given** a sign-in succeeds
**When** the session is established
**Then** an `AuditLog` row records `op: 'auth.signin'` with the actor and timestamp.

**Touchpoints:** FR61, FR62, NFR-S2, AR15
**UX components:** Auth pages inherit FlowDesk style guide §14
**Architecture entities:** `User`, `Account`, `Session`, `AuditLog`

### Story 1.3: Enforce server-side RBAC on every route handler and data path

As a security-conscious operator,
I want role-based access control enforced server-side (not just hidden in the UI),
So that a user without an authorised role cannot reach data or mutations even by typing a URL.

**Acceptance Criteria:**

**Given** a route handler protected by `withAuth(role)` (or equivalent helper in `packages/shared/auth/`)
**When** a user with insufficient role calls the route
**Then** the handler returns `403` with no data leakage
**And** the request never reaches the data layer
**And** an `AuditLog` row records `op: 'rbac.denied'` with `actorId`, route, and required role.

**Given** a Server Component renders a page that requires `MANAGER` role
**When** a `DEVELOPER` navigates to it
**Then** the page redirects to `/forbidden` rendered server-side (NOT a client-side check)
**And** the `/forbidden` page does not expose the existence of the protected route's data.

**Given** a data-access helper in `packages/db/`
**When** a query runs
**Then** the helper requires an explicit `actorId` + `role` parameter and applies RBAC filters at the query level (e.g. DEVELOPER queries are scoped via a join against `UserAppAssignment`).

**Touchpoints:** FR66, NFR-S3
**Architecture entities:** `User`, `Role`, `UserAppAssignment`

### Story 1.4: Render the FlowDesk shell with sidebar, header, dark mode, and theme parity

As an operator,
I want FlowDev to look and feel like FlowDesk from the second I land,
So that I have zero cognitive context-switch and the visual conventions I already know carry over.

**Acceptance Criteria:**

**Given** I am authenticated
**When** I land on any FlowDev page
**Then** I see the FlowDesk shell — `w-64` sidebar, `h-16` sticky header, `p-4 md:p-6 space-y-6` content area — per style guide §4
**And** the shell uses brand purple `#700ce9`, Inter font (Google Fonts via `next/font`), the canonical CSS variable token system, `<html lang="en-ZA">`
**And** the FlowDev nav items (Portfolio, Apps, Costs, Adoption, Alerts, Reports, Settings, Help) render in the sidebar with Lucide icons per UX-DR11
**And** Costs / Reports are hidden for DEVELOPER (with cost-visibility-toggle exception in Epic 4); Settings is ADMIN-only.

**Given** the dark-mode toggle in the user menu
**When** I switch themes
**Then** every shell surface — sidebar, header, content background, borders, focus rings — passes both functional and a11y checks (NFR-B2)
**And** the toggle persists across navigations via a server-side cookie or `localStorage` per FlowDesk pattern.

**Given** a viewport below `md:` (768 px)
**When** I view any FlowDev page
**Then** the sidebar collapses to a hamburger trigger that opens a `<Sheet>` slide-out (style guide §4)
**And** the page content reflows to a single column with `p-4` padding.

**Touchpoints:** UX-DR11, UX-DR16, UX-DR17, NFR-B1, NFR-B2, NFR-B3
**UX components:** Sidebar (style guide §5), Header (§4), Theme toggle (§14)

### Story 1.5: ADMIN invites, edits, and removes FlowDev users

As an ADMIN,
I want to add, edit, and remove FlowDev users,
So that I can control who has access to the platform.

**Acceptance Criteria:**

**Given** I am signed in as ADMIN at `/admin/settings/users`
**When** I click `[+ Invite user]` and submit a form with email + role
**Then** a `User` row is created with the supplied role and `status: 'invited'`
**And** Auth.js's email verification step is skipped (FlowDesk pattern: tenant-scoped invites)
**And** the invited user can complete sign-in via Azure Entra (or set a credentials password) on first visit
**And** an `AuditLog` row records `op: 'user.invite'`.

**Given** an existing user
**When** I edit their email or status
**Then** the change persists and is audit-logged (`op: 'user.update'`).

**Given** a user with `status: 'active'`
**When** I click `[Remove]` and confirm via `<AlertDialog>`
**Then** the user is soft-deleted (`status: 'removed'`, `removedAt: now()`) — sessions are revoked
**And** historical audit entries retain the `actorId` reference (immutable audit; NFR-S6)
**And** an `AuditLog` row records `op: 'user.remove'`.

**Touchpoints:** FR63, FR67, NFR-S6
**UX components:** Forms (style guide §7), `<AlertDialog>` for destructive confirmation
**Architecture entities:** `User`, `AuditLog`

### Story 1.6: ADMIN assigns roles and DEVELOPER scope

As an ADMIN,
I want to assign each user a role (ADMIN / MANAGER / DEVELOPER) and scope DEVELOPERs to specific apps,
So that the RBAC matrix from PRD §Web Application is enforced.

**Acceptance Criteria:**

**Given** I am editing a user at `/admin/settings/users/[id]`
**When** I change their role to DEVELOPER and select one or more apps from a multi-select
**Then** `User.role = 'DEVELOPER'` and `UserAppAssignment` rows are created (one per assigned app)
**And** the role assignment is audit-logged (`op: 'user.role.set'`).

**Given** a DEVELOPER signed in
**When** they query `/api/apps`
**Then** the route handler scopes the result set via the `UserAppAssignment` join — they see only their assigned apps (and unassigned global routes like `/portfolio` filter accordingly).

**Given** an ADMIN removes an app assignment for a DEVELOPER
**When** the change is saved
**Then** the DEVELOPER's next page render reflects the reduced scope without requiring sign-out
**And** the change is audit-logged (`op: 'user.scope.change'`).

**Touchpoints:** FR64, FR65, FR66, FR67
**Architecture entities:** `User`, `UserAppAssignment`, `AuditLog`

### Story 1.7: Persist immutable audit log

As a security stakeholder,
I want every mutation to apps, connectors, credentials, alert rules, and user roles recorded in an immutable audit log,
So that compliance and post-incident review are always available.

**Acceptance Criteria:**

**Given** a server-side mutation occurs anywhere in FlowDev
**When** the mutation completes (or fails)
**Then** an `AuditLog` row is appended with `(actorId, op, appId?, connectorId?, credentialId?, kvKeyVersion?, context, occurredAt)`
**And** the table has no UPDATE or DELETE Prisma operations exposed; the only writer is `packages/shared/audit/append.ts`
**And** Postgres-level revoke ensures the FlowDev DB user has only `INSERT` and `SELECT` on `audit_logs`.

**Given** the helper is called
**When** the mutation succeeds
**Then** the audit row commits in the same transaction as the mutation (no orphan audit entries on rollback).

**Given** a mutation fails after partial work
**When** the transaction rolls back
**Then** no audit row is committed (audit reflects truth, not attempts).

**Touchpoints:** FR67, NFR-S6, NFR-D3
**Architecture entities:** `AuditLog`

### Story 1.8: ADMIN searches and filters the audit log

As an ADMIN,
I want to search and filter the audit log by actor, action type, target, and time range,
So that I can investigate incidents and verify operational compliance.

**Acceptance Criteria:**

**Given** I am ADMIN at `/admin/settings/audit`
**When** the page loads
**Then** I see a paginated table of `AuditLog` rows ordered by `occurredAt DESC`
**And** each row shows actor (display name), `op`, target entity, `occurredAt` formatted via date-fns en-ZA, and an expandable `context` JSON viewer.

**Given** I apply filter pills for `actor`, `op`, `appId`, and a time range
**When** the filters change
**Then** the URL search params encode the filters (bookmarkable)
**And** the result set updates server-side using indexed lookups on `(actorId, occurredAt)`, `(op, occurredAt)`, `(appId, occurredAt)` per architecture §9.

**Given** the filter results are empty
**When** the page renders
**Then** the empty state from UX-DR13 displays ("No matching audit entries") with a `[Clear filters]` link.

**Touchpoints:** FR68, FR69, UX-DR13, UX-DR15
**UX components:** Audit table (style guide §7), filter pills, search
**Architecture entities:** `AuditLog`

---

## Epic 2: Connector Framework & Application Registry

ADMIN can register an app, attach connectors against the unified `collect/healthCheck/validateCredentials` interface, store credentials encrypted at rest via Key Vault envelope encryption, and see the first HTTP probe land within 60 seconds. Webhook receiver (HMAC + outbox + idempotency) ships here as the inbound side of the framework. Journey 3 (Onboarding a New App) lands end-to-end. **Stories sequenced first within the implementation order per PM direction.**

### Story 2.1: ADMIN registers an app with metadata

As an ADMIN,
I want to register a new app in the portfolio with full metadata,
So that monitoring can begin on a fully-described entity.

**Acceptance Criteria:**

**Given** I am ADMIN at `/admin/settings/apps`
**When** I click `[+ New app]` and submit the registry form (name, description, owner, environment `dev/staging/prod`, hostingPlatform `azure/digitalocean/aws/other`, primaryUrl, techStack tags, repository link, runbook link)
**Then** an `App` row is created with `lifecycleStatus: 'ACTIVE'` and a server-generated 24-char base32 `webhookToken`
**And** the route redirects to `/apps/[id]` (the App detail page) with the empty-state "No connectors yet" card per UX-DR12 / UX-DR13
**And** an `AuditLog` row records `op: 'app.create'`.

**Given** required fields are missing
**When** I submit
**Then** React-Hook-Form + Zod render inline `text-sm text-destructive` errors per UX-DR15 / style guide §7
**And** no App row is created.

**Touchpoints:** FR1, FR67, UX-DR12, UX-DR13
**UX components:** Forms (style guide §7), empty state card
**Architecture entities:** `App`, `AuditLog`

### Story 2.2: ADMIN edits, decommissions, and deletes apps

As an ADMIN,
I want to edit app metadata, decommission an app while keeping its history, and permanently delete decommissioned apps,
So that the registry reflects the current portfolio state without losing operational history.

**Acceptance Criteria:**

**Given** an existing app at `/apps/[id]`
**When** I edit any metadata field and save
**Then** the `App` row updates and `AuditLog` records `op: 'app.update'` with field-level diff in `context`.

**Given** an active app
**When** I click `[Decommission]` from the app detail action menu and confirm via `<AlertDialog>`
**Then** `App.lifecycleStatus = 'DECOMMISSIONED'` and all connectors are auto-disabled (per FR10; no further runs scheduled)
**And** historical telemetry, cost, adoption, and email rows are retained
**And** `AuditLog` records `op: 'app.decommission'`.

**Given** a decommissioned app
**When** I click `[Delete permanently]` and confirm
**Then** the `App` row and all related rows (`Connector`, `ConnectorCredential` owned, time-series, `WebhookEventRaw`, `AlertRule`, `AlertEvent`) are deleted via Prisma cascade
**And** `AuditLog` records `op: 'app.delete'` *before* the cascade (so the audit trail survives).

**Touchpoints:** FR2, FR3, FR4, FR67
**UX components:** `<AlertDialog>` for destructive confirmation, action menu
**Architecture entities:** `App`, `AuditLog`

### Story 2.3: System surfaces app lifecycle status everywhere

As an operator,
I want lifecycle status visible on every UI surface that references an app,
So that I never confuse a decommissioned app with an active one.

**Acceptance Criteria:**

**Given** an app with `lifecycleStatus: 'DECOMMISSIONED'`
**When** I view the portfolio table, app detail page, search results, breadcrumbs, or audit log
**Then** the app's row/card/header carries a `<Badge variant="outline">Decommissioned</Badge>` adjacent to the app name
**And** decommissioned apps are excluded from the default portfolio filter (toggleable via filter pill).

**Touchpoints:** FR5, UX-DR15
**UX components:** `<Badge>`, filter pills

### Story 2.4: Define connector interface and ConnectorType enum

As a developer,
I want a shared TypeScript interface that every connector implements,
So that adding a new cloud platform requires writing a connector module and nothing outside it (NFR-SC3).

**Acceptance Criteria:**

**Given** `packages/connectors/src/types.ts`
**When** the package builds
**Then** it exports `interface Connector { collect(ctx): Promise<CollectResult>; healthCheck(ctx): Promise<HealthCheckResult>; validateCredentials(ctx): Promise<ValidationResult>; }` with strict TypeScript types
**And** it exports the `ConnectorType` Prisma enum mirror (HTTP_PROBE, AZURE_ARM, AZURE_COST_MGMT, AZURE_PG_METRICS, AZURE_BLOB, AZURE_COMMUNICATION_EMAIL, DIGITALOCEAN, POSTGRES_DIRECT, RESEND, WEBHOOK_RECEIVER) plus stubs for v1.1 AWS types.

**Given** a connector module under `packages/connectors/src/{type}/`
**When** it is registered in the connector registry
**Then** the registry resolves it by `ConnectorType` value
**And** all three apps (`web`, `worker`, `jobs`) consume the same TypeScript entrypoint (architectural invariant per PRD §14.1).

**Touchpoints:** AR1, AR16, NFR-SC3
**Architecture entities:** `Connector`, `ConnectorType` enum

### Story 2.5: Implement envelope encryption with Azure Key Vault and `useCredential()`

As a security stakeholder,
I want connector credentials encrypted at rest via Azure Key Vault using envelope encryption, with decryption only in-process at moment of use,
So that NFR-S1 is operationalised and credentials are never exposed via direct DB reads.

**Acceptance Criteria:**

**Given** Azure Key Vault key `flowdev-creds-mk` (RSA-4096, soft-delete + purge protection on)
**When** ACA Container Apps + Jobs authenticate to KV
**Then** authentication uses Managed Identity — no KV credentials in app config (AR4).

**Given** `packages/shared/crypto/envelope.ts`
**When** a credential is written
**Then** the helper generates a 256-bit DEK + 96-bit IV, encrypts plaintext with AES-256-GCM, wraps the DEK with `flowdev-creds-mk` via `kv.wrapKey`, zeroes the DEK, and persists `(ciphertext, wrappedDek, iv, authTag, kvKeyVersion)` per architecture §7.

**Given** the same helper exposes `useCredential(credentialId, fn)`
**When** a connector needs the plaintext
**Then** the helper unwraps the DEK from KV (cached 60s in-process), decrypts ciphertext, calls `fn(plaintext)`, zeroes plaintext on return
**And** writes an `AuditLog` row with `op: 'credential.decrypt'` for every unwrap.

**Given** an ESLint rule
**When** any code outside `packages/shared/crypto/envelope.ts` attempts `prisma.connectorCredential.findUnique` or equivalent direct read
**Then** the lint check fails CI (AR5).

**Touchpoints:** NFR-S1, AR4, AR5
**Architecture entities:** `ConnectorCredential`, `AuditLog`

### Story 2.6: ADMIN attaches credentials and connectors to an app

As an ADMIN,
I want to attach a connector to an app with its credentials, encrypted at rest on save and never displayed in plaintext after,
So that I can wire up monitoring without ever leaking secrets.

**Acceptance Criteria:**

**Given** I am on `/apps/[id]` with the inline "Add connector" panel open per UX-DR12
**When** I select a connector type and fill its config + credential fields
**Then** credential `<Input>` fields use `type="password"` and paste-mask immediately on paste (UX-DR12)
**And** there is no `[Show]` action — once submitted, plaintext is sealed (NFR-S1)
**And** I see a `[Test connection]` outline button before `[Save]` (UX-DR12; story 2.8 handles validation).

**Given** I click `[Save]` after a successful test
**When** the API persists
**Then** `useCredential()` envelope-encrypts the credential, writes `ConnectorCredential` (with `appId` for per-app credentials, or null for class-scoped per AR10), creates `Connector` referencing the credential
**And** `AuditLog` records `op: 'connector.create'` and `op: 'credential.create'`
**And** the inline panel collapses; a new `<ConnectorStatusRow>` appears in the App detail sidebar with state `unknown` / "pending first run".

**Touchpoints:** FR6, FR7, FR67, NFR-S1, AR10, UX-DR3, UX-DR12
**UX components:** `<ConnectorStatusRow>`, inline-panel pattern, paste-mask form fields
**Architecture entities:** `Connector`, `ConnectorCredential`, `AuditLog`

### Story 2.7: ADMIN validates connector configuration before activation

As an ADMIN,
I want a `[Test connection]` action that validates credentials and reachability before save,
So that bad configurations are caught at onboarding time rather than at next probe.

**Acceptance Criteria:**

**Given** the connector form has all required fields
**When** I click `[Test connection]`
**Then** the server invokes the connector's `validateCredentials()` method (without persisting anything) and returns a result `{ ok: boolean, detail?: string }`
**And** on success, the button shows a green checkmark + "Ready to save" inline
**And** on failure, an inline diagnostic line shows actionable guidance (e.g. "Credential rejected — check the SP has 'Reader' role on the resource group", "URL unreachable from FlowDev's VNet — confirm health endpoint allows internal calls") per UX-DR12.

**Given** the test fails
**When** I correct the form and click `[Test connection]` again
**Then** the form state is preserved (no fields cleared) and the new validation result replaces the prior diagnostic.

**Touchpoints:** FR8, UX-DR12
**Architecture entities:** *(no entity writes; validation is read-only)*

### Story 2.8: ADMIN rotates connector credentials without history loss

As an ADMIN,
I want to rotate or replace a connector's credentials,
So that compromised secrets can be replaced without re-onboarding the connector or losing historical telemetry.

**Acceptance Criteria:**

**Given** an existing connector with credentials
**When** I open the action menu on its `<ConnectorStatusRow>` and click `[Rotate]`
**Then** a `<Dialog>` opens with credential fields (paste-mask, no `[Show]`)
**And** on submit, the existing `ConnectorCredential` row is updated in place via envelope encryption — `(ciphertext, wrappedDek, iv, authTag, kvKeyVersion, lastRotatedAt)` are overwritten
**And** the `Connector.credentialId` reference is unchanged, so `HealthCheckResult` / `MetricSnapshot` / `CostRecord` history continues uninterrupted
**And** `AuditLog` records `op: 'credential.rotate'`.

**Given** a rotation completes mid-cycle (a probe is running)
**When** the next probe runs
**Then** it uses the new credential transparently (the in-process DEK cache invalidates on rotation).

**Touchpoints:** FR9, FR67, NFR-S1
**Architecture entities:** `ConnectorCredential`, `AuditLog`

### Story 2.9: ADMIN disables, re-enables, and removes connectors

As an ADMIN,
I want to disable a connector temporarily and re-enable it later, or remove it permanently,
So that I can pause monitoring during maintenance without losing history, or clean up retired connectors.

**Acceptance Criteria:**

**Given** a `healthy` or `degraded` connector
**When** I click `[Disable]` from its action menu
**Then** `Connector.failureState = 'DISABLED'` (via FR13's `* → disabled` transition)
**And** the scheduler skips it on subsequent ticks
**And** the `<ConnectorStatusRow>` shows the grey `disabled` pill at `opacity-60` per UX-DR3
**And** `AuditLog` records `op: 'connector.disable'`.

**Given** a `disabled` connector
**When** I click `[Enable]`
**Then** the connector transitions to `unknown` until its next successful run, then to `healthy` (or `degraded`/`failing` per outcome)
**And** `AuditLog` records `op: 'connector.enable'`.

**Given** any connector
**When** I click `[Remove]` and confirm via `<AlertDialog>`
**Then** the `Connector` row is deleted (cascade does not delete `ConnectorCredential` if it is class-scoped + still referenced by other connectors; orphaned credentials are deleted)
**And** historical telemetry rows referencing the connector are retained (the `connectorId` column is non-FK or set null, per architecture)
**And** `AuditLog` records `op: 'connector.remove'`.

**Touchpoints:** FR10, FR11, FR13, FR67, UX-DR3
**UX components:** `<ConnectorStatusRow>` action menu, `<AlertDialog>`
**Architecture entities:** `Connector`, `ConnectorCredential`, `AuditLog`

### Story 2.10: Implement worker runtime with `node-cron` and ACA Jobs

As a developer,
I want an always-on worker (sub-hourly schedules) and ACA Jobs (cron-triggered hourly+ batches) running connector code from the same TypeScript entrypoint,
So that connectors execute reliably out-of-band from the request path (NFR-I1, NFR-R3).

**Acceptance Criteria:**

**Given** `apps/worker` deployed as an always-on Container App with min replicas = 1
**When** the worker starts
**Then** it reads schedule state from `apps`/`connectors` tables and registers `node-cron` tasks per architecture §2 (60s HTTP probes, 5s outbox drain, Postgres `LISTEN` reload trigger)
**And** the worker exposes `/healthz` returning 200 only if a scheduler tick has fired in the last 90s (Container App health probe pinned to it).

**Given** each `(app_id, connector_id)` scheduled tick
**When** it fires
**Then** the worker acquires `pg_try_advisory_lock(hashtext(app_id || ':' || connector_id))` before running; a held lock skips the tick (no overlap)
**And** the worker invokes the connector's `collect()` method, persists results, and releases the lock.

**Given** ACA Jobs declared in IaC (Bicep or Terraform)
**When** I deploy
**Then** cron expressions per architecture §2 are provisioned: `5 * * * *` hourly aggregate, `30 2 * * *` daily aggregate, `0 2 * * *` retention prune, `*/15 * * * *` cost pull, `0 1 * * *` resource snapshot, `0 8 * * *` SARB FX
**And** each Job invokes the same TypeScript entrypoint as the worker (one-job-per-`(app_id, connector_id)` semantics).

**Given** a structured JSON log line is emitted by `apps/web`, `apps/worker`, or `apps/jobs`
**When** Azure Container Apps forwards stdout to App Insights
**Then** every log line carries `correlation_id`, `app_id?`, `connector_id?`, `connector_type?`, `duration_ms`, `outcome` per architecture §2.

**Touchpoints:** FR12, NFR-I1, NFR-R3, NFR-SC5, AR1, AR6, AR7
**Architecture entities:** `Connector`, `App`

### Story 2.11: Implement connector failure-state machine and retry policy

As an operator,
I want each connector's status to reflect its real health (healthy / degraded / failing / disabled / unknown) with deterministic transitions,
So that I can tell at a glance which connectors need attention.

**Acceptance Criteria:**

**Given** a successful connector run
**When** it completes
**Then** `Connector.failureState` transitions to `HEALTHY`, `consecutiveFailures = 0`, `lastSuccessAt = now()`.

**Given** a failed connector run
**When** it completes
**Then** `consecutiveFailures` increments and `lastFailureAt = now()`, `lastError` is updated
**And** if `consecutiveFailures` is in 1..4 → `failureState = 'DEGRADED'`
**And** if `consecutiveFailures >= 5` OR `lastSuccessAt < now() - 30 minutes` → `failureState = 'FAILING'` (whichever fires first per FR13)
**And** the transition is logged structurally per NFR-O3.

**Given** a failed run
**When** the worker retries
**Then** retry policy is initial 30s, factor 2, max 30min, max 5 attempts per scheduled run (NFR-R4)
**And** the queue / scheduler is **not** stalled by a failing connector (NFR-R3) — the next tick still fires for other `(app, connector)` pairs.

**Given** a connector is admin-disabled
**When** any state machine event occurs
**Then** `failureState` stays `DISABLED` until re-enabled.

**Touchpoints:** FR13, FR14, NFR-R3, NFR-R4, NFR-O3
**Architecture entities:** `Connector`

### Story 2.12: Implement HTTP Uptime Probe connector

As an operator,
I want the HTTP probe connector to record uptime data for every registered app,
So that the uptime answer (Q1) becomes available end-to-end (the framework's first exercise).

**Acceptance Criteria:**

**Given** an app with an HTTP probe connector and a configured probe URL
**When** the worker fires the 60s tick
**Then** the connector issues a `GET` to the probe URL with a 10s timeout, captures the status code, latency, and success/fail outcome
**And** persists a `HealthCheckResult` row with `(appId, connectorId, recordedAt, statusCode, latencyMs, success, state)` per architecture §9
**And** the probe executes within ±10s of scheduled time at p95 (NFR-P4).

**Given** the probe succeeds with 2xx
**When** the row is persisted
**Then** `state = 'UP'` and the connector's failure-state machine transitions per Story 2.11.

**Given** the probe times out, returns 5xx, or hits a network error
**When** the row is persisted
**Then** `state = 'DOWN'` (or `DEGRADED` per the FR13 transition rules) and `errorMessage` captures the cause.

**Given** the first probe succeeds within 60s of attaching the connector (Story 2.6 climax)
**When** the portfolio table refreshes
**Then** the app's row shows a green `<AppHealthPill state="UP">` (CSM-1 trigger).

**Touchpoints:** FR12, FR17 (initial collection — full FR17 viewing in Epic 3), NFR-P4
**Architecture entities:** `Connector`, `HealthCheckResult`

### Story 2.13: Implement webhook receiver with HMAC, idempotency, and outbox

As a security-conscious operator,
I want monitored apps to push events to a per-app authenticated webhook URL with HMAC validation, idempotency, and out-of-band persistence,
So that Journey 6 works inside the receiver's 50ms p95 SLO without coupling the request path to typed-event writes.

**Acceptance Criteria:**

**Given** a `POST /webhooks/<app-token>` request
**When** the route handler runs
**Then** it reads `app-token` and resolves `app_id` from `apps.webhookToken` (indexed; cached in-process)
**And** it validates `Content-Length ≤ 16384` (rejects 413 with `{"error":"body_too_large"}` per webhook-contract §7)
**And** it validates `X-FlowDev-Webhook-Version: 1` (rejects 400 with `{"error":"version_mismatch"}` if missing or other)
**And** it reads raw body bytes (no JSON parse yet)
**And** it computes `HMAC-SHA256(secret, "<version>.<timestamp>.<raw_body>")` using the per-app secret decrypted via `useCredential()` (cached 60s) and compares in constant time via `crypto.timingSafeEqual` (rejects 401 with `{"error":"hmac_invalid"}` on mismatch)
**And** it validates `|now - payload.timestamp| ≤ 5 minutes` (rejects 400 with `{"error":"replay_window_exceeded"}` outside).

**Given** a valid signed request
**When** the receiver writes to the outbox
**Then** the route executes `INSERT INTO webhook_events_raw (event_id, app_id, ...) ON CONFLICT (event_id, app_id) DO NOTHING`
**And** returns 202 with `{"accepted":true}` (or `{"accepted":true,"duplicate":true}` on idempotent replay) within 50ms p95 at 50 RPS sustained per NFR-P3
**And** does NOT touch typed event tables (`activity_events`, `integration_call_events`, `custom_metric_events`) — those are populated by the worker draining `webhook_events_raw`.

**Given** the route is invoked
**When** authentication is checked
**Then** the route is **explicitly excluded** from Auth.js middleware (NFR-S2) — verified by an integration test that asserts no `getToken()` call on the path.

**Given** the canonical fixture from `webhook-contract-v1.md` §9
**When** committed at `packages/shared/__fixtures__/webhook/login.json`
**Then** an automated test reproduces `signature = 26bd8d88de5bcf5ffda14f765e45d7cf420615566bb184eb82f677439cc280a8` byte-equal (regression gate; AR12).

**Touchpoints:** FR15, FR14a, NFR-P3, NFR-S2, NFR-S4, NFR-I3, NFR-O4, AR8, AR12
**Architecture entities:** `App`, `WebhookEventRaw`, `ConnectorCredential` (webhook secret)

### Story 2.14: HMAC failures excluded from connector failure threshold

As an operator,
I want HMAC validation failures on the webhook receiver counted separately from connector failures,
So that a sender's bad signature does not corrupt the connector status of an otherwise-healthy webhook receiver.

**Acceptance Criteria:**

**Given** the webhook receiver returns 401 (HMAC invalid)
**When** the result is logged
**Then** the failure increments a per-app `failed_webhook_attempts` counter (separate from connector status)
**And** does NOT increment `Connector.consecutiveFailures` (per FR14a)
**And** is logged structurally under NFR-O4 (without payload contents).

**Given** the failure log is queried
**When** the App detail page renders
**Then** a per-app "failed webhook attempts" counter is visible (next to webhook delivery diagnostic; Story 2.16).

**Touchpoints:** FR14a, NFR-O4
**Architecture entities:** `WebhookEventRaw` (with `hmacResult: 'invalid'`)

### Story 2.15: ADMIN rotates per-app webhook secret

As an ADMIN,
I want to rotate a per-app webhook secret so I can invalidate prior signatures and distribute a new value,
So that compromise or accidental disclosure can be remediated without re-onboarding the app.

**Acceptance Criteria:**

**Given** an app with a webhook secret
**When** I click `[Rotate webhook secret]` on the App detail page
**Then** a confirmation `<AlertDialog>` warns that prior signatures will be invalidated (with optional 24h overlap window per webhook-contract §4)
**And** on confirmation, the server generates a new `whsec_<base32>` secret, envelope-encrypts it, updates `apps.webhookSecret*` columns, and displays the plaintext value **once** in a `<Dialog>` with a `[Copy]` button per UX-DR12
**And** if overlap is enabled, both old and new secrets verify for 24h; after the window, only the new secret verifies (webhook-contract §4)
**And** `AuditLog` records `op: 'webhook.secret.rotate'`.

**Given** the dialog is dismissed
**When** I attempt to view the secret again
**Then** there is no UI surface that shows it — only re-rotation.

**Touchpoints:** FR16, FR67, FR69, NFR-S1
**UX components:** `<Dialog>` for one-time secret display, `[Copy]` action
**Architecture entities:** `App`, `AuditLog`

### Story 2.16: Webhook delivery diagnostic view (ADMIN-only)

As an ADMIN,
I want a diagnostic view showing the last 50 webhook deliveries per app,
So that senders debugging their integration can see whether the signature was right, the timestamp was within the window, and whether persistence succeeded.

**Acceptance Criteria:**

**Given** I am ADMIN at `/apps/[id]/webhook-deliveries`
**When** the page loads
**Then** it shows a table of the last 50 `WebhookEventRaw` rows ordered by `receivedAt DESC` with columns: `receivedAt`, `statusCode`, `hmacResult`, `idempotencyOutcome`, `bodySize`, `processError?` per UX-DR20 / webhook-contract §12
**And** the route is gated to ADMIN role server-side (FR66).

**Given** a non-ADMIN user
**When** they navigate to the URL
**Then** the route returns 403 (story 1.3 enforcement).

**Touchpoints:** FR15, FR16, UX-DR20, webhook-contract §12
**Architecture entities:** `WebhookEventRaw`

### Story 2.17: Connector onboarding inline panel (Journey 3 UX)

As an ADMIN,
I want adding a connector to feel like filling a section of the App detail page rather than navigating into a modal wizard,
So that Journey 3 is a smooth progression with credible progress indication.

**Acceptance Criteria:**

**Given** I am on `/apps/[id]` with the empty-state "No connectors yet" card showing
**When** I click `[+ Add connector]`
**Then** an inline panel slides into the main column (NOT a modal) with a connector-type chooser per UX-DR12
**And** selecting a type reveals the type-specific config form within the same panel
**And** the connector's `[Test connection]` (Story 2.7) and `[Save]` (Story 2.6) actions live within the panel.

**Given** a successful save
**When** the new connector's first run completes within ≤60s
**Then** the new `<ConnectorStatusRow>` updates from `unknown` → `healthy` (CSM-1)
**And** the App detail page shows a verification card "✓ FlowDev is now monitoring this app" once ≥1 connector reaches `healthy` (UX-DR12 step 14).

**Given** the webhook receiver connector type
**When** save completes
**Then** the panel displays the generated webhook URL + secret with `[Copy]` actions per UX-DR12 step 13 (the secret is displayed exactly once; rotation is the only path to a new value per Story 2.15).

**Touchpoints:** FR6, FR15, UX-DR12, J3 mechanics
**UX components:** Inline panel, `<ConnectorStatusRow>`, paste-mask form fields, `[Copy]` actions, verification card
**Architecture entities:** `Connector`, `ConnectorCredential`, `App`

### Story 2.18: AppHealthPill, ConnectorStatusPill, and AlertStatePill components

As an operator,
I want a consistent visual grammar across app health, alert state, and connector status,
So that I learn one mapping (green/amber/red/slate/grey + text) and apply it everywhere.

**Acceptance Criteria:**

**Given** `<AppHealthPill state>` from `src/components/flowdev/app-health-pill.tsx`
**When** rendered with `UP / DEGRADED / DOWN / UNKNOWN`
**Then** colour + text label are **both** present in every state (NFR-A4)
**And** `aria-label="App health: ${state}"` is set
**And** contrast ≥ 4.5:1 in both light + dark themes (verified via Storybook a11y addon)
**And** props match the type from UX-DR1 spec (`size: 'sm' | 'default'`, `withDot?`, `reason?` for hover-card on DEGRADED/DOWN).

**Given** `<ConnectorStatusPill>` and `<AlertStatePill>`
**When** rendered
**Then** they share the `<AppHealthPill>` visual grammar with state-appropriate vocabulary (`healthy/degraded/failing/disabled/unknown` and `firing/acknowledged/resolved` respectively)
**And** disabled state is grey (intentional, not failure) per UX-DR1.

**Given** Storybook stories for all three components
**When** visual regression runs
**Then** both light + dark frames pass (UX-DR17, UX-DR23).

**Touchpoints:** UX-DR1, UX-DR3, UX-DR6, UX-DR17, NFR-A4
**Architecture entities:** *(presentational only)*

### Story 2.19: ConnectorStatusRow component

As an operator,
I want each connector represented as a single-line row with name, last-run timestamp, status pill, and action menu,
So that the App detail sidebar surfaces every connector's state without click-through.

**Acceptance Criteria:**

**Given** `<ConnectorStatusRow>` from UX-DR3
**When** rendered with a connector in any state
**Then** it shows: type icon (Lucide) + connector name (`text-sm font-medium`) + relative timestamp (`text-xs text-muted-foreground` via `formatDistanceToNow`) + `<ConnectorStatusPill>` + action menu (`<DropdownMenu>` triggered by `MoreHorizontal`)
**And** on `degraded`/`failing`, an actionable diagnostic line appears below in `text-xs text-amber-700` / `text-red-700` (e.g. "Credential expired 2 days ago — rotate via Settings")
**And** action menu items are: Test connection, Rotate credentials, Disable/Enable, Remove (Stories 2.7–2.9, 2.15).

**Given** the row is rendered inside a `<ul>` in the App detail sidebar
**When** keyboard focus reaches it
**Then** the action menu is operable via Radix `<DropdownMenu>` keyboard semantics (NFR-A2).

**Touchpoints:** FR13, UX-DR3, UX-DR6, NFR-A2, NFR-A4
**UX components:** `<ConnectorStatusRow>`, `<ConnectorStatusPill>`
**Architecture entities:** `Connector`

---

## Epic 3: Uptime, Performance & Resource Growth Monitoring

ADMIN, MANAGER, and DEVELOPER (assigned apps) can see uptime trends, DB performance metrics, and resource-growth snapshots per app over a selected time range. Hourly + daily aggregate tables ship here so portfolio queries stay under SLO. Connectors added: Azure ARM, Azure PG Metrics, Postgres-direct.

### Story 3.1: Provision time-series storage with BRIN indexes

As a developer,
I want raw time-series tables (`HealthCheckResult`, `MetricSnapshot`, `ResourceSnapshot`) with BRIN indexes on `recorded_at`,
So that 90-day retention scans stay performant on plain PostgreSQL (deferring TimescaleDB to v2 per PRD §14.2).

**Acceptance Criteria:**

**Given** Prisma schema entries from architecture §9
**When** I run `prisma migrate dev`
**Then** tables `health_check_results`, `metric_snapshots`, `resource_snapshots` are created with BTREE composite indexes per architecture §9
**And** raw migration SQL adds `CREATE INDEX ... USING BRIN (recorded_at)` to each table (Prisma DSL doesn't cover this).

**Given** a query against any raw table
**When** it scans by time window
**Then** BRIN index pruning keeps the scan within the time window only (verified via `EXPLAIN`).

**Touchpoints:** AR2, AR14, NFR-SC1, NFR-SC4
**Architecture entities:** `HealthCheckResult`, `MetricSnapshot`, `ResourceSnapshot`

### Story 3.2: Provision aggregate tables with idempotent upserts

As a developer,
I want `MetricHourlyAggregate` and `MetricDailyAggregate` tables with deterministic upsert semantics,
So that re-running roll-up Jobs converges to the same state without duplicating rows.

**Acceptance Criteria:**

**Given** Prisma schema entries from architecture §9
**When** migrated
**Then** tables exist with composite `@@id([appId, metricId, bucketStart])` and `(count, min, max, avg, p50, p95, sum)` columns.

**Given** an aggregate roll-up Job re-runs over the same window
**When** the SQL `INSERT ... ON CONFLICT (app_id, metric_id, bucket_start) DO UPDATE` is executed
**Then** rows converge to the latest computed values without duplication (AR14).

**Touchpoints:** AR14, NFR-SC4
**Architecture entities:** `MetricHourlyAggregate`, `MetricDailyAggregate`

### Story 3.3: Hourly aggregate roll-up Job

As an operator,
I want an hourly Job that rolls raw probe + metric data into `MetricHourlyAggregate`,
So that portfolio dashboards query aggregates (≤500ms p95 per NFR-SC4) instead of scanning raw 78M-row tables.

**Acceptance Criteria:**

**Given** an ACA Job scheduled `5 * * * *` (architecture §2)
**When** it runs
**Then** for each `(appId, metricId)`, it computes `count, min, max, avg, p50, p95, sum` over the prior hour using `percentile_cont` per architecture §3
**And** upserts via the idempotent pattern from Story 3.2
**And** logs `(app_id, metric_id, rows_processed, duration_ms)`.

**Given** the Job runs late (e.g. 5min after the hour due to cold start)
**When** it processes
**Then** it tolerates ~5min of late-arriving raw data per architecture §2.

**Touchpoints:** AR6, AR14, NFR-SC4, NFR-SC5
**Architecture entities:** `MetricSnapshot`, `MetricHourlyAggregate`, `HealthCheckResult`

### Story 3.4: Daily aggregate roll-up Job

As an operator,
I want a daily Job that rolls hourly aggregates into `MetricDailyAggregate`,
So that long-time-range views don't scan a year of hourly rows.

**Acceptance Criteria:**

**Given** an ACA Job scheduled `30 2 * * *`
**When** it runs
**Then** it computes daily aggregates from the prior day's hourly aggregates (cheaper than rescanning raw)
**And** upserts via the same idempotent pattern as Story 3.3.

**Touchpoints:** AR6, AR14
**Architecture entities:** `MetricHourlyAggregate`, `MetricDailyAggregate`

### Story 3.5: Compute and view per-app uptime percentages

As an ADMIN/MANAGER/DEVELOPER (assigned apps),
I want per-app uptime % over rolling windows (24h, 7d, 30d, 90d, custom),
So that I can answer "is this app reliable?" at any time horizon.

**Acceptance Criteria:**

**Given** `HealthCheckResult` rows for an app
**When** `/api/apps/[id]/uptime?range=30d` is called
**Then** the API returns `{ percentage, totalProbes, failedProbes }` computed against `MetricHourlyAggregate` (or `MetricDailyAggregate` for ranges > 7d) for performance.

**Given** I am on the App detail page with an uptime chart card
**When** I select a time range via `<TimeRangeSelector>`
**Then** the chart re-fetches via SWR `mutate` and displays the trend with threshold colouring (≥99% green / 95–99% amber / <95% red per UX §Visual Foundation)
**And** below the chart, the rolling-window percentage values render as stat cards.

**Given** a DEVELOPER not assigned to the app
**When** they call the API
**Then** the route returns 403 (Story 1.3 enforcement).

**Touchpoints:** FR18, FR19, NFR-SC4, UX-DR4
**UX components:** Chart card on `<AppDetailLayout>`, `<TimeRangeSelector>`
**Architecture entities:** `HealthCheckResult`, `MetricHourlyAggregate`, `MetricDailyAggregate`

### Story 3.6: SparklineCell component

As an operator,
I want a 24-px sparkline cell I can place inline in tables,
So that the portfolio table answers "trending?" without click-through.

**Acceptance Criteria:**

**Given** `<SparklineCell>` from UX-DR2
**When** rendered with `data: Array<{ timestamp, value }>` (≥2 points)
**Then** it draws a Recharts `<LineChart>` at 24px × ~80px (table density) with no axes / gridlines / legend / labels
**And** stroke uses `--brand` for `default` accent or threshold colours for `uptime` accent per UX §Visual Foundation
**And** loading state shows `<Skeleton>` at the same dimensions
**And** no-data state renders a muted "—" centred (NOT a flat line).

**Given** I hover or focus the cell
**When** the `<HoverCard>` opens
**Then** it shows `{ metric, range, currentValue, min, max, lastUpdated }`
**And** keyboard focus opens the hover card (NFR-A2).

**Given** the cell is announced to a screen reader
**When** focus reaches it
**Then** `aria-label` describes the trend semantically (e.g. "Response time stable around 380ms over 24h") per NFR-A4 / UX-DR2.

**Touchpoints:** UX-DR2, NFR-A2, NFR-A4, NFR-A5
**Architecture entities:** *(presentational)*

### Story 3.7: TimeRangeSelector component

As an operator,
I want one shared time-range component used identically across portfolio, app detail, costs, adoption, and reports,
So that I build muscle memory and never reinvent it per page.

**Acceptance Criteria:**

**Given** `<TimeRangeSelector>` from UX-DR4
**When** rendered
**Then** it shows `<Tabs>` with `24h / 7d / 30d / 90d / Custom`
**And** clicking a preset updates the URL search params (`?range=30d`) and fires `onChange` for SWR `mutate`
**And** `Custom` opens a `<Popover>` with two `<Calendar>` inputs (from-to); applying encodes `?from=...&to=...`.

**Given** the URL has `?range=30d` on page load
**When** the selector mounts
**Then** it reads from URL state and renders the correct preset selected (bookmarkable per UX §Defining Interaction).

**Given** keyboard navigation
**When** I tab to the selector
**Then** Radix `<Tabs>` arrow-key navigation works; Enter activates `Custom`; the popover is keyboard-trappable and returns focus on close.

**Touchpoints:** FR48, UX-DR4, NFR-A2, NFR-P6
**Architecture entities:** *(client-only state)*

### Story 3.8: Implement Azure ARM connector

As an operator,
I want the Azure Resource Manager connector to collect resource metadata + Container App / VM platform metrics for every Azure-hosted app,
So that the framework can answer "is this app's host platform healthy?"

**Acceptance Criteria:**

**Given** an Azure-hosted app with the ARM connector attached and a class-scoped SP credential (per AR10)
**When** the worker fires the scheduled run
**Then** the connector calls Azure ARM via the managed Azure SDK using `useCredential()` to get the SP secret
**And** persists `MetricSnapshot` rows for resource-relevant metrics (e.g. `azure.containerapp.cpu_percent`, `azure.containerapp.memory_percent` if natively exposed)
**And** rate-limit + retry handling per Azure documented limits (NFR-I2).

**Given** the connector's `validateCredentials()` is invoked
**When** the SP can authenticate and has read scope on the resource group
**Then** it returns `{ ok: true }`
**And** on permission failure, it returns `{ ok: false, detail: "SP missing 'Reader' role on resource group <name>" }` (UX-DR12 actionable diagnostic).

**Touchpoints:** FR12, NFR-I1, NFR-I2, AR10, AR16
**Architecture entities:** `Connector`, `MetricSnapshot`

### Story 3.9: Implement Azure PG Metrics connector

As an operator,
I want DB performance metrics (CPU %, active connections, storage used, slow query count) collected for every app whose connectors include Azure PostgreSQL Flexible Server metrics,
So that I can correlate cost spikes with DB load (Journey 2 use case).

**Acceptance Criteria:**

**Given** an app with the Azure PG Metrics connector + a flexible-server resource ID
**When** the worker fires the scheduled run
**Then** it calls Azure Monitor Metrics API via `useCredential()` to get `cpu_percent`, `active_connections`, `storage_used`, `slow_query_count` (or platform equivalent)
**And** persists `MetricSnapshot` rows.

**Given** the App detail page renders DB performance cards
**When** I view it
**Then** the four metrics show as Recharts trend charts on the time range from `<TimeRangeSelector>`
**And** the cards include the data-table fallback for screen readers (NFR-A5).

**Touchpoints:** FR20, NFR-A5
**Architecture entities:** `Connector`, `MetricSnapshot`

### Story 3.10: Implement Postgres-direct connector

As an operator,
I want a Postgres-direct connector that queries each app's database for slow query count, table row counts (configurable), and DB storage size,
So that resource-growth data and slow-query diagnostics are available for every app using Azure PG.

**Acceptance Criteria:**

**Given** an app with the Postgres-direct connector + a per-app DB user (read-only, scoped to monitoring tables per AR10)
**When** the worker fires the scheduled run
**Then** the connector connects via `useCredential()` to get the connection string, runs `pg_stat_statements`-derived slow-query counts, `SELECT count(*)` against configured tables, and `pg_database_size()`
**And** persists `MetricSnapshot` rows for slow queries and `ResourceSnapshot` rows for table row counts + DB total size.

**Given** the connector encounters a missing `pg_stat_statements` extension
**When** it runs `validateCredentials()`
**Then** it returns `{ ok: false, detail: "pg_stat_statements extension not enabled on this database — see runbook" }` (UX-DR12).

**Touchpoints:** FR20, FR22, AR10, AR16
**Architecture entities:** `Connector`, `MetricSnapshot`, `ResourceSnapshot`

### Story 3.11: View per-app resource-growth trends

As an ADMIN/MANAGER/DEVELOPER (assigned apps),
I want to see DB storage size and configured-table row counts trending over a selected time range,
So that I can answer "is its data growing?" (Q4) and detect runaway growth.

**Acceptance Criteria:**

**Given** a `ResourceSnapshot` time series for an app
**When** I view the App detail page's Resource Growth card with a time range selected
**Then** I see a stacked-line Recharts chart of DB total size + per-table row counts over the range
**And** the card shows the latest values as stat cards.

**Given** a DEVELOPER not assigned to the app
**When** they navigate to the page
**Then** the route returns 403.

**Touchpoints:** FR23, NFR-SC4
**UX components:** Chart card on `<AppDetailLayout>`
**Architecture entities:** `ResourceSnapshot`

### Story 3.12: View HTTP response-time series on App detail

As an operator,
I want HTTP response-time trends visible on the App detail page,
So that I can correlate latency degradation with other signals (Journey 2 secondary use case).

**Acceptance Criteria:**

**Given** `HealthCheckResult` rows with `latencyMs`
**When** I view the App detail page's Performance card
**Then** I see response-time trend (p50, p95) over the time range, computed from `MetricHourlyAggregate` for ranges > 24h
**And** the chart pairs with a screen-reader `<table>` fallback (NFR-A5).

**Touchpoints:** FR21, NFR-A5
**Architecture entities:** `HealthCheckResult`, `MetricHourlyAggregate`

---

## Epic 4: Cost Intelligence with ZAR/FX & Forecast

ADMIN/MANAGER can see per-app + portfolio cost in ZAR with USD source disclosure, monthly trends, and a current-period forecast with data-freshness disclosure. SARB FX daily Job and per-`CostRecord` snapshot semantics make historical reports stable. Connectors added: Azure Cost Management, Digital Ocean.

### Story 4.1: Provision CostRecord and FxRate models with snapshot semantics

As a developer,
I want `CostRecord` rows that capture the FX rate, source, and source amount at collection time,
So that historical reports are stable regardless of subsequent FX-rate changes (NFR-D4).

**Acceptance Criteria:**

**Given** Prisma schema entries from architecture §9 for `CostRecord` and `FxRate`
**When** migrated
**Then** `cost_records` includes `(sourceAmount, sourceCurrency, zarAmount, fxRate, fxSource, fxRateDate, isStale, collectedAt)` per architecture §5
**And** `fx_rates` has PK `(currencyPair, rateDate)`.

**Given** a `CostRecord` is written
**When** the writer composes the row
**Then** it captures the FX rate from `fx_rates` corresponding to `collectedAt::date` (or the most recent successful date if today's is missing)
**And** `isStale = true` if the most recent successful rate is > 24h old.

**Touchpoints:** NFR-D4, AR9
**Architecture entities:** `CostRecord`, `FxRate`

### Story 4.2: SARB FX daily Job

As an operator,
I want a daily Job at 08:00 SAST that pulls the SARB ZAR/USD rate,
So that cost data converted to ZAR uses the official daily rate.

**Acceptance Criteria:**

**Given** an ACA Job scheduled `0 8 * * *`
**When** it runs
**Then** `packages/shared/fx/sarb.ts` calls the SARB Statistical API public endpoint and parses the daily ZAR/USD rate via Zod
**And** writes an `FxRate` row with `(currencyPair: 'ZAR/USD', rateDate, rateDecimal, source: 'SARB', fetchedAt, isStale: false)`.

**Given** the SARB API is unreachable
**When** the Job retries (per NFR-R4) and exhausts attempts
**Then** no new `FxRate` row is written
**And** the next `CostRecord` writes will reuse the most recent successful rate with `isStale: true` if > 24h.

**Given** SARB API reliability < 99% over the 60-day post-launch evaluation window
**When** the operations team reviews
**Then** the implementation supports swapping to a commercial feed via a single-file change in `packages/shared/fx/` (PRD §14.4).

**Touchpoints:** NFR-D4, AR9
**Architecture entities:** `FxRate`

### Story 4.3: Implement Azure Cost Management connector

As an operator,
I want hourly cost data per app from Azure Cost Management,
So that the cost question (Q2) is answerable in ZAR with provenance.

**Acceptance Criteria:**

**Given** an app with the Azure Cost Management connector + class-scoped SP + resource-group filter
**When** the worker runs the Job (cron `*/15 * * * *` per architecture §2)
**Then** the connector calls Azure Cost Management API via `useCredential()` filtered by the app's resource group(s)
**And** persists `CostRecord` rows attributed by service line (compute, storage, database, email, etc. per FR33)
**And** each row captures USD source amount + ZAR amount + the FX snapshot via Story 4.1.

**Given** Azure cost data lags by hours (PRD §14.5)
**When** the connector runs at 12:00
**Then** it fetches data through the most recent complete day available (operator tolerance: 12h is "fresh").

**Touchpoints:** FR32, FR33, NFR-I1, NFR-I2
**Architecture entities:** `Connector`, `ConnectorCredential`, `CostRecord`

### Story 4.4: Implement Digital Ocean cost connector

As an operator,
I want hourly cost data per app from Digital Ocean,
So that DO-hosted apps' costs are visible alongside Azure-hosted apps in the portfolio rollup.

**Acceptance Criteria:**

**Given** an app with the DO connector + a per-team API token
**When** the Job runs
**Then** the connector calls the DO billing API via `useCredential()`
**And** persists `CostRecord` rows attributed by DO product line.

**Touchpoints:** FR32, FR33, AR16
**Architecture entities:** `Connector`, `CostRecord`

### Story 4.5: CostDisplay component (three variants)

As an operator,
I want a single `<CostDisplay>` component that shows ZAR cost with appropriate provenance disclosure across density levels,
So that every monetary value carries a paper trail and never lies about its source.

**Acceptance Criteria:**

**Given** `<CostDisplay>` from UX-DR5
**When** rendered with `variant="inline"`
**Then** it shows `R 4,250` (`text-sm font-medium tabular-nums`) with full provenance available in a hover-card.

**When** rendered with `variant="card"`
**Then** it shows two lines: primary `R 4,250` (`text-2xl font-bold tabular-nums`) + below `USD 230 · forecast` (`text-xs text-muted-foreground`).

**When** rendered with `variant="primary"`
**Then** it shows three lines: primary `R 4,250` (`text-3xl font-bold`) + source `USD 230 source` + FX detail `SARB R18.48 · 25 Apr 2026 · refreshed 2h ago`.

**Given** `isStale: true`
**When** rendered with `card` or `primary` variant
**Then** a `<Badge variant="outline">stale</Badge>` appends to the secondary line.

**Given** `forecast: true`
**When** rendered
**Then** the freshness disclosure (count of complete days of data + last refresh timestamp) is shown per FR38.

**Given** the rendered values
**When** announced to a screen reader
**Then** the `aria-label` includes ZAR + USD + FX rate + source + timestamp (full provenance — not just the primary).

**Touchpoints:** FR34, FR38, NFR-D4, NFR-B3, UX-DR5
**Architecture entities:** *(presentational; consumes `CostRecord`)*

### Story 4.6: View per-app month-to-date cost

As an ADMIN/MANAGER,
I want per-app MTD cost visible on the App detail page,
So that I can answer "what is this app costing this month?" in < 10s.

**Acceptance Criteria:**

**Given** an app with `CostRecord` rows for the current month
**When** I view the App detail page's MTD cost stat card
**Then** the card uses `<CostDisplay variant="card">` with the ZAR sum + USD source sum + freshness disclosure
**And** the value updates within 12h of the latest source data per PRD §14.5.

**Touchpoints:** FR35, NFR-D4
**UX components:** Stat card with `<CostDisplay variant="card">`
**Architecture entities:** `CostRecord`

### Story 4.7: View monthly cost trend per app

As an ADMIN/MANAGER,
I want a monthly cost trend chart per app,
So that I can spot baseline shifts (Journey 2 cost-spike investigation).

**Acceptance Criteria:**

**Given** `CostRecord` rows over a selectable time range
**When** I view the App detail page's cost trend card with `<TimeRangeSelector>`
**Then** the chart shows daily ZAR cost as a Recharts line/area chart over the range
**And** breakdown by service line is available via a toggle (FR33 / Journey 2).

**Touchpoints:** FR36, UX-DR4
**UX components:** Recharts chart card, `<TimeRangeSelector>`
**Architecture entities:** `CostRecord`

### Story 4.8: View portfolio-wide cost rollup

As an ADMIN/MANAGER,
I want a portfolio cost rollup view at `/costs`,
So that I can compare apps side-by-side and answer "why is the bill up this month?" (Journey 2 entry).

**Acceptance Criteria:**

**Given** I am ADMIN/MANAGER at `/costs`
**When** the page loads
**Then** I see a portfolio-wide cost table with per-app columns (MTD ZAR, prior month ZAR, MoM delta %, forecast)
**And** the table is sortable by any column (UX-DR15) — defaulting to MoM delta DESC for spike-spotting per Journey 2
**And** filter pills for platform / owner / lifecycle apply
**And** clicking a row navigates to the App detail page.

**Given** a DEVELOPER without cost-visibility (FR39)
**When** they navigate to `/costs`
**Then** the route returns 403 (UI sidebar nav already hides it; Story 1.3 enforces server-side).

**Touchpoints:** FR37, UX-DR7, UX-DR15
**UX components:** Sortable cost table, filter pills, `<CostDisplay variant="inline">`
**Architecture entities:** `CostRecord`

### Story 4.9: Cost forecast with freshness disclosure

As an ADMIN/MANAGER,
I want a current-period cost forecast for each app and the portfolio,
So that I can project month-end spend before the bill arrives (Journey 2 climax).

**Acceptance Criteria:**

**Given** `CostRecord` rows for the current billing period
**When** the forecast service computes
**Then** it uses linear projection (v1; weighted methodology v1.1 per T5 mitigation) over complete days of data
**And** returns `{ forecastZar, completeDaysOfData, lastRefreshedAt }`.

**Given** the forecast is rendered via `<CostDisplay variant="primary" forecast>`
**When** I view it
**Then** the freshness disclosure shows "based on N complete days of data, refreshed M minutes ago" per FR38 / T5 mitigation.

**Given** Azure cost data is > 12h stale
**When** the forecast renders
**Then** a stale-rate badge appears alongside per Story 4.5.

**Touchpoints:** FR38, NFR-D4, UX-DR5
**Architecture entities:** `CostRecord`

### Story 4.10: DEVELOPER cost-visibility global toggle

As an ADMIN,
I want a single global toggle "DEVELOPERs see cost data: yes/no" defaulting to off,
So that DEVELOPER access to cost is controlled until v1.1 introduces per-app policy (FR39 / A3).

**Acceptance Criteria:**

**Given** I am ADMIN at `/admin/settings/system`
**When** I toggle "DEVELOPERs see cost data"
**Then** the setting persists in a `Setting` row (or equivalent) and the change is audit-logged (`op: 'setting.update'`).

**Given** the toggle is ON
**When** a DEVELOPER navigates to `/costs` or sees the cost column on `/portfolio`
**Then** the route + columns render normally (still scoped to assigned apps).

**Given** the toggle is OFF
**When** a DEVELOPER attempts the same
**Then** server-side RBAC denies cost routes/columns (the sidebar nav also hides `Costs`).

**Touchpoints:** FR39
**Architecture entities:** `Setting` (new), `AuditLog`

---

## Epic 5: Adoption Analytics via Webhook Events

Operators see DAU/WAU/MAU and login activity per app, fed by `login` events that monitored apps push to their per-app webhook URL. Worker drains `WebhookEventRaw` → typed `ActivityEvent` rows out-of-band; the portfolio tile's "today's logins" updates within seconds of a real login.

### Story 5.1: Worker drains webhook outbox into ActivityEvent

As a developer,
I want the worker draining `WebhookEventRaw` rows where `event = 'login'` into typed `ActivityEvent` rows,
So that adoption analytics has clean typed data to query without coupling to the webhook receiver path.

**Acceptance Criteria:**

**Given** the worker's outbox-drain task running every 5s
**When** it finds an unprocessed `WebhookEventRaw` row with `event = 'login'`
**Then** it parses + validates the row's `data` against the `login` Zod schema from webhook-contract §6.1
**And** inserts an `ActivityEvent` row with `(appId, occurredAt, userId, userEmailHash, ip, userAgent, success)`
**And** marks `WebhookEventRaw.processedAt = now()`.

**Given** the schema validation fails
**When** the row is processed
**Then** `WebhookEventRaw.processError` records the validation failure
**And** the row is NOT retried (sender must fix per webhook-contract §11)
**And** the row remains visible in the diagnostic view (Story 2.16).

**Touchpoints:** FR25, AR8
**Architecture entities:** `WebhookEventRaw`, `ActivityEvent`

### Story 5.2: Compute DAU / WAU / MAU per app

As an operator,
I want per-app login count and DAU / WAU / MAU on rolling daily/weekly/monthly windows,
So that adoption can be reported to leadership and compared across apps.

**Acceptance Criteria:**

**Given** `ActivityEvent` rows for an app
**When** `/api/apps/[id]/adoption?range=30d` is called
**Then** the API returns `{ totalLogins, dau, wau, mau, uniqueUsers }` for the range using indexed queries on `(appId, occurredAt)`
**And** computation deduplicates by `userId` for unique-user counts.

**Given** the App detail page Adoption card
**When** rendered
**Then** the four counters appear as stat cards plus a daily-login Recharts chart over the time range from `<TimeRangeSelector>`.

**Touchpoints:** FR26, FR28
**Architecture entities:** `ActivityEvent`

### Story 5.3: Track last-active-at per user/app

As an operator,
I want to know when each user last used an app,
So that I can spot dormant users / accounts at risk.

**Acceptance Criteria:**

**Given** `ActivityEvent` rows
**When** `/api/apps/[id]/users/last-active` is called
**Then** the API returns `[{ userId, userEmailHash, lastActiveAt, loginCount30d }]` ordered by `lastActiveAt DESC` paginated.

**Given** the App detail page Adoption sidebar
**When** rendered
**Then** the top-N most-recently-active users appear (with `userId` masked per UX privacy convention).

**Touchpoints:** FR27
**Architecture entities:** `ActivityEvent`

### Story 5.4: Portfolio "today's logins" cell composition

As an operator,
I want the portfolio table to surface today's login count per app,
So that the four-question answer (Q3 — used today?) is visible without clicking in.

**Acceptance Criteria:**

**Given** the portfolio API endpoint
**When** it composes per-row data
**Then** each row carries `todaysLogins` computed from `ActivityEvent` since SAST midnight
**And** the value updates within seconds of a real login arriving via webhook (Story 5.1 drain cycle = 5s).

**Given** the portfolio table renders
**When** the cell shows
**Then** it uses `text-sm font-medium tabular-nums` (UX §Visual Foundation typography) and renders "—" if `ActivityEvent` count is 0 (no fabricated zeros).

**Touchpoints:** FR26, FR46 (composition only — full FR46 lands in Epic 7)
**Architecture entities:** `ActivityEvent`

---

## Epic 6: Email Communication Monitoring (Azure Communication Services)

Operators see outbound email volume, delivery rate, and bounce rate per app for ACS-using apps. Recipient addresses masked by default with audit-logged unmask. Connector added: Azure Communication Services.

### Story 6.1: Provision EmailEvent model

As a developer,
I want an `EmailEvent` table for per-app email metrics,
So that ACS-collected data has a stable schema to write into.

**Acceptance Criteria:**

**Given** Prisma schema from architecture §9
**When** migrated
**Then** `email_events` exists with `(appId, connectorId, occurredAt, provider, eventType, recipientHash, messageId?, reason?)` and indexed on `(appId, occurredAt DESC)`.

**Touchpoints:** FR42
**Architecture entities:** `EmailEvent`

### Story 6.2: Implement Azure Communication Services email connector

As an operator,
I want outbound email metrics (volume sent, delivered, bounced, complained) collected from ACS for every ACS-using app,
So that email health is visible per app.

**Acceptance Criteria:**

**Given** an app with the ACS connector + a per-resource ACS connection string (or Managed Identity per AR10)
**When** the Job runs
**Then** the connector pulls ACS email events via the Azure SDK using `useCredential()`
**And** persists `EmailEvent` rows with `provider: 'acs'`, `eventType` of `sent / delivered / bounced / complained`, `recipientHash` (SHA-256 of lowercased recipient — never plaintext)
**And** rate-limit handling per ACS documented limits (NFR-I2).

**Touchpoints:** FR42, NFR-I1, NFR-I2, NFR-I4, AR16
**Architecture entities:** `Connector`, `EmailEvent`

### Story 6.3: View email volume + delivery + bounce trends

As an ADMIN/MANAGER/DEVELOPER (assigned apps),
I want trends of email volume, delivery rate, and bounce rate per app,
So that delivery degradation surfaces before users complain.

**Acceptance Criteria:**

**Given** `EmailEvent` rows for an app
**When** I view the App detail page's Email Health card with a time range selected
**Then** the card shows three trend lines (sent / delivered / bounced) on a Recharts chart
**And** the bounce-rate stat card highlights amber if > 2% / red if > 5% per Style Guide thresholds.

**Touchpoints:** FR43
**UX components:** Chart card on `<AppDetailLayout>`, `<TimeRangeSelector>`
**Architecture entities:** `EmailEvent`

### Story 6.4: Recipient masking with audit-logged unmask

As an operator,
I want email recipients masked by default in the UI with an explicit unmask action that is audit-logged,
So that NFR-S5 is operationalised — no incidental PII exposure.

**Acceptance Criteria:**

**Given** any UI that lists email events (App detail Email Health card, recipient log v1.1)
**When** rendered by default
**Then** the recipient column shows `recipientHash`-derived mask (e.g. `***@example.com` or `<sha256>` if no domain knowable)
**And** an `[Unmask]` action is available per row.

**Given** I click `[Unmask]` on a row
**When** the action invokes
**Then** server-side returns the plaintext recipient ONLY if the user has appropriate role
**And** an `AuditLog` row records `op: 'email.recipient.unmask'` with `(actorId, appId, eventId)` per FR69
**And** the unmasked value displays for 30 seconds before re-masking automatically.

**Touchpoints:** FR44, FR69, NFR-S5, NFR-S6
**UX components:** Inline `[Unmask]` action with auto-remask
**Architecture entities:** `EmailEvent`, `AuditLog`

---

## Epic 7: Portfolio & App Detail Dashboards

The Morning Glance — operators land at `/portfolio` and read every app's health, today's spend, today's logins, and alert count without clicking. App detail page composes uptime, cost, adoption, resource, and email charts on the FlowDesk Detail Page split. Sub-2s warm-cache load (NFR-P1).

### Story 7.1: Portfolio table data layer

As a developer,
I want a single `/api/portfolio` endpoint that returns every in-scope app with per-row health/spend/logins/alerts in one round trip,
So that the portfolio renders in < 2s warm-cache (NFR-P1).

**Acceptance Criteria:**

**Given** an authenticated user with role + assigned apps
**When** `/api/portfolio` is called
**Then** the endpoint returns `[{ appId, name, lifecycleStatus, healthState, latencyTrend24h: [...], todaysSpendZar, todaysLogins, firingAlertCount, ... }]` scoped to the user's role + assignments
**And** the query joins against `MetricHourlyAggregate` (or last-24h `HealthCheckResult` for sparkline data) using indexed paths
**And** p95 < 500ms at v1 scale per NFR-SC4.

**Given** the response cache strategy
**When** SWR fetches
**Then** the page sets a `Cache-Control: private, max-age=60, stale-while-revalidate=300` (or equivalent) so subsequent visits warm-cache hit < 2s.

**Touchpoints:** FR46, NFR-P1, NFR-SC4
**Architecture entities:** `App`, `HealthCheckResult`, `MetricHourlyAggregate`, `CostRecord`, `ActivityEvent`, `AlertEvent`

### Story 7.2: PortfolioTable component with sort/filter/search/URL state

As an operator,
I want to scan, sort, filter, and search the portfolio with all state encoded in the URL,
So that bookmarking and browser back work as expected.

**Acceptance Criteria:**

**Given** `<PortfolioTable>` from UX-DR7
**When** rendered with portfolio data
**Then** it composes `<Table>` + per-row `<AppHealthPill>` + `<SparklineCell accent="default">` + `<CostDisplay variant="inline">` + login count + alert badge per UX-DR7
**And** clicking a column header cycles `unsorted → asc → desc` with visible icons per UX-DR15.

**Given** filter pills above the table for platform / owner / lifecycle and a search input with 150ms debounce
**When** any state changes
**Then** URL search params encode the change (`?platform=azure&owner=ops&sort=cost-desc&q=zar`) per UX-DR15
**And** reload + share preserve the state.

**Given** the result set is empty after filtering
**When** rendered
**Then** the empty state from UX-DR13 ("No apps match your filters") shows with a `[Clear filters]` link.

**Given** scroll position + filters + sort
**When** I drill into `/apps/[id]` and click browser back
**Then** the portfolio restores the same scroll position, filters, and sort (URL state is the source of truth).

**Touchpoints:** FR46, FR48, UX-DR7, UX-DR13, UX-DR15
**UX components:** `<PortfolioTable>`, `<TimeRangeSelector>`, search input, filter pills, empty state
**Architecture entities:** `App` + read joins

### Story 7.3: Portfolio page meets sub-2s warm-cache SLO

As an operator,
I want `/portfolio` to render in under 2 seconds on warm-cache for ≤50 apps,
So that the morning glance feels instant (CSM-1 reinforced; NFR-P1).

**Acceptance Criteria:**

**Given** Server Components stream the shell first
**When** the page navigates
**Then** the sidebar + header + page-title + `<TimeRangeSelector>` render in < 200ms via Server Component streaming (UX §The Defining Interaction)
**And** the table renders skeleton rows in < 1s
**And** data resolves into rows in < 2s warm-cache for ≤50 apps (NFR-P1).

**Given** Lighthouse CI runs on `/portfolio`
**When** it completes
**Then** scores ≥ 95 across performance + accessibility per Story 10.7 / NFR-A6.

**Touchpoints:** FR46, NFR-P1, NFR-P6, NFR-P7
**UX components:** `<Skeleton>` rows, Server Components shell
**Architecture entities:** *(no writes)*

### Story 7.4: AppDetailLayout (2/3 + 1/3)

As an operator,
I want the App detail page using the FlowDesk Detail Page split with metric cards in the main column and connector status + recent alerts in the sidebar,
So that everything I need to investigate one app fits a single screen.

**Acceptance Criteria:**

**Given** `<AppDetailLayout>` from UX-DR8
**When** rendered for an app
**Then** the grid is `md:grid-cols-3` with main `md:col-span-2` and sidebar `md:col-span-1` per Style Guide §8
**And** the main column composes (in order): metadata header (name, env, owner, primaryUrl, repo + runbook links, `<AppHealthPill>`, `<TimeRangeSelector>`), Uptime card, Cost card (Epic 4), Adoption card (Epic 5), Resource Growth card (Epic 3), Email Health card (Epic 6)
**And** the sidebar composes Connector Status list (`<ul>` of `<ConnectorStatusRow>`s), Recent Alerts list, Alert Rules summary (Epic 8).

**Given** mobile viewport (< `md:`)
**When** rendered
**Then** the sidebar stacks below the main column with `space-y-6` per UX-DR16.

**Touchpoints:** FR47, UX-DR8, UX-DR16
**UX components:** `<AppDetailLayout>`, all chart cards from Epics 3–6
**Architecture entities:** *(read-only composition)*

### Story 7.5: TimeRangeSelector wired across pages

As an operator,
I want one `<TimeRangeSelector>` per page coordinating all chart re-fetches,
So that switching ranges affects every chart synchronously and visibly.

**Acceptance Criteria:**

**Given** a page with charts driven by SWR with the time range as URL param
**When** the user changes the selector
**Then** all chart hooks re-fetch via SWR `mutate` (or revalidation key change)
**And** chart cards show their `<Skeleton>` for the in-flight period < 1s warm-cache (NFR-P6)
**And** keyboard interaction (Tab + Arrow keys + Enter) operates the selector (NFR-A2).

**Given** the user selects `Custom`
**When** the popover opens with two `<Calendar>`s
**Then** picking a from/to applies and re-fetches; Cancel reverts; Esc closes without applying.

**Touchpoints:** FR48, UX-DR4, NFR-P6, NFR-A2
**UX components:** `<TimeRangeSelector>` consumed across all dashboard pages

### Story 7.6: Portfolio empty + loading + filtered-empty states

As an operator,
I want every state of the portfolio to feel intentional — including no apps, filtered-to-zero, and loading,
So that I never see a blank page or a misleading visual.

**Acceptance Criteria:**

**Given** zero apps registered
**When** `/portfolio` renders (ADMIN scope)
**Then** the empty state from UX-DR13 shows "No apps registered yet" with a `Boxes` icon + `[+ Register your first app]` brand button.

**Given** apps exist but filters reduce the set to zero
**When** the table renders
**Then** the filtered-empty state shows "No apps match your filters" with a `Search` icon + `[Clear filters]` link.

**Given** data is loading
**When** the table mounts
**Then** `<Skeleton>` rows render at `~48px` height matching eventual row dimensions per UX-DR14
**And** sparkline cells render `<Skeleton>` at 24×80px per UX-DR14.

**Touchpoints:** FR46, UX-DR13, UX-DR14
**UX components:** Empty state cards, `<Skeleton>` patterns

### Story 7.7: Mobile responsive treatment for portfolio + app detail

As an operator on a phone,
I want the portfolio and app detail pages to remain functional on a small viewport,
So that I can check critical state from my phone (even if the dense scan-mode is desktop-first).

**Acceptance Criteria:**

**Given** a viewport < `md:` (768px)
**When** I view `/portfolio`
**Then** the dense table allows horizontal scroll (v1; v1.1 candidate: simplified single-column variant per UX-DR16).

**Given** the same viewport on `/apps/[id]`
**When** rendered
**Then** the 2/3 + 1/3 layout collapses; sidebar (connector status, recent alerts) stacks below main; chart cards span full width with `space-y-6`.

**Given** any chart on a phone
**When** rendered
**Then** Recharts charts adapt to the available width without horizontal overflow.

**Touchpoints:** UX-DR16, NFR-A2
**UX components:** Responsive grid, `<Sheet>` sidebar inheritance

---

## Epic 8: Alerting — Rules, Engine, Lifecycle & Channels

ADMIN/MANAGER configure alert rules; the engine evaluates them against telemetry; firing alerts deliver via in-app bell + ACS email; DEVELOPERs (including on phone) can ack/resolve in one tap. Journey 4 (mobile alert ack < 10s from email) lands here.

### Story 8.1: AlertRule model and rule configuration UI

As an ADMIN/MANAGER,
I want to configure alert rules per app (within my scope) for the v1 rule types — uptime threshold, cost MTD threshold, email bounce rate,
So that proactive alerting is operational.

**Acceptance Criteria:**

**Given** Prisma schema from architecture §9 for `AlertRule`
**When** I am ADMIN/MANAGER at `/admin/settings/alert-rules` (ADMIN: all apps; MANAGER: in-scope apps only)
**Then** I can create an `AlertRule` with `(name, appId | null, metric, operator, threshold, window, channels, enabled)` per architecture §9
**And** the form supports the three v1 rule types: uptime-threshold (`metric: "uptime_percent", operator: "<", threshold: 100, window: "5m"`), cost-MTD-threshold (`metric: "cost_mtd_zar", operator: ">", threshold: <value>`), email-bounce-rate (`metric: "bounce_rate_percent", operator: ">", threshold: <value>`)
**And** an `AuditLog` row records `op: 'alert_rule.create'`.

**Given** I edit an existing rule
**When** I save
**Then** changes persist and `AuditLog` records `op: 'alert_rule.update'`.

**Given** I disable a rule
**When** I toggle `enabled = false`
**Then** the engine skips it on next evaluation
**And** `AuditLog` records `op: 'alert_rule.disable'`.

**Touchpoints:** FR54, FR67
**UX components:** Form pattern (style guide §7)
**Architecture entities:** `AlertRule`, `AuditLog`

### Story 8.2: Alert rule evaluation engine

As an operator,
I want the system to evaluate active alert rules against incoming telemetry and create alert events,
So that proactive alerting actually fires (FR55).

**Acceptance Criteria:**

**Given** the worker / Job evaluating rules
**When** new data lands (probe result, MTD cost roll-up, hourly aggregate)
**Then** for each enabled `AlertRule` matching the metric, the engine evaluates `value <operator> threshold` over the configured window
**And** if condition is met AND no `AlertEvent` is currently in `firing/acknowledged` state for the same rule + scope, a new `AlertEvent` is created with `state = 'firing'`, `firedAt = now()`, and `observedValue` captured.

**Given** a rule trips multiple times within the same firing
**When** the engine evaluates
**Then** the engine de-duplicates — does not create another `AlertEvent` until the prior one is `resolved`.

**Given** evaluation runs on every aggregate Job
**When** an aggregate refreshes
**Then** rule evaluation completes within the Job's runtime budget without blocking subsequent Job ticks.

**Touchpoints:** FR55, FR56
**Architecture entities:** `AlertRule`, `AlertEvent`, `MetricHourlyAggregate`, `HealthCheckResult`, `CostRecord`, `EmailEvent`

### Story 8.3: Alert lifecycle state machine (firing → acknowledged → resolved)

As an operator,
I want every alert event to follow a deterministic lifecycle (firing → acknowledged → resolved),
So that responsibility hand-off and post-incident review are unambiguous.

**Acceptance Criteria:**

**Given** an `AlertEvent` with `state = 'firing'`
**When** an authorised user acknowledges via Story 8.4
**Then** `state = 'acknowledged'`, `acknowledgedAt = now()`, `acknowledgedBy = userId`.

**Given** any state transition
**When** persisted
**Then** an `AuditLog` row captures the transition with `op: 'alert.<state>'`.

**Given** the rule's metric returns to within threshold
**When** the engine re-evaluates
**Then** `AlertEvent.state = 'resolved'` (auto-resolve) AND `resolvedAt = now()`
**And** an `AuditLog` row records `op: 'alert.resolve'` with actor `system`.

**Touchpoints:** FR56, FR67
**Architecture entities:** `AlertEvent`, `AuditLog`

### Story 8.4: Acknowledge a firing alert

As an ADMIN/MANAGER/DEVELOPER (assigned apps),
I want to acknowledge a firing alert,
So that my team knows someone is on it (and Journey 4 can complete in one tap from email).

**Acceptance Criteria:**

**Given** an `AlertEvent` in `firing` state visible to me (per role + scope per FR60)
**When** I tap `[Acknowledge]` on `<AlertDetailLayout>` or in the notification bell popover
**Then** `POST /api/alerts/[id]/ack` transitions state to `acknowledged`
**And** `AuditLog` records `op: 'alert.acknowledge'` with `(actorId, alertEventId)` per FR69
**And** the action is optimistic: UI flips state immediately; server confirms within ~150ms; on rare failure, UI reverts + toast error.

**Given** another user already acknowledged
**When** I attempt to ack
**Then** the action returns 409 with the prior acker's identity; UI shows "Already acknowledged by <name> at <time>" instead of the ack button.

**Touchpoints:** FR57, FR67, FR69
**UX components:** Optimistic UI on ack button, toast feedback
**Architecture entities:** `AlertEvent`, `AuditLog`

### Story 8.5: Resolve an alert manually

As an ADMIN/MANAGER/DEVELOPER (assigned apps),
I want to manually resolve an alert (whether `firing` or `acknowledged`),
So that I can close incidents the engine doesn't auto-resolve.

**Acceptance Criteria:**

**Given** an `AlertEvent` in `firing` or `acknowledged` state
**When** I tap `[Resolve]`
**Then** state transitions to `resolved`, `resolvedAt = now()`
**And** the action requires confirmation (2-second hold or `<AlertDialog>` per UX J4) to avoid accidental taps adjacent to ack
**And** `AuditLog` records `op: 'alert.resolve'` with actor identity.

**Touchpoints:** FR58, FR67, FR69
**Architecture entities:** `AlertEvent`, `AuditLog`

### Story 8.6: ACS email channel for alert delivery

As a DEVELOPER on call,
I want firing alerts delivered to my email via Azure Communication Services within ~90s of firing,
So that I learn about incidents before users do.

**Acceptance Criteria:**

**Given** an `AlertEvent` transitions to `firing`
**When** the alert dispatcher fires
**Then** for each user in the alert's notification scope (FR60), it sends an ACS email via `@azure/communication-email`
**And** the email arrives within 90s of fired-at at p95 (NFR-P4 + ACS dispatch latency).

**Given** the email fails to dispatch
**When** the dispatcher retries
**Then** retry policy mirrors NFR-R4 (initial 30s, factor 2, max 5 attempts)
**And** total dispatch failures over 24h are visible to ADMIN via observability.

**Given** outbound email sourcing
**When** sent
**Then** ACS is the only outbound channel — SMTP not used (NFR-I4).

**Touchpoints:** FR59, NFR-I4, NFR-R4
**Architecture entities:** `AlertEvent`

### Story 8.7: ACS email template (mobile-friendly, mirrors in-app)

As a DEVELOPER opening an alert email on my phone,
I want the email layout to mirror the in-app alert detail page,
So that the click-through feels seamless and my eyes know where to look.

**Acceptance Criteria:**

**Given** the alert email template at `packages/shared/email/alert-firing.ts`
**When** rendered for an `AlertEvent`
**Then** it uses inline CSS only (mobile email client compatibility) per UX-DR19
**And** the layout mirrors `<AlertDetailLayout>`: `<AlertStatePill>` + app name + fired-at + duration above the fold, last-good-probe + uptime drop % below
**And** the primary CTA is a full-width `[Acknowledge alert]` link to `https://flowdev.<host>/alerts/[id]`.

**Given** an email client without CSS support
**When** rendered
**Then** the plaintext fallback retains: state, app, fired-at, link.

**Touchpoints:** FR59, UX-DR19, NFR-I4

### Story 8.8: SSO transparent deep-link redirect for `/alerts/[id]`

As a DEVELOPER tapping an alert email link from my phone,
I want the SSO redirect to be transparent so I land on `/alerts/[id]` in one tap,
So that Journey 4 < 10s from email-to-acknowledged is achievable.

**Acceptance Criteria:**

**Given** I tap the email CTA from a browser without an active session
**When** Edge middleware (`getToken()`) detects no session
**Then** it redirects to Azure Entra with `state` encoding the original `/alerts/[id]` URL
**And** on Entra return, the user lands directly on `/alerts/[id]` with session set
**And** the user perceives one tap (the redirect chain is sub-second).

**Given** I tap the email CTA with an active session
**When** the page loads
**Then** I land on `/alerts/[id]` immediately with no auth challenge.

**Touchpoints:** UX-DR21, NFR-S2
**Architecture entities:** `Session`, `AlertEvent`

### Story 8.9: Mobile-portrait AlertDetailLayout with sticky-bottom ack

As a DEVELOPER on my phone,
I want the alert detail page above the fold with a sticky-bottom ack button,
So that I can acknowledge without scrolling on a 360px portrait viewport.

**Acceptance Criteria:**

**Given** `<AlertDetailLayout>` from UX-DR9
**When** rendered on a portrait mobile viewport (< 768px)
**Then** the above-fold composition is: alert title (`text-2xl font-bold`) + `<AlertStatePill>` + app name + `<AppHealthPill>` + `text-sm text-muted-foreground` "fired N min ago"
**And** below-fold: last-good-probe details, uptime-drop sparklines (5/15/60 min), related connector statuses
**And** a `[Acknowledge]` (or `[Resolve]` if already ack) button is sticky-bottom with `position: sticky; bottom: 0; padding: 12px; background: var(--background);` at `h-12 w-full text-base` per UX-DR9 / Style Guide.

**Given** I tap `[Acknowledge]`
**When** the optimistic mutation runs
**Then** the button shows `<Loader2 animate-spin>` + "Acknowledging…" briefly, then a top-of-viewport toast "Alert acknowledged" per UX-DR22
**And** the button replaces with `[Resolve]` in place.

**Given** the button is reachable via keyboard
**When** I tab through the page
**Then** focus reaches the action button; Enter activates it (NFR-A2)
**And** `aria-live="polite"` on the page announces state transitions for screen readers.

**Touchpoints:** FR57, FR58, UX-DR9, UX-DR22, NFR-A2
**UX components:** `<AlertDetailLayout>`, sticky-bottom button, toast

### Story 8.10: Notification bell extension with firing-alert badge

As an operator,
I want the notification bell to show a red dot when there are firing alerts in my scope, with an "Active alerts" section in the popover,
So that I see firing alerts wherever I am in FlowDev.

**Acceptance Criteria:**

**Given** the existing FlowDesk notification bell
**When** the user has ≥1 firing alert in scope (per FR60)
**Then** the bell badge becomes a red dot (distinct from the existing read/unread count)
**And** the popover gains an "Active alerts" section above the existing notification list per UX-DR10
**And** each active alert shows `<AlertStatePill>` + app name + fired-at + a `[Acknowledge]` button.

**Given** I acknowledge an alert from the popover
**When** the SWR mutation runs
**Then** the bell badge state updates across all open sessions of users in scope (Story 8.4)
**And** the alert removes from the "Active alerts" section.

**Given** zero firing alerts in scope
**When** rendered
**Then** the red dot is absent; the popover shows the calm "FlowDev is monitoring all your apps" message per UX-DR13.

**Touchpoints:** FR59, FR60, UX-DR10, UX-DR13
**UX components:** Notification bell extension, `<Popover>` content
**Architecture entities:** `AlertEvent`

### Story 8.11: Role-scoped in-app alert notifications

As an ADMIN/MANAGER/DEVELOPER,
I want to see alerts only for apps I have access to per RBAC,
So that I am not paged for apps outside my scope.

**Acceptance Criteria:**

**Given** an `AlertEvent` for an app
**When** the system computes notification scope
**Then** it includes ADMINs, MANAGERs (always), and DEVELOPERs assigned to the app (per `UserAppAssignment`).

**Given** a DEVELOPER not assigned to the app
**When** the bell or alert list renders
**Then** the alert is invisible to them (server-side filtered, not just UI hidden — Story 1.3).

**Touchpoints:** FR60, NFR-S3
**Architecture entities:** `AlertEvent`, `UserAppAssignment`

---

## Epic 9: Reporting & CSV Export

ADMIN/MANAGER can generate on-demand reports — uptime, cost, adoption, or combined portfolio — over a selected date range and export as CSV with ZAR + USD parallel columns. Combined one-month portfolio report completes < 60s (NFR-P5).

### Story 9.1: Report generator service

As an ADMIN/MANAGER,
I want a server-side report generator that produces uptime / cost / adoption / combined-portfolio reports over an arbitrary date range,
So that any report request resolves to data that fits Werner's monthly review (Journey 5).

**Acceptance Criteria:**

**Given** `/api/reports/generate` with `(reportType, dateFrom, dateTo, scope: 'app' | 'portfolio', appId?)`
**When** invoked
**Then** the service composes data from `MetricDailyAggregate` (uptime), `CostRecord` (cost), `ActivityEvent` aggregates (adoption), and computes per-app + portfolio totals
**And** uses daily aggregates for ranges > 7d (NFR-SC4 query budget)
**And** returns a structured result for CSV serialisation
**And** combined-portfolio one-month range completes < 60s p95 (NFR-P5).

**Given** scope = 'app' with an unassigned DEVELOPER
**When** invoked
**Then** the route returns 403.

**Touchpoints:** FR50, NFR-P5, NFR-SC4
**Architecture entities:** `MetricDailyAggregate`, `CostRecord`, `ActivityEvent`, `App`

### Story 9.2: CSV export with ZAR + USD parallel columns

As an ADMIN/MANAGER,
I want the report exported as CSV with ZAR primary + USD source in adjacent columns,
So that Werner's CSV opens cleanly in Excel and leadership can audit conversions.

**Acceptance Criteria:**

**Given** a generated report
**When** I click `[Export CSV]`
**Then** the response streams a CSV with: header row including FX-rate disclosure ("FX rate: SARB <date>; ZAR/USD = X.XX"), data rows with `Cost (ZAR)` and `Cost (USD source)` adjacent, totals row at bottom
**And** date columns formatted via date-fns en-ZA (`dd MMM yyyy`)
**And** numbers use `tabular-nums`-equivalent formatting (no thousand separator that confuses Excel locale)
**And** filename pattern: `flowdev-<reportType>-<scope>-<dateFrom>-<dateTo>.csv`.

**Given** the CSV is opened in Excel with en-ZA locale
**When** Werner reviews
**Then** column types resolve correctly (ZAR as currency, dates as dates, percentages as percentages).

**Touchpoints:** FR51, NFR-B3
**Architecture entities:** *(read-only)*

### Story 9.3: Reports page

As an ADMIN/MANAGER,
I want a `/reports` page where I select range + report type and click `[Generate]`,
So that running a monthly report is a 30-second action.

**Acceptance Criteria:**

**Given** I am at `/reports`
**When** the page renders
**Then** I see a form with `<TimeRangeSelector>` + report-type radio (`Uptime / Cost / Adoption / Combined Portfolio`) + scope toggle (single app vs portfolio with app picker) per UX §Journey 5
**And** a `[Generate]` brand button.

**Given** I click `[Generate]`
**When** the request runs
**Then** the button shows `<Loader2 animate-spin>` + "Generating…" until response
**And** on success, the CSV download triggers automatically
**And** a toast "Report downloaded" confirms per UX-DR22.

**Given** zero reports have been generated yet
**When** the page mounts
**Then** the empty state from UX-DR13 shows "No reports yet" with the inline form.

**Touchpoints:** FR50, FR51, NFR-P5, UX-DR4, UX-DR13, UX-DR22

---

## Epic 10: Production Hardening & Observability

v1 GA gate. Structured JSON logs + correlation IDs across web/worker/jobs; App Insights query-duration emission for the NFR-SC4 TimescaleDB tripwire; retention prune Job + per-app retention overrides; pen-test / threat-model review; accessibility audit; cross-browser + theme-parity test infrastructure; real-device mobile testing for J4. **No FRs — NFR-driven epic gating v1 GA.**

### Story 10.1: Structured JSON logging across web, worker, and jobs

As an operator of FlowDev itself,
I want every log line from `apps/web`, `apps/worker`, and `apps/jobs` to be structured JSON forwarded to App Insights,
So that observability is uniform and queryable (NFR-O1).

**Acceptance Criteria:**

**Given** `packages/shared/logger/` defining a structured logger
**When** any app emits a log line
**Then** the line is JSON with `(level, timestamp, message, correlation_id, app_id?, connector_id?, connector_type?, duration_ms?, outcome?, ...)` per architecture §2
**And** stdout is captured by Azure Container Apps and forwarded to App Insights
**And** log retention ≥ 30 days (NFR-O3 implementation).

**Touchpoints:** NFR-O1, NFR-O3

### Story 10.2: Correlation ID propagation

As a debugger,
I want correlation IDs propagated browser → API → worker job,
So that a single user action is traceable end-to-end through logs.

**Acceptance Criteria:**

**Given** a browser request to FlowDev
**When** the request arrives
**Then** the API route reads or generates `X-Correlation-Id`, attaches it to the logger context, and propagates to any worker enqueue.

**Given** a worker job spawned by an API call
**When** the job runs
**Then** its log lines carry the originating `correlation_id` per NFR-O2.

**Touchpoints:** NFR-O2

### Story 10.3: Connector run logging retained ≥30 days

As an operator,
I want every connector run's outcome (success, failure, duration, records collected) logged structurally and retained ≥30 days,
So that connector forensics survives recent failures.

**Acceptance Criteria:**

**Given** any scheduled connector run
**When** it completes
**Then** a log line is emitted with `(app_id, connector_id, connector_type, outcome: 'success' | 'failure', duration_ms, records_collected, error?)`
**And** the App Insights workspace's retention is configured ≥30 days for these.

**Touchpoints:** NFR-O3

### Story 10.4: Webhook validation failure logging (NFR-O4)

As a security stakeholder,
I want webhook validation failures logged (without payload contents) for security review,
So that brute-force HMAC attempts and version-drift senders are visible.

**Acceptance Criteria:**

**Given** a webhook request fails HMAC validation, replay-window check, or version check
**When** the route returns 4xx
**Then** the log line includes `(app_id?, error_kind, status_code, ip, content_length)` but NOT the request body or signature
**And** App Insights includes a saved query for "webhook validation failure rate by app" used by ADMIN security review.

**Touchpoints:** NFR-O4

### Story 10.5: App Insights query-duration emission and NFR-SC4 tripwire

As an architect,
I want time-series-sensitive queries to emit `query_name` + `query_duration_ms` to App Insights with an alert at p95 > 500ms over 1h,
So that the TimescaleDB re-evaluation gate (PRD §14.2) fires on real evidence.

**Acceptance Criteria:**

**Given** a Prisma middleware or query helper
**When** any time-series-sensitive query runs (raw probe scans, dashboard queries)
**Then** the helper emits `(query_name, query_duration_ms, app_id?, range)` to App Insights with the tag `time_series_sensitive: true`.

**Given** an Azure Monitor alert
**When** the p95 of `raw-table-query` query_duration_ms exceeds 500ms over a 1h window
**Then** ops is paged with the runbook entry "TimescaleDB re-evaluation triggered — see PRD §14.2" per AR13.

**Touchpoints:** NFR-SC4, AR13

### Story 10.6: Retention prune Job

As an operator,
I want a nightly Job pruning raw + hourly aggregates per the configured retention defaults,
So that storage growth stays bounded (NFR-D1).

**Acceptance Criteria:**

**Given** an ACA Job scheduled `0 2 * * *`
**When** it runs
**Then** for each retention-controlled table, it deletes rows older than the per-app effective retention (default 90d raw, 365d hourly, indefinite daily) using batched 10k-row DELETEs with a 30min budget per architecture §8
**And** logs `(table, app_id, rows_deleted, duration_ms)` per batch.

**Given** the Job logs zero rows deleted across all apps for two consecutive nights
**When** the tripwire alert fires
**Then** ops is paged (likely cause: stuck Job, schema drift, or silent runner failure per architecture §8).

**Touchpoints:** NFR-D1, NFR-D3, AR6

### Story 10.7: Per-app retention overrides

As an ADMIN,
I want to configure per-app retention overrides within the defaults' bounds,
So that high-volume apps can tighten retention without affecting others (NFR-D2).

**Acceptance Criteria:**

**Given** I am ADMIN at `/admin/settings/apps/[id]/retention`
**When** I set `rawDays: 30, hourlyDays: 180`
**Then** `App.retentionOverrides` JSONB updates
**And** Zod validation rejects values that *extend* defaults (NFR-D2 — overrides may only tighten)
**And** audit logs `op: 'app.retention.override'`.

**Given** the prune Job runs
**When** it scans this app
**Then** it uses the overrides instead of defaults.

**Touchpoints:** NFR-D2, FR67
**Architecture entities:** `App`, `AuditLog`

### Story 10.8: Pen-test / threat-model review gate

As a PM,
I want a pen-test or threat-model review completed and signed off before v1 GA,
So that NFR-S10 is demonstrably satisfied (PRD §Decisions Log).

**Acceptance Criteria:**

**Given** v1 functional and NFR scope is complete
**When** the PM raises the GA gate
**Then** a pen-test (or threat-model review with a security professional) has been booked and conducted
**And** any critical/high findings have been remediated before the GA tag is cut
**And** the report is filed in the security archive for audit.

**Touchpoints:** NFR-S10

### Story 10.9: Accessibility audit gate

As a PM,
I want a manual + automated accessibility audit completed before v1 GA,
So that NFR-A6 is demonstrably satisfied.

**Acceptance Criteria:**

**Given** v1 functional scope is complete
**When** the audit runs
**Then** Lighthouse accessibility ≥ 95 on `/portfolio`, `/apps/[id]`, `/alerts/[id]`, `/reports`, `/admin/settings`, sign-in
**And** axe-core scans return zero violations on these pages (Story 10.11)
**And** manual VoiceOver (macOS Safari) + NVDA (Windows Firefox) walkthroughs of J1, J3, J4 confirm screen-reader operability per UX §Testing Strategy
**And** any blocker is fixed before GA tag is cut.

**Touchpoints:** NFR-A6, UX-DR18

### Story 10.10: Storybook + visual regression infrastructure

As a developer,
I want Storybook with theme-parity visual regression for every FlowDev component,
So that pixel shifts in dark mode (or light) are caught in CI before merge (UX-DR23).

**Acceptance Criteria:**

**Given** Storybook installed alongside `apps/web`
**When** I add a FlowDev component
**Then** I co-locate `<component>.stories.tsx` with stories for both light and dark themes
**And** every story has a `data-testid="story-root"` wrapper for visual regression keying.

**Given** Chromatic (or equivalent) integrated in CI
**When** a PR opens
**Then** visual diffs against `main` are flagged; merging requires explicit acceptance of any visual changes
**And** dark-mode + light-mode parity is enforced — a divergence in either flags the PR (NFR-B2).

**Touchpoints:** UX-DR17, UX-DR23, NFR-B2

### Story 10.11: Playwright E2E + axe-core accessibility tests

As a developer,
I want end-to-end tests covering J1, J3, J4, J5 with axe-core a11y assertions on every page visit,
So that regressions in critical journeys + accessibility violations break the build (UX-DR24).

**Acceptance Criteria:**

**Given** Playwright configured against the staging deployment
**When** the test suite runs
**Then** it covers:
- J1: portfolio loads < 2s warm-cache, sortable, filterable, drill-in works
- J3: connector onboarding from `/admin/settings` → first probe within 60s → green pill on portfolio
- J4: email link → SSO transparent → mobile portrait viewport → ack within 10s
- J5: report generation < 60s with valid CSV
**And** every page visit calls `await checkA11y()` (axe-core) which returns zero violations
**And** test failures gate merge.

**Touchpoints:** UX-DR24, NFR-A6, NFR-P1, NFR-P5

### Story 10.12: Real-device mobile testing for J4

As a PM,
I want J4 alert ack flow validated on real iOS Safari + Android Chrome before v1 GA,
So that emulator/Storybook coverage is backed by actual device testing (UX-DR25).

**Acceptance Criteria:**

**Given** v1 functional scope complete
**When** real-device testing runs
**Then** J4 ack flow is validated on viewport sizes 360×640 (low-end Android), 375×812 (iPhone), 414×896 (iPhone Plus) on the latest two major versions of iOS Safari + Android Chrome (NFR-B1)
**And** tap targets verified ≥44×44px
**And** sticky-bottom ack button visible without zoom on every viewport
**And** any regression is fixed before GA tag is cut.

**Touchpoints:** UX-DR25, NFR-A2, NFR-B1

### Story 10.13: Cross-browser support validation

As a PM,
I want explicit validation that FlowDev works on the latest two major versions of Chrome, Edge, Firefox, and Safari in both light and dark themes,
So that NFR-B1 + NFR-B2 are demonstrably satisfied.

**Acceptance Criteria:**

**Given** the Playwright test matrix from Story 10.11
**When** configured for cross-browser
**Then** the test suite runs against `chromium`, `firefox`, `webkit` with both theme cookies set
**And** all tests pass in all browsers + both themes before GA tag is cut.

**Touchpoints:** NFR-B1, NFR-B2

---

## Deferred Capabilities (v1.1 / v2 — backlog continuity)

Per PRD §Product Scope, the following items are explicitly excluded from v1. They are listed here so the dev team can map continuing work and the architect knows where each FR lands.

### v1.1 (additive — no architectural rework)

- **FR24** — Server CPU/memory metrics where the host platform exposes them (Performance — full).
- **FR29** — Cumulative user-growth charts per app and portfolio (Adoption — full).
- **FR30** — Third-party integration-call events via webhook (`integration_call` payload schema is contract-published; receiver already drains it).
- **FR31** — Per-integration health views.
- **FR40** — Budget thresholds + breach alerts.
- **FR41** — Manual cost-share attribution rules for shared resources.
- **FR45** — Recent-sends log search per app.
- **FR49** — Cross-cutting portfolio dashboards (cost / uptime / adoption trend).
- **FR52** — Scheduled recurring reports via email.
- **AWS connector suite** — CloudWatch + Cost Explorer + RDS + S3 + SES (gated on AWS hosting going live).
- **Resend connector** + recipient log search.
- **Azure Blob Storage connector** (resource growth — full).
- **Per-app DEVELOPER cost-visibility policy** (FR39 generalisation).
- **Auto-discovery onboarding helpers** (PRD §14.8 — ARM resource enumeration; webhook env-var injection).
- **Automated credential rotation tooling** (replacing manual `scripts/rotate-credentials.ts`).
- **Tile-view variant of `<PortfolioTable>`** (UX-DR7 v1.1 enhancement).

### v2 (architectural / strategic)

- **VIEWER role** (read-only stakeholder access; rename FR64 / RBAC matrix).
- **Microsoft Teams + Slack alert channels, SMS** (FR59 channel expansion).
- **Multi-region uptime probing**.
- **TimescaleDB migration** (gated on NFR-SC4 tripwire from Story 10.5).
- **Anomaly detection** on cost and adoption.
- **Synthetic multi-step probes** (login flows, journey checks).
- **OpenTelemetry receiver** (full APM tracing).
- **Public / embeddable per-app status pages**.
- **Capacity forecasting** ("you'll hit DB storage cap in N weeks").
- **Automated runbook execution** on alert.
- **FR53 — PDF report export**.

