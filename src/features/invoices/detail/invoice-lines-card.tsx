import { Amount } from "@/components/app/amount";
import { AmountRow } from "@/components/app/amount-row";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Invoice } from "@/data/types";
import { addMoney } from "@/domain/money";
import { formatVatRateLabel, REVERSE_CHARGE_MENTION } from "@/domain/vat";
import { formatPercent, formatQuantity } from "@/lib/format";

/** Lignes de la facture et récapitulatif (période, remise, acompte, TVA, retenue, net à payer). */
export function InvoiceLinesCard({ invoice }: { invoice: Invoice }) {
  const t = invoice.totals;
  const isProgress = !!invoice.progress;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{invoice.title}</CardTitle>
        {isProgress ? <CardDescription>Montants de la période = cumul actuel − cumul de la situation précédente.</CardDescription> : null}
      </CardHeader>
      <CardContent>
        <ul className="divide-y">
          {invoice.lines.map((l) => (
            <li key={l.id} className="flex flex-col gap-1 py-2.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <span className="min-w-0">
                {l.description}
                {l.sectionTitle ? <span className="block text-xs text-muted-foreground">{l.sectionTitle}</span> : null}
              </span>
              <span className="flex shrink-0 items-baseline justify-between gap-4 sm:justify-end">
                <span className="num text-sm text-muted-foreground">
                  {l.progress
                    ? `${formatPercent(l.progress.previousPercent)} → ${formatPercent(l.progress.currentPercent)}`
                    : `${formatQuantity(l.quantity)} ${l.unit} × ${l.unitPrice.replace(".", ",")} €`}{" "}
                  · {invoice.reverseCharge ? "AE" : formatVatRateLabel(l.vatRate)}
                </span>
                <Amount value={l.net} className="w-28 text-right font-medium" />
              </span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-1.5 border-t pt-4 text-sm sm:ml-auto sm:max-w-sm">
          {isProgress ? <AmountRow label="Travaux de la période HT" value={addMoney(t.net, t.depositDeduction, t.discount)} /> : null}
          {t.discount !== "0.00" ? <AmountRow label="Remise" value={t.discount} negative /> : null}
          {t.depositDeduction !== "0.00" ? <AmountRow label="Acompte déduit (HT)" value={t.depositDeduction} negative /> : null}
          <AmountRow label="Total HT" value={t.net} strong />
          {t.vatBreakdown.map((b) => (
            <AmountRow key={`${b.vatCategory}${b.vatRate}`} label={b.vatCategory === "AE" ? "TVA autoliquidée" : `TVA ${formatVatRateLabel(b.vatRate)}`} value={b.vat} />
          ))}
          <AmountRow label={invoice.reverseCharge ? "Total" : "Total TTC"} value={t.gross} strong />
          {t.retention !== "0.00" ? (
            <AmountRow label={`Retenue de garantie ${formatPercent(invoice.progress?.retentionRate ?? "0")}`} value={t.retention} negative />
          ) : null}
          <div className="flex justify-between border-t pt-2 text-base font-semibold">
            <dt>Net à payer</dt>
            <dd>
              <Amount value={t.netToPay} />
            </dd>
          </div>
        </dl>
        {invoice.reverseCharge ? <p className="mt-3 rounded-md bg-pending-soft p-2 text-xs text-pending">{REVERSE_CHARGE_MENTION}</p> : null}
      </CardContent>
    </Card>
  );
}
