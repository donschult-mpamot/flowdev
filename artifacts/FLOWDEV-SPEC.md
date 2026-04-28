# FlowDev — Application Specification

> **Project Brief / Handoff Document**
> This document is the high-level overview of FlowDev, intended as the starting context for the BMAD analyst → PM → architect chain in Claude Code. It describes *what* FlowDev is and *what* it should do. The detailed PRD, architecture, and implementation plans will be developed by the BMAD process from this brief.

---

## 1. Project Context

| Item | Value |
|------|-------|
| **Project Name** | FlowDev |
| **Project Code** | MPAMOT (Multi-Platform Application Monitoring & Operations Tool) |
| **GitHub Repository** | `MPAMOT` under the `donschult-mpamot` GitHub account |
| **Sister Product** | **FlowDesk** — internal work item / project management system. FlowDev shares branding, tech stack, and SSO with FlowDesk. |
| **Audience** | Internal use only — internal engineering, ops, and leadership team |
| **Confidentiality** | **Internal / restricted.** FlowDev aggregates operational and cost data across the entire portfolio of bespoke apps. Treat this as a sensitive internal system. No public/external user access. |
| **Build Process** | BMAD methodology, executed in Claude Code |

---

## 2. Vision & Purpose

We have built — and continue to build — a growing portfolio of bespoke web applications, both internal and client-facing, hosted across multiple cloud platforms (currently Digital Ocean and Azure; AWS is being added imminently; others may follow). Each app has its own stack, its own database, its own email/notification path, its own user base, and its own cost profile.

Today, knowing whether any one of those apps is healthy, growing, costing too much, or being used at all requires logging into multiple consoles, eyeballing different dashboards, and stitching the picture together by hand. As the portfolio grows, this scales badly.

**FlowDev is the single pane of glass that brings every app in the portfolio into one place.** It is the operations, observability, and adoption-tracking layer that sits *across* all our apps regardless of where they are hosted, so the team can:

- Know at a glance whether every app is up and healthy.
- Understand how much each app is costing us, and whether those costs are growing.
- See who is actually using each app and how usage is trending.
- See where each app's data and resources are accumulating over time.
- Get notified proactively when something is wrong instead of finding out from a user.
- Produce reports on system adoption and performance over arbitrary time periods.

---

## 3. Goals & Success Criteria

FlowDev is successful when:

1. **Every app we run is registered in FlowDev** within a day of going live.
2. **Uptime, cost, and adoption** for any registered app can be answered in under 30 seconds without leaving FlowDev.
3. **The team is alerted by FlowDev before users complain** for the majority of incidents.
4. **Monthly portfolio reports** (cost, uptime, adoption per app and across the portfolio) can be generated in one click.
5. **New cloud platforms or new services can be onboarded** by adding a connector — without re-architecting FlowDev.

---

## 4. Target Users & Roles

FlowDev is internal-only. Authentication uses **Azure Entra ID SSO** (same tenant as FlowDesk) with a local credentials fallback for development.

| Role | Capabilities |
|------|--------------|
| **ADMIN** | Full access. Register/edit/remove monitored apps, configure connectors, manage credentials, manage users and roles, configure alert rules, view all costs, view all logs. |
| **MANAGER** | View all dashboards, costs, reports, and adoption data across the portfolio. Can configure alert rules for apps in their scope. Cannot edit credentials or onboard apps. |
| **DEVELOPER** | View dashboards and logs for apps they are assigned to. Can acknowledge alerts. Limited cost visibility (configurable). |
| **VIEWER** *(optional, v2)* | Read-only access to specific dashboards / reports — for stakeholders who need visibility but no operational rights. |

Roles are role-gated in the UI exactly as FlowDesk does it (see Style Guide §5).

---

## 5. Core Capabilities

This section lists *what* FlowDev does. Each capability will be expanded into user stories during the BMAD PRD phase.

### 5.1 Application Registry

The foundation of FlowDev. Every app we monitor is registered as a first-class entity with metadata: name, description, owner, environment (dev/staging/prod), hosting platform, primary URL, tech stack, tags, lifecycle status (active / decommissioned), and links to source repo, runbook, etc. The registry drives every other feature — connectors, dashboards, alerts, costs, and reports are all scoped *per app*.

### 5.2 Connectors & Integrations

FlowDev's value depends entirely on its ability to connect into the systems each app runs on. The connector model is **the core architectural primitive** of FlowDev. Connectors must be:

- **Pluggable** — adding a new platform (e.g. AWS) does not require rewriting existing connectors.
- **Per-app** — one app may have multiple connectors (e.g. an Azure Container App + an Azure PostgreSQL + a SendGrid mailbox).
- **Credential-isolated** — each connector stores its own credentials, encrypted at rest, never exposed in the UI.

**Required connector types for v1:**

| Connector | Purpose |
|-----------|---------|
| **HTTP Uptime Probe** | FlowDev pings the app's health endpoint on a schedule. Records availability and response time. |
| **Digital Ocean API** | Resources, droplet/app status, billing data |
| **Azure Resource Manager API** | Resource health for Container Apps, App Services, Functions |
| **Azure Cost Management API** | Per-resource cost data |
| **Azure PostgreSQL Flexible Server metrics** | DB CPU, connections, storage, query performance |
| **Azure Blob Storage** | Container size, object counts, growth |
| **Azure Communication Services** | Outbound email volume, delivery, bounces |
| **AWS (CloudWatch + Cost Explorer + RDS + S3 + SES)** | AWS equivalents of the above (target for v1.1 once AWS hosting goes live) |
| **PostgreSQL direct** | For apps where we want fine-grained DB metrics: row counts per key table, slow queries, connection counts. Read-only credentials. |
| **SendGrid** | Inbound and outbound email metrics for apps using SendGrid |
| **Generic Webhook Receiver** | An app can `POST` arbitrary metrics or events to a unique FlowDev endpoint (e.g. login events, custom counters). |

**Connector design notes for the architect:**
- Each connector is a TypeScript module implementing a common interface (`collect()`, `healthCheck()`, `validateCredentials()`).
- Connectors are run by a **scheduler / background worker**, not on the request path.
- Failed connector runs are logged but do not bring down the UI.

### 5.3 Uptime & Availability Monitoring

Per-app HTTP probes on a configurable schedule (default: every 60s). Records each probe result (status code, response time, success/fail). Surfaces uptime % over rolling windows (24h / 7d / 30d / 90d / custom). Supports multi-region probing in v2.

### 5.4 Performance Monitoring

Track and visualise over time:
- API/page response time (from probes)
- Database performance — CPU %, active connections, slow query count, storage used
- Server resource utilisation (where the platform exposes it)

### 5.5 User Activity & Adoption Analytics

For each monitored app, track:
- Login count per day / week / month
- Distinct active users (DAU / WAU / MAU)
- Last-active-at per known user
- Cumulative user growth

This requires apps to either (a) push login events to FlowDev's webhook receiver, or (b) expose an analytics endpoint FlowDev can poll. The contract for this should be standardised so every Flow* app and future app reports the same shape of data. **This is a key item for the architect to design carefully.**

### 5.6 Resource Growth Tracking

Periodically snapshot and chart:
- File / blob counts and total size per app
- Key database table row counts (configurable per app)
- Database storage size

The point is to spot accumulating data — both as a usage indicator and a cost driver.

### 5.7 Cost Intelligence

Pull billing/cost data from each platform's billing API and attribute it to the registered app. Display:
- Current month-to-date cost per app
- Cost per app per month over time (trend chart)
- Cost broken down by service (compute, storage, database, email, etc.)
- Portfolio-wide cost roll-up
- Forecast for the current billing period
- Budget thresholds per app with alerting (see §5.12)

Currency display follows the FlowDesk locale convention: ZAR with `en-ZA` formatting (with conversion from USD/native currency where the platform bills in USD; FX rate source is a v1 decision for the architect).

### 5.8 Notification & Email Monitoring

For every app that sends user emails or notifications:
- Volume sent per day / week
- Delivery rate, bounce rate, complaint rate (where the provider exposes it)
- Searchable log of recent sends (recipient masked appropriately)
- Alerts on bounce-rate or send-failure spikes

### 5.9 API & Third-Party Integration Health

Each app typically calls one or more third-party APIs (payment, mapping, AI providers, etc.). FlowDev should track, per integration:
- Call volume
- Error rate
- Latency
- Last failure timestamp

This relies on apps reporting integration events via the webhook contract (§5.5).

### 5.10 Dashboards

Three dashboard tiers:

1. **Portfolio dashboard** (landing page after login) — every app as a tile/row showing current up/down state, today's cost, today's logins, alert count. This is the single pane of glass.
2. **App detail dashboard** — drill-down view per app: uptime chart, cost chart, adoption chart, resource chart, recent alerts, integration health. Follows the FlowDesk **Detail Page (2/3 + 1/3 split)** pattern from Style Guide §8.
3. **Cross-cutting dashboards** — e.g. portfolio cost trend, portfolio uptime, portfolio adoption — for management reporting.

All charts use **Recharts** per the existing tech stack.

### 5.11 Reporting

Generate reports over arbitrary date ranges, scoped to a single app or the whole portfolio:
- Uptime / SLA report
- Cost report
- Adoption report
- Combined monthly portfolio report

Reports must be **exportable** (CSV at minimum; PDF in v2). Reports should be saveable as scheduled — e.g. "email me the portfolio report on the 1st of every month."

### 5.12 Alerting

Configurable alert rules per app and per metric:
- Uptime: "alert if uptime < 99% over last 1h"
- Cost: "alert if month-to-date cost > X"
- Email: "alert if bounce rate > 5% over last 24h"
- Resource: "alert if DB storage > 80% of provisioned"
- Generic: "alert if metric `X` crosses threshold"

Alert delivery channels (v1): **email** (via Azure Communication Services, same as FlowDesk) and in-app notifications (using the same notification bell pattern as Style Guide §6). Channels for v2: Microsoft Teams webhook, SMS.

Alerts have lifecycle states: `firing` → `acknowledged` → `resolved`. Acknowledgement is captured in the audit log.

---

## 6. System Architecture (Conceptual)

The detailed architecture is the architect agent's deliverable. This section sets the constraints and shape.

### 6.1 Data Collection Model

FlowDev uses **both pull and push**:
- **Pull (scheduled):** the FlowDev worker runs each app's connectors on a schedule (uptime probe every 60s; cost data hourly; resource snapshots daily; etc.).
- **Push (webhook):** apps send events to FlowDev (login events, integration call results, custom metrics) via a unique authenticated webhook URL per app.

### 6.2 Background Workers

The scheduling and collection layer **must run out-of-band from the Next.js request handlers**. The architect should choose between:
- A separate Node.js worker process running a job queue (e.g. BullMQ + Redis).
- A series of cron-triggered Azure Functions that call into FlowDev's API.
- Next.js scheduled route handlers triggered by an external scheduler (Azure Container Apps Jobs).

This decision should be made in the architecture phase; the requirement is simply that uptime probes do not contend with user requests.

### 6.3 Time-Series Data

Most of what FlowDev stores is time-series (every probe, every metric snapshot, every cost data point). PostgreSQL with appropriate indexing is the default, consistent with the FlowDesk stack. **TimescaleDB** (a PG extension) should be evaluated by the architect — it would be a natural fit but adds operational complexity. v1 can ship on plain PostgreSQL.

### 6.4 Data Retention

Retention is configurable but defaults to:
- Raw probe results: 90 days
- Hourly aggregates: 1 year
- Daily aggregates: indefinite

---

## 7. Conceptual Data Model

To be expanded by the architect — these are the core entities:

- **App** — the registered application being monitored
- **Platform** — Digital Ocean, Azure, AWS, etc.
- **Connector** — a configured integration between an App and a Platform (or service)
- **HealthCheck** — uptime probe configuration
- **HealthCheckResult** — time-series probe results
- **Metric** + **MetricSnapshot** — generic time-series metric data
- **CostRecord** — billing data per App per period per service line
- **ActivityEvent** — login / user action events from monitored apps
- **ResourceSnapshot** — file / db size / row counts at a point in time
- **EmailEvent** — email send / delivery / bounce records
- **IntegrationCall** — third-party API call records
- **AlertRule** — configured alert
- **AlertEvent** — a firing of an alert rule
- **User** + **Role** — FlowDev's own users (mirrors FlowDesk pattern)
- **AuditLog** — record of every config change inside FlowDev itself

---

## 8. Tech Stack

> **FlowDev MUST conform to the existing FlowDesk tech stack.** See the attached `TECH-STACK.md` for the canonical reference. Changes to the stack require explicit approval. Below are FlowDev-specific considerations only.

### 8.1 Inherited from FlowDesk (no deviation)

- **Database:** PostgreSQL 15 (Azure Flexible Server in prod; Alpine container locally)
- **ORM:** Prisma 6.x
- **Framework:** Next.js 15 (App Router) + React 19 + TypeScript 5
- **Auth:** Auth.js v5 with Azure Entra ID + credentials fallback, `@auth/prisma-adapter`
- **UI:** shadcn/ui on Radix UI primitives, Tailwind CSS 4, Lucide React icons
- **Forms:** React Hook Form + Zod
- **Charts:** Recharts
- **Date handling:** date-fns (`en-ZA` locale)
- **Data fetching:** SWR
- **Email:** `@azure/communication-email`
- **File storage:** `@azure/storage-blob` (for any user-uploaded artefacts inside FlowDev)
- **Containerisation:** Docker multi-stage build, `node:20-alpine` base
- **Hosting:** Azure Container Apps + Azure Container Registry
- **CI/CD:** GitHub Actions (deploy on push to `main`)

### 8.2 Net-new for FlowDev

These are additions FlowDev needs that FlowDesk does not. The architect should select specific libraries and document them:

- **Background job runner** — to be chosen (BullMQ + Redis, or Azure Container Apps Jobs, or equivalent).
- **Cloud-platform SDKs:**
  - `@azure/arm-monitor`, `@azure/arm-resources`, `@azure/arm-costmanagement` (Azure)
  - `aws-sdk` v3 modular packages (AWS) — when AWS hosting comes online
  - Digital Ocean API — there is no official Node SDK; calls via `fetch` is fine
- **Encryption-at-rest helper for stored credentials** — Node `crypto` with a key sourced from Azure Key Vault is the expected pattern.
- **Optional:** TimescaleDB extension on the production PostgreSQL — to be evaluated by architect.

### 8.3 Out of scope

- No Python services, no Go services, no microservices split. FlowDev is a single Next.js app + (potentially) one worker process, in line with FlowDesk.
- No custom-built design system. **Use shadcn/ui as-is.**

---

## 9. UI / UX Guidelines

> **FlowDev MUST follow the existing style guide.** See attached `STYLE-GUIDE.md` for the canonical reference.

In summary:

- **Brand colour:** the same deep purple (`#700ce9`, HSL `270 93% 48%`) used by FlowDesk and BD. FlowDev is part of the same internal product family.
- **Font:** Inter, applied via Next.js font optimisation.
- **Layout shell:** identical to BD/FlowDesk — fixed left sidebar (`w-64`), sticky header (`h-16`), main content `p-4 md:p-6 space-y-6`.
- **Stat cards, tables, dialogs, sheets, badges, toasts, forms** — all per the style guide.
- **Dark mode:** must be supported, same toggle pattern as FlowDesk.
- **Locale:** `en-ZA`, dates formatted `dd MMM yyyy`, currency in ZAR.
- **Mobile-responsive** mobile-first, with `md:` breakpoint for sidebar.
- **Accessibility:** keyboard nav and focus rings via Radix, screen-reader text, sufficient contrast.

### FlowDev-specific UI patterns (additions to the style guide)

The following are new patterns FlowDev introduces. They must extend — not break — the existing style guide.

| Pattern | Description |
|---------|-------------|
| **App health pill** | A compact badge showing uptime state (`UP` green / `DEGRADED` amber / `DOWN` red / `UNKNOWN` grey). Used everywhere an app is referenced. Uses the existing semantic status-colour system from Style Guide §2. |
| **Sparkline cells** | Small inline trend charts in tables (e.g. last 24h response time per app). Use Recharts `<LineChart>` with axes hidden. |
| **Connector status row** | A list-row pattern showing the connector name, last successful run, and a status pill, used on the App detail page. |
| **Time-range selector** | A consistent component for choosing 24h / 7d / 30d / 90d / custom range, used at the top of every dashboard and chart. |
| **Cost in ZAR** | Use the `cn()` + a shared `formatZAR()` helper. Where source data is in USD, display ZAR with a small `(USD X.XX)` muted-foreground sub-label. |

### Navigation (sidebar)

| Label | Route | Icon | Visible to |
|-------|-------|------|------------|
| Portfolio | `/` | `LayoutDashboard` | All roles |
| Apps | `/apps` | `Boxes` | All roles |
| Costs | `/costs` | `Wallet` | ADMIN, MANAGER |
| Adoption | `/adoption` | `Users` | All roles |
| Alerts | `/alerts` | `Bell` | All roles |
| Reports | `/reports` | `BarChart3` | ADMIN, MANAGER |
| Settings | `/admin/settings` | `Settings` | ADMIN only |
| Help & Support | `/help` | `HelpCircle` | All (bottom section) |

Settings has the same nested-tabs pattern as FlowDesk: Users | Connectors | Credentials | Alert Rules | Audit | System.

---

## 10. Security & Privacy

FlowDev is an **internal system holding sensitive operational and cost data about every app we run**. Treat it accordingly.

### Authentication
- Azure Entra ID SSO is the primary auth path. Local credentials are a dev/fallback path only.
- Session handling is `getToken()`-based for Edge middleware, identical to FlowDesk's pattern.

### Authorisation
- All routes are role-gated server-side, not just in the UI.
- Cost data may be further restricted for the DEVELOPER role (configurable).

### Credential storage
- **Connector credentials (API keys, DB passwords, etc.) are encrypted at rest.** Encryption key managed via Azure Key Vault. Plaintext is never logged and never returned by any API.
- A connector credential is only ever decrypted in-process at the moment of use.

### Webhook authentication
- Every push-webhook URL is unique per app and includes a per-app secret. Inbound webhooks are HMAC-validated.

### Audit
- Every change to apps, connectors, credentials, alert rules, and user roles is written to an immutable audit log.
- The audit log is visible to ADMIN only.

### Data privacy
- Email recipient addresses captured from email-monitoring connectors must be masked (e.g. `j****@example.com`) by default in the UI; un-mask requires an audit-logged action.
- Login event data (user identifiers from monitored apps) is treated as PII. Retention follows the org's data-retention policy.
- FlowDev does not store user passwords from monitored apps. Ever.

### Public exposure
- FlowDev itself has **no anonymous routes** other than the auth endpoints and the per-app webhook endpoints (which require the per-app secret).
- The deployment lives in the same Azure tenant as FlowDesk and inherits the org's network controls.

---

## 11. Non-Functional Requirements

| Concern | Target |
|---------|--------|
| **Availability** | 99.5% (FlowDev itself). FlowDev going down must not bring down any monitored app. |
| **Probe accuracy** | Uptime probes execute within ±10s of their scheduled time at p95. |
| **Dashboard load** | Portfolio dashboard < 2s on a warm cache for ≤ 50 apps. |
| **Scale (v1)** | 50 apps, 200 connectors, 90 days raw data retention. |
| **Scale (v2 target)** | 200 apps, 1000 connectors. |
| **Browser support** | Latest two versions of Chrome, Edge, Firefox, Safari. |
| **Logging** | Structured JSON logs from API routes and worker; correlation IDs propagated. |
| **Backups** | Postgres backups via Azure Flexible Server's managed backup. |

---

## 12. Out of Scope (v1)

To keep v1 shippable, the following are explicitly deferred:

- APM-style code-level tracing (we are not building a New Relic / Datadog replacement)
- Log aggregation from monitored apps (we capture events and metrics, not raw log streams)
- Synthetic transactions (multi-step user-journey monitoring) — uptime probes only in v1
- Real-time streaming dashboards — minute-level refresh is fine for v1
- Mobile native app — the responsive web UI is sufficient
- Public status page — internal portfolio dashboard only
- Multi-tenant / customer-facing views

---

## 13. Future Enhancements (for backlog, not v1)

- Public/embeddable per-app status pages
- Microsoft Teams + Slack alert channels
- Anomaly detection on cost and adoption metrics
- Synthetic multi-step probes
- Full APM tracing integration (e.g. via OpenTelemetry receiver)
- Multi-region uptime probing
- TimescaleDB migration if data volume requires it
- Automated runbook execution on alerts
- Capacity forecasting / "you'll hit your DB storage cap in N weeks"

---

## 14. Open Questions for the BMAD Process

These are decisions the analyst, PM, and architect should resolve as part of BMAD planning:

1. **Background job framework** — BullMQ+Redis vs Azure Container Apps Jobs vs another option.
2. **TimescaleDB** — adopt for v1, or defer until volume demands it.
3. **Standard webhook contract** — the exact JSON shape that monitored apps will use to push login events, integration calls, and custom metrics. This needs to be designed once and adopted across all Flow* apps.
4. **FX rate source** — for converting USD-billed platforms to ZAR.
5. **Cost data freshness expectations** — Azure cost data lags by hours; what's the user's tolerance?
6. **Per-app credential scoping** — is one shared Azure subscription credential acceptable for v1, or does each app get its own service principal?
7. **Retention defaults** — confirm 90 days raw / 1y hourly / indefinite daily.
8. **Onboarding UX** — how much of connector setup can be auto-discovered vs explicitly configured?

---

## 15. Glossary

| Term | Meaning |
|------|---------|
| **App** | A registered monitored application in FlowDev's registry. |
| **Connector** | A configured integration between an App and an external system (cloud platform, database, email provider, etc.). |
| **Probe** | An HTTP/HTTPS uptime check FlowDev runs on an App. |
| **Snapshot** | A point-in-time recording of a metric (e.g. file count, DB size). |
| **Push event** | Data sent *to* FlowDev by a monitored app via webhook. |
| **Pull collection** | Data fetched *by* FlowDev from a remote API on a schedule. |
| **Alert rule** | A user-configured condition that, when met, fires an Alert Event. |
| **Portfolio** | The full set of apps we run, viewed as a single managed group. |
| **BMAD** | The structured AI-assisted development methodology used to build this system in Claude Code. |
| **MPAMOT** | Multi-Platform Application Monitoring & Operations Tool — the project codename. |
| **FlowDesk** | The sister product (work item / project management). FlowDev shares its tech stack, branding, and SSO. |

---

*End of brief. Hand off to BMAD analyst.*
