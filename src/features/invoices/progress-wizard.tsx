"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { CheckCheck, Loader2, Receipt } from "lucide-react";
import { toast } from "sonner";
import { Amount } from "@/components/app/amount";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import type { Quote } from "@/data/types";
import { Dec, parseDecimalInput } from "@/domain/money";
import {
  computeProgressInvoice,
  type ProgressCumulative,
  type ProgressInvoiceResult,
} from "@/domain/progress-billing";
import { formatVatRateLabel, REVERSE_CHARGE_MENTION } from "@/domain/vat";
import { formatPercent } from "@/lib/format";
import { createProgressDraftAction } from "./actions";

type Props = {
  quote: Pick<Quote, "id" | "sections" | "discount" | "reverseCharge">;
  previous: ProgressCumulative | null;
  depositNet: string;
  retentionRate: string;
  today: string;
};

const pctToInput = (v: string) => new Dec(v).toString().replace(".", ",");

export function ProgressWizard({ quote, previous, depositNet, retentionRate, today }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [issueDate, setIssueDate] = useState(today);
  const lines = quote.sections.flatMap((s) => s.lines.map((l) => ({ ...l, sectionId: s.id })));
  const prevPct = (id: string) => previous?.percentByLine[id] ?? "0.00";
  const [inputs, setInputs] = useState<Record<string, string>>(() =>
    Object.fromEntries(lines.map((l) => [l.id, pctToInput(prevPct(l.id))])),
  );

  const lineErrors = useMemo(() => {
    const out: Record<string, string> = {};
    for (const l of lines) {
      const parsed = parseDecimalInput(inputs[l.id] ?? "");
      if (parsed === null) out[l.id] = "Pourcentage attendu (ex. 45).";
      else if (Number(parsed) > 100) out[l.id] = "100 % maximum.";
      else if (Number(parsed) < 0) out[l.id] = "Valeur positive attendue.";
      else if (new Dec(parsed).lessThan(prevPct(l.id)))
        out[l.id] =
          `Ne peut pas être inférieur au cumul précédent (${formatPercent(prevPct(l.id))}).`;
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputs]);

  const result: ProgressInvoiceResult | null = useMemo(() => {
    if (Object.keys(lineErrors).length) return null;
    return computeProgressInvoice({
      contract: quote,
      progress: Object.fromEntries(lines.map((l) => [l.id, parseDecimalInput(inputs[l.id]!)!])),
      previous,
      deposit: new Dec(depositNet).isZero() ? null : { net: depositNet },
      retentionRate,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputs, lineErrors]);

  const byLine = new Map(result?.lines.map((l) => [l.lineId, l]) ?? []);
  const setSection = (sectionId: string, value: string) =>
    setInputs((cur) => ({
      ...cur,
      ...Object.fromEntries(
        lines.filter((l) => l.sectionId === sectionId).map((l) => [l.id, value]),
      ),
    }));

  const submit = () => {
    if (!result) {
      toast.error("Corrigez les pourcentages signalés.");
      return;
    }
    if (new Dec(result.periodWorksGrossNet).isZero()) {
      toast.error("Aucun avancement nouveau depuis la situation précédente.");
      return;
    }
    startTransition(async () => {
      const r = await createProgressDraftAction({
        quoteId: quote.id,
        issueDate,
        progress: Object.fromEntries(lines.map((l) => [l.id, parseDecimalInput(inputs[l.id]!)!])),
      });
      if (!r.ok) toast.error(r.error);
      else {
        toast.success(r.message);
        router.push(r.data!.redirectTo);
      }
    });
  };

  const index = (previous?.index ?? 0) + 1;

  return (
    <div className="grid gap-6 pb-28 md:pb-0 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="min-w-0 space-y-4">
        <div className="flex flex-wrap items-end gap-4 rounded-lg border bg-card p-4">
          <div>
            <Label htmlFor="p-date">Date de la situation</Label>
            <Input
              id="p-date"
              type="date"
              className="mt-1.5 w-48"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setInputs(Object.fromEntries(lines.map((l) => [l.id, "100"])))}
          >
            <CheckCheck aria-hidden />
            Tout à 100 % (solde)
          </Button>
          <p className="text-sm text-muted-foreground">
            Saisissez l&apos;avancement <strong>cumulé</strong> depuis le début du chantier, ligne
            par ligne.
          </p>
        </div>

        {quote.sections.map((s) => (
          <section key={s.id} aria-label={s.title} className="rounded-lg border bg-card">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b p-3">
              <h2 className="font-medium">{s.title}</h2>
              <div className="flex items-center gap-2">
                <Label htmlFor={`lot-${s.id}`} className="text-sm text-muted-foreground">
                  Tout le lot à
                </Label>
                <Input
                  id={`lot-${s.id}`}
                  inputMode="decimal"
                  className="w-20"
                  placeholder="%"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      setSection(s.id, (e.target as HTMLInputElement).value);
                    }
                  }}
                  onBlur={(e) => e.target.value && setSection(s.id, e.target.value)}
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            </div>
            <ul className="divide-y">
              {s.lines.map((l) => {
                const r = byLine.get(l.id);
                const err = lineErrors[l.id];
                const id = `pct-${l.id}`;
                return (
                  <li
                    key={l.id}
                    className="grid gap-3 p-3 md:grid-cols-[minmax(0,1fr)_8rem_7rem_8rem] md:items-center"
                  >
                    <div className="min-w-0">
                      <label htmlFor={id} className="block font-medium">
                        {l.description}
                      </label>
                      <span className="text-sm text-muted-foreground">
                        Marché <Amount value={r?.contractNet ?? "0"} /> HT · précédent{" "}
                        {formatPercent(prevPct(l.id))}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Input
                          id={id}
                          inputMode="decimal"
                          value={inputs[l.id] ?? ""}
                          onChange={(e) => setInputs((cur) => ({ ...cur, [l.id]: e.target.value }))}
                          aria-invalid={!!err || undefined}
                          aria-describedby={err ? `${id}-err` : undefined}
                          className="text-right"
                        />
                        <span aria-hidden className="text-sm text-muted-foreground">
                          %
                        </span>
                      </div>
                    </div>
                    <Progress
                      value={Number(parseDecimalInput(inputs[l.id] ?? "") ?? 0)}
                      className="h-1.5 [&>*]:bg-brand"
                      aria-hidden
                    />
                    <p className="num text-right text-sm">
                      <span className="text-muted-foreground md:hidden">Période : </span>
                      <Amount value={r?.periodAmount ?? "0"} className="font-medium" />
                    </p>
                    {err ? (
                      <p
                        id={`${id}-err`}
                        role="alert"
                        className="text-sm text-destructive md:col-span-4"
                      >
                        {err}
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      <aside className="xl:block">
        <Card className="xl:sticky xl:top-16">
          <CardHeader>
            <CardTitle className="text-lg">Situation n° {index}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {result ? (
              <>
                <div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Avancement global</span>
                    <span className="num font-medium">{formatPercent(result.overallPercent)}</span>
                  </div>
                  <Progress
                    value={Number(result.overallPercent)}
                    className="mt-1.5 h-2 [&>*]:bg-brand"
                    aria-label={`Avancement global ${formatPercent(result.overallPercent)}`}
                  />
                </div>
                <dl className="space-y-1.5 text-sm">
                  <Row label="Travaux de la période HT" value={result.periodWorksGrossNet} />
                  {result.periodDiscount !== "0.00" ? (
                    <Row label="Remise" value={result.periodDiscount} negative />
                  ) : null}
                  {result.periodDepositDeduction !== "0.00" ? (
                    <Row
                      label="Acompte déduit (HT)"
                      value={result.periodDepositDeduction}
                      negative
                    />
                  ) : null}
                  <Row label="Total HT" value={result.net} strong />
                  {result.vatBreakdown.map((b) => (
                    <Row
                      key={`${b.vatCategory}${b.vatRate}`}
                      label={
                        b.vatCategory === "AE"
                          ? "TVA autoliquidée"
                          : `TVA ${formatVatRateLabel(b.vatRate)}`
                      }
                      value={b.vat}
                    />
                  ))}
                  <Row
                    label={quote.reverseCharge ? "Total (autoliquidation)" : "Total TTC"}
                    value={result.gross}
                    strong
                  />
                  {result.periodRetention !== "0.00" ? (
                    <Row
                      label={`Retenue de garantie ${formatPercent(result.retentionRate)}`}
                      value={result.periodRetention}
                      negative
                    />
                  ) : null}
                  <div className="flex justify-between border-t pt-2 text-base font-semibold">
                    <dt>Net à payer</dt>
                    <dd>
                      <Amount value={result.netToPay} />
                    </dd>
                  </div>
                </dl>
                {quote.reverseCharge ? (
                  <p className="rounded-md bg-pending-soft p-2 text-xs text-pending">
                    {REVERSE_CHARGE_MENTION}
                  </p>
                ) : null}
              </>
            ) : (
              <p role="status" className="text-sm text-destructive">
                Corrigez les pourcentages signalés pour voir le calcul.
              </p>
            )}
            <Button type="button" className="w-full" onClick={submit} disabled={pending || !result}>
              {pending ? <Loader2 aria-hidden className="animate-spin" /> : <Receipt aria-hidden />}
              Créer la situation (brouillon)
            </Button>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}

function Row({
  label,
  value,
  negative,
  strong,
}: {
  label: string;
  value: string;
  negative?: boolean;
  strong?: boolean;
}) {
  return (
    <div className={strong ? "flex justify-between font-medium" : "flex justify-between"}>
      <dt className={strong ? undefined : "text-muted-foreground"}>{label}</dt>
      <dd>
        {negative ? "− " : ""}
        <Amount value={value} />
      </dd>
    </div>
  );
}
