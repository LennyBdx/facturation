import Link from "next/link";
import { Amount } from "@/components/app/amount";
import { LifecycleStatusBadge, PaymentStatusBadge, QuoteStatusBadge, WorksiteStatusBadge } from "@/components/status/status-badge";
import { INVOICE_KIND_LABELS } from "@/components/status/status-config";
import type { Invoice, Quote, ReceivedInvoice, Worksite } from "@/data/types";
import { formatDate } from "@/lib/format";
import { invoicePaymentStatus, quoteTotals } from "@/services/builders";

/** Listes compactes de documents liés (fiches client et chantier). */

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-2 text-sm text-muted-foreground">{children}</p>;
}

export function InvoiceMiniList({ invoices, today }: { invoices: Invoice[]; today: string }) {
  if (invoices.length === 0) return <Empty>Aucune facture.</Empty>;
  return (
    <ul className="divide-y">
      {invoices.map((i) => (
        <li key={i.id}>
          <Link href={`/app/factures/${i.id}`} className="flex min-h-11 flex-col gap-1.5 py-3 hover:bg-accent/30 sm:-mx-2 sm:px-2">
            <span className="flex items-start justify-between gap-3">
              <span className="min-w-0">
                <span className="block truncate font-medium">{i.number ?? "Brouillon"} — {INVOICE_KIND_LABELS[i.kind]}</span>
                <span className="block truncate text-sm text-muted-foreground">
                  {formatDate(i.issueDate)} · {i.title}
                </span>
              </span>
              <Amount value={i.totals.netToPay} className="font-semibold" />
            </span>
            <span className="flex flex-wrap gap-1.5">
              <PaymentStatusBadge status={invoicePaymentStatus(i, today)} />
              {i.issuedAt ? <LifecycleStatusBadge status={i.eInvoicing.status} outOfScope={i.buyer?.kind === "individual"} /> : null}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function QuoteMiniList({ quotes }: { quotes: Quote[] }) {
  if (quotes.length === 0) return <Empty>Aucun devis.</Empty>;
  return (
    <ul className="divide-y">
      {quotes.map((q) => (
        <li key={q.id}>
          <Link href={`/app/devis/${q.id}`} className="flex min-h-11 items-center justify-between gap-3 py-3 hover:bg-accent/30 sm:-mx-2 sm:px-2">
            <span className="min-w-0">
              <span className="block truncate font-medium">{q.title}</span>
              <span className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                {q.number} · {formatDate(q.issueDate)} <QuoteStatusBadge status={q.status} />
              </span>
            </span>
            <span className="text-right">
              <Amount value={quoteTotals(q).net} className="font-semibold" />
              <span className="block text-xs text-muted-foreground">HT</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function WorksiteMiniList({ worksites }: { worksites: Worksite[] }) {
  if (worksites.length === 0) return <Empty>Aucun chantier.</Empty>;
  return (
    <ul className="divide-y">
      {worksites.map((w) => (
        <li key={w.id}>
          <Link href={`/app/chantiers/${w.id}`} className="flex min-h-11 items-center justify-between gap-3 py-3 hover:bg-accent/30 sm:-mx-2 sm:px-2">
            <span className="min-w-0">
              <span className="block truncate font-medium">{w.name}</span>
              <span className="block text-sm text-muted-foreground">
                {w.reference} · {w.address.city}
              </span>
            </span>
            <WorksiteStatusBadge status={w.status} />
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function ReceivedMiniList({ invoices }: { invoices: ReceivedInvoice[] }) {
  if (invoices.length === 0) return <Empty>Aucune facture fournisseur rattachée.</Empty>;
  return (
    <ul className="divide-y">
      {invoices.map((r) => (
        <li key={r.id}>
          <Link href={`/app/factures-recues/${r.id}`} className="flex min-h-11 items-center justify-between gap-3 py-3 hover:bg-accent/30 sm:-mx-2 sm:px-2">
            <span className="min-w-0">
              <span className="block truncate font-medium">{r.supplier.name}</span>
              <span className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                {r.number} · {formatDate(r.issueDate)} <LifecycleStatusBadge status={r.status} />
              </span>
            </span>
            <Amount value={r.gross} className="font-semibold" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
