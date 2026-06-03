import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * Defence-in-depth for the service-role Supabase key:
 * only API route handlers and the typed query layer may import it.
 * Any other importer fails the build.
 */
const restrictServiceRole = {
  files: ["**/*.{ts,tsx}"],
  ignores: [
    "app/api/**",
    "lib/supabase/queries/**",
    "lib/supabase/service-role.ts",
  ],
  rules: {
    "no-restricted-imports": [
      "error",
      {
        paths: [
          {
            name: "@/lib/supabase/service-role",
            message:
              "service-role bypasses RLS; only import from app/api/** or lib/supabase/queries/**.",
          },
        ],
        patterns: [
          {
            group: ["**/lib/supabase/service-role"],
            message:
              "service-role bypasses RLS; only import from app/api/** or lib/supabase/queries/**.",
          },
        ],
      },
    ],
  },
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  restrictServiceRole,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
