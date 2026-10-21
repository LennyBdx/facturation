"use client";

import { useState } from "react";
import type { MonthlyFigure } from "@/domain/reporting";
import { compactEuros, niceScale } from "@/lib/chart-scale";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

const SERIES = [
  { key: "billed", label: "Facturé", swatch: "bg-chart-1" },
  { key: "collected", label: "Encaissé", swatch: "bg-chart-2" },
] as const;

const monthShort = new Intl.DateTimeFormat("fr-FR", { month: "short", timeZone: "UTC" });
const monthLong = new Intl.DateTimeFormat("fr-FR", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const toDate = (month: string) => new Date(`${month}-01T00:00:00Z`);

/**
 * Colonnes groupées « facturé / encaissé » sur 12 mois. Survol ou focus clavier d'un mois :
 * infobulle avec les deux valeurs ; tableau des données accessible sous le graphique.
 */
export function ActivityChart({ figures }: { figures: MonthlyFigure[] }) {
  const [active, setActive] = useState<number | null>(null);
  const values = figures.map((f) => ({ billed: Number(f.billed), collected: Number(f.collected) }));
  const scale = niceScale(Math.max(0, ...values.flatMap((v) => [v.billed, v.collected])));
  const height = (v: number) => `${(Math.max(0, v) / scale.max) * 100}%`;

  return (
    <div>
      <ul className="mb-4 flex flex-wrap gap-4 text-sm" aria-label="Légende">
        {SERIES.map((s) => (
          <li key={s.key} className="flex items-center gap-2 text-muted-foreground">
            <span aria-hidden className={cn("size-3 rounded-[3px]", s.swatch)} />
            {s.label}
          </li>
        ))}
      </ul>

      <div className="grid grid-cols-[3.5rem_minmax(0,1fr)] gap-x-2" aria-hidden={false}>
        {/* Axe des montants */}
        <div aria-hidden className="relative h-56">
          {scale.ticks.map((t) => (
            <span
              key={t}
              className="num absolute right-0 translate-y-1/2 text-xs text-muted-foreground"
              style={{ bottom: `${(t / scale.max) * 100}%` }}
            >
              {compactEuros(t)}
            </span>
          ))}
        </div>

        {/* Zone de tracé */}
        <div className="relative h-56" onPointerLeave={() => setActive(null)}>
          {scale.ticks.map((t) => (
            <span
              key={t}
              aria-hidden
              className="absolute inset-x-0 h-px bg-border"
              style={{ bottom: `${(t / scale.max) * 100}%` }}
            />
          ))}
          <ol className="absolute inset-0 flex" aria-label="Facturé et encaissé par mois">
            {figures.map((f, i) => (
              <li key={f.month} className="relative flex-1">
                <button
                  type="button"
                  className={cn(
                    "absolute inset-0 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active === i && "bg-secondary/70",
                  )}
                  aria-label={`${monthLong.format(toDate(f.month))} : facturé ${formatMoney(f.billed)}, encaissé ${formatMoney(f.collected)}`}
                  onPointerEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive(null)}
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 bottom-0 flex h-full items-end justify-center gap-0.5"
                >
                  <span
                    className="w-[min(14px,38%)] rounded-t-[4px] bg-chart-1"
                    style={{ height: height(values[i].billed) }}
                  />
                  <span
                    className="w-[min(14px,38%)] rounded-t-[4px] bg-chart-2"
                    style={{ height: height(values[i].collected) }}
                  />
                </div>
                {active === i ? <Tooltip figure={f} alignRight={i >= figures.length / 2} /> : null}
              </li>
            ))}
          </ol>
        </div>

        {/* Mois */}
        <span />
        <ol aria-hidden className="mt-2 flex">
          {figures.map((f, i) => (
            <li
              key={f.month}
              className={cn(
                "flex-1 text-center text-xs text-muted-foreground",
                // Sur mobile, un mois sur deux (en partant du plus récent).
                (figures.length - 1 - i) % 2 === 1 && "max-sm:invisible",
              )}
            >
              {monthShort.format(toDate(f.month)).replace(".", "")}
            </li>
          ))}
        </ol>
      </div>

      <details className="mt-4 text-sm">
        <summary className="inline-flex min-h-11 cursor-pointer items-center text-primary underline-offset-4 hover:underline md:min-h-0">
          Voir les données
        </summary>
        <div className="mt-2 overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <caption className="sr-only">Facturé et encaissé par mois, montants TTC</caption>
            <thead className="bg-secondary/60 text-muted-foreground">
              <tr>
                <th scope="col" className="px-3 py-2 text-left font-medium">
                  Mois
                </th>
                <th scope="col" className="px-3 py-2 text-right font-medium">
                  Facturé
                </th>
                <th scope="col" className="px-3 py-2 text-right font-medium">
                  Encaissé
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {figures.map((f) => (
                <tr key={f.month}>
                  <th scope="row" className="px-3 py-1.5 text-left font-normal capitalize">
                    {monthLong.format(toDate(f.month))}
                  </th>
                  <td className="num px-3 py-1.5 text-right">{formatMoney(f.billed)}</td>
                  <td className="num px-3 py-1.5 text-right">{formatMoney(f.collected)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

function Tooltip({ figure, alignRight }: { figure: MonthlyFigure; alignRight: boolean }) {
  return (
    <div
      role="status"
      className={cn(
        "pointer-events-none absolute bottom-full z-10 mb-2 w-max min-w-40 rounded-lg border bg-popover p-3 text-sm shadow-md",
        alignRight ? "right-0" : "left-0",
      )}
    >
      <p className="mb-1.5 text-xs text-muted-foreground capitalize">
        {monthLong.format(toDate(figure.month))}
      </p>
      {SERIES.map((s) => (
        <p key={s.key} className="flex items-center gap-2">
          <span aria-hidden className={cn("h-0.5 w-3 rounded-full", s.swatch)} />
          <span className="num font-semibold">{formatMoney(figure[s.key])}</span>
          <span className="text-muted-foreground">{s.label}</span>
        </p>
      ))}
    </div>
  );
}
