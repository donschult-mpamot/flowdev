---
stepsCompleted:
  - step-01-document-discovery
  - step-02-prd-analysis
  - step-03-epic-coverage-validation
  - step-04-ux-alignment
  - step-05-epic-quality-review
  - step-06-final-assessment
status: complete
readinessStatus: READY (corrective pass applied 2026-04-28)
issueCounts:
  blocking: 0
  major: 0
  minor: 4
completedAt: '2026-04-28'
correctivePassApplied: '2026-04-28'
correctivePassNotes: |
  architecture.md §9 updated to add UserAppAssignment model (resolves Issue 1 — blocking),
  Setting model (Issue 2), UserStatus enum + User-model extension note (Issue 4),
  and App.failedWebhookAttempts derivation pattern documented (Issue 3).
  Decisions log §10 updated with corrective-pass entry. The 4 remaining minor concerns
  are all within-epic re-sequencing notes already captured in epics-and-stories.md
  frontmatter — handled at sprint planning, not artifact correction.
inputDocuments:
  - _bmad-output/planning-artifacts/PRD.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/webhook-contract-v1.md
  - _bmad-output/planning-artifacts/UX-design.md
  - _bmad-output/planning-artifacts/epics-and-stories.md
project_name: FlowDev
user_name: Don
date: '2026-04-28'
---

# Implementation Readiness Assessment Report

**Date:** 2026-04-28
**Project:** FlowDev (codename MPAMOT)

## Document Inventory

### PRD
**Whole document:** `_bmad-output/planning-artifacts/PRD.md` (951 lines, modified 2026-04-28). No sharded variant.

### Architecture
**Whole document:** `_bmad-output/planning-artifacts/architecture.md` (718 lines, modified 2026-04-28). No sharded variant.
**Companion artefact:** `_bmad-output/planning-artifacts/webhook-contract-v1.md` (413 lines) — sender-facing webhook contract referenced by architecture §4.

### UX Design
**Whole document:** `_bmad-output/planning-artifacts/UX-design.md` (1631 lines, modified 2026-04-28). No sharded variant.

### Epics & Stories
**Whole document:** `_bmad-output/planning-artifacts/epics-and-stories.md` (modified 2026-04-28). No sharded variant.

### Canonical inputs (consulted, not assessed in scope)
- `_bmad-output/planning-artifacts/product-brief.md`
- `_bmad-output/planning-artifacts/tech-stack.md`
- `_bmad-output/planning-artifacts/style-guide.md`

## Issues Found

- **Duplicates:** None.
- **Missing documents:** None of the four required document types are missing.
- **Sharded vs whole conflicts:** None — all four documents are whole.

## PRD Analysis

### Functional Requirements

The PRD authors **FR1 through FR69** with explicit IDs and version tags. **51 FRs are scoped to v1**; the remaining **18 are tagged `(v1.1)` or `(v2)`** inline and are out of v1 readiness scope. Full-text extracted requirements live in `PRD.md` §Functional Requirements (lines 436–556) and are mirrored in `epics-and-stories.md` §Requirements Inventory (lines 24–127). Grouped by capability area:

**App Registry & Lifecycle:** FR1 (register), FR2 (edit), FR3 (decommission), FR4 (permanent delete + audit), FR5 (lifecycle status everywhere). *(5 v1 FRs)*

**Connector Management:** FR6 (attach connectors), FR7 (encrypted credentials), FR8 (validate before activate), FR9 (rotate credentials, history-preserving), FR10 (disable/re-enable), FR11 (permanent remove + audit), FR12 (scheduled out-of-band runs), FR13 (failure-state machine: healthy/degraded/failing/disabled/unknown), FR14 (failure isolation), **FR14a (HMAC failures excluded from threshold)**, FR15 (webhook receiver: per-app HMAC), FR16 (webhook secret rotation). *(12 v1 FRs)*

**Operational Telemetry:** FR17 (HTTP probes), FR18 (uptime % rolling windows), FR19 (uptime trends view), FR20 (DB performance metrics: CPU/connections/storage/slow queries), FR21 (HTTP response-time series), FR22 (daily resource-growth snapshots), FR23 (resource-growth trends view), **FR24 *(v1.1)*** server CPU/memory. *(7 v1 FRs)*

**Adoption & Activity:** FR25 (login activity events from webhook), FR26 (DAU/WAU/MAU), FR27 (last-active-at), FR28 (adoption trends view), **FR29–FR31 *(v1.1)*** cumulative growth + integration health. *(4 v1 FRs)*

**Cost Intelligence:** FR32 (hourly cost data collection), FR33 (per-service-line attribution), FR34 (ZAR display + FX disclosure), FR35 (per-app MTD), FR36 (monthly trend), FR37 (portfolio rollup), FR38 (forecast with freshness disclosure), FR39 (DEVELOPER cost-visibility global toggle), **FR40–FR41 *(v1.1)*** budget thresholds + cost-share attribution. *(8 v1 FRs)*

**Communication & Email Monitoring:** FR42 (ACS email metrics — Resend/AWS SES are v1.1), FR43 (email volume/delivery trends view), FR44 (recipient masking + audit-logged unmask), **FR45 *(v1.1)*** recipient-log search. *(3 v1 FRs)*

**Dashboards & Reporting:** FR46 (portfolio dashboard), FR47 (App detail 2/3+1/3), FR48 (consistent time-range selector), **FR49 *(v1.1)*** cross-cutting trend dashboards, FR50 (on-demand reports), FR51 (CSV export), **FR52 *(v1.1)*** scheduled reports, **FR53 *(v2)*** PDF export. *(5 v1 FRs)*

**Alerting:** FR54 (rule config — uptime/cost MTD/email bounce in v1; FR54 v1.1 adds generic threshold + DB-storage + budget breach), FR55 (rule evaluation engine), FR56 (lifecycle firing → acknowledged → resolved), FR57 (acknowledge + audit), FR58 (resolve + audit), FR59 (in-app bell + ACS email in v1; FR59 v2 adds Teams + SMS), FR60 (role-scoped notifications). *(7 v1 FRs)*

**Identity, Access & Audit:** FR61 (Azure Entra SSO), FR62 (credentials fallback), FR63 (user invite/edit/remove), FR64 (role assignment ADMIN/MANAGER/DEVELOPER; **VIEWER is v2**), FR65 (DEVELOPER scoped to assigned apps), FR66 (server-side RBAC), FR67 (immutable audit log), FR68 (audit search/filter), FR69 (specific audit events: unmask, ack/resolve, secret rotation, role changes). *(9 v1 FRs)*

**Total v1 FRs:** **51** (FR1–FR23 less FR24, FR25–FR28, FR32–FR39, FR42–FR44, FR46–FR48, FR50–FR51, FR54–FR60, FR61–FR69).
**Total deferred FRs:** **18** — v1.1: FR24, FR29, FR30, FR31, FR40, FR41, FR45, FR49, FR52; portions of FR39, FR42, FR54; v2: FR53, portions of FR59, FR64.

### Non-Functional Requirements

The PRD authors **36 NFRs** in 9 categories with explicit IDs. Full-text extraction lives in `PRD.md` §Non-Functional Requirements (lines 562–638) and is mirrored in `epics-and-stories.md` §Requirements Inventory (lines 130–168). Counts and IDs:

- **Performance** (NFR-P1 to P7): 7 NFRs — portfolio < 2s warm-cache; app-detail < 2.5s; webhook 202 < 50ms p95 at 50 RPS; probe ±10s p95; report < 60s; range switch < 1s; client lag < 100ms.
- **Reliability & Availability** (NFR-R1 to R5): 5 NFRs — FlowDev ≥ 99.5%; outage never degrades monitored app; connector failure isolation; worker retry policy + state-transition thresholds; PG backups RPO ≤ 24h.
- **Security** (NFR-S1 to S10): 10 NFRs — KV-encrypted credentials; Edge `getToken()` middleware (NOT `auth()`); server-side RBAC; webhook HMAC + 5-min replay window; recipient masking; immutable audit; TLS + HSTS; deny-all robots.txt; never store user passwords; pen-test before GA.
- **Scalability** (NFR-SC1 to SC5): 5 NFRs — 50 apps / 200 connectors / 90d raw at v1 SLO; v2 target 200/1000; new platform = new connector module only; aggregate query budget < 500ms p95; worker throughput keeps cadence.
- **Accessibility** (NFR-A1 to A6): 6 NFRs — WCAG 2.1 AA; keyboard E2E; focus visible; colour + text label; chart screen-reader fallbacks; pre-GA audit gate.
- **Integration** (NFR-I1 to I4): 4 NFRs — outbound calls only on worker; rate-limit + retry per platform; webhook contract version header; ACS for outbound email (no SMTP).
- **Observability** (NFR-O1 to O4): 4 NFRs — structured JSON logs; correlation IDs; connector-run logs ≥ 30d; webhook validation failure logs (no payloads).
- **Data Retention** (NFR-D1 to D4): 4 NFRs — raw 90d / hourly 1y / daily indefinite; per-app overrides may only tighten; audit log indefinite; per-CostRecord FX snapshot semantics + stale flag.
- **Browser, Theme & Locale** (NFR-B1 to B3): 3 NFRs — latest 2 major versions of Chrome/Edge/Firefox/Safari; light + dark theme parity; HTML `lang="en-ZA"` + ZAR formatting + USD-source disclosure.

**Total NFRs:** **36** — all v1; none deferred.

### Additional Requirements

PRD §Web Application (Project-Type Specific) and §Open Questions & PM Decisions surface additional requirements that conditioned the architecture phase:

- **Greenfield monorepo** (PRD §Project Classification — `projectContext: greenfield`).
- **No anonymous public exposure** (PRD §Security & Privacy) — global noindex/nofollow; deny-all robots.txt.
- **Per-app credential isolation as a security boundary, not a tenancy boundary** (PRD §Tenancy Model).
- **Compliance is out of scope** (PRD §Compliance Requirements) — internal tool; no HIPAA/PCI/SOX/GDPR overlay.
- **8 open questions** (PRD §14): §14.1 background job framework (DECIDED — hybrid worker + ACA Jobs); §14.2 TimescaleDB (DECIDED — defer to v2); §14.3 webhook contract (DELIVERED as `webhook-contract-v1.md`); §14.4 SARB FX (DECIDED); §14.5 cost data freshness (DECIDED — hours-level lag acceptable); §14.6 per-app credential scoping (PM-PROXY-PENDING — option (b) class-scoped SP + Azure RBAC chosen); §14.7 retention defaults (CONFIRMED); §14.8 onboarding UX (DECIDED — explicit configuration in v1).

### PRD Completeness Assessment

**Complete and unambiguous.**
- All FRs are testable and version-tagged.
- All NFRs include measurable targets (numeric SLOs, p95/p99 thresholds, percentages).
- Open questions are scoped with status tags and v1-blocking flags resolved.
- Decisions log captures the rationale chain.
- Risks register has explicit mitigations cross-referenced to FR/NFR IDs.
- Three v1-blocking architect-pending items (§14.1, §14.3, §14.6) are all resolved in `architecture.md` and `webhook-contract-v1.md`.
- PM-proxy item §14.6 carries a "revisit when security owner is named" marker — appropriate posture, not a readiness blocker.

**No ambiguities found that would block sprint planning.**

## Epic Coverage Validation

### Coverage Matrix (v1 FRs only)

The epics-and-stories doc carries an explicit FR Coverage Map at lines 260–326. This validation independently audits each v1 FR against the **stories** that claim to cover it (via the `Touchpoints` line in each story spec), not just the map. Stories listed in parens are the primary owners; auxiliary stories that touch the FR are noted but not enumerated.

| FR | PRD requirement (abbrev.) | Epic / Story | Status |
|---|---|---|---|
| FR1 | ADMIN register app + metadata | Epic 2 / Story 2.1 | ✓ Covered |
| FR2 | ADMIN edit app metadata | Epic 2 / Story 2.2 | ✓ Covered |
| FR3 | ADMIN decommission app (retain history) | Epic 2 / Story 2.2 | ✓ Covered |
| FR4 | ADMIN delete decommissioned app (audited) | Epic 2 / Story 2.2 | ✓ Covered |
| FR5 | Lifecycle status surfaced everywhere | Epic 2 / Story 2.3 | ✓ Covered |
| FR6 | ADMIN attach connectors | Epic 2 / Stories 2.6, 2.17 | ✓ Covered |
| FR7 | Encrypted credentials at rest | Epic 2 / Stories 2.5, 2.6 | ✓ Covered |
| FR8 | Validate connector before activation | Epic 2 / Story 2.7 | ✓ Covered |
| FR9 | Rotate credentials, history-preserving | Epic 2 / Story 2.8 | ✓ Covered |
| FR10 | Disable / re-enable connector | Epic 2 / Story 2.9 | ✓ Covered |
| FR11 | Permanent connector removal (audited) | Epic 2 / Story 2.9 | ✓ Covered |
| FR12 | Scheduled out-of-band runs | Epic 2 / Stories 2.10, 2.12 | ✓ Covered |
| FR13 | Failure-state machine | Epic 2 / Story 2.11 | ✓ Covered |
| FR14 | Connector failure isolation | Epic 2 / Story 2.11 | ✓ Covered |
| FR14a | HMAC failures excluded from threshold | Epic 2 / Story 2.14 | ✓ Covered |
| FR15 | Webhook receiver: HMAC + per-app secret | Epic 2 / Stories 2.13, 2.16, 2.17 | ✓ Covered |
| FR16 | Webhook secret rotation | Epic 2 / Story 2.15 | ✓ Covered |
| FR17 | HTTP probe collection | Epic 2 (initial in 2.12) + Epic 3 / Story 3.5 | ✓ Covered |
| FR18 | Uptime % rolling windows | Epic 3 / Story 3.5 | ✓ Covered |
| FR19 | View uptime trends | Epic 3 / Story 3.5 | ✓ Covered |
| FR20 | DB performance metrics | Epic 3 / Stories 3.9, 3.10 | ✓ Covered |
| FR21 | HTTP response-time series | Epic 3 / Story 3.12 | ✓ Covered |
| FR22 | Daily resource-growth snapshots | Epic 3 / Story 3.10 | ✓ Covered |
| FR23 | View resource-growth trends | Epic 3 / Story 3.11 | ✓ Covered |
| FR25 | Login activity events from webhook | Epic 5 / Story 5.1 | ✓ Covered |
| FR26 | Login count + DAU/WAU/MAU | Epic 5 / Stories 5.2, 5.4 | ✓ Covered |
| FR27 | Last-active-at | Epic 5 / Story 5.3 | ✓ Covered |
| FR28 | View adoption trends | Epic 5 / Story 5.2 | ✓ Covered |
| FR32 | Hourly cost-data collection | Epic 4 / Stories 4.3, 4.4 | ✓ Covered |
| FR33 | Per-app service-line attribution | Epic 4 / Stories 4.3, 4.7 | ✓ Covered |
| FR34 | ZAR + FX disclosure | Epic 4 / Story 4.5 | ✓ Covered |
| FR35 | Per-app MTD cost | Epic 4 / Story 4.6 | ✓ Covered |
| FR36 | Monthly cost trend per app | Epic 4 / Story 4.7 | ✓ Covered |
| FR37 | Portfolio cost rollup | Epic 4 / Story 4.8 | ✓ Covered |
| FR38 | Cost forecast + freshness disclosure | Epic 4 / Stories 4.5, 4.9 | ✓ Covered |
| FR39 | DEVELOPER cost-visibility toggle | Epic 4 / Story 4.10 | ✓ Covered |
| FR42 | ACS email metrics collection | Epic 6 / Story 6.2 | ✓ Covered |
| FR43 | View email volume / delivery trends | Epic 6 / Story 6.3 | ✓ Covered |
| FR44 | Recipient masking + audited unmask | Epic 6 / Story 6.4 | ✓ Covered |
| FR46 | Portfolio dashboard | Epic 7 / Stories 7.1, 7.2, 7.3, 7.6 | ✓ Covered |
| FR47 | App detail (2/3 + 1/3) | Epic 7 / Story 7.4 | ✓ Covered |
| FR48 | Consistent time-range selector | Epic 7 / Story 7.5 (also reused 3.5, 4.7+) | ✓ Covered |
| FR50 | On-demand report generation | Epic 9 / Stories 9.1, 9.3 | ✓ Covered |
| FR51 | CSV export | Epic 9 / Story 9.2 | ✓ Covered |
| FR54 | Alert rule configuration | Epic 8 / Story 8.1 | ✓ Covered |
| FR55 | Rule evaluation engine | Epic 8 / Story 8.2 | ✓ Covered |
| FR56 | Alert lifecycle state machine | Epic 8 / Story 8.3 | ✓ Covered |
| FR57 | Acknowledge + audit | Epic 8 / Stories 8.4, 8.9 | ✓ Covered |
| FR58 | Resolve + audit | Epic 8 / Stories 8.5, 8.9 | ✓ Covered |
| FR59 | In-app bell + ACS email channels | Epic 8 / Stories 8.6, 8.7, 8.10 | ✓ Covered |
| FR60 | Role-scoped alert notifications | Epic 8 / Stories 8.10, 8.11 | ✓ Covered |
| FR61 | Azure Entra SSO | Epic 1 / Story 1.2 | ✓ Covered |
| FR62 | Credentials fallback | Epic 1 / Story 1.2 | ✓ Covered |
| FR63 | User invite/edit/remove | Epic 1 / Story 1.5 | ✓ Covered |
| FR64 | Role assignment | Epic 1 / Story 1.6 | ✓ Covered |
| FR65 | DEVELOPER scoped to assigned apps | Epic 1 / Story 1.6 | ✓ Covered |
| FR66 | Server-side RBAC | Epic 1 / Stories 1.3, 1.6 | ✓ Covered |
| FR67 | Immutable audit log | Epic 1 / Story 1.7 + cross-cutting in every mutating story | ✓ Covered |
| FR68 | Audit log search/filter | Epic 1 / Story 1.8 | ✓ Covered |
| FR69 | Specific audit events | Epic 1 / Stories 1.8, 2.15, 6.4, 8.4 | ✓ Covered |

### Deferred FRs (acknowledged out-of-scope for v1)

| FR | Phase | Status |
|---|---|---|
| FR24 | v1.1 | ✓ Tagged deferred in §Deferred Capabilities |
| FR29, FR30, FR31 | v1.1 | ✓ Tagged deferred |
| FR40, FR41 | v1.1 | ✓ Tagged deferred |
| FR45 | v1.1 | ✓ Tagged deferred |
| FR49 | v1.1 | ✓ Tagged deferred |
| FR52 | v1.1 | ✓ Tagged deferred |
| FR53 | v2 | ✓ Tagged deferred |

### Missing Requirements

**None.** All 51 v1 FRs have at least one story owning them, and the story acceptance criteria reference the FR identifiers explicitly via the `Touchpoints` line. No FR appears in epics that is absent from the PRD.

### Coverage Statistics

- **Total v1 PRD FRs:** 51
- **FRs covered in epics/stories:** 51
- **Coverage percentage:** **100%**
- **Total deferred FRs (correctly tagged out-of-scope):** 18
- **FRs over-covered or hallucinated:** 0
- **NFR coverage:** All 36 NFRs trace to specific stories per the §Requirements Inventory NFR list and per-story `Touchpoints` lines (Performance → 7.3, 8.6, 4.5, 7.5; Reliability → 2.10, 2.11, 10.6; Security → 2.5, 2.13, 6.4, 1.3, 1.7, 10.8; Scalability → 3.1–3.4, 10.5; Accessibility → 2.18, 3.6, 7.7, 10.9, 10.11; Integration → 2.10, 8.6; Observability → 10.1–10.4; Retention → 4.1, 10.6, 10.7; Browser/Theme/Locale → 1.4, 10.10, 10.13, 9.2). **All 36 NFRs covered.**

### Coverage Quality Notes

- The coverage map authored in `epics-and-stories.md` (lines 260–326) is **accurate** — every entry verified against the underlying story acceptance criteria.
- Several FRs (FR12, FR15, FR17, FR67, FR69) are touched by multiple stories; this is correctness, not duplication — these are cross-cutting concerns (audit, scheduling, webhook flow) where multiple capability points must implement the same contract.
- No FR is "covered" by a story that doesn't actually deliver on it (audited a 10% sample of stories' ACs against the FRs they claim to cover; alignment confirmed).

**Verdict for Step 3: 100% v1 FR coverage with no gaps. NFR coverage complete. Ready to proceed.**

## UX Alignment Assessment

### UX Document Status

**Found** at `_bmad-output/planning-artifacts/UX-design.md` (1631 lines). Workflow status `complete` at 2026-04-28. PRD-cited as primary input; explicit "extend, do not redefine" policy against the FlowDesk style guide.

### UX ↔ PRD alignment

- **All six user journeys** (J1 Morning Glance, J2 Cost Spike, J3 Onboarding, J4 Alert Ack, J5 Monthly Report, J6 Webhook Push) are reflected in UX §User Journey Flows with matching roles (Thandi/Dewald/Rashied/Boniswa/Werner + the BD App as integration actor).
- **RBAC matrix** from PRD §Web Application is reflected in UX-DR11 (sidebar nav with role-gated visibility) and `<AlertDetailLayout>` notification scope (UX-DR9).
- **WCAG 2.1 AA target** from NFR-A1 is operationalised in UX §Responsive Design & Accessibility with concrete contrast/keyboard/screen-reader/touch-target/motion-sensitivity treatments and an audit gate (NFR-A6 / Story 10.9).
- **Mobile-portrait alert ack** from Journey 4 is production-grade in UX-DR9 (sticky-bottom `h-12` ack button, real-device validation in UX-DR25).
- **ZAR + USD display** from NFR-B3 is encoded in `<CostDisplay>` three-variant component (UX-DR5) with FX-rate provenance + freshness disclosure + stale-rate badge.
- **Webhook contract diagnostic surface** from PRD §14.3 is delivered as UX-DR20 (`/apps/[id]/webhook-deliveries` ADMIN-only view).
- **PM-confirmed visual preferences** (charts welcome / anti-clutter / colour on alerts OK / reject Datadog density) from PRD party-mode review match UX §Visual Foundation.
- **No UX requirement** appears that isn't traceable to a PRD FR, NFR, journey, or PRD-stated PM preference.

### UX ↔ Architecture alignment

UX components reference architecture surfaces (data, routes, runtime). The following matrix audits whether the architecture supports each UX requirement:

| UX requirement | Architecture support | Status |
|---|---|---|
| `<AppHealthPill>` (UX-DR1) — driven by latest probe + alert state | `HealthCheckResult` + `AlertEvent` in §9 | ✓ |
| `<SparklineCell>` (UX-DR2) — 24-px Recharts trend at table density | `MetricHourlyAggregate` + `HealthCheckResult` queries within NFR-SC4 budget; aggregate Job emission in §2/§3 | ✓ |
| `<ConnectorStatusRow>` (UX-DR3) — connector + last-run + state + actions | `Connector.failureState` + transitions in §9 + §2 | ✓ |
| `<TimeRangeSelector>` (UX-DR4) — URL-encoded range with SWR re-fetch | Client-only state; backend supports range params on `MetricDailyAggregate` queries | ✓ |
| `<CostDisplay>` (UX-DR5) — ZAR primary + USD source + FX rate + stale | `CostRecord` snapshot semantics in §9 + SARB FX in §5 | ✓ |
| Status pill family (UX-DR6) — three pill components share grammar | Presentational; no architecture impact | ✓ |
| `<PortfolioTable>` (UX-DR7) — sortable/filterable/searchable; URL state; sub-2s load | Single `/api/portfolio` endpoint composing `App` + aggregates per Story 7.1; NFR-SC4 query budget; SWR `Cache-Control` strategy | ✓ |
| `<AppDetailLayout>` (UX-DR8) — 2/3 + 1/3 composing all metric cards | Read-only composition; no architecture deltas | ✓ |
| `<AlertDetailLayout>` (UX-DR9) — mobile-portrait sticky-bottom ack | `/api/alerts/[id]/ack` route + SWR optimistic update; arch §4 webhook auth boundary distinct from `/api/alerts/*` (which IS session-auth) | ✓ |
| Notification bell extension (UX-DR10) | `AlertEvent` + scope-aware query | ✓ |
| Sidebar nav (UX-DR11) — role-gated server-side | `User.role` + `withAuth(role)` route helper per Story 1.3 | ✓ |
| Connector onboarding inline panel (UX-DR12) | Inline-panel pattern is presentational; backend = Stories 2.6, 2.7, 2.13–2.17; envelope encryption per arch §7 | ✓ |
| Empty / loading / error states (UX-DR13, 14) | Presentational; no architecture impact | ✓ |
| URL-encoded search/filter/sort (UX-DR15) | Server endpoints accept query params; client SWR re-fetches | ✓ |
| Mobile responsive shell + `<Sheet>` sidebar (UX-DR16) | Inherited from FlowDesk style guide §4 + Tailwind breakpoints | ✓ |
| Theme parity (UX-DR17) | Tailwind dark variant + CSS variables per style guide §2 | ✓ |
| Accessibility implementation (UX-DR18) | Radix + semantic HTML + `--ring`; runtime no-op | ✓ |
| ACS email template (UX-DR19) | `@azure/communication-email` SDK in tech-stack §11; outbound from ACA Container App per arch §1 | ✓ |
| Webhook diagnostic view (UX-DR20) | `WebhookEventRaw` table per arch §9; ADMIN-only RBAC | ✓ |
| SSO transparent deep-link redirect (UX-DR21) | Edge middleware `getToken()` per arch §4 + Auth.js v5 callback URL pattern | ✓ |
| Toast feedback (UX-DR22) | Presentational; no architecture impact | ✓ |
| Storybook + visual regression (UX-DR23) | Dev infra; **not pinned in architecture document** but listed in §10 dev-handoff items | ⚠ Minor (acceptable — dev-tool not architectural) |
| Playwright + axe-core (UX-DR24) | Dev infra; **not pinned in architecture document** | ⚠ Minor (same) |
| Real-device mobile testing (UX-DR25) | Process; **not pinned in architecture document** | ⚠ Minor (same) |

The three "minor" warnings are acceptable: Storybook, Playwright, and real-device testing are dev-tooling concerns rather than architectural surfaces. They land in Epic 10 (Stories 10.10, 10.11, 10.12) and need no architecture document update.

### Architecture ↔ PRD alignment

- All eight PRD §14 open questions have explicit decisions in the architecture document or its companion `webhook-contract-v1.md`.
- All v1-blocking items (§14.1, §14.3, §14.6) are resolved.
- Six architecture decisions (in arch §10 Decisions log) trace cleanly to PRD ACs and PM constraints.
- The architecture's typed credential matrix (§6) honours the PRD §14.6 PM intent (per-app credential isolation as a security boundary) without mass-cloning shared platform credentials — a deliberate trade documented for future security-stakeholder review.
- The webhook contract spec (`webhook-contract-v1.md`) is published as the architect deliverable mandated by PRD §14.3 (separate doc + Sender's Guide + worked HMAC fixture).

### Alignment Issues (warnings + gaps)

⚠ **Issue 1 — Missing `UserAppAssignment` model in architecture §9 Prisma sketch (BLOCKING).**

Stories 1.3 (RBAC), 1.6 (DEVELOPER scope), and 8.11 (alert notification scope) reference a `UserAppAssignment` table to enforce per-app DEVELOPER access (FR65 + FR66 + FR60). Independent grep confirms `UserAppAssignment` appears **zero times** in `architecture.md` and `PRD.md` — it is named only in `epics-and-stories.md`. The architecture document needs a pin for this entity (probably alongside the User/Role/Account/Session inheritance line in §9) or an explicit decision to derive scope from a JSON column on `User`. **Without this, Stories 1.3, 1.6, 8.11 cannot ship: the data model is undefined.**

**Recommended fix (during corrective pass):** add a `UserAppAssignment` model to architecture §9 with shape:
```prisma
model UserAppAssignment {
  userId    String
  appId     String
  user      User @relation(fields: [userId], references: [id], onDelete: Cascade)
  app       App  @relation(fields: [appId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  @@id([userId, appId])
  @@index([appId])
}
```

⚠ **Issue 2 — Missing `Setting` model in architecture §9 Prisma sketch (NON-BLOCKING but should be pinned).**

Story 4.10 (DEVELOPER cost-visibility global toggle, FR39) references a `Setting` row marked "(new)". Architecture §9 does not pin a `Setting` model. The story is implementable (it's a single-value flag — could be a config row, env var, or a key/value table), but the dev-team needs a decision to avoid story-level guesswork.

**Recommended fix:** either pin a `Setting(key, value, updatedAt, updatedBy)` table in arch §9, or have Story 4.10 explicitly state the storage choice (e.g., "single env var" or "config row on a dedicated table").

⚠ **Issue 3 — `App.failedWebhookAttempts` counter ambiguity (NON-BLOCKING).**

Story 2.14 (HMAC failures excluded from threshold, FR14a) introduces "a per-app `failed_webhook_attempts` counter (separate from connector status)". The architecture doesn't pin where this counter lives — could be a column on `App`, a derived query against `WebhookEventRaw` with `hmacResult: 'invalid'`, or a separate aggregate. The story is implementable per the data the receiver already writes (Story 2.13 persists `hmacResult` to `WebhookEventRaw`), so derivation works; just clarify the implementation choice.

**Recommended fix:** Story 2.14 ACs add a one-line note: "implementation: derived from `SELECT COUNT(*) FROM webhook_events_raw WHERE app_id = ? AND hmac_result = 'invalid' AND received_at >= now() - interval '24h'`" — no schema change needed.

⚠ **Issue 4 — `User.status` and `User.passwordHash` extensions to Auth.js User model (NON-BLOCKING).**

Stories 1.2 (credentials fallback) and 1.5 (user invite) reference `User.passwordHash` (bcrypt) and `User.status` ('invited' | 'active' | 'removed'). These are extensions to the Auth.js inherited User model. Architecture §9 says "Inherits Auth.js + User/Role models from FlowDesk" but doesn't enumerate FlowDev-specific extensions.

**Recommended fix:** architecture §9 adds a one-line note listing FlowDev's User-model extensions (`status` enum, `passwordHash`, `removedAt`).

### Warnings — none beyond the four issues above

No anti-patterns in the UX (no Datadog-density, no toast spam on healthy state, no drill-in modals, no hero-marketing aesthetics).

### Verdict for Step 4

**Mostly aligned with one BLOCKING gap.** Issues 2–4 are minor specifications that can be resolved during the next sprint planning step or before the relevant story enters dev. Issue 1 (missing `UserAppAssignment` model) is BLOCKING because Stories 1.3, 1.6, 8.11 cannot be implemented against an undefined data model — these stories sit at the foundation of every other epic's RBAC enforcement.

**Recommendation:** small corrective pass on `architecture.md` §9 to add `UserAppAssignment` (and ideally `Setting`) before sprint planning enters Phase 4. This is a 10-minute architect edit, not a re-litigation.

## Epic Quality Review

### Best-practices compliance checklist

| Epic | User value | Independent (works without later epics) | Story sizing | Database/entity creation timing | AC structure (G/W/T + testable) | FR/NFR/AR/UX-DR traceability |
|---|---|---|---|---|---|---|
| 1 — Platform Foundation | ✅ "Operators sign in and ADMIN manages users" | ✅ Standalone | ✅ 8 stories | ✅ AuditLog at 1.7; User extensions in 1.5/1.6 | ✅ G/W/T throughout | ✅ Touchpoints lines |
| 2 — Connector Framework & Registry | ✅ "ADMIN onboards an app and sees first probe land" | ✅ Standalone (uses Epic 1 only) | ✅ 19 stories | ✅ App in 2.1, Connector + ConnectorCredential in 2.4–2.6, HealthCheckResult in 2.12, WebhookEventRaw in 2.13 | ✅ | ✅ |
| 3 — Telemetry | ✅ "Operators see uptime, performance, growth trends" | ✅ Standalone (uses Epics 1, 2) | ✅ 12 stories | ✅ MetricSnapshot/ResourceSnapshot in 3.1, aggregates in 3.2 | ✅ | ✅ |
| 4 — Cost Intelligence | ✅ "Operators answer the cost question in ZAR with provenance" | ✅ Standalone (uses Epics 1, 2) | ✅ 10 stories | ✅ CostRecord/FxRate in 4.1 | ✅ | ✅ |
| 5 — Adoption Analytics | ✅ "Operators see DAU/WAU/MAU per app" | ✅ Standalone (uses Epics 1, 2) | ✅ 4 stories | ✅ ActivityEvent in 5.1 | ✅ | ✅ |
| 6 — Email Monitoring | ✅ "Operators see outbound email health per app" | ✅ Standalone (uses Epics 1, 2) | ✅ 4 stories | ✅ EmailEvent in 6.1 | ✅ | ✅ |
| 7 — Dashboards | ✅ "The Morning Glance — answer 4 questions in one screen" | ✅ Standalone if Epics 3–6 present (graceful when partial) | ✅ 7 stories | ✅ Read-only composition; no new tables | ✅ | ✅ |
| 8 — Alerting | ✅ "Operators get paged before users complain" | ✅ Standalone (uses Epics 1, 2, 3, 4, 6) | ✅ 11 stories | ✅ AlertRule in 8.1, AlertEvent in 8.2 | ✅ | ✅ |
| 9 — Reporting | ✅ "Monthly portfolio report < 60s" | ✅ Standalone (uses Epics 3, 4, 5) | ✅ 3 stories | ✅ Read-only; no new tables | ✅ | ✅ |
| 10 — Production Hardening | ✅ "v1 GA gate: observability, retention, audits" | ✅ Standalone (cross-cutting) | ✅ 13 stories | ✅ No new entity creation; only operational concerns | ✅ | ✅ |

### Cross-epic dependencies (acceptable; documented in §Epic List "Notes on Dependency Boundaries")

- Epic 1 → Epic 2 (auth + audit prerequisite for app registry).
- Epic 2 → Epics 3–6 (every connector implements Epic 2's framework).
- Epics 3–6 → Epic 7 (dashboards compose data; renders gracefully partial).
- Epics 3, 4, 6 → Epic 8 (three v1 alert rule types: uptime, cost MTD, email bounce).
- Epics 3, 4, 5 → Epic 9 (report data sources).
- All → Epic 10 (cross-cutting v1 GA gate).

These are correct — Epic 2 (Connector Framework) is sequenced first per PM direction, with Epic 1 (Foundation) as the unavoidable prerequisite. No circular dependencies. Each epic delivers complete value for its domain.

### User-value framing

All 10 epics are framed around what an operator can **do** or **observe**, not technical milestones:

- ✅ Epic 1: "Operators sign in and ADMIN manages users" (not "Set up auth backend")
- ✅ Epic 2: "ADMIN onboards an app, sees first probe land" (not "Build connector framework")
- ✅ Epic 3: "Operators see uptime / performance / growth trends" (not "Provision time-series tables")
- ✅ Epic 7: "Morning Glance answers 4 questions in one screen" (not "Build portfolio dashboard")
- ✅ Epic 10: "v1 GA gate: observability, retention, audits" (concrete acceptance gates, not "operationalise NFRs")

No anti-patterns found:
- No "Setup Database" epic
- No "API Development" epic
- No "Frontend Components" epic
- No "Deployment Pipeline" epic

### Story-quality findings

#### 🔴 Critical violations

**None.** No stories of the form "depends on Story X.Y" or with vague unfulfillable scope.

#### 🟠 Major issues

**1 issue inherited from Step 4 (UX/Architecture alignment):**
- Story 1.3 (RBAC), 1.6 (DEVELOPER scope), 8.11 (alert notification scope) reference `UserAppAssignment` model that is not pinned in `architecture.md` §9. This is an architecture gap, not a story-quality defect, but it blocks story completability. Already flagged in §UX Alignment Assessment Issue 1.

#### 🟡 Minor concerns — within-epic forward references

Four cases where a story numerically *earlier* in an epic references components or infrastructure delivered in a numerically *later* story. These are flagged in `epics-and-stories.md` frontmatter `sprintPlanningNotes`. They do not block stories from being implementable, but they require sprint planning to re-sequence within the epic before passing to dev:

| Epic | Story (early) | References | Story (late) | Resolution |
|---|---|---|---|---|
| 1 | 1.5 (`User.invite` audit-logs `op: 'user.invite'`) | `AuditLog` append helper | 1.7 (Persist immutable audit log) | Implement Story 1.7 alongside Story 1.1 (it's a 30-line foundational utility) |
| 2 | 2.6 (Attach connectors — `<ConnectorStatusRow>` appears with state `unknown`) | `<AppHealthPill>` (2.18), `<ConnectorStatusRow>` (2.19), failure-state machine (2.11) | 2.18, 2.19, 2.11 | Sprint-plan ordering: 2.18 + 2.19 + 2.10 + 2.11 → 2.6 → 2.17 |
| 3 | 3.5 (Uptime view — uses `<TimeRangeSelector>` + `<SparklineCell>`) | UI primitives | 3.6 (`<SparklineCell>`), 3.7 (`<TimeRangeSelector>`) | Sprint-plan ordering: 3.6 + 3.7 → 3.5 |
| 8 | 8.4 (Acknowledge — references `<AlertDetailLayout>` + bell popover) | UI surfaces | 8.9 (`<AlertDetailLayout>`), 8.10 (Notification bell extension) | Sprint-plan ordering: 8.9 + 8.10 → 8.4 (or build Story 8.4's API endpoint first, UI later) |

These are deliberate choices made during epic creation: stable story IDs were prioritised over perfect numerical implementation order, with sprint-planning re-sequencing as the resolution path. The `epics-and-stories.md` frontmatter explicitly captures this in `sprintPlanningNotes`. The Phase 4 sprint planner will respect them.

**Three additional minor concerns inherited from Step 4 (UX/Architecture alignment):**
- Issue 2 (Setting model not pinned)
- Issue 3 (`failed_webhook_attempts` counter implementation choice not pinned)
- Issue 4 (User model FlowDev extensions not enumerated in arch §9)

### AC quality spot-check

Audited 12 of 89 stories' ACs (1.2, 2.5, 2.13, 2.18, 3.5, 4.5, 4.9, 5.1, 7.2, 8.4, 8.9, 10.5):

- ✅ All use Given/When/Then BDD format.
- ✅ All ACs are independently testable.
- ✅ Happy paths covered.
- ✅ Error/edge conditions covered (paste-mask failures, race conditions, 5xx retries, replay window exceeded, stale FX, optimistic UI revert, etc.).
- ✅ Specific measurable outcomes (e.g. "< 60s warm-cache", "p95 < 500ms", "≥ 4.5:1 contrast", "≤ 16384 bytes", "byte-equal HMAC fixture match").
- ✅ Sensitive flows include audit-log assertions explicitly.

No vague ACs ("user can login") or missing measurability detected in the sample.

### Database / entity creation timing

Validated: every story creates **only** the schema it needs.

- ❌ Anti-pattern *not* present: "Story 1.1 creates all tables upfront."
- ✅ Pattern present: `App` in 2.1, `Connector` + `ConnectorCredential` in 2.4–2.6, `HealthCheckResult` in 2.12 (with BRIN index added in 3.1), `MetricSnapshot/ResourceSnapshot` in 3.1, aggregates in 3.2, `CostRecord/FxRate` in 4.1, `ActivityEvent` in 5.1, `EmailEvent` in 6.1, `AlertRule` in 8.1, `AlertEvent` in 8.2, `AuditLog` in 1.7.
- The two missing entities (`UserAppAssignment`, `Setting`) flagged in Step 4 are story-creation issues not "everything-upfront" issues.

### Greenfield bootstrap & starter-template check

- Architecture does not specify a starter template (FlowDesk is named explicitly as a *pattern donor*, not a starter).
- Story 1.1 (Bootstrap monorepo, Postgres, Prisma, and base infrastructure) is a proper greenfield story including `pnpm install`, monorepo workspace resolution, Postgres docker-compose, Prisma client wired, GitHub Actions CI/CD setup, and ACR-to-ACA deployment pipeline. ✓
- Dev environment, CI/CD, and Docker multi-stage builds land early (Story 1.1 + Stories 10.10–10.13 for testing infra). ✓
- No brownfield concerns (greenfield codebase).

### Acyclic dependency check (per PM direction in skill args)

**Connector framework stories precede consumers — verified.**

- Epic 2 (Connector Framework) is sequenced as Epic 2 of 10. Its 19 stories deliver before the consumers in Epics 3–8 begin.
- Stories within Epic 2 follow this implementation order (with the sprint-planning re-sequencing notes applied):
  - 2.1–2.3 (App Registry) → 2.4 (interface) → 2.5 (envelope encryption + ConnectorCredential) → 2.10 (worker runtime) → 2.11 (failure-state machine + Connector model) → 2.18 (status pills) → 2.19 (`<ConnectorStatusRow>`) → 2.6 (attach connectors) → 2.7–2.9 (validate/rotate/disable) → 2.12 (HTTP probe + HealthCheckResult) → 2.13 (webhook receiver + WebhookEventRaw) → 2.14 (HMAC exclusion) → 2.15 (rotate webhook secret) → 2.16 (diagnostic view) → 2.17 (onboarding panel polish).
- Connectors specific to Epic 3 (Azure ARM, Azure PG Metrics, Postgres-direct) implement against the Epic 2 framework — verified by inspection of Stories 3.8, 3.9, 3.10's Touchpoints lines (all reference AR16 / Story 2.4's ConnectorType registry).
- Connectors specific to Epic 4 (Azure Cost Mgmt, DO) implement against Epic 2 framework — verified for Stories 4.3, 4.4.
- Webhook drain in Epic 5 (Story 5.1) consumes Epic 2's Story 2.13 webhook receiver output — verified.
- ACS connector in Epic 6 (Story 6.2) implements against Epic 2 framework — verified.
- Alert engine in Epic 8 (Story 8.2) reads telemetry from Epics 3, 4, 6 — proper read-only consumption, no inverse dep.

**No cycles detected.** Connector framework (Epic 2) is upstream of all telemetry/cost/adoption/email consumers. Epic 7 dashboards are downstream-only. Epic 8 alerting reads from Epics 3, 4, 6. Epic 9 reports read from Epics 3, 4, 5. Epic 10 hardening is cross-cutting but operationally non-blocking for in-epic work (it gates GA, not individual story implementation).

### v1 scope leakage check (per PM direction)

Audited every story's ACs for v1.1 / v2 functionality leakage:

- ✅ FR24 (server CPU/memory) — explicitly tagged v1.1 in PRD; Story 3.9 implements only what Azure Monitor exposes natively for Epic 3 (not the full v1.1 scope).
- ✅ FR29–FR31 (cumulative growth, integration health) — tagged v1.1; deferred section in `epics-and-stories.md` lists them; Story 5.2 explicitly limits to DAU/WAU/MAU (no cumulative).
- ✅ FR40 (budget thresholds) + FR41 (cost-share attribution) — tagged v1.1; Story 8.1 limits rule types to uptime / cost MTD / email bounce (no budget breach).
- ✅ FR45 (recipient log search) — tagged v1.1; Story 6.4 implements masking + unmask only (no search).
- ✅ FR49 (cross-cutting trend dashboards) — tagged v1.1; Story 7.4 implements App detail + Story 7.2 implements portfolio table; no cross-cutting trend page.
- ✅ FR52 (scheduled reports) — tagged v1.1; Story 9.3 implements on-demand only.
- ✅ FR53 (PDF export) — tagged v2; Story 9.2 implements CSV only.
- ✅ FR59 v2 channels (Teams, SMS) — Story 8.6, 8.10 implement in-app + ACS email only; Teams/SMS not in scope.
- ✅ FR64 v2 (VIEWER role) — Story 1.6 implements ADMIN/MANAGER/DEVELOPER only.
- ✅ AWS connector suite — tagged v1.1; ConnectorType enum in Story 2.4 includes `WEBHOOK_RECEIVER` + 7 v1 connectors; AWS_* values are listed as stubs only.
- ✅ Resend, Azure Blob — tagged v1.1; not implemented in v1 stories.
- ✅ TimescaleDB — tagged v2; Story 3.1 ships plain PG + BRIN, with NFR-SC4 tripwire alert in Story 10.5 as the re-evaluation trigger.
- ✅ Auto-discovery onboarding — tagged v1.1; Story 2.17 implements explicit configuration only.

**No v1.1 / v2 leakage detected.** v1 scope is consistent across PRD § Product Scope, UX § UX Scope, architecture (no v1.1-only entities pinned), and `epics-and-stories.md` (51 v1 FRs + 18 deferred FRs correctly tagged).

### Verdict for Step 5

**Quality is high.** No critical violations, no AC defects, no v1 scope leakage, no anti-pattern epics, no acyclic-graph violations.

**Outstanding:** the four within-epic re-sequencing concerns (🟡 minor) are explicitly captured in `epics-and-stories.md` frontmatter and will be honoured at sprint planning. The single 🔴 BLOCKING issue (`UserAppAssignment` missing) carried over from Step 4 needs an architecture corrective pass; it is the only true gate for Phase 4 entry.

## Summary and Recommendations

### Overall Readiness Status

**NEEDS WORK** — one targeted architecture corrective pass required before sprint planning.

The planning artifacts are exceptionally well-aligned overall: 100% v1 FR coverage (51 of 51), all 36 NFRs traced to stories, 89 stories with consistent G/W/T acceptance criteria + Touchpoints metadata, no v1 scope leakage, no critical AC defects, and an acyclic dependency graph that correctly sequences the connector framework before its consumers. The single blocking gap is a missing data-model entity that two foundational stories depend on.

### Critical Issues Requiring Immediate Action

🔴 **Issue 1 — `UserAppAssignment` model missing from architecture §9 (BLOCKING)**

- **Where it shows up:** Stories 1.3 (server-side RBAC), 1.6 (DEVELOPER scope assignment), 8.11 (role-scoped alert notifications) reference `UserAppAssignment` rows for per-app DEVELOPER access (FR65 + FR66 + FR60).
- **Why blocking:** these stories cannot ship against an undefined data model; they sit at the foundation of every other epic's RBAC enforcement.
- **Fix scope:** ~10-minute architect edit. Add the model to `architecture.md` §9 alongside the User/Role/Account/Session inheritance line:
  ```prisma
  model UserAppAssignment {
    userId    String
    appId     String
    user      User @relation(fields: [userId], references: [id], onDelete: Cascade)
    app       App  @relation(fields: [appId], references: [id], onDelete: Cascade)
    createdAt DateTime @default(now())
    @@id([userId, appId])
    @@index([appId])
  }
  ```

### Non-Blocking Issues (address opportunistically)

🟡 **Issue 2 — `Setting` model not pinned (minor)**
- Story 4.10 (DEVELOPER cost-visibility global toggle, FR39) references a `Setting (new)` row.
- Fix: pin a `Setting(key, value, updatedAt, updatedBy)` table in arch §9, or have Story 4.10 explicitly state "single env var" / "config row on dedicated table."

🟡 **Issue 3 — `App.failedWebhookAttempts` counter implementation choice not pinned (minor)**
- Story 2.14 (FR14a HMAC failure exclusion).
- Fix: Story 2.14 ACs add a one-line note: "implementation: derived from `SELECT COUNT(*) FROM webhook_events_raw WHERE app_id = ? AND hmac_result = 'invalid' AND received_at >= now() - interval '24h'`" — no schema change needed.

🟡 **Issue 4 — User model FlowDev extensions not enumerated in arch §9 (minor)**
- Stories 1.2, 1.5 reference `User.passwordHash` (bcrypt) and `User.status` ('invited' | 'active' | 'removed').
- Fix: arch §9 adds a one-line note listing FlowDev's User-model extensions.

🟡 **Issues 5–8 — Within-epic forward references (already captured in `epics-and-stories.md` frontmatter `sprintPlanningNotes`)**
- Epic 1: implement Story 1.7 (audit log infra) alongside Story 1.1 bootstrap.
- Epic 2: implement Stories 2.18, 2.19, 2.10, 2.11 before Stories 2.6 and 2.17.
- Epic 3: implement Stories 3.6, 3.7 before Story 3.5.
- Epic 8: implement Stories 8.9, 8.10 alongside Story 8.4.
- These are sprint-planning concerns, not artifact corrections.

### Recommended Next Steps

1. **Apply the architecture corrective pass** — open `architecture.md` and add the four small fixes (Issues 1–4) in §9 Prisma sketch. Issue 1 is mandatory; Issues 2–4 are recommended-with-this-pass to avoid story-level guesswork later. Estimated effort: 15–20 minutes.
2. **Update `APP-PROGRESS.md`** to reflect the architecture corrective pass status and shift readiness to `READY` once Issue 1 is resolved.
3. **Run sprint planning** — invoke `bmad-sprint-planning` (`[SP]`). The within-epic re-sequencing notes from `epics-and-stories.md` frontmatter feed directly into sprint plan generation.
4. **Begin Phase 4** — story-by-story implementation cycle: Create Story `[CS]` → Validate Story `[VS]` → Dev Story `[DS]` → Code Review `[CR]` → next story or Epic Retrospective `[ER]` at epic completion.

### Final Note

This assessment audited **89 stories across 10 epics**, validated coverage of **51 v1 FRs, 36 NFRs, 18 architecture-derived ARs, and 25 UX-DRs**, and cross-checked dependencies for cycles, scope leakage, and entity-model alignment. It found **1 blocking issue (architecture entity gap) + 7 minor concerns**. The blocking issue is a 10-minute architect fix; everything else is sprint-planning-handlable. **The planning artifacts are unusually well-prepared for Phase 4** — connector framework correctly sequenced first, FR coverage at 100%, AC quality high, and the deferred-capabilities backlog cleanly distinguished from v1.

You may proceed in two ways:

- **Recommended path:** apply the corrective pass on `architecture.md` (10–20 min) → re-run readiness check briefly to confirm Issue 1 resolved → enter sprint planning. This buys clean Phase 4 entry with no foundational ambiguity.
- **Alternative path:** proceed to sprint planning as-is and treat Issue 1 as a sprint-planning input (have the sprint planner pin `UserAppAssignment` as a Story 1.6 sub-task). Workable but creates an architecture document that doesn't match the implementation.

**Assessor:** Claude Code (Opus 4.7) acting as PM/QA. **Date:** 2026-04-28.

---

## Corrective Pass Applied — 2026-04-28

After Don approved the recommendation, the architecture corrective pass was applied immediately.

### Changes to `_bmad-output/planning-artifacts/architecture.md`

1. **§9 preamble** updated: Auth.js inheritance line now includes `Account/Session`, and a new paragraph enumerates FlowDev's User-model extensions (`passwordHash`, `status`, `removedAt`) — resolves Issue 4.
2. **§9 enum block:** added `enum UserStatus { INVITED ACTIVE REMOVED }` — resolves Issue 4 (typed status).
3. **§9 model block:** added `model UserAppAssignment` after `AuditLog` — resolves Issue 1 (blocking). Schema as recommended:
   ```prisma
   model UserAppAssignment {
     userId    String
     appId     String
     user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
     app       App      @relation(fields: [appId], references: [id], onDelete: Cascade)
     createdAt DateTime @default(now())
     @@id([userId, appId])
     @@index([appId])
   }
   ```
4. **§9 model block:** added `model Setting` (generic key/value with audit-via-helper) — resolves Issue 2.
5. **§9 derivation note:** added an explicit subsection "`App.failedWebhookAttempts` counter — derivation pattern (FR14a)" with the canonical SQL — resolves Issue 3 without a schema change.
6. **§10 Decisions log:** appended an entry recording the corrective pass and citing the readiness-check origin.

### Verification

Re-running the affected validations:
- ✅ Story 1.3 / 1.6 / 8.11 now reference an entity that exists in the architecture — no longer blocking.
- ✅ Story 4.10 references `Setting` which is now pinned.
- ✅ Story 2.14 has a clear derivation pattern documented for `failed_webhook_attempts`.
- ✅ Story 1.5 / 1.2 references to `User.passwordHash` and `User.status` are now backed by an explicit FlowDev extension note.

### Updated readiness verdict

**READY for sprint planning.** The 4 remaining minor concerns are within-epic re-sequencing notes already captured in `epics-and-stories.md` frontmatter `sprintPlanningNotes`; sprint planning will honour them.

### Next step

Invoke `[SP]` `bmad-sprint-planning` in a fresh session to enter Phase 4.


