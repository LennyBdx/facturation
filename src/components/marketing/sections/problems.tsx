import { CircleAlert } from "lucide-react";
import { problems } from "@/content/home";
import { ICONS } from "../icons";
import { Section, SectionHeading } from "../section";

export function Problems() {
  return (
    <Section labelledBy="problems-title">
      <SectionHeading id="problems-title" title={problems.title} intro={problems.intro} />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {problems.items.map((p) => {
          const Icon = ICONS[p.icon] ?? CircleAlert;
          return (
            <li key={p.title} className="reveal rounded-2xl border bg-card p-6">
              <span aria-hidden className="mb-4 flex size-10 items-center justify-center rounded-md bg-warning-soft text-warning">
                <Icon className="size-5" />
              </span>
              <h3 className="font-semibold">{p.title}</h3>
              <p className="mt-1 text-muted-foreground">{p.text}</p>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
