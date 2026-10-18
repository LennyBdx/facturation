import Link from "next/link";
import type { Metadata } from "next";
import { Plus, Receipt } from "lucide-react";
import { Amount } from "@/components/app/amount";
import { EmptyState } from "@/components/app/empty-state";
import { ListToolbar } from "@/components/app/list-toolbar";
import { PageHeader } from "@/components/app/page-header";
import { ResponsiveList } from "@/components/app/responsive-list";
import { LifecycleStatusBadge, PaymentStatusBadge } from "@/components/status/status-badge";
import { INVOICE_KIND_LABELS, PAYMENT_STATUS } from "@/components/status/status-config";
import { Button } from "@/components/ui/button";
import type { PaymentStatus } from "@/domain/lifecycle";
import { compareMoney, ZERO } from "@/domain/money";
import { formatDate } from "@/lib/format";
import { invoicePaymentStatus, invoiceRemaining } from "@/services/builders";
import { getContext } from "@/services/context";
import { invoiceNeedsCorrection } from "@/services/dashboard";

export const metadata: Metadata = { title: "Factures émises" };

const FILTERS = [
  ...(Object.keys(PAYMENT_STATUS) as PaymentStatus[]).map((s) => ({ value: s, label: PAYMENT_STATUS[s].label })),
  { value: "a-encaisser", label: "Reste à encaisser" },
  { value: "a-corriger", label: "Facture électronique à traiter" },
];

export default async function InvoicesPage({ searchParams }: { searchParams: Promise<{ q?: string; filtre?: string }> }) {
  const { q, filtre } = await searchParams;
  const { repos, orgId, today } = await getContext();
  const [invoices, clients] = await Promise.all([repos.invoices.list(orgId, { search: q }), repos.clients.list(orgId)]);
  const clientName = new Map(clients.map((c) => [c.id, c.name]));
  const rows = invoices
    .map((invoice) => ({ invoice, status: invoicePaymentStatus(invoice, today), remaining: invoiceRemaining(invoice) }))
    .filter((r) => {
      if (!filtre) return true;
      if (filtre === "a-encaisser") return compareMoney(r.remaining, ZERO) > 0;
      if (filtre === "a-corriger") return invoiceNeedsCorrection(r.invoice);
      return r.status === filtre;
    });

  const badges = (r: (typeof rows)[number]) => (
    <>
      <PaymentStatusBadge status={r.status} />
      {r.invoice.issuedAt ? <LifecycleStatusBadge status={r.invoice.eInvoicing.status} outOfScope={r.invoice.buyer?.kind === "individual"} /> : null}
    </>
  );

  return (
    <>
      <PageHeader
        title="Factures émises"
        description="Statut de paiement et statut de la facture électronique, côte à côte."
        actions={
          <Button asChild>
            <Link href="/factures/nouvelle">
              <Plus aria-hidden />
              Nouvelle facture
            </Link>
          </Button>
        }
      />
      <ListToolbar searchLabel="Rechercher une facture" searchPlaceholder="Numéro, intitulé, client…" filterLabel="Statut" filterOptions={FILTERS} />
      {rows.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title={q || filtre ? "Aucune facture ne correspond à votre recherche." : "Aucune facture pour l'instant."}
          description="Les factures se créent à partir d'un devis accepté : acompte, situation de travaux ou facture unique."
          action={
            <Button asChild>
              <Link href="/factures/nouvelle">Créer une facture</Link>
            </Button>
          }
        />
      ) : (
        <ResponsiveList
          caption="Liste des factures émises"
          rows={rows}
          getKey={(r) => r.invoice.id}
          href={(r) => `/factures/${r.invoice.id}`}
          columns={[
            { header: "Numéro", cell: (r) => <span className="font-mono text-sm">{r.invoice.number ?? "Brouillon"}</span> },
            {
              header: "Client",
              cell: (r) => (
                <span className="block max-w-56">
                  <span className="block truncate">{clientName.get(r.invoice.clientId)}</span>
                  <span className="block truncate text-xs text-muted-foreground">{INVOICE_KIND_LABELS[r.invoice.kind]}</span>
                </span>
              ),
            },
            { header: "Émission", cell: (r) => <span className="num">{formatDate(r.invoice.issueDate)}</span> },
            { header: "Échéance", cell: (r) => <span className="num">{r.invoice.kind === "credit_note" ? "—" : formatDate(r.invoice.dueDate)}</span> },
            { header: "Statuts", cell: (r) => <span className="flex flex-wrap gap-1">{badges(r)}</span> },
            {
              header: "Net à payer",
              align: "right",
              cell: (r) => (
                <span className="block">
                  {r.invoice.kind === "credit_note" ? "− " : ""}
                  <Amount value={r.invoice.totals.netToPay} />
                  {compareMoney(r.remaining, ZERO) > 0 && r.remaining !== r.invoice.totals.netToPay ? (
                    <span className="block text-xs text-muted-foreground">
                      reste <Amount value={r.remaining} />
                    </span>
                  ) : null}
                </span>
              ),
            },
          ]}
          mobile={(r) => ({
            title: clientName.get(r.invoice.clientId),
            subtitle: `${r.invoice.number ?? "Brouillon"} · ${INVOICE_KIND_LABELS[r.invoice.kind]} · ${formatDate(r.invoice.issueDate)}`,
            amount: (
              <>
                {r.invoice.kind === "credit_note" ? "− " : ""}
                <Amount value={r.invoice.totals.netToPay} />
              </>
            ),
            meta: badges(r),
          })}
        />
      )}
    </>
  );
}
