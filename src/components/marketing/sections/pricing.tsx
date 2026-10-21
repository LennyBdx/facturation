import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { cta, pricing } from "@/content/home";
import { cn } from "@/lib/utils";
import { Section, SectionHeading } from "../section";

/** Offres en maquette : prix et contenus [À DÉFINIR]. Aucune mention inventée (« le plus choisi »…). */
export function Pricing() {
  return (
    <Section id={pricing.id} labelledBy="pricing-title">
      <SectionHeading id="pricing-title" title={pricing.title} intro={pricing.intro} />
      <ul className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-3">
        {pricing.plans.map((p) => (
          <li
            key={p.name}
            className={cn(
              "reveal flex flex-col rounded-2xl border bg-card p-6",
              p.highlighted && "border-primary ring-1 ring-primary",
            )}
          >
            <h3 className="text-xl font-semibold">{p.name}</h3>
            <p className="text-sm text-muted-foreground">{p.audience}</p>
            <p className="mt-4 text-2xl font-semibold">{p.price}</p>
            <ul className="mt-4 flex-1 space-y-2">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check aria-hidden className="mt-1 size-4 shrink-0 text-success" />
                  {f}
                </li>
              ))}
            </ul>
            <Button
              asChild
              size="lg"
              variant={p.highlighted ? "default" : "outline"}
              className="mt-6 h-12 w-full rounded-full text-base"
            >
              <Link href={routes.signUp}>
                {cta.primary}
                <span className="sr-only"> — offre {p.name}</span>
              </Link>
            </Button>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-center text-sm text-muted-foreground">{pricing.note}</p>
    </Section>
  );
}
