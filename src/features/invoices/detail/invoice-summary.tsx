import Link from "next/link";
import { Amount } from "@/components/app/amount";
import { DetailList } from "@/components/app/detail-list";
import { routes } from "@/config/routes";
import type { Invoice, Quote } from "@/data/types";
import { kindRules } from "@/domain/invoice-kinds";
import { compareMoney, ZERO } from "@/domain/money";
import { formatDate, formatPercent } from "@/lib/format";

const linkClass = "text-primary underline-offset-4 hover:underline";

/** Montant principal et références de la facture. */
export function InvoiceSummary({
  invoice,
  remaining,
  quote,
  corrected,
  creditNote,
}: {
  invoice: Invoice;
  remaining: string;
  quote: Quote | null;
  corrected: Invoice | null;
  creditNote: Invoice | null;
}) {
  const rules = kindRules(invoice.kind);
  return (
    <section aria-label="Montant" className="mb-6 grid gap-3 sm:grid-cols-3">
      <div className="rounded-lg border bg-card p-4 sm:col-span-1">
        <p className="text-sm text-muted-foreground">{rules.isReceivable ? "Net à payer" : "Montant de l'avoir"}</p>
        <p className="num text-3xl font-semibold tracking-tight">
          <Amount value={invoice.totals.netToPay} />
        </p>
        {invoice.issuedAt && rules.isReceivable ? (
          <p className="text-sm text-muted-foreground">
            {compareMoney(remaining, ZERO) > 0 ? (
              <>
                Reste <Amount value={remaining} /> · échéance {formatDate(invoice.dueDate)}
              </>
            ) : invoice.cancelledByCreditNoteId ? (
              "Annulée par avoir"
            ) : (
              "Soldée"
            )}
          </p>
        ) : null}
      </div>
      <div className="rounded-lg border bg-card p-4 sm:col-span-2">
        <DetailList
          columns={3}
          items={[
            { label: "Émission", value: formatDate(invoice.issueDate) },
            { label: "Échéance", value: rules.isReceivable ? formatDate(invoice.dueDate) : "—" },
            {
              label: "Devis",
              value: quote ? (
                <Link className={linkClass} href={routes.quotes.show(quote.id)}>
                  {quote.number}
                </Link>
              ) : (
                "—"
              ),
            },
            { label: "Réf. marché / commande", value: invoice.orderReference },
            {
              label: "Facture corrigée",
              value: corrected ? (
                <Link className={linkClass} href={routes.invoices.show(corrected.id)}>
                  {corrected.number}
                </Link>
              ) : null,
              hidden: !corrected,
            },
            {
              label: "Annulée par l'avoir",
              value: creditNote ? (
                <Link className={linkClass} href={routes.invoices.show(creditNote.id)}>
                  {creditNote.number ?? "brouillon"}
                </Link>
              ) : null,
              hidden: !creditNote,
            },
            { label: "Avancement cumulé", value: invoice.progress ? formatPercent(invoice.progress.overallPercent) : null, hidden: !invoice.progress },
          ]}
        />
      </div>
    </section>
  );
}
