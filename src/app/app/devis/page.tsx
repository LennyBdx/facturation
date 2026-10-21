import { routes } from "@/config/routes";
import Link from "next/link";
import type { Metadata } from "next";
import { FileText, Plus } from "lucide-react";
import { Amount } from "@/components/app/amount";
import { EmptyState } from "@/components/app/empty-state";
import { ListPagination } from "@/components/app/list-pagination";
import { ListToolbar } from "@/components/app/list-toolbar";
import { PageHeader } from "@/components/app/page-header";
import { ResponsiveList } from "@/components/app/responsive-list";
import { QuoteStatusBadge } from "@/components/status/status-badge";
import { QUOTE_STATUS } from "@/components/status/status-config";
import { Button } from "@/components/ui/button";
import { getRequestContext } from "@/composition/request-context";
import type { QuoteStatus } from "@/data/types";
import { sortOptions } from "@/features/lists/sort-options";
import { formatDate } from "@/lib/format";
import { listHref } from "@/lib/list-href";
import { paginate } from "@/lib/pagination";
import { formatSort } from "@/lib/sorting";
import { quoteRows } from "@/services/list-views";

export const metadata: Metadata = { title: "Devis" };

const STATUSES = Object.keys(QUOTE_STATUS) as QuoteStatus[];

const SORT_OPTIONS = sortOptions([
  { key: "date", label: "Date", kind: "date" },
  { key: "client", label: "Client", kind: "text" },
  { key: "montant", label: "Total HT", kind: "number" },
  { key: "numero", label: "Numéro", kind: "text" },
]);

export default async function QuotesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filtre?: string; tri?: string; page?: string }>;
}) {
  const { q, filtre, tri, page } = await searchParams;
  const ctx = await getRequestContext();
  const { rows, sort, narrowed } = await quoteRows(ctx, { q, filtre, tri }, STATUSES);
  const paged = paginate(rows, page);
  const query = { q, filtre, tri };

  return (
    <>
      <PageHeader
        title="Devis"
        description="Brouillons, devis envoyés et réponses de vos clients."
        actions={
          <Button asChild>
            <Link href={routes.quotes.new()}>
              <Plus aria-hidden />
              Nouveau devis
            </Link>
          </Button>
        }
      />
      <ListToolbar
        searchLabel="Rechercher un devis"
        searchPlaceholder="Numéro ou objet du devis…"
        filterLabel="Statut"
        filterOptions={STATUSES.map((s) => ({ value: s, label: QUOTE_STATUS[s].label }))}
        sortOptions={SORT_OPTIONS}
        sortValue={formatSort(sort)}
        exportHref={rows.length ? routes.exportCsv("devis") : undefined}
      />
      {rows.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={
            narrowed
              ? "Aucun devis ne correspond à votre recherche."
              : "Aucun devis pour l'instant."
          }
          description="Créez un devis en quelques minutes : lots, lignes, TVA et totaux calculés automatiquement."
          action={
            <Button asChild>
              <Link href={routes.quotes.new()}>Créer un devis</Link>
            </Button>
          }
        />
      ) : (
        <>
          <ResponsiveList
            caption="Liste des devis"
            rows={paged.items}
            getKey={(r) => r.quote.id}
            href={(r) => routes.quotes.show(r.quote.id)}
            sort={{
              current: sort,
              href: (s) => listHref(routes.quotes.list(), query, { tri: formatSort(s) }),
            }}
            columns={[
              {
                header: "Numéro",
                sortKey: "numero",
                cell: (r) => <span className="font-mono text-sm">{r.quote.number}</span>,
              },
              {
                header: "Objet",
                sortKey: "objet",
                cell: (r) => <span className="line-clamp-1">{r.quote.title}</span>,
              },
              { header: "Client", sortKey: "client", cell: (r) => r.clientName },
              {
                header: "Date",
                sortKey: "date",
                sortFirstDir: "desc",
                cell: (r) => <span className="num">{formatDate(r.quote.issueDate)}</span>,
              },
              {
                header: "Statut",
                sortKey: "statut",
                cell: (r) => <QuoteStatusBadge status={r.status} />,
              },
              {
                header: "Total HT",
                align: "right",
                sortKey: "montant",
                sortFirstDir: "desc",
                cell: (r) => <Amount value={r.net} />,
              },
            ]}
            mobile={(r) => ({
              title: r.quote.title,
              subtitle: `${r.quote.number} · ${r.clientName}`,
              amount: <Amount value={r.net} />,
              meta: (
                <>
                  <QuoteStatusBadge status={r.status} />
                  <span className="num ml-auto text-sm text-muted-foreground">
                    {formatDate(r.quote.issueDate)}
                  </span>
                </>
              ),
            })}
          />
          <ListPagination
            pagination={paged}
            pathname={routes.quotes.list()}
            query={query}
            label="devis"
          />
        </>
      )}
    </>
  );
}
