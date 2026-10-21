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
  {
    // Domaine : fonctions pures, sans dépendance vers les couches extérieures ni le framework.
    files: ["src/domain/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/*", "!@/domain/*", "next", "next/*", "react", "react-dom"],
              message:
                "Le domaine reste pur : aucune dépendance vers les données, services, UI ou Next.js.",
            },
          ],
        },
      ],
    },
  },
  {
    // Services, données et intégrations ne dépendent jamais de l'interface.
    files: ["src/services/**", "src/data/**", "src/integrations/**", "src/composition/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/app/*", "@/components/*", "@/features/*"],
              message: "Dépendance inversée : les couches internes ne connaissent pas l'interface.",
            },
          ],
        },
      ],
    },
  },
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", destructuredArrayIgnorePattern: "^_" },
      ],
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "src/components/ui/**"]),
]);

export default eslintConfig;
