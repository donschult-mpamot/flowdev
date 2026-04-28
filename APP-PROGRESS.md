# FlowDev — App Progress

**Project:** FlowDev (codename **MPAMOT** — Multi-Platform Application Monitoring & Operations Tool)
**Owner:** Don
**Methodology:** BMAD (Phase-driven planning → implementation)
**Last updated:** 2026-04-28 EOD (Story 1.1 PR #1 open as draft, CI running; resume tomorrow)

> Single source of truth for project status across Claude Code sessions. Read this first when resuming work in a new session, then act on the **Next step** in §Current state.

---

## Current state

**Phase:** 4 — Implementation, **Story 1.1 status `review`** — PR open as draft, CI running.

**🟦 PR #1 (Story 1.1):** <https://github.com/donschult-mpamot/flowdev/pull/1>
- Base: `main` (initial README-only seed commit `7e41274`)
- Head: `feat/story-1-1-bootstrap` — two commits: `da55b8e` scaffold + `3291266` BMAD artifacts (post-rebase SHAs)
- Status at EOD: draft, mergeable, CI `pending` on the `typecheck / lint / test / build` job

**Next step when you resume:**
1. **Check CI result on PR #1.** `"/c/Program Files/GitHub CLI/gh.exe" pr checks 1` from `C:\Dev\flowdev`. If green → step 2. If red → fix forward, push, re-check.
2. **`[CR]` Code Review** — `bmad-code-review` against PR #1, in a **fresh session with a different LLM** than Opus 4.7 (Sonnet 4.6 or Opus 4.6 ideally — different blind spots). Review surface = the diff in PR #1.
3. **CR passes / fixes applied → mark PR ready (un-draft) → merge to `main`.** Use **Squash and merge** or **Rebase and merge**; both preserve `main`'s initial commit.
4. **`[CS]` Story 1.7** (audit log infrastructure — sequenced alongside 1.1 per §Sprint-planning notes item 1) → `[DS]` → `[CR]`.
5. **Then loop forward**: Story 1.2 (Auth.js + SSO), 1.3 (RBAC), 1.4 (FlowDesk shell), 1.5/1.6 (user mgmt — depend on 1.7's audit append helper), 1.8 (audit search/filter).

**Decisions locked (2026-04-28, Don):**
- Repo location: stay in `C:\Dev\flowdev` (code coexists with `_bmad-output/`, `_bmad/`, `artifacts/`, this file).
- Package manager: **npm** (FlowDesk parity), not pnpm. Story 1.1 AC text says `pnpm`; story file documents the npm interpretation. Planning artifact `epics-and-stories.md` is **not** edited — story files own per-story decisions.
- GitHub repo: `https://github.com/donschult-mpamot/flowdev` (default branch `main`). Workspace scopes use `@flowdev/*`; `MPAMOT` lives only in the GitHub org name and internal docs.
- `gh` CLI installed via winget (`gh 2.92.0` at `C:\Program Files\GitHub CLI\gh.exe`); authenticated as `donschult-mpamot` (token in OS keyring).

**Story 1.1 verification (2026-04-28, all green locally):**
- `npm install` ✓ (411 packages across 6 workspaces)
- `npm run db:generate` ✓ (Prisma 6.19.3 client from empty schema)
- `npm run typecheck` ✓ (all 6 workspaces)
- `npm run lint` ✓ (Next.js ESLint zero errors; other workspaces lint not configured per story scope)
- `npm run test` ✓ (8 tests across 6 workspaces)
- `npm run build` ✓ (Next.js standalone output, jobs/worker tsc emit)
- `docker compose up -d` ✓ (`flowdev-postgres` healthy on `:5432`, group visible in Docker Desktop)

**Active sprint tracker:** `_bmad-output/implementation-artifacts/sprint-status.yaml` — 10 epics, 91 stories. Epic 1 = `in-progress`, Story 1.1 = `review`, all others = `backlog`. Re-sequencing notes embedded as comments inside the file.

---

## Phase progress

| Phase | Status | Artifact(s) |
|---|---|---|
| 1 — Analysis | ✅ Complete | `_bmad-output/planning-artifacts/product-brief.md` |
| 2 — Planning | ✅ Complete | `_bmad-output/planning-artifacts/PRD.md`, `_bmad-output/planning-artifacts/UX-design.md` |
| 3 — Solutioning | ✅ Complete | `_bmad-output/planning-artifacts/architecture.md`, `_bmad-output/planning-artifacts/webhook-contract-v1.md`, `_bmad-output/planning-artifacts/epics-and-stories.md`, `_bmad-output/planning-artifacts/implementation-readiness-report-2026-04-28.md` |
| 4 — Implementation | 🟡 In progress (Story 1.1 — PR #1 open as draft, CI running, awaiting `[CR]`) | PR #1 ([link](https://github.com/donschult-mpamot/flowdev/pull/1)) · `_bmad-output/implementation-artifacts/sprint-status.yaml` · `_bmad-output/implementation-artifacts/1-1-bootstrap-...md` · the scaffold (`apps/`, `packages/`, root configs) |

---

## Canonical artifacts

Authoritative inputs that condition every BMAD step. **Never duplicate or paraphrase — link to them.**

| File | Purpose |
|---|---|
| `_bmad-output/planning-artifacts/product-brief.md` | Source brief — treated as authoritative for PRD inputs |
| `_bmad-output/planning-artifacts/tech-stack.md` | FlowDesk-inherited tech stack; FlowDev MUST conform per brief §8 |
| `_bmad-output/planning-artifacts/style-guide.md` | FlowDesk visual + UX style guide; FlowDev extends, does not redefine |
| `artifacts/FLOWDEV-SPEC.md` | Spec doc (older — superseded by PRD; retain for reference) |
| `artifacts/TECH-STACK.md` | Mirror of canonical tech-stack |
| `artifacts/STYLE-GUIDE.md` | Mirror of canonical style-guide |

> Source-of-truth precedence: `_bmad-output/planning-artifacts/*` over `artifacts/*` for any v1 work.

---

## Planning artifacts produced (Phases 1–3)

### Phase 1 — Analysis

- **`product-brief.md`** — 12 capabilities, 11 connector types, 4 personas, target outcomes, FlowDesk pattern-donor relationship.

### Phase 2 — Planning

- **`PRD.md`** — 69 FRs (51 v1; 18 deferred), 36 NFRs, 6 user journeys, RBAC matrix, 8 open questions resolved, risks register, decisions log. Authoritative for v1 capability contract.
- **`UX-design.md`** — 5 FlowDev-specific components (`<AppHealthPill>`, `<SparklineCell>`, `<ConnectorStatusRow>`, `<TimeRangeSelector>`, `<CostDisplay>`), 2 FlowDesk-pattern extensions, J1/J3/J4 mechanics, mobile-portrait alert ack flow, accessibility implementation, theme parity.

### Phase 3 — Solutioning

- **`architecture.md`** — Resolves PRD §14 architect-pending items. Hybrid `apps/worker` (always-on ACA Container App) + ACA Jobs runtime; envelope encryption via Azure Key Vault Managed Identity; per-app credential isolation via class-scoped SPs + Azure RBAC (option b); Prisma 6 schema sketch (§9) — App, Connector, ConnectorCredential, HealthCheckResult, MetricSnapshot, MetricHourlyAggregate, MetricDailyAggregate, CostRecord, FxRate, WebhookEventRaw, ActivityEvent, IntegrationCallEvent, CustomMetricEvent, ResourceSnapshot, EmailEvent, AlertRule, AlertEvent, AuditLog, **UserAppAssignment, Setting** (added in 2026-04-28 corrective pass), plus User-model extensions (`status`, `passwordHash`, `removedAt`). SARB FX daily Job. node-cron worker with `pg_try_advisory_lock`.
- **`webhook-contract-v1.md`** — Sender-facing versioned contract. HMAC-SHA256 signing input `<version>.<timestamp>.<raw_body>`. Per-app secret. Replay window 5 min. Idempotency via `(event_id, app_id)`. Three event types (`login`, `integration_call`, `custom_metric`). Worked HMAC fixture committed at `packages/shared/__fixtures__/webhook/login.json`. TypeScript + Python + curl reference implementations.
- **`epics-and-stories.md`** — 10 epics, 89 stories. Connector Framework sequenced first per PM direction. Every story carries FR/NFR/AR/UX-DR refs, UX components consumed, and architecture entities touched. Sprint-planning notes captured in frontmatter for within-epic re-sequencing.
- **`implementation-readiness-report-2026-04-28.md`** — Six-step readiness assessment. Found 100% v1 FR + NFR coverage, no scope leakage, acyclic dependency graph. One blocking entity gap (`UserAppAssignment`) + 3 minor pinning ambiguities — all resolved in the 2026-04-28 architecture corrective pass.

---

## Epic & story summary

| Epic | Stories | Coverage |
|---|---|---|
| 1 — Platform Foundation (Identity, RBAC, Shell, Audit) | 8 | FR61–FR69 |
| 2 — Connector Framework & Application Registry *(stories sequenced first)* | 19 | FR1–FR16, FR14a |
| 3 — Uptime / Performance / Resource Growth | 12 | FR17–FR23 |
| 4 — Cost Intelligence with FX & Forecast | 10 | FR32–FR39 |
| 5 — Adoption Analytics via Webhook Events | 4 | FR25–FR28 |
| 6 — Email Monitoring (ACS) | 4 | FR42–FR44 |
| 7 — Portfolio & App Detail Dashboards | 7 | FR46–FR48 |
| 8 — Alerting (Rules, Engine, Lifecycle, Channels) | 11 | FR54–FR60 |
| 9 — Reporting & CSV Export | 3 | FR50, FR51 |
| 10 — Production Hardening & Observability | 13 | NFR-driven; gates v1 GA |
| **Total** | **91** | **51 v1 FRs + 36 NFRs + 18 ARs + 25 UX-DRs** |

**Deferred to v1.1:** FR24, FR29, FR30, FR31, FR40, FR41, FR45, FR49, FR52 — plus AWS connector suite, Resend connector, Azure Blob, auto-discovery, scheduled reports, budget thresholds, tile-view portfolio.
**Deferred to v2:** FR53, VIEWER role, Teams/Slack/SMS channels, multi-region probing, TimescaleDB, anomaly detection, synthetic probes, OpenTelemetry, capacity forecasting, runbook automation, PDF export.

---

## Sprint-planning notes (capture before Phase 4)

The epics doc flags four within-epic re-sequencing items. The dev team should respect these at sprint planning rather than following raw story numbers:

1. **Epic 1** — Implement Story **1.7** (`Persist immutable audit log` infrastructure) alongside Story **1.1** (bootstrap). Subsequent user-management stories (1.5, 1.6) depend on the audit append helper being available.
2. **Epic 2** — Implement Stories **2.18** (status pills), **2.19** (`<ConnectorStatusRow>`), **2.10** (worker runtime), and **2.11** (failure-state machine) **before** Story **2.6** (attach connector) and Story **2.17** (onboarding panel polish), which compose them.
3. **Epic 3** — Implement Stories **3.6** (`<SparklineCell>`) and **3.7** (`<TimeRangeSelector>`) **before** Story **3.5** (uptime view), which uses both.
4. **Epic 8** — Implement Stories **8.9** (`<AlertDetailLayout>`) and **8.10** (notification bell extension) alongside Story **8.4** (acknowledge endpoint), since 8.4's user-flow ACs reference both surfaces.

Story IDs themselves are stable references — keep them; just adjust execution order.

---

## Open decisions / pending stakeholders

| Item | Status | Source |
|---|---|---|
| **PRD §14.6** — per-app credential scoping (option a vs option b) | PM-PROXY-PENDING-SIGN-OFF — Don acting as security proxy. Architect chose **option (b)** (class-scoped SP + Azure RBAC) conditional on (i) RG-level RBAC scope, (ii) no per-app rotation policy, (iii) future security owner sign-off. | PRD §14.6 / architecture §6 |
| **Implementation readiness corrective pass** | DONE 2026-04-28 — added `UserAppAssignment`, `Setting` models, `UserStatus` enum + User-model extensions, and `App.failedWebhookAttempts` derivation pattern to architecture §9. Decisions log §10 updated. | architecture §9, §10 |
| **PRD §14.1** — background job framework | DECIDED — hybrid `apps/worker` always-on Container App + ACA Jobs; no Redis. | architecture §2 |
| **PRD §14.2** — TimescaleDB | DECIDED — defer to v2; ship plain PG + aggregates. Re-evaluation gated by NFR-SC4 tripwire alert (Story 10.5). | architecture §3 |
| **PRD §14.5** — cost data freshness | DECIDED — hours-level lag acceptable; UI surfaces freshness disclosure inline. Re-evaluate at 60-day gate. | architecture §5, Story 4.9 |
| **NFR-S10** — pen-test / threat-model review | Pending — must complete before v1 GA. Story **10.8**. | epics-and-stories.md |
| **NFR-A6** — accessibility audit | Pending — Lighthouse ≥ 95 + axe-core zero violations + manual VoiceOver/NVDA walkthrough on J1, J3, J4 before v1 GA. Story **10.9**. | epics-and-stories.md |

---

## Validated learning gates (post-launch — do not address now)

Per PRD §Validated Learning Gates, evaluated 30/60/90 days post-GA:

1. Operators' daily cloud-console tab counts trend down (self-report at 30-day check-in).
2. Time-to-answer-leadership-cost-question drops from hours to under 60 minutes.
3. ≥ 70% of incidents alert via FlowDev before user-reported.
4. 100% of new apps onboarded < 1 working day.

If gate 1 or 2 fail at 60 days → re-rack v1.1 priorities. If gates 3, 4 pass → architecture is sound; v1.1 proceeds as planned.

---

## How to resume in a new session

1. **Open this file first.** It tells you the current phase, what's done, and the next step.
2. **If a PR is open (see §Current state):** check its CI status with `"/c/Program Files/GitHub CLI/gh.exe" pr checks <num>` before doing anything else. Fixes for a red CI run come before any new BMAD work.
3. **Check the BMAD output directory** — `_bmad-output/planning-artifacts/` and `_bmad-output/implementation-artifacts/` — for the actual artifacts.
4. **Run the recommended next step** from §Current state. BMAD skills should run in a fresh context window each.
5. **For implementation work:** consult `epics-and-stories.md` for the active epic/story, plus `architecture.md` §9 for the relevant Prisma entities and any sprint-planning re-sequencing notes from §Sprint-planning notes above.
6. **Update this file** at every meaningful milestone — phase completion, epic kickoff, story completion, gate passes/failures, decision changes, PR open/merge.

### Useful skill quick-reference

| Code | Skill | When |
|---|---|---|
| `IR` | `bmad-check-implementation-readiness` | Phase 3 closeout — verify PRD/UX/Architecture/Epics alignment |
| `SP` | `bmad-sprint-planning` | Phase 4 entry — produces sprint status file |
| `CS` | `bmad-create-story` | Per-story prep — pull next story into a dedicated context file |
| `VS` | `bmad-create-story:validate` | Validate story readiness before dev |
| `DS` | `bmad-dev-story` | Implementation execution |
| `CR` | `bmad-code-review` | Adversarial review of dev output |
| `ER` | `bmad-retrospective` | Optional — at epic completion |
| `SS` | `bmad-sprint-status` | Anytime — sprint snapshot |
| `CC` | `bmad-correct-course` | When significant change is needed |
| `BH` | `bmad-help` | When unsure what to do next |

---

## Repository pointers

- **BMAD config:** `_bmad/bmm/config.yaml` — `user_name: Don`, `planning_artifacts: _bmad-output/planning-artifacts`, `implementation_artifacts: _bmad-output/implementation-artifacts`, `project_knowledge: docs`.
- **BMAD scripts:** `_bmad/scripts/` — `resolve_customization.py` (skill customization resolver).
- **Customizations:** `_bmad/custom/*.toml` — currently none specific to FlowDev workflow.
- **Future codebase:** `MPAMOT` repo (greenfield — not yet initialized; Story 1.1 bootstraps).
