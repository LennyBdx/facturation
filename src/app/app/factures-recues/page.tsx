import { routes } from "@/config/routes";
import type { Metadata } from "next";
import { Inbox, Info } from "lucide-react";
import { Amount } from "@/components/app/amount";
import { EmptyState } from "@/components/app/empty-state";
import { ListPagination } from "@/components/app/list-pagination";
import { ListToolbar } from "@/components/app/list-toolbar";
import { PageHeader } from "@/components/app/page-header";
import { ResponsiveList } from "@/components/app/responsive-list";
import { LifecycleStatusBadge, ToneBadge } from "@/components/status/status-badge";
import { RECEIVED_CATEGORY_LABELS } from "@/components/status/status-config";
import { getRequestContext } from "@/composition/request-context";
import { sortOptions } from "@/features/lists/sort-options";
import { ReceivedSync } from "@/features/received/received-sync";
import { formatDate } from "@/lib/format";
import { listHref } from "@/lib/list-href";
import { paginate } from "@/lib/pagination";
import { formatSort } from "@/lib/sorting";
import { receivedNeedsAction } from "@/services/dashboard";
import { receivedRows } from "@/services/list-views";

export const metadata: Metadata = { title: "Factures reçues" };

/** Libellés des filtres ; les règles correspondantes sont dans `RECEIVED_FILTERS`. */
const FILTERS = [
  { value: "a-traiter", label: "À traiter" },
  { value: "approuvees", label: "Approuvées, à payer" },
  { value: "litiges", label: "En litige ou suspendues" },
  { value: "refusees", label: "Refusées" },
  { value: "payees", label: "Payées" },
];

const SORT_OPTIONS = sortOptions([
  { key: "echeance", label: "Échéance", kind: "date" },
  { key: "fournisseur", label: "Fournisseur", kind: "text" },
  { key: "montant", label: "TTC", kind: "number" },
]);

export default async function ReceivedInvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filtre?: string; tri?: string; page?: string }>;
}) {
  const { q, filtre, tri, page } = await searchParams;
  const ctx = await getRequestContext();
  const { rows, sort, narrowed } = await receivedRows(ctx, { q, filtre, tri });
  const connected = ctx.org.settings.eInvoicing.connectionStatus === "connected";
  const paged = paginate(rows, page);
  const query = { q, filtre, tri };

  return (
    <>
      <PageHeader
        title="Factures reçues"
        description="Factures de vos fournisseurs et sous-traitants, reçues via votre plateforme agréée."
      />
      {!connected ? (
        <div
          role="status"
          className="mb-4 flex gap-2 rounded-lg border border-warning/30 bg-warning-soft p-3 text-sm text-warning"
        >
          <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
          La connexion à votre plateforme agréée n&apos;est pas finalisée : les nouvelles factures
          n&apos;arrivent pas encore. Voir Paramètres → Facture électronique.
        </div>
      ) : (
        <ReceivedSync />
      )}
      <ListToolbar
        searchLabel="Rechercher une facture reçue"
        searchPlaceholder="Fournisseur ou numéro…"
        filterLabel="Statut"
        filterOptions={FILTERS}
        sortOptions={SORT_OPTIONS}
        sortValue={formatSort(sort)}
        exportHref={rows.length ? routes.exportCsv("factures-recues") : undefined}
      />
      {rows.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={
            narrowed
              ? "Aucune facture ne correspond à votre recherche."
              : "Aucune facture reçue pour l'instant."
          }
          description="Les factures de vos fournisseurs arrivent ici automatiquement depuis la plateforme agréée."
        />
      ) : (
        <>
          <ResponsiveList
            caption="Factures fournisseurs reçues"
            rows={paged.items}
            getKey={(r) => r.received.id}
            href={(r) => routes.received.show(r.received.id)}
            sort={{
              current: sort,
              href: (s) => listHref(routes.received.list(), query, { tri: formatSort(s) }),
            }}
            columns={[
              {
                header: "Fournisseur",
                sortKey: "fournisseur",
                cell: ({ received: r }) => (
                  <span className="block max-w-60">
                    <span className="block truncate">{r.supplier.name}</span>
                    <span className="block truncate font-mono text-xs text-muted-foreground">
                      {r.number}
                    </span>
                  </span>
                ),
              },
              {
                header: "Catégorie",
                sortKey: "categorie",
                cell: (r) => (
                  <span className="text-sm">{RECEIVED_CATEGORY_LABELS[r.received.category]}</span>
                ),
              },
              {
                header: "Chantier",
                sortKey: "chantier",
                cell: (r) => <span className="line-clamp-1 text-sm">{r.worksiteName || "—"}</span>,
              },
              {
                header: "Échéance",
                sortKey: "echeance",
                cell: (r) => <span className="num">{formatDate(r.received.dueDate)}</span>,
              },
              {
                header: "Statut",
                sortKey: "statut",
                cell: ({ received: r }) => (
                  <span className="flex flex-wrap gap-1">
                    <LifecycleStatusBadge status={r.status} />
                    {receivedNeedsAction(r) ? <ToneBadge tone="info">À traiter</ToneBadge> : null}
                  </span>
                ),
              },
              {
                header: "TTC",
                align: "right",
                sortKey: "montant",
                sortFirstDir: "desc",
                cell: (r) => <Amount value={r.received.gross} />,
              },
            ]}
            mobile={({ received: r }) => ({
              title: r.supplier.name,
              subtitle: `${r.number} · échéance ${formatDate(r.dueDate)}`,
              amount: <Amount value={r.gross} />,
              meta: (
                <>
                  <LifecycleStatusBadge status={r.status} />
                  {receivedNeedsAction(r) ? <ToneBadge tone="info">À traiter</ToneBadge> : null}
                </>
              ),
            })}
          />
          <ListPagination
            pagination={paged}
            pathname={routes.received.list()}
            query={query}
            label="factures reçues"
          />
        </>
      )}
    </>
  );
}
