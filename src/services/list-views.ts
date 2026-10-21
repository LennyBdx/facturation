/**
 * Listes de l'application : chargement, filtre, tri. Partagé par les pages et par
 * l'export CSV, qui exportent ainsi exactement ce que l'utilisateur voit (hors pagination).
 */
import "server-only";
import type {
  Client,
  ClientKind,
  Invoice,
  Quote,
  QuoteStatus,
  ReceivedInvoice,
  Worksite,
  WorksiteStatus,
} from "@/data/types";
import { kindRules } from "@/domain/invoice-kinds";
import type { PaymentStatus } from "@/domain/lifecycle";
import { compareMoney, sumMoney, ZERO } from "@/domain/money";
import { by, type Comparator, parseSort, type Sort, sortRows } from "@/lib/sorting";
import {
  effectiveQuoteStatus,
  invoicePaymentStatus,
  invoiceRemaining,
  quoteTotals,
} from "./builders";
import type { ServiceContext } from "./context";
import { billedProgress, invoiceNeedsCorrection, receivedNeedsAction } from "./dashboard";

/** Paramètres d'URL communs aux listes. */
export interface ListParams {
  q?: string;
  filtre?: string;
  tri?: string;
}

export interface ListResult<T, K extends string> {
  rows: T[];
  sort: Sort<K>;
  /** Vrai si une recherche ou un filtre restreint la liste. */
  narrowed: boolean;
}

function finish<T, K extends string>(
  rows: T[],
  params: ListParams,
  keys: readonly K[],
  fallback: Sort<K>,
  comparators: Record<K, Comparator<T>>,
  narrowed: boolean,
): ListResult<T, K> {
  const sort = parseSort(params.tri, keys, fallback);
  return { rows: sortRows(rows, sort, comparators), sort, narrowed };
}

const nameMap = <T extends { id: string; name: string }>(items: T[]) =>
  new Map(items.map((i) => [i.id, i.name]));

// --- Clients ------------------------------------------------------------------

/** Valeur du filtre qui affiche les clients archivés (masqués sinon). */
export const CLIENT_ARCHIVED_FILTER = "archives";

export const CLIENT_SORT_KEYS = ["nom", "type", "ville", "solde"] as const;
export type ClientSortKey = (typeof CLIENT_SORT_KEYS)[number];
export type ClientRow = { client: Client; due: string };

export async function clientRows(
  ctx: ServiceContext<"clients" | "invoices">,
  params: ListParams,
  kinds: readonly ClientKind[],
): Promise<ListResult<ClientRow, ClientSortKey>> {
  const archived = params.filtre === CLIENT_ARCHIVED_FILTER;
  const kind = kinds.includes(params.filtre as ClientKind)
    ? (params.filtre as ClientKind)
    : undefined;
  const [clients, invoices] = await Promise.all([
    ctx.repos.clients.list(ctx.orgId, { search: params.q, kind, archived }),
    ctx.repos.invoices.list(ctx.orgId),
  ]);
  const rows = clients.map((client) => ({
    client,
    due: sumMoney(invoices.filter((i) => i.clientId === client.id).map(invoiceRemaining)),
  }));
  return finish(
    rows,
    params,
    CLIENT_SORT_KEYS,
    { key: "nom", dir: "asc" },
    {
      nom: by.text((r) => r.client.name),
      type: by.text((r) => r.client.kind),
      ville: by.text((r) => r.client.billingAddress.city),
      solde: by.decimal((r) => r.due),
    },
    !!(params.q || kind || archived),
  );
}

// --- Chantiers ----------------------------------------------------------------

export const WORKSITE_SORT_KEYS = ["nom", "client", "statut", "avancement", "marche"] as const;
export type WorksiteSortKey = (typeof WORKSITE_SORT_KEYS)[number];
export type WorksiteRow = { worksite: Worksite; clientName: string; progress: string };

export async function worksiteRows(
  ctx: ServiceContext<"worksites" | "clients" | "invoices">,
  params: ListParams,
  statuses: readonly WorksiteStatus[],
): Promise<ListResult<WorksiteRow, WorksiteSortKey>> {
  const status = statuses.includes(params.filtre as WorksiteStatus)
    ? (params.filtre as WorksiteStatus)
    : undefined;
  const [worksites, clients, invoices] = await Promise.all([
    ctx.repos.worksites.list(ctx.orgId, { search: params.q, status }),
    ctx.repos.clients.list(ctx.orgId),
    ctx.repos.invoices.list(ctx.orgId),
  ]);
  const clientName = nameMap(clients);
  const rows = worksites.map((worksite) => ({
    worksite,
    clientName: clientName.get(worksite.clientId) ?? "",
    progress: billedProgress(worksite.id, invoices),
  }));
  return finish(
    rows,
    params,
    WORKSITE_SORT_KEYS,
    { key: "nom", dir: "asc" },
    {
      nom: by.text((r) => r.worksite.name),
      client: by.text((r) => r.clientName),
      statut: by.text((r) => r.worksite.status),
      avancement: by.decimal((r) => r.progress),
      marche: by.decimal((r) => r.worksite.contractAmount),
    },
    !!(params.q || status),
  );
}

// --- Devis --------------------------------------------------------------------

export const QUOTE_SORT_KEYS = ["numero", "objet", "client", "date", "statut", "montant"] as const;
export type QuoteSortKey = (typeof QUOTE_SORT_KEYS)[number];
export type QuoteRow = {
  quote: Quote;
  status: QuoteStatus;
  net: string;
  gross: string;
  clientName: string;
};

export async function quoteRows(
  ctx: ServiceContext<"quotes" | "clients">,
  params: ListParams,
  statuses: readonly QuoteStatus[],
): Promise<ListResult<QuoteRow, QuoteSortKey>> {
  const status = statuses.includes(params.filtre as QuoteStatus)
    ? (params.filtre as QuoteStatus)
    : undefined;
  const [quotes, clients] = await Promise.all([
    ctx.repos.quotes.list(ctx.orgId, { search: params.q }),
    ctx.repos.clients.list(ctx.orgId),
  ]);
  const clientName = nameMap(clients);
  const rows = quotes
    .map((quote) => {
      const totals = quoteTotals(quote);
      return {
        quote,
        status: effectiveQuoteStatus(quote, ctx.today),
        net: totals.net,
        gross: totals.gross,
        clientName: clientName.get(quote.clientId) ?? "",
      };
    })
    .filter((r) => !status || r.status === status);
  return finish(
    rows,
    params,
    QUOTE_SORT_KEYS,
    { key: "date", dir: "desc" },
    {
      numero: by.text((r) => r.quote.number),
      objet: by.text((r) => r.quote.title),
      client: by.text((r) => r.clientName),
      date: by.isoDate((r) => r.quote.issueDate),
      statut: by.text((r) => r.status),
      montant: by.decimal((r) => r.net),
    },
    !!(params.q || status),
  );
}

// --- Factures émises ----------------------------------------------------------

export const INVOICE_SORT_KEYS = [
  "numero",
  "client",
  "emission",
  "echeance",
  "statut",
  "montant",
] as const;
export type InvoiceSortKey = (typeof INVOICE_SORT_KEYS)[number];
export type InvoiceRow = {
  invoice: Invoice;
  status: PaymentStatus;
  remaining: string;
  clientName: string;
};

/** Filtres spécifiques en plus des statuts de paiement. */
export const INVOICE_EXTRA_FILTERS = ["a-encaisser", "a-corriger"] as const;

export async function invoiceRows(
  ctx: ServiceContext<"invoices" | "clients">,
  params: ListParams,
): Promise<ListResult<InvoiceRow, InvoiceSortKey>> {
  const [invoices, clients] = await Promise.all([
    ctx.repos.invoices.list(ctx.orgId, { search: params.q }),
    ctx.repos.clients.list(ctx.orgId),
  ]);
  const clientName = nameMap(clients);
  const { filtre } = params;
  const rows = invoices
    .map((invoice) => ({
      invoice,
      status: invoicePaymentStatus(invoice, ctx.today),
      remaining: invoiceRemaining(invoice),
      clientName: clientName.get(invoice.clientId) ?? "",
    }))
    .filter((r) => {
      if (!filtre) return true;
      if (filtre === "a-encaisser") return compareMoney(r.remaining, ZERO) > 0;
      if (filtre === "a-corriger") return invoiceNeedsCorrection(r.invoice);
      return r.status === filtre;
    });
  return finish(
    rows,
    params,
    INVOICE_SORT_KEYS,
    { key: "emission", dir: "desc" },
    {
      // Les brouillons (sans numéro) passent en tête du tri décroissant.
      numero: by.text((r) => r.invoice.number ?? "~"),
      client: by.text((r) => r.clientName),
      emission: by.isoDate((r) => r.invoice.issueDate),
      echeance: by.isoDate((r) => r.invoice.dueDate),
      statut: by.text((r) => r.status),
      // Montant signé : un avoir (négatif) se classe sous les factures.
      montant: by.decimal((r) =>
        kindRules(r.invoice.kind).sign < 0
          ? `-${r.invoice.totals.netToPay}`
          : r.invoice.totals.netToPay,
      ),
    },
    !!(params.q || filtre),
  );
}

// --- Factures reçues ----------------------------------------------------------

export const RECEIVED_FILTERS: Record<string, (r: ReceivedInvoice) => boolean> = {
  "a-traiter": receivedNeedsAction,
  approuvees: (r) => r.status === "approved" || r.status === "partially_approved",
  litiges: (r) => r.status === "disputed" || r.status === "suspended",
  refusees: (r) => r.status === "refused",
  payees: (r) => r.status === "payment_sent",
};

export const RECEIVED_SORT_KEYS = [
  "fournisseur",
  "categorie",
  "chantier",
  "echeance",
  "statut",
  "montant",
] as const;
export type ReceivedSortKey = (typeof RECEIVED_SORT_KEYS)[number];
export type ReceivedRow = { received: ReceivedInvoice; worksiteName: string };

export async function receivedRows(
  ctx: ServiceContext<"receivedInvoices" | "worksites">,
  params: ListParams,
): Promise<ListResult<ReceivedRow, ReceivedSortKey>> {
  const [received, worksites] = await Promise.all([
    ctx.repos.receivedInvoices.list(ctx.orgId, { search: params.q }),
    ctx.repos.worksites.list(ctx.orgId),
  ]);
  const worksiteName = nameMap(worksites);
  const filter = params.filtre ? RECEIVED_FILTERS[params.filtre] : undefined;
  const rows = received
    .filter((r) => !filter || filter(r))
    .map((r) => ({
      received: r,
      worksiteName: r.worksiteId ? (worksiteName.get(r.worksiteId) ?? "") : "",
    }));
  return finish(
    rows,
    params,
    RECEIVED_SORT_KEYS,
    { key: "echeance", dir: "asc" },
    {
      fournisseur: by.text((r) => r.received.supplier.name),
      categorie: by.text((r) => r.received.category),
      chantier: by.text((r) => r.worksiteName),
      echeance: by.isoDate((r) => r.received.dueDate),
      statut: by.text((r) => r.received.status),
      montant: by.decimal((r) => r.received.gross),
    },
    !!(params.q || filter),
  );
}
