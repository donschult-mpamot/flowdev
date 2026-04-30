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
];
