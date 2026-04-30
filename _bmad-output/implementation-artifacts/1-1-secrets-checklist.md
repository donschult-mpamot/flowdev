# Story 1.1 — GitHub Secrets & Variables Checklist

> **Don's task** — provision Azure infrastructure first (architecture §11 line 750), then create the secrets and variables below in the GitHub repo settings: <https://github.com/donschult-mpamot/flowdev/settings/secrets/actions>.

The CI workflow (`.github/workflows/ci.yml`) needs **no** secrets — it runs against the public registry and the local workspace.

The deploy workflow (`.github/workflows/deploy.yml`) is **gated** behind the `DEPLOY_ENABLED` repo variable. While the variable is unset (or `false`), `workflow_dispatch` runs are no-ops and `push: main` does not deploy. Setting it to `true` requires all the secrets and variables below to be in place.

---

## Repository **secrets** (encrypted)

| Name | Source | Notes |
|---|---|---|
| `ACR_USERNAME` | Azure portal → ACR → Access keys | Admin user enabled on the ACR registry, or a service principal with `AcrPush`. |
| `ACR_PASSWORD` | Same | Pair with `ACR_USERNAME`. |
| `AZURE_CREDENTIALS` | `az ad sp create-for-rbac --sdk-auth` JSON | Service principal with `Contributor` on the resource group hosting Container Apps. |

Story 1.2 will introduce additional Auth.js secrets (`AUTH_SECRET`, `AZURE_AD_*`). Story 2.5 will introduce Key Vault references (no plain secret — Managed Identity).

---

## Repository **variables** (plaintext — non-sensitive config)

| Name | Example | Notes |
|---|---|---|
| `DEPLOY_ENABLED` | `true` | Gate. Leave unset until ACA + ACR + secrets exist. |
| `ACR_LOGIN_SERVER` | `flowdev.azurecr.io` | ACR hostname. |
| `AZURE_RESOURCE_GROUP` | `rg-flowdev-prod` | Resource group containing Container Apps. |
| `AZURE_CONTAINERAPP_WEB` | `flowdev-web` | ACA name for `apps/web`. |
| `AZURE_CONTAINERAPP_WORKER` | `flowdev-worker` | ACA name for `apps/worker` (always-on, min-replicas ≥1). |
| `AZURE_CONTAINERAPP_JOBS_PREFIX` | `flowdev-job` | ACA Jobs name prefix. The deploy workflow appends `-${jobName}` for each of the seven Jobs (e.g. `flowdev-job-hourly-aggregate`). |

---

## Provisioning prerequisites (out of scope for Story 1.1 — Don's ops work)

These aren't secrets but they gate the deploy workflow flipping to `push: main`:

- [ ] Azure Container Registry (ACR) — `flowdev.azurecr.io` (or whatever name).
- [ ] Three Azure Container Apps: `flowdev-web`, `flowdev-worker`. Plus seven ACA Jobs (`flowdev-job-${jobName}` for each of the seven entrypoints in `apps/jobs/src/`).
- [ ] Azure Key Vault `flowdev-creds-mk` with the master RSA-4096 key (Story 2.5 wires envelope encryption against this — out of scope for 1.1).
- [ ] Managed Identity attached to all three Container Apps + Jobs with `Key Vault Crypto User` on the master key.
- [ ] Postgres Flexible Server provisioned (separate database, same server class as FlowDesk per architecture §1).
- [ ] Service principal taxonomy (architecture §11 line 756) — six SPs in v1 (eight when AWS lands at v1.1). Out of scope for 1.1; gating Story 2.5.

When all of the above exist:
1. Set the GitHub variables and secrets above.
2. Set `DEPLOY_ENABLED=true`.
3. Edit `.github/workflows/deploy.yml`: change the trigger from `workflow_dispatch` only to `push: branches: [main]`.
4. Push. The first deploy will run.
