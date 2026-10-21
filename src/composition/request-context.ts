/**
 * Racine de composition : le SEUL endroit qui choisit les implémentations concrètes
 * (données en mémoire, plateforme simulée, horloge simulée) et les assemble avec la
 * session pour former le contexte d'une requête.
 *
 * Pour passer en production : remplacer les fabriques importées ici (PostgreSQL,
 * plateforme agréée réelle, horloge système), sans toucher aux services ni aux pages.
 */
import "server-only";
import { cache } from "react";
import { getRepositories, getUnitOfWork } from "@/data";
import { getEInvoicingProvider } from "@/integrations/e-invoicing";
import { nowIso, today } from "@/lib/clock";
import { getCurrentMembership, getCurrentOrganization, getCurrentUser } from "@/lib/session";
import { type AppDeps, type Context, createContext } from "@/services/context";

export function getAppDeps(): AppDeps {
  return {
    repos: getRepositories(),
    uow: getUnitOfWork(),
    provider: getEInvoicingProvider(),
    clock: { today, now: nowIso },
  };
}

/** Contexte de la requête courante (mémoïsé pendant le rendu). */
export const getRequestContext = cache(async (): Promise<Context> => {
  const [org, user, membership] = await Promise.all([getCurrentOrganization(), getCurrentUser(), getCurrentMembership()]);
  return createContext(getAppDeps(), { org, user, membership });
});
