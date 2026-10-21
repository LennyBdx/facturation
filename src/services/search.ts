import "server-only";
import { kindRules } from "@/domain/invoice-kinds";
import type { ServiceContext } from "./context";

export type SearchResultType = "client" | "worksite" | "quote" | "invoice" | "received";

export interface SearchResult {
  type: SearchResultType;
  id: string;
  title: string;
  subtitle: string;
}

/** Nombre maximal de résultats par type d'élément. */
const PER_TYPE = 5;

/**
 * Recherche globale (palette ⌘K) dans les clients, chantiers, devis, factures émises
 * et reçues de l'entreprise. Les clients archivés restent trouvables.
 */
export async function globalSearch(
  ctx: ServiceContext<"clients" | "worksites" | "quotes" | "invoices" | "receivedInvoices">,
  rawQuery: string,
): Promise<SearchResult[]> {
  const search = rawQuery.trim();
  if (search.length < 2) return [];
  const { repos, orgId } = ctx;
  const [clients, worksites, quotes, invoices, received, allClients] = await Promise.all([
    repos.clients.list(orgId, { search }),
    repos.worksites.list(orgId, { search }),
    repos.quotes.list(orgId, { search }),
    repos.invoices.list(orgId, { search }),
    repos.receivedInvoices.list(orgId, { search }),
    repos.clients.list(orgId),
  ]);
  const clientName = new Map(allClients.map((c) => [c.id, c.name]));
  const first = <T>(items: T[]) => items.slice(0, PER_TYPE);

  return [
    ...first(clients).map((c) => ({
      type: "client" as const,
      id: c.id,
      title: c.name,
      subtitle: [c.billingAddress.city, c.archivedAt ? "archivé" : null]
        .filter(Boolean)
        .join(" · "),
    })),
    ...first(worksites).map((w) => ({
      type: "worksite" as const,
      id: w.id,
      title: w.name,
      subtitle: `${w.reference} · ${clientName.get(w.clientId) ?? ""}`,
    })),
    ...first(quotes).map((q) => ({
      type: "quote" as const,
      id: q.id,
      title: q.title,
      subtitle: `${q.number} · ${clientName.get(q.clientId) ?? ""}`,
    })),
    ...first(invoices).map((i) => ({
      type: "invoice" as const,
      id: i.id,
      title: `${kindRules(i.kind).label} ${i.number ?? "(brouillon)"}`,
      subtitle: `${clientName.get(i.clientId) ?? ""} · ${i.title}`,
    })),
    ...first(received).map((r) => ({
      type: "received" as const,
      id: r.id,
      title: r.supplier.name,
      subtitle: r.number,
    })),
  ];
}
