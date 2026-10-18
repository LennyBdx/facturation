import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Architecture : les pages et composants passent par les points d'entrée
    // `@/data` et `@/integrations/e-invoicing`, jamais par les implémentations.
    files: ["src/app/**", "src/components/**", "src/features/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/data/mock", "@/data/mock/*", "@/data/memory", "@/data/memory/*"],
              message: "Importer les données via `@/data` (getRepositories), jamais directement.",
            },
            {
              group: ["@/integrations/e-invoicing/*"],
              message: "Importer le provider via `@/integrations/e-invoicing`.",
            },
          ],
        },
      ],
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "src/components/ui/**"]),
]);

export default eslintConfig;
