import js from "@eslint/js";
import tseslint from "typescript-eslint";

// Root config — used by every workspace except apps/web (which has its own
// Next.js-specific config that takes precedence via flat-config discovery).

export default [
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.next/**",
      "**/coverage/**",
      "packages/db/src/generated/**",
      "apps/web/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx,mts,cts}"],
    rules: {
      // NFR-S6: audit_logs is append-only. Defense-in-depth alongside the
      // Postgres-level REVOKE in the 1_7_audit_log migration. Catches any
      // *.auditLog.{update,updateMany,delete,deleteMany,upsert} call shape.
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "CallExpression[callee.type='MemberExpression'][callee.object.property.name='auditLog'][callee.property.name=/^(update|updateMany|delete|deleteMany|upsert)$/]",
          message:
            "audit_logs is append-only (NFR-S6). Use appendAudit() from @flowdev/shared.",
        },
      ],
    },
  },
];
