import { ChevronDown } from "lucide-react";
import { faq } from "@/content/home";
import { Section, SectionHeading } from "../section";

/**
 * FAQ en accordéon natif <details>/<summary> : accessible au clavier et aux
 * lecteurs d'écran, fonctionne sans JavaScript.
 */
export function Faq() {
  return (
    <Section id={faq.id} labelledBy="faq-title" tone="card">
      <SectionHeading id="faq-title" title={faq.title} />
      <div className="mx-auto max-w-3xl divide-y overflow-hidden rounded-2xl border bg-background">
        {faq.items.map((item) => (
          <details key={item.q} className="group">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-medium hover:bg-secondary/60 [&::-webkit-details-marker]:hidden">
              <span>{item.q}</span>
              <ChevronDown aria-hidden className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
            </summary>
            <p className="px-5 pb-5 text-muted-foreground">{item.a}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}
