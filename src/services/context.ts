/**
 * Contexte d'exécution côté serveur : repositories, entreprise et utilisateur
 * courants, provider de facture électronique. Tous les services passent par lui.
 */
import { getRepositories } from "@/data";
import { getEInvoicingProvider } from "@/integrations/e-invoicing";
import { today } from "@/lib/clock";
import { getCurrentMembership, getCurrentOrganization, getCurrentUser } from "@/lib/session";

export async function getContext() {
  const [org, user] = await Promise.all([getCurrentOrganization(), getCurrentUser()]);
  return {
    repos: getRepositories(),
    provider: getEInvoicingProvider(),
    org,
    orgId: org.id,
    user,
    today: today(),
    membership: () => getCurrentMembership(),
  };
}

export type Context = Awaited<ReturnType<typeof getContext>>;

/** Résultat standard d'une Server Action. */
export type ActionResult<T = undefined> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };
