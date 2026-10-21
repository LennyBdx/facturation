/**
 * Décorateur de cache des lectures (Cache Components : `"use cache"` + `cacheTag`).
 *
 * Les lectures d'une entreprise sont mises en cache sous l'étiquette `org:<id>` ;
 * toute Server Action réussie l'invalide avec `updateTag` (voir `composition/action.ts`).
 * Les écritures, et toutes les lectures faites PENDANT une action, passent par les
 * repositories non décorés : une action lit toujours ses propres écritures.
 *
 * Indépendant de l'implémentation : le même décorateur s'appliquera à PostgreSQL.
 */
import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { getRepositories } from "./index";
import type { ClientFilter, InvoiceFilter, QuoteFilter, ReceivedInvoiceFilter, Repositories, WorksiteFilter } from "./repositories";

export const orgCacheTag = (organizationId: string) => `org:${organizationId}`;

function tagged(organizationId: string) {
  cacheTag(orgCacheTag(organizationId));
  cacheLife("hours");
}

async function listClients(orgId: string, filter?: ClientFilter) {
  "use cache";
  tagged(orgId);
  return getRepositories().clients.list(orgId, filter);
}
async function getClient(orgId: string, id: string) {
  "use cache";
  tagged(orgId);
  return getRepositories().clients.get(orgId, id);
}
async function listWorksites(orgId: string, filter?: WorksiteFilter) {
  "use cache";
  tagged(orgId);
  return getRepositories().worksites.list(orgId, filter);
}
async function getWorksite(orgId: string, id: string) {
  "use cache";
  tagged(orgId);
  return getRepositories().worksites.get(orgId, id);
}
async function listQuotes(orgId: string, filter?: QuoteFilter) {
  "use cache";
  tagged(orgId);
  return getRepositories().quotes.list(orgId, filter);
}
async function getQuote(orgId: string, id: string) {
  "use cache";
  tagged(orgId);
  return getRepositories().quotes.get(orgId, id);
}
async function listInvoices(orgId: string, filter?: InvoiceFilter) {
  "use cache";
  tagged(orgId);
  return getRepositories().invoices.list(orgId, filter);
}
async function getInvoice(orgId: string, id: string) {
  "use cache";
  tagged(orgId);
  return getRepositories().invoices.get(orgId, id);
}
async function listReceived(orgId: string, filter?: ReceivedInvoiceFilter) {
  "use cache";
  tagged(orgId);
  return getRepositories().receivedInvoices.list(orgId, filter);
}
async function getReceived(orgId: string, id: string) {
  "use cache";
  tagged(orgId);
  return getRepositories().receivedInvoices.get(orgId, id);
}

/** Repositories dont les lectures par entreprise sont servies depuis le cache. */
export function withReadCache(base: Repositories): Repositories {
  return {
    ...base,
    clients: { ...base.clients, list: listClients, get: getClient },
    worksites: { ...base.worksites, list: listWorksites, get: getWorksite },
    quotes: { ...base.quotes, list: listQuotes, get: getQuote },
    invoices: { ...base.invoices, list: listInvoices, get: getInvoice },
    receivedInvoices: { ...base.receivedInvoices, list: listReceived, get: getReceived },
  };
}
