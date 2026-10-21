import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import { cta, finalCta } from "@/content/home";

/** Seule section en teinte primaire de la page. */
export function FinalCta() {
  return (
    <section aria-labelledby="final-cta-title" className="bg-primary py-16 text-primary-foreground md:py-20">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2 id="final-cta-title" className="text-3xl font-semibold tracking-tight text-balance md:text-4xl">
          {finalCta.title}
        </h2>
        <p className="mt-3 text-lg text-primary-foreground/85">{finalCta.text}</p>
        <div className="mt-8 flex flex-col items-center gap-3">
          <Button asChild size="lg" variant="secondary" className="w-full sm:w-auto">
            <Link href={ROUTES.signUp}>
              {cta.primary}
              <ArrowRight aria-hidden />
            </Link>
          </Button>
          <p className="text-sm text-primary-foreground/80">{finalCta.note}</p>
        </div>
      </div>
    </section>
  );
}
