/** Nom du produit : défini une seule fois dans `./site.ts` (site vitrine et application). */
export { PRODUCT_NAME as APP_NAME } from "./site";
export const APP_TAGLINE = "Devis et factures de situation pour le BTP";
/** Mention neutre (aucun label officiel tant qu'il n'est pas obtenu). */
export const E_INVOICING_READY_LABEL = "Prêt pour la facture électronique";

/**
 * Date du jour simulée du prototype : les données fictives (échéances, retards)
 * sont construites autour de cette date. À supprimer au branchement du back-end.
 */
export const DEMO_TODAY = "2026-10-18";

/** Utilisateur fictif toujours « connecté » dans le prototype (voir `src/lib/session.ts`). */
export const DEMO_USER_ID = "usr-julien";
