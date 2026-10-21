"use client";

import { Check, ChevronRight, HardHat } from "lucide-react";
import { Tabs } from "radix-ui";
import { trades } from "@/content/home";
import { cn } from "@/lib/utils";
import { ICONS } from "../icons";

/**
 * « Pour les entreprises du second œuvre » : sélecteur de métier. Chaque métier affiche un
 * extrait de devis type (unités et taux de TVA propres au métier) et ce que l'outil gère.
 * Tous les panneaux restent dans le HTML (forceMount) pour le référencement.
 */
export function Trades() {
  return (
    <section aria-labelledby="trades-title" className="border-y bg-card py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Tabs.Root
          defaultValue={trades.items[0].name}
          orientation="vertical"
          className="grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14"
        >
          <div className="reveal">
            <h2
              id="trades-title"
              className="text-3xl font-bold tracking-tight text-balance md:text-5xl"
            >
              {trades.title}
            </h2>
            <p className="mt-3 text-lg text-muted-foreground">{trades.intro}</p>
            <Tabs.List
              aria-label="Métiers"
              className="mt-8 flex flex-wrap gap-2 lg:flex-col lg:gap-1.5"
            >
              {trades.items.map((t) => {
                const Icon = ICONS[t.icon] ?? HardHat;
                return (
                  <Tabs.Trigger
                    key={t.name}
                    value={t.name}
                    className={cn(
                      "group flex min-h-11 items-center gap-3 rounded-xl border bg-background px-3 text-left font-medium transition-colors",
                      "hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                      "data-[state=active]:border-transparent data-[state=active]:bg-band data-[state=active]:text-band-foreground",
                      "lg:min-h-14 lg:w-full lg:px-4",
                    )}
                  >
                    <span
                      aria-hidden
                      className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent text-brand group-data-[state=active]:bg-white/10 group-data-[state=active]:text-band-accent"
                    >
                      <Icon className="size-4" />
                    </span>
                    {t.name}
                    <ChevronRight
                      aria-hidden
                      className="ml-auto hidden size-4 opacity-0 transition-opacity group-data-[state=active]:opacity-100 lg:block"
                    />
                  </Tabs.Trigger>
                );
              })}
            </Tabs.List>
          </div>

          {trades.items.map((t) => (
            <Tabs.Content
              key={t.name}
              value={t.name}
              forceMount
              className="reveal self-center focus-visible:outline-none data-[state=inactive]:hidden"
            >
              <TradeExample trade={t} />
            </Tabs.Content>
          ))}
        </Tabs.Root>
      </div>
    </section>
  );
}

function TradeExample({ trade }: { trade: (typeof trades.items)[number] }) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-background shadow-xl">
      <div className="flex items-center justify-between gap-3 border-b bg-card px-5 py-3">
        <p className="text-sm font-semibold">
          {trades.exampleLabel} · {trade.name}
        </p>
        <span aria-hidden className="h-1.5 w-10 rounded-full bg-brand" />
      </div>
      <table className="w-full text-sm">
        <caption className="sr-only">
          {trades.exampleLabel}, {trade.name}
        </caption>
        <thead className="text-xs text-muted-foreground">
          <tr>
            <th scope="col" className="px-5 pt-4 pb-2 text-left font-medium">
              Désignation
            </th>
            <th scope="col" className="px-2 pt-4 pb-2 text-right font-medium">
              Quantité
            </th>
            <th scope="col" className="px-5 pt-4 pb-2 text-right font-medium">
              TVA
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {trade.lines.map((l) => (
            <tr key={l.label}>
              <td className="px-5 py-3">{l.label}</td>
              <td className="num px-2 py-3 text-right whitespace-nowrap">
                {l.quantity} <span className="text-muted-foreground">{l.unit}</span>
              </td>
              <td className="px-5 py-3 text-right whitespace-nowrap">
                <span
                  className={cn(
                    "rounded-md px-1.5 py-0.5 text-xs font-medium",
                    l.vat === "Autoliquidation"
                      ? "bg-pending-soft text-pending"
                      : "bg-secondary text-secondary-foreground",
                  )}
                >
                  {l.vat}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="border-t bg-card px-5 py-5">
        <p className="text-muted-foreground">{trade.text}</p>
        <ul className="mt-4 flex flex-wrap gap-2">
          {trade.handles.map((h) => (
            <li
              key={h}
              className="inline-flex items-center gap-1.5 rounded-full border border-success/25 bg-success-soft px-3 py-1 text-sm text-success"
            >
              <Check aria-hidden className="size-3.5" />
              {h}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
