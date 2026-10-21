import { HardHat } from "lucide-react";
import { trades } from "@/content/home";
import { ICONS } from "../icons";
import { Section, SectionHeading } from "../section";

export function Trades() {
  return (
    <Section labelledBy="trades-title" tone="card">
      <SectionHeading id="trades-title" title={trades.title} intro={trades.intro} />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {trades.items.map((t) => {
          const Icon = ICONS[t.icon] ?? HardHat;
          return (
            <li key={t.name} className="reveal rounded-2xl border bg-background p-5">
              <span aria-hidden className="mb-3 flex size-10 items-center justify-center rounded-md bg-accent text-brand">
                <Icon className="size-5" />
              </span>
              <h3 className="font-semibold">{t.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t.text}</p>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
