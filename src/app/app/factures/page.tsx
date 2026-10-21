import { kindRules } from "@/domain/invoice-kinds";
import { routes } from "@/config/routes";
import Link from "next/link";
import type { Metadata } from "next";
import { Plus, Receipt } from "lucide-react";
import { Amount } from "@/components/app/amount";
import { EmptyState } from "@/components/app/empty-state";
import { ListPagination } from "@/components/app/list-pagination";
import { ListToolbar } from "@/components/app/list-toolbar";
import { PageHeader } from "@/components/app/page-header";
import { ResponsiveList } from "@/components/app/responsive-list";
import { LifecycleStatusBadge, PaymentStatusBadge } from "@/components/status/status-badge";
import { INVOICE_KIND_LABELS, PAYMENT_STATUS } from "@/components/status/status-config";
import { Button } from "@/components/ui/button";
import { getRequestContext } from "@/composition/request-context";
import type { PaymentStatus } from "@/domain/lifecycle";
import { compareMoney, ZERO } from "@/domain/money";
import { sortOptions } from "@/features/lists/sort-options";
import { formatDate } from "@/lib/format";
import { listHref } from "@/lib/list-href";
import { paginate } from "@/lib/pagination";
import { formatSort } from "@/lib/sorting";
import { type InvoiceRow, invoiceRows } from "@/services/list-views";

export const metadata: Metadata = { title: "Factures émises" };

const FILTERS = [
  ...(Object.keys(PAYMENT_STATUS) as PaymentStatus[]).map((s) => ({
    value: s,
    label: PAYMENT_STATUS[s].label,
  })),
  { value: "a-encaisser", label: "Reste à encaisser" },
  { value: "a-corriger", label: "Facture électronique à traiter" },
];

const SORT_OPTIONS = sortOptions([
  { key: "emission", label: "Émission", kind: "date" },
  { key: "echeance", label: "Échéance", kind: "date" },
  { key: "client", label: "Client", kind: "text" },
  { key: "montant", label: "Net à payer", kind: "number" },
  { key: "numero", label: "Numéro", kind: "text" },
]);

function Badges({ row: r }: { row: InvoiceRow }) {
  return (
    <>
      <PaymentStatusBadge status={r.status} />
      {r.invoice.issuedAt ? (
        <LifecycleStatusBadge
          status={r.invoice.eInvoicing.status}
          outOfScope={r.invoice.buyer?.kind === "individual"}
        />
      ) : null}
    </>
  );
}

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filtre?: string; tri?: string; page?: string }>;
}) {
  const { q, filtre, tri, page } = await searchParams;
  const ctx = await getRequestContext();
  const { rows, sort, narrowed } = await invoiceRows(ctx, { q, filtre, tri });
  const paged = paginate(rows, page);
  const query = { q, filtre, tri };

  return (
    <>
      <PageHeader
        title="Factures émises"
        description="Statut de paiement et statut de la facture électronique, côte à côte."
        actions={
          <Button asChild>
            <Link href={routes.invoices.new()}>
              <Plus aria-hidden />
              Nouvelle facture
            </Link>
          </Button>
        }
      />
      <ListToolbar
        searchLabel="Rechercher une facture"
        searchPlaceholder="Numéro, intitulé, client…"
        filterLabel="Statut"
        filterOptions={FILTERS}
        sortOptions={SORT_OPTIONS}
        sortValue={formatSort(sort)}
        exportHref={rows.length ? routes.exportCsv("factures") : undefined}
      />
      {rows.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title={
            narrowed
              ? "Aucune facture ne correspond à votre recherche."
              : "Aucune facture pour l'instant."
          }
          description="Les factures se créent à partir d'un devis accepté : acompte, situation de travaux ou facture unique."
          action={
            <Button asChild>
              <Link href={routes.invoices.new()}>Créer une facture</Link>
            </Button>
          }
        />
      ) : (
        <>
          <ResponsiveList
            caption="Liste des factures émises"
            rows={paged.items}
            getKey={(r) => r.invoice.id}
            href={(r) => routes.invoices.show(r.invoice.id)}
            sort={{
              current: sort,
              href: (s) => listHref(routes.invoices.list(), query, { tri: formatSort(s) }),
            }}
            columns={[
              {
                header: "Numéro",
                sortKey: "numero",
                sortFirstDir: "desc",
                cell: (r) => (
                  <span className="font-mono text-sm">{r.invoice.number ?? "Brouillon"}</span>
                ),
              },
              {
                header: "Client",
                sortKey: "client",
                cell: (r) => (
                  <span className="block max-w-56">
                    <span className="block truncate">{r.clientName}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {INVOICE_KIND_LABELS[r.invoice.kind]}
                    </span>
                  </span>
                ),
              },
              {
                header: "Émission",
                sortKey: "emission",
                sortFirstDir: "desc",
                cell: (r) => <span className="num">{formatDate(r.invoice.issueDate)}</span>,
              },
              {
                header: "Échéance",
                sortKey: "echeance",
                cell: (r) => (
                  <span className="num">
                    {kindRules(r.invoice.kind).isReceivable ? formatDate(r.invoice.dueDate) : "—"}
                  </span>
                ),
              },
              {
                header: "Statuts",
                sortKey: "statut",
                cell: (r) => (
                  <span className="flex flex-wrap gap-1">
                    <Badges row={r} />
                  </span>
                ),
              },
              {
                header: "Net à payer",
                align: "right",
                sortKey: "montant",
                sortFirstDir: "desc",
                cell: (r) => (
                  <span className="block">
                    {kindRules(r.invoice.kind).sign < 0 ? "− " : ""}
                    <Amount value={r.invoice.totals.netToPay} />
                    {compareMoney(r.remaining, ZERO) > 0 &&
                    r.remaining !== r.invoice.totals.netToPay ? (
                      <span className="block text-xs text-muted-foreground">
                        reste <Amount value={r.remaining} />
                      </span>
                    ) : null}
                  </span>
                ),
              },
            ]}
            mobile={(r) => ({
              title: r.clientName,
              subtitle: `${r.invoice.number ?? "Brouillon"} · ${INVOICE_KIND_LABELS[r.invoice.kind]} · ${formatDate(r.invoice.issueDate)}`,
              amount: (
                <>
                  {kindRules(r.invoice.kind).sign < 0 ? "− " : ""}
                  <Amount value={r.invoice.totals.netToPay} />
                </>
              ),
              meta: <Badges row={r} />,
            })}
          />
          <ListPagination
            pagination={paged}
            pathname={routes.invoices.list()}
            query={query}
            label="factures"
          />
        </>
      )}
    </>
  );
}
