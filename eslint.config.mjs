import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",

    // Repo-specific: folders not meant to be linted (noise in Problems).
    "BACKUPS/**",
    "CHEMA/**",
    "logs/**",
    "data/**",
    "scripts/**",

    // Sandbox / experiments (not part of the core app quality gate).
    "app/motor-bueno/**",
    "app/icons-preview/**",
    "app/icons-search-found/**",
    "app/page-motor-malo-BACKUP.tsx",
    "app/test-*/**",
    "app/testing-*/**",
  ]),
]);

export default eslintConfig;
