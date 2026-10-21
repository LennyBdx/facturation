/**
 * Variables d'environnement, validées au démarrage (échec immédiat si une valeur
 * est invalide). Aucune n'est obligatoire dans le prototype.
 *
 * Au branchement du back-end, ajouter ici DATABASE_URL, les clés de la plateforme
 * agréée et de Stripe (en `z.string().min(1)` : obligatoires).
 */
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  /** URL publique du site vitrine (SEO, sitemap, Open Graph). */
  NEXT_PUBLIC_SITE_URL: z.string().url().default("https://www.example.com"),
  /** Ouvre les pages /debug en production (fermées par défaut). */
  ENABLE_DEBUG_PAGES: z.enum(["true", "false"]).default("false"),
});

const parsed = schema.safeParse({
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || undefined,
  ENABLE_DEBUG_PAGES: process.env.ENABLE_DEBUG_PAGES || undefined,
});

if (!parsed.success) {
  throw new Error(
    `Variables d'environnement invalides :\n${parsed.error.issues.map((i) => `- ${i.path.join(".")} : ${i.message}`).join("\n")}`,
  );
}

export const env = {
  isProduction: parsed.data.NODE_ENV === "production",
  siteUrl: parsed.data.NEXT_PUBLIC_SITE_URL.replace(/\/$/, ""),
  debugPagesEnabled:
    parsed.data.NODE_ENV !== "production" || parsed.data.ENABLE_DEBUG_PAGES === "true",
} as const;
