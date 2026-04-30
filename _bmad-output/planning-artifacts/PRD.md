---
stepsCompleted:
  - step-01-init
  - step-02-discovery
  - step-02b-vision
  - step-02c-executive-summary
  - step-03-success
  - step-04-journeys
  - step-05-domain (skipped — domain is `general`, no regulatory overlay; brief §10 covers all relevant constraints)
  - step-06-innovation (skipped — FlowDev is excellent execution of an established category, not novel; per brief §12 explicitly not a Datadog/New Relic replacement)
  - step-07-project-type
  - step-08-scoping
  - step-09-functional
  - step-10-nonfunctional
  - step-11-polish
  - step-12-complete
prdStatus: complete
prdCompletedAt: '2026-04-28'
releaseMode: phased
partyModeReviewers:
  - architect (Winston)
  - analyst (Mary)
  - dev (Amelia)
inputDocuments:
  - _bmad-output/planning-artifacts/product-brief.md
  - _bmad-output/planning-artifacts/tech-stack.md
  - _bmad-output/planning-artifacts/style-guide.md
documentCounts:
  briefs: 1
  research: 0
  brainstorming: 0
  projectDocs: 2
workflowType: 'prd'
projectType: 'greenfield'
sourceBriefAuthoritative: true
classification:
  projectType: web_app
  projectTypeSecondary: saas_b2b
  domain: general
  domainNotes: 'DevOps / observability / FinOps / internal IT tooling'
  complexity: medium
  complexityDrivers:
    - pluggable cross-platform connector abstraction
    - time-series storage and aggregation
    - scheduled background workers / job runner
    - encrypted credential storage via Azure Key Vault
    - FX conversion (USD to ZAR) for cost attribution
    - alert state machine (firing -> acknowledged -> resolved)
    - audit log of all config changes
  projectContext: greenfield
  tenancy: single-tenant
  patternDonor: FlowDesk (stack + style + SSO)
---

# Product Requirements Document — FlowDev

**Author:** Don
**Date:** 2026-04-28
**Codename:** MPAMOT (Multi-Platform Application Monitoring & Operations Tool)
**Source Brief:** `_bmad-output/planning-artifacts/product-brief.md` (treated as primary input — not re-elicited)

---

## Executive Summary

FlowDev (codename **MPAMOT** — Multi-Platform Application Monitoring & Operations Tool) is an internal-only operations console that brings every registered app in the MPAMOT portfolio into a single view. It exists because portfolio operators today must log into multiple cloud consoles, billing dashboards, email-provider UIs, and database panels to answer four basic questions about any app: is it up, what does it cost, who is using it, and is its data growing? FlowDev answers all four — per app and across the portfolio — without leaving the tool.

The product targets three internal roles: **ADMIN** (registers apps, configures connectors, manages credentials and alert rules), **MANAGER** (full read across uptime, cost, and adoption; configures alert rules in scope), and **DEVELOPER** (scoped views and alert acknowledgement on assigned apps; cost visibility configurable). Authentication is Azure Entra ID SSO (same tenant as the sister product FlowDesk) with a credentials fallback for development. Authorisation is enforced server-side, not just in the UI.

FlowDev is built on the FlowDesk stack — Next.js 15 (App Router), React 19, TypeScript 5, PostgreSQL 15 (Azure Flexible Server), Prisma 6, Auth.js v5, shadcn/ui on Radix, Tailwind 4, Recharts, Azure Communication Services for outbound email, deployed on Azure Container Apps via GitHub Actions. The net-new architectural elements are a pluggable **connector model** (per-app, credential-isolated, encrypted-at-rest via Azure Key Vault), a **scheduled background worker** for pull-based collection (uptime probes every 60s, cost data hourly, resource snapshots daily), and an **authenticated webhook receiver** for push events from monitored apps (login events, integration calls, custom metrics). Most stored data is time-series; v1 ships on plain Postgres with TimescaleDB deferred until volume justifies the operational cost.

The portfolio is the first-class managed entity. The portfolio dashboard is the landing page after login: every registered app as a tile or row, showing health, today's cost, today's logins, and current alert count. Drilling into an app reveals its uptime, cost, adoption, resource growth, email and integration health charts on the FlowDesk **Detail Page (2/3 + 1/3)** layout, with time-range, sparkline, app health pill, and connector-status patterns added to the inherited style guide.

### What Makes This Special

1. **Portfolio-first, not app-first or platform-first.** Existing observability (Datadog, New Relic), FinOps (CloudHealth), and platform-native dashboards each show one slice — one app, one platform, or one signal type. FlowDev's primary view is the entire MPAMOT portfolio at a glance, regardless of host. Adding a new cloud platform (AWS imminently; others later) requires writing a connector, not re-architecting.
2. **Uptime, cost, and adoption in the same pane.** FlowDev fuses signals that conventionally live in separate tools (APM + FinOps + product analytics + email-deliverability + DB metrics) because, per app, they answer the same operational question: *is this app worth what it costs, and is anyone actually using it?* No other tool answers that holistically for a heterogeneous portfolio of bespoke internal apps.
3. **Connector-as-primitive.** Each connector is a TypeScript module against a common interface (`collect()`, `healthCheck()`, `validateCredentials()`), runs in a background worker, and stores its credentials encrypted and isolated. This is the structural reason FlowDev can credibly claim "covers every app" instead of accidentally — new platforms slot in without disturbing existing ones.
4. **Owned, locale-correct, and free of per-seat SaaS cost.** Inherits FlowDesk's auth, UI, deployment, dark-mode, and `en-ZA` / ZAR-with-FX-from-USD locale conventions. Tailored to the operator team's actual workflow rather than retrofitting an enterprise APM product onto an internal portfolio.

The differentiation moment: the first time an operator opens `/portfolio` and sees every MPAMOT app on a single screen with live health, today's spend, today's active users, and alert state — and closes the four cloud-console tabs they previously kept open.

## Project Classification

| Dimension | Value |
|---|---|
| Project Type | Web application (Next.js 15 App Router), with SaaS-B2B-style RBAC, dashboard, and integration patterns applied to a single-tenant internal deployment |
| Domain | DevOps / observability / FinOps / internal IT tooling (`general` per BMAD taxonomy — no regulated-industry compliance overlay) |
| Complexity | **Medium.** Drivers: pluggable cross-platform connector abstraction; time-series storage and aggregation; scheduled background workers; encrypted credential storage via Key Vault; FX (USD → ZAR) for cost attribution; alert state machine; immutable audit log |
| Project Context | **Greenfield.** New repository (`MPAMOT`); FlowDesk is a *pattern donor* (stack, SSO tenant, visual system) — not a predecessor codebase being extended |
| Tenancy | Single-tenant (one MPAMOT operator team). Per-app credential isolation looks multi-tenant-shaped but is a security boundary, not a tenancy boundary |

---

## Success Criteria

### User Success

The MPAMOT operator team's success is measured against the **four-question** framing from the Executive Summary. Targets are specific and time-bound from the operator's perspective:

| Operator question | Target experience |
|---|---|
| *"Is app X up?"* | Answered in < 5 seconds — visible at `/portfolio` without a click; one click to the App detail page if more depth is needed |
| *"What is app X costing this month?"* | Answered in < 10 seconds, in ZAR, with FX disclosure if the source is USD |
| *"Who used app X today?"* | Answered in < 10 seconds — DAU and login count visible on portfolio tile and app detail |
| *"Is app X's data growing?"* | Answered in < 15 seconds — daily snapshot trend on app detail (DB row counts for configured tables, DB storage; blob/file growth in v1.1) |
| **All four, for any registered app** | **Answerable in < 30 seconds total without leaving FlowDev** *(brief §3 goal #2 codified)* |

The "delight moment" is operational: the operator closes the four cloud-console tabs they previously kept open during the workday because FlowDev now answers what they used those tabs for. Adoption signal: an operator's daily browser session shows fewer cloud-console visits week over week after FlowDev rollout.

### Business Success

| Metric | v1 target | Source |
|---|---|---|
| Portfolio coverage | 100% of MPAMOT apps registered in FlowDev within **1 working day** of going live | Brief §3 goal #1 |
| Proactive incident detection | **≥ 70%** of incidents alerted by FlowDev before being reported by a user (operationalises "majority") | Brief §3 goal #3 |
| One-click monthly report | Combined cost + uptime + adoption portfolio report generated and downloadable in **< 60 seconds** | Brief §3 goal #4 |
| New-platform onboarding cost | A new cloud platform connector ships in **< 2 weeks of dev effort** with no changes outside the connector module (operationalises goal #5) | Brief §3 goal #5 |
| Capacity headroom | v1 supports **50 registered apps, 200 connectors, 90 days raw retention** at stated dashboard SLO | Brief §11 |

### Technical Success

- **FlowDev availability ≥ 99.5%** — and a FlowDev outage must not degrade any monitored app (no inline dependencies).
- **Probe scheduling accuracy ±10s at p95** of scheduled probe time.
- **Portfolio dashboard < 2s** warm-cache load for ≤ 50 apps.
- **Connector fault isolation** — a failed connector run logs and surfaces in connector-status UI but does not cascade to other connectors or block the request path.
- **Credential security** — every connector credential encrypted at rest via Azure Key Vault key, never logged, decrypted only in-process at moment of use. Pen-test or threat-model review passes before v1 GA.
- **Webhook authentication** — HMAC-validated per-app secret with rotation supported.
- **Audit completeness** — 100% of mutations to apps, connectors, credentials, alert rules, and user roles written to the immutable audit log, ADMIN-readable.
- **Retention defaults applied** — 90 days raw / 1 year hourly aggregates / indefinite daily aggregates, configurable per app (subject to confirmation in Open Questions §14.7 of the brief).

### Measurable Outcomes (one-line summary for stakeholder reporting)

> 30-second portfolio answer · 70%+ proactive alerts · 1-click monthly report < 60s · < 2-week new-platform onboarding · 99.5% FlowDev availability · 50 apps / 200 connectors at v1.

---

## Product Scope

The brief lists **12 capabilities (§5.1–5.12)** and **11 connector types (§5.2)**. This section establishes the MVP philosophy, validated-learning gates, and resource frame, then stages capabilities and connectors across v1 / v1.1 / v2 against the principle that **v1 must answer the four questions for every Azure- or DO-hosted app, alert on uptime and cost, forecast monthly spend, and let an operator export a monthly report.**

### MVP Strategy & Philosophy

**Approach: Problem-solving MVP.** v1 is "useful" the moment the operator team can answer the four questions (is app X up, what does it cost this month, who is using it today, is its data growing) for every Azure- or DO-hosted MPAMOT app, and receive proactive alerts on uptime and cost. Functionally, v1 ships when Journeys 1–5 work end-to-end against the actual portfolio; Journey 6 (webhook integration) underpins the adoption signal in Journeys 1, 2, and 5.

This is *not*:
- An experience MVP — we are not optimising for delight or polish beyond the inherited FlowDesk shell. Usefulness is the primary axis.
- A platform MVP — v1 is not building extension surfaces for third parties; the connector-as-primitive abstraction serves *us*, not external developers.
- A revenue MVP — no commercial model.

### Validated Learning Gates

Signals that v1 is doing its job, evaluated 30 / 60 / 90 days post-GA:

1. Operators' daily cloud-console tab counts trend down — measured by self-report at the 30-day check-in.
2. Time-to-answer-leadership-cost-question drops from hours to under 60 minutes — measured against the next ad-hoc cost question.
3. ≥ 70% of incidents alert via FlowDev before user-reported.
4. 100% of new apps onboarded < 1 working day.

If gate 1 or 2 fail at the 60-day mark, v1.1 priorities re-rack toward whatever is blocking adoption (likely cost-attribution clarity or webhook-adoption convenience). If gates 3 and 4 pass, the alerting + onboarding architecture is sound and v1.1 proceeds against planned scope. The 60-day gate is also when §14.2 (TimescaleDB), §14.5 (cost-data freshness), §14.7 (retention defaults), and the §14.4 SARB API reliability are re-evaluated against actual production behaviour.

### Resource Requirements

- **Build team:** Primarily solo developer + architect input on open questions (see §Open Questions & PM Decisions). Stack inheritance from FlowDesk (auth, UI shell, locale, deployment pipeline) absorbs significant greenfield-cost; FlowDev is greenfield as a *codebase* but not as a *system pattern*.
- **External dependencies:** Azure tenant access (same as FlowDesk SSO), Azure Container Apps + ACR provisioning, Azure Key Vault key for credential encryption, SARB public API access (FX), SendGrid v1.1 contingent, AWS account access v1.1 contingent.
- **Skill profile required:** TypeScript / Next.js / Prisma (carried over from FlowDesk), plus background-worker / scheduling experience and cloud-platform SDK familiarity (Azure ARM + Cost Management; DO API; later AWS) for connector implementation.

### MVP — v1 (release-ready scope)

**Capabilities included in v1:**

| § | Capability | v1 cut |
|---|---|---|
| 5.1 | Application Registry | **Full.** Foundation; everything else depends on it. |
| 5.2 | Connectors framework | **Full** (pluggable interface, encrypted credentials, scheduler). Connector *types* selectively cut — see below. |
| 5.3 | Uptime & Availability Monitoring | **Full** (single-region; multi-region deferred to v2 per brief §13). |
| 5.4 | Performance Monitoring | **Reduced.** v1: HTTP response time (from probes) + DB CPU / connections / storage / slow query count via Azure PG metrics + PG-direct. **Defer:** server CPU/memory beyond what ARM exposes natively. |
| 5.5 | Adoption Analytics | **Reduced.** v1: login count, DAU/WAU/MAU, last-active-at via webhook receiver. **Defer:** cumulative user growth charts → v1.1. |
| 5.6 | Resource Growth Tracking | **Reduced.** v1: DB storage size + configured table row counts (via PG-direct connector). **Defer:** Blob storage size/object counts → v1.1. |
| 5.7 | Cost Intelligence | **Reduced — but with forecast.** v1: MTD cost per app, monthly cost trend chart, breakdown by service, portfolio rollup, ZAR display with FX from USD, **MTD forecast for current billing period**. **Defer:** budget thresholds + budget breach alerts → v1.1. |
| 5.8 | Notification & Email Monitoring | **Reduced.** v1: outbound volume + delivery + bounce for apps using **Azure Communication Services**. **Defer:** Resend-based apps + AWS SES-based apps + recipient log search → v1.1 (AWS SES is part of the AWS suite). |
| 5.9 | API & Third-Party Integration Health | **Defer to v1.1.** Depends on app-side webhook contract maturity (open question §14.3); circular dependency for v1. |
| 5.10 | Dashboards | **Portfolio + App Detail only.** **Defer** cross-cutting (portfolio trend) dashboards → v1.1. |
| 5.11 | Reporting | **Reduced.** v1: on-demand CSV export of uptime / cost / adoption / combined-portfolio reports. **Defer:** scheduled email reports → v1.1; PDF → v2. |
| 5.12 | Alerting | **Reduced.** v1: uptime threshold rules + cost MTD-exceeds-X rules + email-bounce-rate rules. Channels: in-app bell + email (ACS). **Defer:** generic threshold rules + DB-storage rules → v1.1; Teams / SMS → v2. |

**Connectors included in v1:**

| Connector | v1? | Why |
|---|---|---|
| HTTP Uptime Probe | ✅ v1 | Bedrock — no probe = no uptime |
| Azure Resource Manager API | ✅ v1 | Primary current host |
| Azure Cost Management API | ✅ v1 | Goal #2 (cost question) |
| Azure PostgreSQL Flexible Server metrics | ✅ v1 | Most MPAMOT apps use this |
| Azure Communication Services | ✅ v1 | Most MPAMOT apps send via ACS |
| Generic Webhook Receiver | ✅ v1 | Push channel — required for adoption analytics |
| Digital Ocean API | ✅ v1 | Current secondary host |
| PostgreSQL direct | ✅ v1 | Required for resource growth + slow queries |
| Azure Blob Storage | 🟡 v1.1 | Useful for growth tracking; not in critical path for four-question answer |
| Resend | 🟡 v1.1 | Lights up only when an app uses Resend; ACS covers the in-Azure majority. AWS SES handled inside the AWS suite, not as a separate connector. |
| AWS suite (CloudWatch + Cost Explorer + RDS + S3 + SES) | 🟡 v1.1 | Per brief §5.2: "target for v1.1 once AWS hosting goes live" |

**v1 also includes** (cross-cutting): Auth.js v5 with Azure Entra ID + credentials fallback, server-side RBAC, immutable audit log, Key Vault credential encryption, scheduled background worker, the FlowDesk visual shell plus the new FlowDev patterns (app health pill, sparkline cells, connector status row, time-range selector, cost-in-ZAR helper), dark mode, mobile responsiveness.

### Growth — v1.1 (additive, no architectural rework)

- **AWS connector suite** (CW + Cost Explorer + RDS + S3 + SES) — gated on AWS hosting going live
- **Resend connector** + recipient log search across email connectors (AWS SES handled within the AWS suite)
- **Azure Blob Storage connector**
- **Resource Growth Tracking — full** (file/blob counts and total size, alongside DB metrics)
- **API & Third-Party Integration Health (§5.9)** — call volume, error rate, latency, last-failure per registered integration, fed by webhook contract
- **Cross-cutting dashboards** — portfolio cost trend, portfolio uptime, portfolio adoption trend
- **Cost intelligence — budget thresholds + budget breach alerts** (forecast already in v1)
- **Adoption — cumulative user growth charts**
- **Performance — full** — server CPU/memory where the platform exposes it
- **Alerting — full rule set** — generic-threshold rules, DB-storage rules
- **Reporting — scheduled** — "email me the portfolio report on the 1st of every month" via ACS

### Vision — v2 (architectural / strategic)

Per brief §13 — listed for completeness; dates uncommitted:

- **VIEWER role** (read-only stakeholder access)
- **Microsoft Teams + Slack alert channels, SMS** alert delivery
- **Multi-region uptime probing**
- **TimescaleDB migration** if data volume justifies
- **Anomaly detection** on cost and adoption metrics
- **Synthetic multi-step probes** (login flows, journey checks)
- **OpenTelemetry receiver** for full APM tracing integration
- **Public / embeddable per-app status pages**
- **Capacity forecasting** ("you'll hit DB storage cap in N weeks")
- **Automated runbook execution** on alert
- **PDF report export**

> **Note on cost forecasting in v1.** Promoted from v1.1 to v1 per PM direction. The v1 forecast must transparently disclose its inputs and the freshness of underlying cost data (Azure cost APIs lag by hours per open question §14.5) — i.e. show a "forecast based on X complete days of data, last updated Y minutes ago" disclosure on the forecast value. Forecast methodology (linear projection vs. day-of-month-weighted vs. rolling average) is an architecture decision, not a PRD decision.

---

## User Journeys

Five human journeys + one integration journey cover the four roles defined in brief §4 (ADMIN, MANAGER, DEVELOPER; VIEWER deferred to v2) plus the non-human integration surface (monitored apps pushing events). Names are illustrative.

### Journey 1 — The Morning Glance *(DEVELOPER, success path)*

**Persona:** Thandi, full-stack developer responsible for four MPAMOT apps. Pre-FlowDev she opened Azure Portal, the DO console, the Postgres metrics dashboard, and her inbox for "did anything break overnight?" — daily, ~8 minutes of tab-switching before her first coffee.

**Opening scene.** 08:30. She opens her browser to the FlowDev tab pinned from yesterday. Login is silent — Azure Entra SSO already has her session.

**Rising action.** `/portfolio` renders in under 2 seconds. Her four apps are green, sparkline cells show last-24h response time flat under 400ms, today's-spend column shows nothing unusual, no firing alerts. She glances at the team's other apps too — all green except one in DEGRADED amber on response time.

**Climax.** She doesn't have to do anything. The portfolio dashboard *is* the morning standup data. The DEGRADED app isn't hers — she pings the owner via Teams, knowing FlowDev already alerted them.

**Resolution.** 30 seconds, one tab. She closes the four cloud-console tabs that used to live in her browser permanently.

**Capabilities revealed:** Application Registry (5.1), Uptime Monitoring (5.3), Adoption Analytics (5.5 portfolio tile data), Dashboards (5.10 portfolio), App health pill + sparkline cells (FlowDev UI patterns), SSO auth.

---

### Journey 2 — The Cost Spike Investigation *(MANAGER, edge case / debugging)*

**Persona:** Dewald, ops manager. Friday 16:00. Leadership has just asked "why is the Azure bill 30% up this month?" Pre-FlowDev that's a 4-hour CSV-stitching exercise across Azure Cost Management exports per subscription, manually attributing resources to apps.

**Opening scene.** He opens FlowDev. `/costs` is reachable from the sidebar — MANAGER role has full cost visibility.

**Rising action.** He sorts the portfolio cost table by **month-over-month delta**. The BD App is up 4× on its baseline. He clicks through. The App detail page shows cost broken down by service line: **Azure PostgreSQL** is the spike. He slides the time-range selector to 30 days; the PG cost chart shows a clean step-up 12 days ago.

**Climax.** He overlays the DB CPU and storage charts (same time range). Storage jumped 12 days ago — someone enabled a feature that's writing to a previously-empty audit table. The forecast for the current billing period (now in v1) projects another R8,400 if nothing changes. He has a complete answer before close of business: spend driver identified, projection attached.

**Resolution.** 25 minutes vs. 4 hours. He files the answer. He also notes: he wants a budget threshold + alert on this app — but that's v1.1, and a human being just caught it in time.

**Capabilities revealed:** Cost Intelligence (5.7 — including v1 forecast with freshness disclosure), Performance Monitoring (5.4 DB metrics), Resource Growth Tracking (5.6 DB storage), App Detail dashboard (5.10), time-range selector, ZAR display + USD-source disclosure, FX conversion.

---

### Journey 3 — Onboarding a New App *(ADMIN, configuration journey)*

**Persona:** Rashied, ADMIN. The team just launched **Hawu**, a new internal staff portal on Azure Container Apps + Azure PG.

**Opening scene.** Without FlowDev, Hawu would silently exist for weeks before anyone noticed it wasn't being monitored. The brief's success goal #1 demands < 1 working day from launch to coverage.

**Rising action.** Rashied opens `/admin/settings` → Apps → New. Fills the registry form: name, description, owner, environment (`prod`), platform (Azure), primary URL, tech stack tags, repo link, runbook link. Saves.

He adds connectors one at a time: **HTTP Uptime Probe** (paste the `/health` URL — first probe fires within 60 seconds, immediately green). **Azure Resource Manager** (paste the subscription credential — encrypted to Key Vault on save, never echoed back). **Azure Cost Management** (same credential scope; resource-group filter applied). **Azure PostgreSQL metrics**. **PostgreSQL direct** for slow-query and row-count tracking. **Generic Webhook** — FlowDev generates the unique authenticated URL + HMAC secret; he copies it into Hawu's env vars so the app can push login events when it deploys next.

**Climax.** He goes to `/portfolio`. Hawu is there. Green pill, today's spend zero, today's logins zero (no users yet), connector-status row shows all green. Total time: 6 minutes 40 seconds.

**Resolution.** Hawu is monitored from launch. The SLA target (< 1 working day) is comfortably met. The audit log records every step he just took — credential additions, role-relevant changes — for later compliance.

**Capabilities revealed:** Application Registry (5.1), full Connector framework (5.2 — pluggable, credential-isolated, encrypted at rest), webhook authentication (per-app secret + HMAC), audit log, ADMIN-only Settings UI with nested tabs (Users / Connectors / Credentials / Alert Rules / Audit / System).

---

### Journey 4 — The Proactive Alert *(DEVELOPER, alert lifecycle)*

**Persona:** Boniswa, developer on call. She's in a client meeting away from her laptop.

**Opening scene.** 11:42. The HTTP probe for the **ZA-South** app records its third consecutive failed result. The probe scheduler executed within ±10s of schedule (NFR target). The alert rule "uptime < 100% over last 5m" trips.

**Rising action.** 11:42:45. The alert event transitions to `firing`. FlowDev's notification system fires two channels: an in-app bell notification (visible to all DEVELOPERs assigned to ZA-South) and an ACS-delivered email to Boniswa. She gets the email push on her phone within 90 seconds of the first failed probe — well before the brief's "before users complain" target.

**Climax.** She opens the email link on her phone. FlowDev's mobile-responsive UI loads the alert detail. She acknowledges the alert (`firing` → `acknowledged`); the audit log captures her ack with timestamp. She forwards the issue to the team chat: "On it, looks like the container restart loop again." Real fix happens in 12 minutes; she resolves the alert (`acknowledged` → `resolved`).

**Resolution.** No user wrote in. Brief §3 goal #3 lived: detected and alerted before users noticed.

**Capabilities revealed:** Uptime Monitoring (5.3), Alerting state machine (5.12 — `firing` → `acknowledged` → `resolved`), in-app notification bell pattern, ACS email channel, mobile responsiveness, audit log of acks, role-based alert visibility (DEVELOPER scope).

---

### Journey 5 — Monthly Portfolio Report *(MANAGER → leadership)*

**Persona:** Werner, manager. First of the month. Leadership wants the previous month's portfolio review: cost, uptime, adoption, per app and rolled up.

**Opening scene.** Pre-FlowDev: a 2-day exercise of CSVs from Azure Cost Management, ad-hoc Postgres queries for usage, manual uptime stitching from probe logs, and a spreadsheet built from scratch.

**Rising action.** He opens `/reports`. Selects date range = previous calendar month. Picks **Combined Portfolio Report** (cost + uptime + adoption per app + portfolio totals). Clicks **Generate**.

**Climax.** CSV file downloads in 47 seconds. Every registered MPAMOT app, every metric, every total. Currency in ZAR, FX disclosure on USD-sourced values. Uptime as percentage; cost in ZAR with USD source amounts in a parallel column for traceability; DAU/WAU/MAU per app for the period.

**Resolution.** He opens the CSV in Excel, writes 200 words of commentary, sends. The exercise that took two days now takes two hours, mostly the writing.

**Capabilities revealed:** Reporting (5.11 — CSV export, on-demand, combined portfolio scope), Dashboards (5.10 cross-cutting view of all apps), date-range picker, ZAR formatting + FX disclosure, the < 60-second one-click report success metric (brief §3 goal #4).

---

### Journey 6 — A Monitored App Pushes Events *(API/Integration)*

**Persona:** Not a human — the **BD App** itself, sending login events to FlowDev's webhook receiver.

**Opening scene.** A user logs into BD App at 09:14. BD App's auth handler completes, then POSTs an event to its FlowDev webhook URL (`https://flowdev.internal/webhooks/<unique-app-token>`). The payload is the standardised webhook contract (open question §14.3): `{ event: 'login', userId: 'u_42a...', timestamp: '...', appMetadata: {...} }`. The header includes an HMAC signature using the app's secret.

**Rising action.** FlowDev's webhook endpoint validates the HMAC. Invalid → 401 + audit-log the failed attempt. Valid → enqueues to the background worker. Returns 202 within 50ms — the monitored app is never blocked on FlowDev.

**Climax.** The worker writes an `ActivityEvent` row, updates the per-app rolling DAU counter, and (within seconds) the portfolio tile's "today's logins" updates. No user-facing UI was involved; the value is the data being there when an operator looks.

**Resolution.** The BD App's developer never has to maintain anything ongoing. They wired the webhook URL into env vars at registration time (Journey 3), and from then on FlowDev consumes whatever they push. If FlowDev is down, the POST fails fast — BD App ignores it (fire-and-forget) and a user's login is never delayed.

**Capabilities revealed:** Generic Webhook Receiver (5.2 connector type), webhook authentication (per-app secret, HMAC), background worker decoupling (no inline blocking), Activity event time-series (data model `ActivityEvent`), the standardised webhook contract that's open question §14.3, the resilience principle from §11 NFRs ("FlowDev going down must not bring down any monitored app").

---

### Journey Requirements Summary

The five human journeys + one integration journey collectively require:

| Capability area | Journeys touching it |
|---|---|
| Auth + RBAC + audit | All — SSO in J1, ADMIN scope J3, MANAGER scope J2 & J5, DEVELOPER scope J1 & J4 |
| Application Registry | J3 (creation), all others (consumption) |
| Connector framework + credential security | J3 directly; J1/J2/J4/J5 indirectly (data is only there because connectors ran) |
| Uptime Monitoring | J1, J4 |
| Cost Intelligence (incl. v1 forecast) | J2, J5 |
| Performance + Resource Growth | J2 |
| Adoption Analytics + Webhook receiver | J1, J5, J6 |
| Email Monitoring | Implicit — J5 portfolio report rolls it up; full UX surfaces in v1.1 with SendGrid |
| Dashboards (portfolio + app detail) | J1, J2 |
| Reporting (CSV) | J5 |
| Alerting (rule, state machine, channels) | J4 |
| Mobile responsiveness + dark mode | J4 (phone) |
| Webhook contract + HMAC | J3 (provisioning), J6 (consumption) |

**No v1 capability is left without a journey** — confirms the v1 cut in §Product Scope is functionally complete.

**Two journeys deliberately omitted** (would belong in later iterations): the **VIEWER** role's read-only digest journey (v2), and a **scheduled report email** journey (v1.1 — Werner currently triggers manually in J5).

---

## Web Application (Next.js) — Project-Type Specific Requirements

### Project-Type Overview

FlowDev is a single-tenant Next.js 15 (App Router) web application, browser-only, no native mobile or desktop client. It applies SaaS-B2B patterns (multi-role RBAC, dashboard-heavy UI, third-party integrations) inside one internal tenancy. Authentication is browser-based (Azure Entra SSO + credentials fallback); there is no public API surface for third parties. The webhook receiver is the only inbound API, scoped to monitored apps via per-app HMAC secrets.

### Technical Architecture

**Application Architecture (SPA / MPA).** Hybrid via Next.js App Router. Server Components for data-loading routes (`/portfolio`, `/apps/[id]`, `/costs`, `/reports`); Client Components only where interactivity demands it (charts, time-range selector, alert ack drawer, filters). No heavy client-state library — SWR (already in stack) for client-side data refetch with `refreshInterval` on dashboard hooks. Protected routes gated in Edge middleware via `getToken()` (FlowDesk pattern; not `auth()`). Production: Next.js standalone build, Dockerised on `node:20-alpine`, Azure Container Apps + ACR, GitHub Actions on push to `main`.

**Browser Support.** Latest two major versions of Chrome, Edge, Firefox, Safari (brief §11). Both light and dark themes must pass.

**Responsive Design.** Mobile-first, `md:` (768px) primary breakpoint per FlowDesk style guide §9. Sidebar collapses to slide-out Sheet below `md`; stat-card grids reduce columns; dialog footer flips to `flex-col-reverse` on mobile. **Journey 4** (alert ack from phone) is the operational baseline — must work end-to-end on a portrait mobile viewport.

**SEO.** **Not applicable.** Internal-only with no anonymous routes (brief §10) other than auth and per-app webhook endpoints. Global `noindex`, `nofollow`. Deny-all `robots.txt`. No sitemap.

**Real-Time.** **Not required in v1.** Minute-level refresh is sufficient (brief §12 explicitly defers real-time streaming dashboards). UI freshness is bounded by connector poll cadence (HTTP probe every 60s, cost data hourly, resource snapshots daily) + worker cycle. Implementation: polling via SWR; no WebSockets / SSE in v1.

**Accessibility.** Target **WCAG 2.1 AA**, operationalising brief §9. Keyboard-navigable end-to-end (Radix UI primitives). Focus visible on all interactive elements (`--ring` token). Colour is never the sole signal — the **app health pill** uses both colour *and* text (`UP / DEGRADED / DOWN / UNKNOWN`). Recharts visuals on App detail are paired with screen-reader-friendly data-table fallbacks. Accessibility audit gate before v1 GA.

### Tenancy Model

**Single-tenant.** One MPAMOT operator team; one FlowDev deployment. **Per-app credential isolation is a security boundary, not a tenancy boundary** — connector credentials are encrypted-at-rest, scoped to the App entity that owns them; one App's connectors cannot be used to query another App's resources. No subscription tiers, no per-tenant billing, no cross-tenant routing.

### RBAC Matrix

| Capability | ADMIN | MANAGER | DEVELOPER | VIEWER (v2) |
|---|---|---|---|---|
| View portfolio + app detail | ✅ | ✅ | ✅ (assigned apps only) | ✅ (configured scope) |
| View cost data | ✅ all | ✅ all | 🟡 configurable per policy (brief §10) | ❌ |
| View adoption data | ✅ | ✅ | ✅ (assigned apps) | ✅ (configured) |
| View audit log | ✅ | ❌ | ❌ | ❌ |
| Register / edit / decommission app | ✅ | ❌ | ❌ | ❌ |
| Add / edit / remove connector | ✅ | ❌ | ❌ | ❌ |
| Manage credentials | ✅ | ❌ | ❌ | ❌ |
| Manage users & roles | ✅ | ❌ | ❌ | ❌ |
| Configure alert rules | ✅ (all apps) | ✅ (apps in scope) | ❌ | ❌ |
| Acknowledge / resolve alert | ✅ | ✅ | ✅ (on assigned apps) | ❌ |
| Generate / export report | ✅ | ✅ | ❌ | ✅ (configured reports) |

All checks enforced server-side (route handler + data layer), not just UI gating (brief §10). UI gating is a *convenience*, never a *boundary*.

### Subscription Tiers

**Not applicable.** FlowDev is internal, not commercial. No paid tiers, no billing, no entitlements engine.

### Integration List (project-type view)

The full v1 connector inventory lives in §Product Scope. Project-type-relevant integration patterns:

- **Inbound (apps → FlowDev):** Webhook receiver, per-app HMAC-validated, returns 202 within 50ms; persistence happens out of band on the worker. Only inbound API surface in v1.
- **Outbound (FlowDev → cloud platforms):** Azure ARM / Cost Management / PG Flexible Server metrics / ACS / Blob; DO API; AWS suite (v1.1). All invoked from the background worker, never on the request path. Encrypted credentials decrypted in-process at moment of use, never logged.
- **Outbound (FlowDev → users):** Azure Communication Services for alert email and (v1.1) scheduled report email — FlowDesk pattern, same SDK.
- **No public / third-party API.** FlowDev exposes no developer API for external consumers in v1 or v1.1.

### Compliance Requirements

**Out of scope — internal tool, no regulated data.** No HIPAA / PCI-DSS / SOX / GDPR-grade obligations apply. The only PII handled is logged-in employee identifiers from monitored apps, governed by the org's internal data-retention policy per brief §10. The data-handling discipline (encrypted credentials, masked email recipients, immutable audit log, no anonymous routes) is operationalised in §Non-Functional Requirements; this subsection records the *absence* of a regulated overlay so it is not silently rediscovered downstream.

### Implementation Considerations

- **Stack inheritance from FlowDesk is mandatory** (brief §8.1) — no deviation without explicit approval. Net-new dependencies (background job runner, cloud SDKs, Key Vault helper) listed in brief §8.2 are decisions for the architect.
- **Codebase boundary:** FlowDev lives in a separate repository (`MPAMOT`); design tokens (Tailwind brand palette, Inter font, shadcn config) are re-implemented from the style guide, not vendored from FlowDesk.
- **Data layer:** PostgreSQL 15 + Prisma 6 with `@auth/prisma-adapter`. Time-series tables are normal Prisma models in v1 — TimescaleDB hyperdata tables are deferred (open question §14.2).
- **Background worker:** Out-of-process from Next.js request handlers (brief §6.2). Runner selection (BullMQ+Redis vs. Azure Container Apps Jobs vs. cron-triggered Azure Functions) is open question §14.1.
- **Dark mode:** Required at parity with light mode (brief §9). All FlowDev-specific patterns (app health pill, sparkline cells, connector-status row, time-range selector) designed in both.

---

## Functional Requirements

The capability contract for FlowDev. Every FR below must be implemented for the product to exist as the PRD describes. FRs without a phase tag are **v1**; deferred capabilities are tagged `(v1.1)` or `(v2)` inline.

### App Registry & Lifecycle

- **FR1.** ADMIN can register a new app in the portfolio with metadata: name, description, owner, environment (dev/staging/prod), hosting platform, primary URL, tech stack tags, repository link, runbook link.
- **FR2.** ADMIN can edit any field of a registered app's metadata.
- **FR3.** ADMIN can mark an app as decommissioned, retaining its historical data without continuing active monitoring.
- **FR4.** ADMIN can permanently delete a decommissioned app (subject to data-retention policy), with the action recorded in the audit log.
- **FR5.** System maintains lifecycle status (`active`, `decommissioned`) per app and exposes it on every UI surface that references the app.

### Connector Management

- **FR6.** ADMIN can attach one or more connectors to a registered app, selecting from available connector types.
- **FR7.** ADMIN can supply per-connector credentials, which the system encrypts at rest and never displays in plaintext after save.
- **FR8.** ADMIN can validate a connector's configuration — verifying credential validity and reachability — before activation.
- **FR9.** ADMIN can rotate or replace connector credentials without losing continuity of historical data.
- **FR10.** ADMIN can disable a connector temporarily and re-enable it without losing prior data.
- **FR11.** ADMIN can remove a connector permanently, with the action recorded in the audit log.
- **FR12.** System runs each enabled connector on its configured schedule, independently of UI request handling.
- **FR13.** System surfaces each connector's last-successful-run timestamp and current status on the app detail page. Status is one of: `healthy` (most recent run succeeded), `degraded` (1–4 consecutive run failures), `failing` (≥ 5 consecutive run failures **or** no successful run within the last 30 minutes — whichever fires first), `disabled` (admin-suspended), `unknown` (newly added, never run, or pending first probe). State transitions: `healthy → degraded → failing` on consecutive failures; `failing/degraded → healthy` on first successful run; `* → disabled` on admin action; `disabled → unknown → healthy/degraded` on re-enable. State changes are written to the structured log (NFR-O3).
- **FR14.** System isolates connector failures — a failed connector run does not block other connectors, the request path, or dashboard rendering.
- **FR14a.** HMAC-validation failures on the webhook receiver (FR15) **do not** count toward a connector's consecutive-failure threshold (FR13). They are logged separately under NFR-O4 and reflected in a per-app "failed webhook attempts" counter; only successful HMAC validation followed by processing failure counts against connector status.
- **FR15.** A monitored app can push events to its unique authenticated webhook URL; the system validates each request via per-app HMAC + per-app secret.
- **FR16.** ADMIN can rotate a per-app webhook secret, invalidating prior signatures and providing a new secret for distribution.

### Operational Telemetry (Uptime, Performance, Resource Growth)

- **FR17.** System probes each registered app's HTTP health endpoint on a configurable schedule (default 60s), recording status code, response time, and success/fail outcome.
- **FR18.** System computes per-app uptime percentages over rolling windows (24h, 7d, 30d, 90d, custom).
- **FR19.** ADMIN, MANAGER, or DEVELOPER (on assigned apps) can view per-app uptime trends over a selected time range.
- **FR20.** System collects database performance metrics (CPU %, active connections, storage used, slow query count) for each app whose connectors include PostgreSQL metrics.
- **FR21.** System collects HTTP response-time series from probe results.
- **FR22.** System captures resource-growth snapshots on a daily cadence — DB storage size and configured table row counts (v1); Blob storage size and object counts **(v1.1)**.
- **FR23.** ADMIN, MANAGER, or DEVELOPER (on assigned apps) can view resource-growth trends over a selected time range.
- **FR24. (v1.1)** System collects per-app server CPU and memory metrics where the host platform exposes them.

### Adoption & Activity Tracking

- **FR25.** System records login activity events per app, sourced from the per-app webhook receiver, capturing user identifier, timestamp, and per-app metadata.
- **FR26.** System computes per-app login count and DAU / WAU / MAU on rolling daily, weekly, and monthly windows.
- **FR27.** System maintains last-active-at per known user identifier per app.
- **FR28.** ADMIN, MANAGER, or DEVELOPER (on assigned apps) can view adoption trends and active-user counts over a selected time range.
- **FR29. (v1.1)** System aggregates cumulative user-growth charts per app and across the portfolio.
- **FR30. (v1.1)** System records third-party integration-call events per app via the webhook contract — call volume, latency, error rate, last-failure timestamp.
- **FR31. (v1.1)** ADMIN, MANAGER, or DEVELOPER (on assigned apps) can view per-integration health for each registered app.

### Cost Intelligence

- **FR32.** System collects per-app cost data from each cloud-platform billing connector on an hourly cadence.
- **FR33.** System attributes per-app cost by cloud-platform service line (compute, storage, database, email, etc.).
- **FR34.** System displays all cost values in ZAR, applying the configured FX source for USD-billed platforms, and discloses the source currency + FX rate alongside.
- **FR35.** ADMIN or MANAGER can view per-app month-to-date cost.
- **FR36.** ADMIN or MANAGER can view monthly cost trend per app over a selected time range.
- **FR37.** ADMIN or MANAGER can view portfolio-wide cost rollup over a selected time range.
- **FR38.** System computes a forecast of total cost for the current billing period per app and for the portfolio, displaying the forecast with its data-freshness disclosure (count of complete days of data + last refresh timestamp).
- **FR39.** DEVELOPER can view cost data when ADMIN has enabled the global "DEVELOPERs see cost" toggle (v1); per-app cost-visibility-per-role policy **(v1.1)**.
- **FR40. (v1.1)** ADMIN or MANAGER can configure budget thresholds per app, with breach alerts via configured channels.
- **FR41. (v1.1)** ADMIN can apply manual cost-share attribution rules for shared resources spanning multiple apps.

### Communication & Email Monitoring

- **FR42.** System collects outbound email metrics (volume sent, delivery rate, bounce rate, complaint rate where exposed) per app via Azure Communication Services connectors (v1) and Resend connectors **(v1.1)**. AWS SES email metrics are collected through the AWS suite **(v1.1)**, not a standalone connector.
- **FR43.** ADMIN, MANAGER, or DEVELOPER (on assigned apps) can view email-volume and delivery-rate trends over a selected time range.
- **FR44.** System masks email recipient addresses by default in the UI; un-masking is an explicit user action recorded in the audit log.
- **FR45. (v1.1)** ADMIN, MANAGER, or DEVELOPER (on assigned apps) can search a recent-sends log per app, with masked recipients by default.

### Dashboards & Reporting

- **FR46.** ADMIN, MANAGER, DEVELOPER, and (v2) VIEWER can view a portfolio dashboard showing every app within their access scope, with per-app current health, today's spend, today's logins, and current alert count.
- **FR47.** ADMIN, MANAGER, DEVELOPER, and (v2) VIEWER can drill into an app-detail dashboard showing uptime, cost, adoption, resource growth, communications, integration health, and recent alerts on the FlowDesk Detail Page (2/3 + 1/3) layout.
- **FR48.** Users with dashboard access can change the time range applied to dashboard charts via a consistent time-range selector (24h, 7d, 30d, 90d, custom).
- **FR49. (v1.1)** ADMIN or MANAGER can view cross-cutting portfolio dashboards (cost trend, uptime trend, adoption trend) across all registered apps.
- **FR50.** ADMIN or MANAGER can generate on-demand reports — uptime, cost, adoption, or combined portfolio — over a selected date range, scoped to a single app or the whole portfolio.
- **FR51.** ADMIN or MANAGER can export any generated report as CSV.
- **FR52. (v1.1)** ADMIN or MANAGER can schedule a recurring report (e.g. monthly portfolio report on the 1st) for delivery via email.
- **FR53. (v2)** ADMIN or MANAGER can export reports as PDF.

### Alerting

- **FR54.** ADMIN can configure alert rules globally; MANAGER can configure alert rules for apps within their scope. Rule types in v1: uptime-threshold, cost-MTD-threshold, email-bounce-rate. **(v1.1)** adds generic-threshold rules, DB-storage-threshold rules, and budget-breach rules.
- **FR55.** System evaluates active alert rules against incoming telemetry and creates an alert event when a rule's condition is met.
- **FR56.** System maintains alert lifecycle state per event: `firing` → `acknowledged` → `resolved`.
- **FR57.** ADMIN, MANAGER, or DEVELOPER (on assigned apps) can acknowledge a `firing` alert, transitioning it to `acknowledged`, with the action recorded in the audit log.
- **FR58.** ADMIN, MANAGER, or DEVELOPER (on assigned apps) can resolve a `firing` or `acknowledged` alert, transitioning it to `resolved`, with the action recorded in the audit log.
- **FR59.** System delivers alert notifications via in-app notification bell and Azure Communication Services email (v1). **(v2)** Microsoft Teams webhook + SMS channels.
- **FR60.** ADMIN, MANAGER, and DEVELOPER receive in-app alert notifications scoped to their role and assigned apps.

### Identity, Access & Audit

- **FR61.** A team member can authenticate via Azure Entra ID single sign-on.
- **FR62.** A team member can authenticate via local credentials when SSO is unavailable (development / fallback path).
- **FR63.** ADMIN can invite, modify, or remove FlowDev users.
- **FR64.** ADMIN can assign a role (ADMIN, MANAGER, DEVELOPER) to each user. **(v2)** VIEWER role available.
- **FR65.** ADMIN can assign DEVELOPER users to one or more apps for scoped access.
- **FR66.** System enforces role-based access control on every route handler and data-access path, not only in the UI.
- **FR67.** System records every mutation to apps, connectors, credentials, alert rules, and user roles in an immutable audit log.
- **FR68.** ADMIN can search and filter the audit log by actor, action type, target entity, and time range.
- **FR69.** System logs audit events for credential un-masking, alert acknowledgement and resolution, webhook secret rotation, and user-role changes.

### Coverage Cross-Check

| Brief §5 capability / cross-cutting | FRs |
|---|---|
| §5.1 App Registry | FR1–FR5 |
| §5.2 Connectors | FR6–FR16 |
| §5.3 Uptime | FR17–FR19 |
| §5.4 Performance | FR20, FR21, FR24 |
| §5.5 Adoption | FR25–FR29 |
| §5.6 Resource Growth | FR22, FR23 |
| §5.7 Cost Intelligence | FR32–FR41 |
| §5.8 Email Monitoring | FR42–FR45 |
| §5.9 Integration Health | FR30, FR31 (v1.1) |
| §5.10 Dashboards | FR46–FR49 |
| §5.11 Reporting | FR50–FR53 |
| §5.12 Alerting | FR54–FR60 |
| Brief §4 Auth / RBAC | FR61–FR66 |
| Brief §10 Audit | FR67–FR69 |
| Webhook contract (Journey 6, §14.3) | FR15, FR16 |
| Forecast freshness disclosure (Step 8 T5 mitigation) | FR38 |

---

## Non-Functional Requirements

Brief §10 (Security & Privacy) and §11 (Non-Functional Requirements) consolidated into testable, measurable form. Categories that don't apply (regulatory compliance — addressed in Step 5 skip; localisation beyond `en-ZA` already specified) are omitted.

### Performance

- **NFR-P1.** Portfolio dashboard renders in **< 2s warm-cache** for ≤ 50 apps (brief §11).
- **NFR-P2.** App detail dashboard renders in **< 2.5s warm-cache** at v1 scale.
- **NFR-P3.** Webhook receiver responds with `202` within **50ms p95 at 50 RPS sustained** for valid requests; `401` within **50ms p99** for HMAC-invalid requests at the same load. Persistence happens out of band on the worker (see FR12, NFR-I1).
- **NFR-P4.** HTTP uptime probes execute within **±10s of scheduled time at p95** (brief §11).
- **NFR-P5.** On-demand report generation (combined portfolio, one-month range) completes in **< 60s** at v1 scale (brief §3 goal #4).
- **NFR-P6.** Time-range selector switches re-fetch dashboard data in **< 1s warm-cache**.
- **NFR-P7.** Client-side interaction lag stays under the **100ms perception threshold**.

### Reliability & Availability

- **NFR-R1.** FlowDev's own availability target **≥ 99.5%** (brief §11).
- **NFR-R2.** **A FlowDev outage must never degrade any monitored app.** FlowDev is never on the request path of a monitored app's user — webhook delivery is fire-and-forget from the app's perspective.
- **NFR-R3.** Connector failures are isolated — one failing connector does not block other connectors, the worker queue, or UI rendering.
- **NFR-R4.** Background worker retries failed connector runs with exponential backoff (initial 30s, factor 2, max 30min, max 5 attempts per scheduled run). A connector transitions to `failing` status (per FR13) on **≥ 5 consecutive run failures** OR **no successful run in the last 30 minutes**, whichever fires first. The status change does not stall the queue; the connector continues to be scheduled.
- **NFR-R5.** PostgreSQL backups via Azure Flexible Server's managed backup (brief §11). RPO ≤ 24h.

### Security

- **NFR-S1.** All connector credentials encrypted at rest with a key sourced from **Azure Key Vault**. Plaintext credentials never logged. Decrypted only in-process at moment of use.
- **NFR-S2.** Authentication enforced on every route handler. Edge middleware uses `getToken()` (FlowDesk pattern). Anonymous endpoints (with no session-based auth) limited to: SSO callbacks, credentials-login, and per-app HMAC-validated webhook receivers. **The webhook route (`/webhooks/<app-token>`) MUST NOT be wrapped in `auth()` or any session middleware** — it is authenticated solely via per-app HMAC + signed timestamp (NFR-S4). Wrapping it in session auth would break Journey 6 and is a configuration error.
- **NFR-S3.** Authorisation (RBAC) enforced server-side on every route handler and data-access path — never only at the UI layer (brief §10).
- **NFR-S4.** Webhook authentication: per-app secret + HMAC signature on every inbound request. Replay protection via signed timestamp; requests > 5 minutes outside server time rejected.
- **NFR-S5.** Email recipient addresses masked by default in the UI; un-masking is an explicit user action recorded in the audit log.
- **NFR-S6.** Audit log is immutable — no API or UI surface mutates or deletes audit entries.
- **NFR-S7.** TLS on all inbound and outbound HTTP. HSTS enabled. Certificates auto-managed by Azure Container Apps.
- **NFR-S8.** No anonymous public exposure: global `noindex`, `nofollow`; deny-all `robots.txt`.
- **NFR-S9.** User passwords from monitored apps are never stored, transmitted, or processed by FlowDev.
- **NFR-S10.** Pen-test or threat-model review passes before v1 GA.

### Scalability

- **NFR-SC1.** v1 supports **50 registered apps, 200 connectors, 90 days raw data retention** at the stated dashboard SLO (brief §11).
- **NFR-SC2.** v2 target: **200 apps, 1000 connectors** (brief §11).
- **NFR-SC3.** Adding a new cloud platform requires writing a connector module against the established interface, with **no changes outside the connector module** — operationalises brief §3 goal #5 ("< 2 weeks of dev effort").
- **NFR-SC4.** Time-series queries against hourly/daily aggregate tables stay under **500ms p95** at v1 scale. Raw-table queries are scoped to time windows ≤ 24h.
- **NFR-SC5.** Worker job throughput: all scheduled connector runs complete within their nominal cadence at v1 scale (no perpetual backlog).

### Accessibility

- **NFR-A1.** **WCAG 2.1 AA** conformance across all FlowDev surfaces (operationalises brief §9).
- **NFR-A2.** Keyboard navigation operates end-to-end for every primary user task in Journeys 1–5.
- **NFR-A3.** Focus is visible on every interactive element via the `--ring` token.
- **NFR-A4.** No information conveyed by colour alone — every state pill (app health, alert state, connector status) carries both colour and text label.
- **NFR-A5.** Recharts visualisations on the App detail page are paired with screen-reader-friendly tabular data fallbacks.
- **NFR-A6.** Accessibility audit completes successfully before v1 GA.

### Integration

- **NFR-I1.** All outbound platform-API calls (Azure ARM / Cost Management / PG metrics / ACS / Blob; DO API; AWS suite v1.1 incl. SES; Resend v1.1; PostgreSQL direct) execute from the background worker, **never on the request path**.
- **NFR-I2.** Outbound API calls implement rate-limit and retry handling per each platform's documented limits, with backoff strategies that do not exhaust quota.
- **NFR-I3.** Webhook contract versioned via `X-FlowDev-Webhook-Version` header from v1. Backward-compatible additions are non-breaking; breaking changes require a version bump.
- **NFR-I4.** All outbound emails (alert email v1; scheduled report email v1.1) sent via Azure Communication Services. SMTP is not used.

### Observability (of FlowDev itself)

- **NFR-O1.** FlowDev produces **structured JSON logs** from API routes and the background worker (brief §11).
- **NFR-O2.** Correlation IDs propagated across request boundaries (browser → API → worker job).
- **NFR-O3.** Connector run results (success/failure, duration, records collected) are written to a structured log retained ≥ 30 days.
- **NFR-O4.** Webhook receiver logs validation failures (without payload contents) for security review.

### Data Retention

- **NFR-D1.** Default retention: **raw probe/metric data 90 days; hourly aggregates 1 year; daily aggregates indefinite** (brief §6.4 — confirmed in §Open Questions §14.7).
- **NFR-D2.** ADMIN can configure per-app retention overrides within the defaults' bounds (cannot reduce audit-log retention).
- **NFR-D3.** Audit log retention: indefinite, no automatic pruning.
- **NFR-D4.** Each `CostRecord` snapshot (FR32–FR34) captures the FX rate that applied at collection time, the FX source (`SARB` v1; see §Open Questions §14.4), the source currency, and the source amount. Historical reports use the rate captured at snapshot time, not today's rate. If the FX source has been unreachable for > 24h, the snapshot stores `is_stale: true` along with the most recent successfully-captured rate, and the cost UI surfaces a stale-rate badge.

### Browser, Theme & Locale

- **NFR-B1.** Latest two major versions of **Chrome, Edge, Firefox, Safari** supported (brief §11).
- **NFR-B2.** **Light and dark themes** both pass functional and accessibility checks.
- **NFR-B3.** HTML `lang="en-ZA"`. Dates formatted via date-fns en-ZA locale (`dd MMM yyyy`). Currency formatted in ZAR via shared `formatZAR()` helper. USD-source values display ZAR primary + USD sub-label per Step 7 / brief §9.

---

## Risks & Mitigations

Hoisted to top-level so downstream consumers (architect, dev, ops) can address it independently. Open questions cross-referenced here are resolved or scoped in §Open Questions & PM Decisions.

### Technical Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| T1 | **Connector abstraction leaks.** The unified `collect()` / `healthCheck()` / `validateCredentials()` interface gets bloated handling Azure Cost Mgmt vs. DO billing vs. AWS vs. webhook semantics, breaking the "add a new platform without rewriting" promise. | Medium | High | Build v1 connectors in deliberate order — **HTTP probe → Azure ARM → DO API → Azure Cost Mgmt** — exercising the interface from maximally different angles before locking shape. If it survives those four, AWS in v1.1 will not surprise the abstraction. |
| T2 | **Time-series volume on plain PostgreSQL.** ~78M raw probe records over 90 days at v1 scale (50 apps × 200 connectors × 60s probes); portfolio dashboards may not stay under 2s without aggregation discipline. | Medium | High | Architect designs **hourly + daily aggregate tables** from day one. Portfolio queries hit aggregates, not raw. TimescaleDB migration deferred to v2 (§14.2). Re-evaluate at 60-day gate. |
| T3 | **Background-worker selection** (§14.1) — wrong choice between BullMQ+Redis / Azure Container Apps Jobs / cron-triggered Azure Functions costs weeks of rework. | Medium | High | PM-constrained architect choice with explicit ACs (§14.1). Default lean: Azure Container Apps Jobs; tripwire criteria escalate to BullMQ+Redis. Constraint reaffirmed: worker runs out-of-band from request handlers. |
| T4 | **Webhook contract is one-shot.** Once Flow* apps adopt v1 of the contract (§14.3), breaking changes are organisationally expensive. | Medium | Medium | Version the contract from day one (`X-FlowDev-Webhook-Version: 1`). Spec includes idempotency key, retry semantics, clock-skew tolerance, HMAC signing input, and a "Sender's guide" — published as a separate doc artefact alongside the PRD before connector work begins. |
| T5 | **Cost forecast on stale Azure cost data.** Forecast (in v1) projects on data that lags by hours (§14.5). Inaccurate forecasts erode trust in the cost feature broadly. | Medium | Medium | Forecast UI displays data-freshness disclosure inline (NFR-D4 captures the rate-and-timestamp; FR38 mandates the disclosure). Linear projection in v1; switch to weighted methodology in v1.1 if accuracy is poor. |
| T6 | **Connector failure cascades.** A failing connector (e.g. expired Azure credential) blocks the worker queue or contaminates dashboard data. | Medium | High | Connector fault isolation enforced by FR13 state machine + NFR-R3/R4. Failed runs logged + surfaced in connector-status row; never block the request path; never affect other connectors. HMAC-validation failures explicitly excluded from the connector-failure threshold (FR14a). |

### Adoption Risks (internal, in lieu of market risks)

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| A1 | **App owners don't wire the webhook.** Adoption analytics depends on monitored apps pushing events; a launched app that skips webhook setup shows zero logins forever, eroding trust in the data. | High | Medium | Webhook setup is an explicit step in Journey 3. Connector-status row warns if no webhook events received within N days of registration. Auto-discovery is v1.1 if friction surfaces (§14.8). |
| A2 | **Cost attribution is blurry for shared resources.** Per-app attribution depends on resource-group-per-app convention; shared resources cause attribution gaps. | Medium | High | Document the resource-group-per-app convention as part of onboarding (Journey 3). Manual cost-share attribution rules added in v1.1 (FR41). v1 limitation surfaced explicitly: "shared-resource costs not yet attributed." |
| A3 | **DEVELOPER role cost-visibility policy is undefined** (brief §10 leaves it "configurable"). | Medium | Medium | v1 ships a single global toggle (FR39): "DEVELOPERs see cost data: yes / no." Default off (conservative). Per-app cost-visibility-per-role is v1.1. |

### Resource Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | **Solo build velocity dictates scope.** With one primary developer, scope creep is the dominant existential risk. | High | High | The v1 cut prunes 5 of 12 capabilities. Discipline is *the* mitigation. Stack inheritance from FlowDesk (auth, UI, deploy, locale) absorbs ~30% of greenfield-equivalent effort. |
| R2 | **AWS connector v1.1 timing depends on AWS hosting going live.** If AWS slips, v1.1 ships shorter or in two cuts. | Medium | Low | AWS suite isolated as v1.1 contingent. Other v1.1 items (SendGrid, Blob, integration health, scheduled reports, budget alerts) ship independently — v1.1a (no AWS) and v1.1b (AWS-inclusive) is acceptable if needed. |
| R3 | **Open-question backlog** blocks architecture phase. | Medium | Medium | All eight open questions are now scoped in §Open Questions & PM Decisions with status tags. Three are v1-blocking (§14.1, §14.3, §14.6). The rest are tunable, tactical, or decided. |

---

## Open Questions & PM Decisions

The eight open questions from brief §14, each with status, decision (or scoped deferral), constraints for the architect, and v1.1 portability note where Azure-coupled.

**Status legend:**
- **DECIDED** — PM has made the call; architect implements within the decision.
- **PM-CONSTRAINED-ARCHITECT-CHOICE** — architect picks among options against PM-stated criteria/ACs.
- **ARCHITECT-PENDING** — open for the architect, with PM-supplied constraints.
- **PM-PROXY-PENDING-SIGN-OFF** — PM has made a provisional call as proxy for an unstaffed stakeholder role; revisit when that owner is named.
- **TUNABLE-POST-LAUNCH** — operating decision, revisit at 60-day gate.

> **Note on PM proxying.** No dedicated security stakeholder is presently assigned to FlowDev; the PM (Don) is acting as security proxy on §14.6. This is recorded so a future security owner inherits the full decision context.

### §14.1 — Background job framework

**Status:** PM-CONSTRAINED-ARCHITECT-CHOICE · v1-blocking.

**Question:** BullMQ+Redis vs. Azure Container Apps Jobs vs. cron-triggered Azure Functions for the connector scheduler.

**PM-stated default:** **Azure Container Apps Jobs** — boring choice, same platform as the Next.js app, same IaC, same observability surface, zero new operational overhead. Fits the FlowDesk-inherited Azure deployment pattern.

**Architect must validate against three acceptance criteria:**
1. **Observability parity:** scheduled-job failure visibility ≥ what a queue-based system (BullMQ) would give. A silently-non-scheduled Job is unacceptable for an ops tool. Must include alerting on missed run cadence.
2. **Cold-start within polling SLA:** ACA Jobs cold-start + connector run completes within the configured cadence (default 60s for HTTP probe). If cold-start eats > 10% of the cadence at v1 scale, escalate.
3. **Headroom for v1.1 connector count:** when AWS lands and connector count likely doubles, the runner choice must accommodate without re-platforming.

**Tripwire criteria — escalate to BullMQ+Redis if any of:**
- Job graph depth > 2 with shared state between stages (e.g. collect → transform → alert in chained order).
- Sub-minute scheduling required for any connector (none in v1; flag if v1.1 needs it).
- > 50 concurrent jobs requiring coordination, distributed locks, or fan-out beyond ACA Jobs' native primitives.

**Cron-triggered Azure Functions:** **rejected**. Wrong abstraction for stateful pollers; separates connector code from the Next.js codebase.

**Architectural invariant (PRD-pinned):** connector execution is invokable from both the Next.js dev server (in-process for local testing) and the scheduled job runner against the **same TypeScript entrypoint**, with identical observable behaviour. Architect picks the monorepo shape (e.g. `packages/connectors/*` consumed by `apps/web` and `apps/jobs`); PRD locks the invariant.

**Job semantics architect must define:** what a "job" is (one connector run per app, or per-connector-type fan-out); retry budget (initial backoff, factor, max attempts) — see NFR-R4 for the failure-state thresholds the runner must respect.

**v1.1 portability impact:** ACA Jobs is Azure-native. If the v1.1 AWS push extends *beyond* monitoring AWS resources to *running FlowDev itself* on AWS, the runner choice must port. BullMQ+Redis is portable; ACA Jobs is not. Re-evaluate if a multi-host FlowDev deployment becomes a goal.

**Body cross-reference:** Implementation Considerations (§Web Application Project-Type Specific Requirements); NFR-R4; T3.

### §14.2 — TimescaleDB

**Status:** DECIDED · TUNABLE-POST-LAUNCH.

**Question:** adopt for v1, or defer until volume demands it.

**Decision:** **Defer to v2.** v1 ships on plain PostgreSQL with hourly + daily aggregate tables (T2 mitigation; NFR-SC4 query budget). NFR-SC1 scale (~78M raw records over 90 days) is comfortably within plain Postgres limits with aggregation discipline.

**Re-evaluation trigger:** 60-day learning gate. Migration is justified if NFR-SC4 (raw-table query p95 < 500ms at v1 scale) breaches in production.

**v1.1 portability impact:** None — TimescaleDB extension is available on Azure Flexible Server PG and AWS RDS for PostgreSQL. Migration path is portable.

**Body cross-reference:** NFR-SC4; T2.

### §14.3 — Standard webhook contract

**Status:** ARCHITECT-PENDING · v1-blocking.

**Question:** exact JSON shape and protocol monitored apps use to push events.

**PM-supplied constraints (architect designs the spec; publishes as a versioned doc artefact alongside the PRD before connector work begins):**

**Authentication & integrity:**
- HMAC-SHA256 signature in `X-FlowDev-Signature` header.
- **Signing input (canonical string):** `<version> "." <timestamp> "." <raw_request_body>` — the raw bytes, not a re-serialised JSON. Architect documents the exact construction and provides a worked fixture (signing-input bytes → expected hex digest) in the spec.
- `X-FlowDev-Webhook-Version: 1` header from day one (NFR-I3).
- Per-app secret stored encrypted at rest (NFR-S1); rotatable via FR16.
- Per-app URL pattern: `/webhooks/<app-token>` — `app-token` is opaque non-secret (the secret is server-side; URL token is for routing only).

**Replay protection:**
- Signed `timestamp` field in payload, **Unix seconds** (integer).
- Server rejects requests where `|server_now − payload_timestamp| > 5 minutes`. Skew tolerance is server-clock vs payload-clock; architect documents NTP expectation for senders.
- Replay (same signature + timestamp received twice within window): **idempotent on receive** — server returns 202 and writes the event only if its `event_id` is not already persisted (see Idempotency below).

**Idempotency:**
- Each event payload includes `event_id` (UUID v4, sender-generated).
- Server stores `event_id` per app for the replay window plus a 5-minute buffer; duplicate `event_id` → 202 + drop (no double-write).
- Senders MUST generate a stable `event_id` before first send and reuse it on retry.

**Retry / failure semantics (PRD-mandated, architect documents in spec):**
- 2xx → accepted, do not retry.
- 4xx → reject, do not retry (client error: bad signature, malformed payload, version mismatch, payload too large).
- 5xx → retry with exponential backoff (sender-recommended: initial 30s, factor 2, max 30 min, max 5 attempts).
- HMAC-invalid → 401 (do not retry).
- Unknown app-token → 404 (do not retry).
- Replay window exceeded → 400 (do not retry; sender clock drift).
- Idempotent-replay (same `event_id` accepted earlier) → 202.

**Payload schema:**
- Common envelope: `{ event_id, event, timestamp, app_id, version, data }`.
- `event` is a string; v1 reserved values are `login`, `integration_call`, `custom_metric`, but parsers must not error on unknown values (forward compatibility).
- `data` is event-typed: architect publishes a per-event-type schema in the spec (login data shape; integration_call data shape; custom_metric data shape).
- Reserved-fields convention documented for forward-compatible additions.
- Maximum **request body** size: **16 KB** (pre-decompression; reject larger with 413).

**Receiver SLOs (testable):**
- Valid request → 202 within 50ms p95 at 50 RPS sustained (NFR-P3).
- Invalid HMAC → 401 within 50ms p99 at the same load.
- Persistence happens out of band on the worker (FR12, NFR-I1); receiver does not block on database write.

**Auth boundary:**
- The webhook route (`/webhooks/<app-token>`) is **NOT** wrapped in session auth — authentication is purely HMAC + timestamp (NFR-S2). Wrapping it in `auth()` is a configuration error.

**Sender's Guide (architect deliverable):**
- The spec includes a "Sender's guide" sub-section reframing the same constraints from the implementer's perspective: what to send, what to expect back, how to debug. Includes worked example HMAC payload + expected signature for fixture-driven implementation. Mandatory before any monitored app integrates.

**Sender observability (FlowDev side):**
- FlowDev exposes a per-app "last 50 webhook deliveries" diagnostic view (App detail page, ADMIN-visible) showing timestamp, status code, signature-validation result, idempotency outcome — for senders debugging their own integrations. v1 in-scope; reduces support load.

**v1.1 portability impact:** None. The contract is HTTP + HMAC, sender-agnostic and platform-agnostic.

**Body cross-reference:** FR15, FR16, FR14a, NFR-S2, NFR-S4, NFR-P3, NFR-I3; Journey 6; T4.

### §14.4 — FX rate source

**Status:** DECIDED · TACTICAL.

**Question:** for converting USD-billed platforms to ZAR.

**Decision:** **SARB (South African Reserve Bank) daily rate via the public API**, with snapshot semantics fixed in NFR-D4:
- One blended daily rate; not intraday.
- Captured rate stored alongside each cost snapshot — historical reports use the rate that applied at the time, not today's.
- "Rate: ZAR/USD = X.XX (SARB, YYYY-MM-DD)" disclosure surfaces alongside every USD-source value.
- If SARB API unreachable > 24h: snapshot stores `is_stale: true` with the most recent successfully-captured rate; cost UI surfaces a stale-rate badge.

**Fallback path:** commercial FX feed if SARB API reliability is < 99% over the 60-day evaluation window. Cost: small.

**v1.1 portability impact:** None — SARB is a generic public API; same conversion logic applies regardless of cloud host.

**Body cross-reference:** FR34, NFR-D4.

### §14.5 — Cost data freshness expectations

**Status:** DECIDED · TUNABLE-POST-LAUNCH.

**Question:** Azure cost APIs lag by hours; what is operator tolerance?

**Decision:** **Hours-level lag is acceptable.** Cost data is "fresh" if last refresh < 12 hours ago. The forecast UI must surface lag inline (T5 mitigation; FR38) so user expectations are calibrated rather than hidden.

**Re-evaluation trigger:** 60-day gate if operator feedback indicates the lag is materially blocking the cost-question SLO (User Success target: < 10s to answer "what is app X costing this month").

**v1.1 portability impact:** AWS Cost Explorer also has lag (~24h for granular data). The 12h target may need to relax for AWS-attributed costs; surface differently in the UI ("AWS data refreshed N hours ago") rather than treating both clouds identically.

**Body cross-reference:** FR32, FR38, T5.

### §14.6 — Per-app credential scoping

**Status:** PM-PROXY-PENDING-SIGN-OFF · v1-blocking · *Don is acting as security proxy; revisit when a security owner is staffed.*

**Question:** is one shared Azure subscription credential acceptable for v1, or does each app get its own service principal?

**PM intent (decided):** **Per-app credential isolation, encrypted at rest via Azure Key Vault, decrypted only in-process at moment of use.** The principle is locked: blast radius isolation + independent rotation. This is the security boundary brief §10 implies and NFR-S1 operationalises.

**Architect execution (open):** two viable provisioning models, architect chooses based on operational tooling and onboarding-friction trade-off — security-stakeholder review when one is named.

| Option | Granularity | Onboarding friction | Operational cost | Security posture |
|---|---|---|---|---|
| **(a) One service principal per app** | Strictest | High — every app onboarding includes SP creation | N SPs to provision, rotate, audit | Strongest blast-radius isolation |
| **(b) One SP per environment-tier per app-class** (e.g. one SP for "Azure read-only metrics across prod apps" + one for "Azure cost-mgmt across prod apps") with resource-group-level RBAC providing per-app data isolation | Cluster-scoped credential; per-app data isolation via Azure RBAC | Lower — onboarding adds an app to existing RBAC scope, not a new SP | Bounded SP count (~6–10 across env × class) | Same blast radius for the credential, narrower per-app data exposure via Azure RBAC |

**PM lean:** Option (b) for v1, **conditional on:** (i) Azure RBAC scoping at resource-group level genuinely isolates app-level access (not "all prod" lumped together); (ii) per-app rotation is not required by org policy; (iii) named security stakeholder confirms blast-radius posture acceptable. Option (a) is correct if v1 onboarding-friction tolerance is high (~10–20 minutes per app is OK) or if compliance demands strict per-app isolation.

**Architect deliverables required before v1 GA:**
- Rotation cadence (SLA) — how often credentials must rotate.
- Revocation behaviour — when an app is offboarded, SLA on credential destruction (must support FR4 audit-logged delete).
- Onboarding-time impact quantified — current FlowDesk app-registration baseline vs. FlowDev with chosen provisioning model.
- Automated rotation tooling scope — per-app SPs without rotation tooling is theatre (Mary's challenge).

**Acknowledged trade-off:** option (a) doubles or worse the onboarding effort (Journey 3); v1.1 may add an Azure-AD-side helper to streamline SP creation regardless of which option is chosen.

**v1.1 portability impact:** Per-app SP is Azure-specific. AWS equivalent is per-app IAM role (assumed via STS). Architect documents the equivalence pattern so v1.1 AWS connectors inherit the same isolation principle without re-deciding.

**Body cross-reference:** NFR-S1, NFR-S3; Journey 3; brief §10.

### §14.7 — Retention defaults

**Status:** DECIDED · TUNABLE-POST-LAUNCH.

**Question:** confirm 90 days raw / 1y hourly / indefinite daily.

**Decision:** **Confirmed as v1 default** — operationalised in NFR-D1. Per-app overrides allowed within the bounds (NFR-D2). Reviewable at the 60-day gate against actual storage growth.

**v1.1 portability impact:** None.

**Body cross-reference:** NFR-D1, NFR-D2; brief §6.4.

### §14.8 — Onboarding UX (auto-discovery vs. explicit)

**Status:** DECIDED · TACTICAL.

**Question:** how much of connector setup can be auto-discovered vs. explicitly configured?

**Decision:** **v1 is fully explicit configuration** (Journey 3 — Rashied types/pastes every value). v1.1 candidates if onboarding-friction signals appear at the 30-day gate:
- ARM resource enumeration to suggest connectable resources after Azure subscription credentials are added.
- Per-app webhook-secret auto-injection helper for newly deployed apps via env-var template.

**v1.1 portability impact:** Auto-discovery on AWS uses Resource Groups / Resource Explorer rather than ARM; architect uses the connector abstraction (T1) to keep the discovery layer per-platform.

**Body cross-reference:** Journey 3; A1.

### v1-blocking summary

Three of eight open questions block architecture-phase work until resolved:

| # | Topic | Owner | Status |
|---|---|---|---|
| §14.1 | Background job framework | Architect, against PM ACs and tripwire criteria | PM-CONSTRAINED-ARCHITECT-CHOICE |
| §14.3 | Webhook contract spec (separate doc artefact) | Architect, against PM constraints | ARCHITECT-PENDING |
| §14.6 | Per-app credential scoping (provisioning model) | Architect + future security owner | PM-PROXY-PENDING-SIGN-OFF |

The other five (§14.2, §14.4, §14.5, §14.7, §14.8) are decided, tunable, or tactical.

---

## Decisions Log

Append-only chronological record of consequential decisions. Captures *how we got here* — sister section to §Open Questions, which captures *current state*.

| Date | Decision | Rationale | Source |
|---|---|---|---|
| 2026-04-28 | Cost forecasting promoted from v1.1 to v1 (FR38, §Product Scope §5.7) | PM direction during Step 3 scope review; budget thresholds + breach alerts remain v1.1 | Don, PRD Step 3 |
| 2026-04-28 | Project framing corrected: monitored apps are "MPAMOT apps" / "the portfolio," not "Flint apps" | Don's email domain does not define product scope; brief uses neutral language | Don, PRD Step 2b correction |
| 2026-04-28 | Compliance Requirements subsection retained as one-liner stating absence (not deleted) | Mary (party-mode) flagged that silent deletion leaves an auditable gap; absence-statement is documented record | Don, party-mode review |
| 2026-04-28 | §14.1 reframed from PM-lean to PM-constrained architect choice with three explicit ACs + tripwire criteria | Mary + Winston (party-mode) — verdict requires ACs the architect can validate; criteria-not-verdict gives the architect a tripwire | Party-mode review |
| 2026-04-28 | §14.3 webhook contract constraints expanded with idempotency key, retry/failure semantics, clock-skew tolerance, HMAC signing-input definition, payload-per-event-type schema, p95 load floor, sender's-guide requirement, sender observability view | All three party-mode reviewers — original draft was not implementer-buildable without back-channel | Party-mode review |
| 2026-04-28 | §14.6 split into PM-decided intent (per-app credential isolation) + architect-pending execution (SP provisioning model: option-(a) vs. option-(b) middle-path) | Winston + Mary — implementation choice was overcooked as a single PM decision; security-stakeholder review needed (PM acting as proxy) | Party-mode review |
| 2026-04-28 | Connector failure-state machine pinned in FR13 + FR14a (HMAC failures excluded from threshold) | Amelia (party-mode) — testability requires explicit states + transitions | Party-mode review |
| 2026-04-28 | NFR-R4 expanded with concrete window (≥ 5 consecutive failures OR no success in last 30 minutes) and retry policy (initial 30s, factor 2, max 30min, max 5 attempts) | Amelia — original spec was untestable | Party-mode review |
| 2026-04-28 | NFR-D4 added: per-CostRecord FX-rate snapshot semantics, source attribution, stale-flag behaviour | Amelia — without this, cost-history tests are undefined | Party-mode review |
| 2026-04-28 | NFR-S2 strengthened with explicit "webhook route MUST NOT be wrapped in session auth" | Amelia — flagged as a likely implementation pitfall | Party-mode review |
| 2026-04-28 | Risks & Mitigations extracted to top-level section after NFRs | Mary, Winston, Amelia — risks are not scope; deserve standalone surface | Party-mode review |

---

## Document Handoff

This PRD is the top of the BMAD funnel for FlowDev. The next artefacts are produced by separate skills consuming defined slices of this document.

### Decision-status legend (appears in §Open Questions)

| Tag | Meaning | Who acts |
|---|---|---|
| `DECIDED` | PM has made the call | Architect implements |
| `PM-CONSTRAINED-ARCHITECT-CHOICE` | Architect picks among options against PM ACs | Architect, then back to PM for validation |
| `ARCHITECT-PENDING` | Open for architect with PM constraints | Architect designs spec (often a separate doc) |
| `PM-PROXY-PENDING-SIGN-OFF` | PM made provisional call as proxy for unstaffed role | Revisit when stakeholder named |
| `TUNABLE-POST-LAUNCH` | Operating decision | Re-evaluate at 60-day gate |
| `TACTICAL` | Local optimisation, not strategic | Architect or PM as scoped |

### Downstream consumer map

| Consumer | Sections required for their work |
|---|---|
| **UX Designer** (`bmad-create-ux-design`) | §Executive Summary; §Success Criteria → User Success; §User Journeys (all six); §Functional Requirements (capability contract); §Web Application Project-Type Specific Requirements (Responsive Design, Accessibility, RBAC Matrix); §Open Questions §14.8 (onboarding UX) |
| **System Architect** (`bmad-create-architecture`) | §Project Classification; §Product Scope; §Functional Requirements; §Non-Functional Requirements (all); §Risks & Mitigations (Technical Risks); §Open Questions §14.1, §14.2, §14.3, §14.6 (v1-blocking) and §14.4, §14.5, §14.7 (operational); §Web Application Project-Type Specific Requirements (Technical Architecture, Tenancy, Implementation Considerations) |
| **Tech Writer** (`bmad-agent-tech-writer`) | §Executive Summary; §User Journeys; §Open Questions §14.3 (webhook contract Sender's Guide derives from this); §Document Handoff |
| **Senior Software Engineer** (`bmad-agent-dev`) | §Functional Requirements; §Non-Functional Requirements; §Open Questions §14.3 + §14.6 (test fixtures derive from these); §Risks & Mitigations |
| **Operations / on-call** | §Non-Functional Requirements (Reliability, Observability, Data Retention); §Risks & Mitigations; §Open Questions §14.5 (cost-data freshness operator tolerance) |

### Canonical artefacts

The PRD lives alongside its source brief, tech stack, and style guide in `_bmad-output/planning-artifacts/`:

- `product-brief.md` — source brief (treated as authoritative input for the PRD)
- `tech-stack.md` — FlowDesk tech stack reference (FlowDev MUST conform per brief §8)
- `style-guide.md` — FlowDesk visual + UX style guide (FlowDev MUST conform per brief §9)
- `PRD.md` — *this document*

The architect will produce a separate webhook-contract spec referenced in §14.3 (delivered before connector implementation begins).

### Document metadata

- **Author:** Don (PM) · **Date:** 2026-04-28
- **Source brief:** `_bmad-output/planning-artifacts/product-brief.md`
- **Polish reviewers:** Winston (architect), Mary (analyst), Amelia (dev) — party-mode round 1, 2026-04-28
- **PRD version:** v1.0 (post-polish)
- **Next action:** Step 12 — workflow completion + handoff to architecture phase
