import { Amount } from "@/components/app/amount";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Invoice, PaymentMethod } from "@/data/types";
import { compareMoney, ZERO } from "@/domain/money";
import { formatDate } from "@/lib/format";
import { PaymentDialog } from "../invoice-widgets";

const METHOD_LABELS: Record<PaymentMethod, string> = { transfer: "Virement", check: "Chèque", card: "Carte", cash: "Espèces", other: "Autre" };

/** Paiements reçus et enregistrement d'un nouveau paiement. */
export function PaymentsCard({ invoice, remaining, today, canRecord }: { invoice: Invoice; remaining: string; today: string; canRecord: boolean }) {
  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
        <CardTitle className="text-lg">Paiements</CardTitle>
        {canRecord && compareMoney(remaining, ZERO) > 0 ? <PaymentDialog invoiceId={invoice.id} remaining={remaining} today={today} /> : null}
      </CardHeader>
      <CardContent>
        {invoice.payments.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun paiement enregistré.</p>
        ) : (
          <ul className="divide-y">
            {invoice.payments.map((p) => (
              <li key={p.id} className="flex justify-between gap-3 py-2.5 text-sm">
                <span>
                  {formatDate(p.date)} — {METHOD_LABELS[p.method]}
                  {p.reference ? <span className="text-muted-foreground"> · {p.reference}</span> : null}
                </span>
                <Amount value={p.amount} className="font-medium" />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
