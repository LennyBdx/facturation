import { routes } from "@/config/routes";
import Link from "next/link";
import type { Metadata } from "next";
import { FileText, Plus } from "lucide-react";
import { Amount } from "@/components/app/amount";
import { EmptyState } from "@/components/app/empty-state";
import { ListToolbar } from "@/components/app/list-toolbar";
import { PageHeader } from "@/components/app/page-header";
import { ResponsiveList } from "@/components/app/responsive-list";
import { QuoteStatusBadge } from "@/components/status/status-badge";
import { QUOTE_STATUS } from "@/components/status/status-config";
import { Button } from "@/components/ui/button";
import type { QuoteStatus } from "@/data/types";
import { effectiveQuoteStatus } from "@/features/quotes/form-values";
import { formatDate } from "@/lib/format";
import { quoteTotals } from "@/services/builders";
import { getRequestContext } from "@/composition/request-context";

export const metadata: Metadata = { title: "Devis" };

const STATUSES = Object.keys(QUOTE_STATUS) as QuoteStatus[];

export default async function QuotesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filtre?: string }>;
}) {
  const { q, filtre } = await searchParams;
  const status = STATUSES.includes(filtre as QuoteStatus) ? (filtre as QuoteStatus) : undefined;
  const { repos, orgId, today } = await getRequestContext();
  const [all, clients] = await Promise.all([
    repos.quotes.list(orgId, { search: q }),
    repos.clients.list(orgId),
  ]);
  const clientName = new Map(clients.map((c) => [c.id, c.name]));
  const quotes = all
    .map((quote) => ({
      quote,
      status: effectiveQuoteStatus(quote, today),
      totals: quoteTotals(quote),
    }))
    .filter((x) => !status || x.status === status);

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
      />
      {quotes.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={
            q || status
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
        <ResponsiveList
          caption="Liste des devis"
          rows={quotes}
          getKey={(x) => x.quote.id}
          href={(x) => routes.quotes.show(x.quote.id)}
          columns={[
            {
              header: "Numéro",
              cell: (x) => <span className="font-mono text-sm">{x.quote.number}</span>,
            },
            { header: "Objet", cell: (x) => <span className="line-clamp-1">{x.quote.title}</span> },
            { header: "Client", cell: (x) => clientName.get(x.quote.clientId) },
            {
              header: "Date",
              cell: (x) => <span className="num">{formatDate(x.quote.issueDate)}</span>,
            },
            { header: "Statut", cell: (x) => <QuoteStatusBadge status={x.status} /> },
            { header: "Total HT", align: "right", cell: (x) => <Amount value={x.totals.net} /> },
          ]}
          mobile={(x) => ({
            title: x.quote.title,
            subtitle: `${x.quote.number} · ${clientName.get(x.quote.clientId)}`,
            amount: <Amount value={x.totals.net} />,
            meta: (
              <>
                <QuoteStatusBadge status={x.status} />
                <span className="num ml-auto text-sm text-muted-foreground">
                  {formatDate(x.quote.issueDate)}
                </span>
              </>
            ),
          })}
        />
      )}
    </>
  );
}
