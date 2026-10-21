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
import { withReadCache } from "@/data/cached-repositories";
import { getEInvoicingProvider } from "@/integrations/e-invoicing";
import { nowIso, today } from "@/lib/clock";
import { getCurrentMembership, getCurrentOrganization, getCurrentUser } from "@/lib/session";
import { type AppDeps, type Context, createContext } from "@/services/context";

/**
 * @param readCache lectures servies par le cache (`"use cache"`) : vrai pour le rendu,
 * faux dans les Server Actions, qui doivent lire leurs propres écritures.
 */
export function getAppDeps({ readCache }: { readCache: boolean }): AppDeps {
  const repos = getRepositories();
  return {
    repos: readCache ? withReadCache(repos) : repos,
    uow: getUnitOfWork(),
    provider: getEInvoicingProvider(),
    clock: { today, now: nowIso },
  };
}

async function buildContext(readCache: boolean): Promise<Context> {
  const [org, user, membership] = await Promise.all([getCurrentOrganization(), getCurrentUser(), getCurrentMembership()]);
  return createContext(getAppDeps({ readCache }), { org, user, membership });
}

/** Contexte de rendu de la requête courante (mémoïsé pendant le rendu, lectures en cache). */
export const getRequestContext = cache(() => buildContext(true));

/** Contexte d'une Server Action : lectures directes, sans cache. */
export const getActionContext = cache(() => buildContext(false));
