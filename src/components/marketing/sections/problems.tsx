import { ArrowRight, CircleAlert, CircleCheck } from "lucide-react";
import { problems } from "@/content/home";
import { ICONS } from "../icons";
import { Section } from "../section";

const ROW = "grid md:grid-cols-[minmax(0,1fr)_3.5rem_minmax(0,1fr)]";

/**
 * Comparatif « Aujourd'hui / Avec Factobat » : chaque irritant du métier face à la réponse
 * de l'outil, en lignes éditoriales (pas de cartes, pour rompre avec les grilles voisines).
 */
export function Problems() {
  return (
    <Section labelledBy="problems-title">
      <div className="reveal mb-10 grid gap-4 md:mb-14 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-end lg:gap-16">
        <h2
          id="problems-title"
          className="text-3xl font-bold tracking-tight text-balance md:text-5xl"
        >
          {problems.title}
        </h2>
        <p className="text-lg text-muted-foreground">{problems.intro}</p>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card">
        {/* En-têtes de colonnes (ordinateur) ; sur mobile, chaque ligne porte ses libellés. */}
        <div aria-hidden className={`${ROW} hidden border-b bg-secondary/60 md:grid`}>
          <ColumnLabel tone="warning">{problems.beforeLabel}</ColumnLabel>
          <span />
          <ColumnLabel tone="success">{problems.afterLabel}</ColumnLabel>
        </div>
        <ul className="divide-y">
          {problems.items.map((item) => {
            const Icon = ICONS[item.icon] ?? CircleAlert;
            return (
              <li key={item.title} className={`reveal ${ROW}`}>
                <div className="flex gap-4 p-5 md:p-6">
                  <span
                    aria-hidden
                    className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-warning-soft text-warning"
                  >
                    <Icon className="size-5" />
                  </span>
                  <div>
                    <p className="mb-1 text-xs font-semibold tracking-wide text-warning uppercase md:sr-only">
                      {problems.beforeLabel}
                    </p>
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="mt-1 text-muted-foreground">{item.text}</p>
                  </div>
                </div>
                <div aria-hidden className="hidden items-center justify-center md:flex">
                  <span className="flex size-8 items-center justify-center rounded-full border bg-background text-muted-foreground">
                    <ArrowRight className="size-4" />
                  </span>
                </div>
                <div className="flex gap-3 bg-success-soft/50 p-5 md:p-6">
                  <CircleCheck aria-hidden className="mt-0.5 size-5 shrink-0 text-success" />
                  <div>
                    <p className="mb-1 text-xs font-semibold tracking-wide text-success uppercase md:sr-only">
                      {problems.afterLabel}
                    </p>
                    <p>{item.fix}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </Section>
  );
}

function ColumnLabel({
  tone,
  children,
}: {
  tone: "warning" | "success";
  children: React.ReactNode;
}) {
  return (
    <p className="flex items-center gap-2 px-6 py-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
      <span
        className={
          tone === "warning" ? "size-2 rounded-full bg-warning" : "size-2 rounded-full bg-success"
        }
      />
      {children}
    </p>
  );
}
