import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { cta, finalCta } from "@/content/home";

/** Appel final : bloc marine arrondi (comme le bloc des fonctionnalités). */
export function FinalCta() {
  return (
    <section aria-labelledby="final-cta-title" className="px-3 py-8 sm:px-6 md:py-12">
      <div className="mx-auto max-w-7xl rounded-[2rem] bg-primary px-5 py-14 text-center text-primary-foreground md:py-20">
        <h2 id="final-cta-title" className="mx-auto max-w-3xl text-3xl font-bold tracking-tight text-balance md:text-5xl">
          {finalCta.title}
        </h2>
        <p className="mt-3 text-lg text-primary-foreground/85">{finalCta.text}</p>
        <div className="mt-8 flex flex-col items-center gap-3">
          <Button asChild size="lg" variant="secondary" className="h-12 w-full rounded-full px-7 text-base sm:w-auto">
            <Link href={routes.signUp}>
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
