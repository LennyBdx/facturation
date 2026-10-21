"use client";

import { Loader2, Save } from "lucide-react";
import { Amount } from "@/components/app/amount";
import { Button } from "@/components/ui/button";
import type { QuoteTotals } from "@/domain/quote";
import { formatVatRateLabel, REVERSE_CHARGE_MENTION } from "@/domain/vat";

export function TotalsBlock({
  totals,
  reverseCharge,
}: {
  totals: QuoteTotals;
  reverseCharge: boolean;
}) {
  return (
    <dl className="space-y-2 text-sm">
      <div className="flex justify-between">
        <dt className="text-muted-foreground">Total HT avant remise</dt>
        <dd>
          <Amount value={totals.grossNet} />
        </dd>
      </div>
      {totals.discountAmount !== "0.00" ? (
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Remise</dt>
          <dd>
            − <Amount value={totals.discountAmount} />
          </dd>
        </div>
      ) : null}
      <div className="flex justify-between font-medium">
        <dt>Total HT</dt>
        <dd>
          <Amount value={totals.net} />
        </dd>
      </div>
      {totals.vatBreakdown.map((b) => (
        <div key={`${b.vatCategory}${b.vatRate}`} className="flex justify-between">
          <dt className="text-muted-foreground">
            {b.vatCategory === "AE" ? "TVA autoliquidée" : `TVA ${formatVatRateLabel(b.vatRate)}`}
            <span className="block text-xs">
              sur <Amount value={b.base} />
            </span>
          </dt>
          <dd>
            <Amount value={b.vat} />
          </dd>
        </div>
      ))}
      <div className="flex justify-between border-t pt-2 text-base font-semibold">
        <dt>Total {reverseCharge ? "à payer" : "TTC"}</dt>
        <dd>
          <Amount value={totals.gross} />
        </dd>
      </div>
      {totals.depositAmount !== "0.00" ? (
        <div className="flex justify-between text-muted-foreground">
          <dt>Acompte demandé</dt>
          <dd>
            <Amount value={totals.depositAmount} />
          </dd>
        </div>
      ) : null}
      {reverseCharge ? (
        <p className="rounded-md bg-pending-soft p-2 text-xs text-pending">
          {REVERSE_CHARGE_MENTION}
        </p>
      ) : null}
    </dl>
  );
}

function SaveButton({
  pending,
  label = "Enregistrer le devis",
  className,
}: {
  pending: boolean;
  label?: string;
  className?: string;
}) {
  return (
    <Button
      type="submit"
      className={className}
      disabled={pending}
      onClick={(e) => e.stopPropagation()}
    >
      {pending ? <Loader2 aria-hidden className="animate-spin" /> : <Save aria-hidden />}
      {label}
    </Button>
  );
}

/**
 * Totaux toujours visibles : colonne collante (ordinateur), bloc en bas (tablette),
 * barre collante dépliable au-dessus des onglets (mobile).
 */
export function QuoteTotalsPanels({
  totals,
  reverseCharge,
  pending,
}: {
  totals: QuoteTotals;
  reverseCharge: boolean;
  pending: boolean;
}) {
  return (
    <>
      <aside className="hidden xl:block">
        <div className="sticky top-16 space-y-4 rounded-lg border bg-card p-4">
          <TotalsBlock totals={totals} reverseCharge={reverseCharge} />
          <SaveButton pending={pending} className="w-full" />
        </div>
      </aside>

      <div className="hidden space-y-4 rounded-lg border bg-card p-4 md:block xl:hidden">
        <TotalsBlock totals={totals} reverseCharge={reverseCharge} />
        <SaveButton pending={pending} className="w-full" />
      </div>

      <div className="fixed inset-x-0 bottom-16 z-20 border-t bg-card/95 px-4 py-3 backdrop-blur md:hidden">
        <details className="group">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3">
            <span>
              <span className="block text-xs text-muted-foreground">
                Total {reverseCharge ? "HT (autoliquidation)" : "TTC"}
              </span>
              <Amount value={totals.gross} className="text-lg font-semibold" />
            </span>
            <span className="flex items-center gap-2">
              <span className="text-sm text-primary group-open:hidden">Détail</span>
              <SaveButton pending={pending} label="Enregistrer" />
            </span>
          </summary>
          <div className="pt-3">
            <TotalsBlock totals={totals} reverseCharge={reverseCharge} />
          </div>
        </details>
      </div>
    </>
  );
}
