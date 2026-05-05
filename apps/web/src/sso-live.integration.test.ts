// Live SSO smoke test against a real Azure Entra ID tenant.
//
// Skips unless AZURE_AD_TENANT_ID + AZURE_AD_CLIENT_ID + AZURE_AD_CLIENT_SECRET
// are all populated. CI deliberately leaves these unset so the skip path runs;
// staging populates them and verifies live OIDC handshake before merge.
//
// The full browser-redirect flow requires Playwright (deferred to Story 10.11).
// This file establishes the gating contract so that Story 10.11's harness can
// drop into a `runIf`-guarded slot without rewriting test conventions.

import { describe, it } from "vitest";

const liveSsoConfigured =
  Boolean(process.env.AZURE_AD_TENANT_ID) &&
  Boolean(process.env.AZURE_AD_CLIENT_ID) &&
  Boolean(process.env.AZURE_AD_CLIENT_SECRET);

if (!liveSsoConfigured) {
  console.warn(
    "[sso-live.integration.test] AZURE_AD_TENANT_ID/CLIENT_ID/CLIENT_SECRET not all set — " +
      "live SSO smoke test skipped. Story 1.2 ships code-complete-with-stubs; live verification " +
      "happens in staging once Don supplies the tenant config.",
  );
}

describe.skipIf(!liveSsoConfigured)("Azure Entra ID live SSO (integration)", () => {
  it.todo("performs OIDC handshake against the live tenant via Playwright (Story 10.11)");
});
