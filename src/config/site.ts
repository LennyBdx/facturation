import { env } from "./env";

/**
 * Identité du site vitrine. Nom du produit (site vitrine) :
 * remplacer `PRODUCT_NAME` ici suffit à mettre à jour toute la page d'accueil.
 */
export const PRODUCT_NAME = "Factobat";

/** URL publique du site (SEO, sitemap, Open Graph) : variable NEXT_PUBLIC_SITE_URL. [À DÉFINIR] */
export const SITE_URL = env.siteUrl;

export const SITE_DESCRIPTION =
  "Logiciel de devis et de facturation pour les entreprises du second œuvre : situations de travaux, retenue de garantie, autoliquidation. Prêt pour la facture électronique.";

/** Liste officielle des plateformes agréées (impots.gouv.fr). */
export const OFFICIAL_PLATFORMS_URL = "https://www.impots.gouv.fr/je-consulte-la-liste-des-plateformes-agreees";
