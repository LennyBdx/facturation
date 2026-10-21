import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import { cta, hero } from "@/content/home";
import { DesktopFrame, PhoneFrame } from "../device-frame";
import { ICONS } from "../icons";

/** Hero : seul `h1` de la page, deux appels à l'action, captures réelles du prototype. */
export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="overflow-hidden pt-10 pb-16 md:pt-16 md:pb-24">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-10">
        <div>
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-sm text-muted-foreground">
            <span aria-hidden className="size-1.5 rounded-full bg-brand" />
            {hero.eyebrow}
          </p>
          <h1 id="hero-title" className="text-4xl leading-[1.1] font-semibold tracking-tight text-balance sm:text-5xl lg:text-[3.5rem]">
            {hero.title}
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">{hero.subtitle}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href={ROUTES.signUp}>
                {cta.primary}
                <ArrowRight aria-hidden />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
              <Link href="#fonctionnalites">{cta.secondary}</Link>
            </Button>
          </div>
          <ul className="mt-8 space-y-3">
            {hero.points.map((p) => {
              const Icon = ICONS[p.icon] ?? Check;
              return (
                <li key={p.text} className="flex items-start gap-3">
                  <span aria-hidden className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
                    <Icon className="size-4" />
                  </span>
                  <span className="pt-0.5">{p.text}</span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="relative pb-10 sm:pr-12 lg:pr-16 lg:pb-14">
          <DesktopFrame shot={hero.images.desktop} priority sizes="(min-width: 1024px) 40rem, 100vw" />
          <PhoneFrame
            shot={hero.images.mobile}
            priority
            sizes="(min-width: 1024px) 11rem, 30vw"
            className="absolute right-0 bottom-0 w-[30%] max-w-44 min-w-28"
          />
        </div>
      </div>
    </section>
  );
}
