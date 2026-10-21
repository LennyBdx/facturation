import Link from "next/link";
import { ArrowRight, Check, CircleCheck } from "lucide-react";
import { LifecycleStatusBadge } from "@/components/status/status-badge";
import { Button } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { cta, hero } from "@/content/home";
import { DesktopFrame, PhoneFrame } from "../device-frame";
import { withHighlight } from "../highlight";
import { ICONS } from "../icons";

/**
 * Hero centré : titre avec mot-clé souligné, pastilles, appel à l'action en pilule,
 * grande capture réelle avec éléments flottants (téléphone, suivi des statuts).
 */
export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-4xl text-center">
          <h1
            id="hero-title"
            className="text-4xl leading-[1.08] font-bold tracking-tight text-balance sm:text-6xl lg:text-7xl"
          >
            {withHighlight(hero.title, hero.titleHighlight)}
          </h1>
          <ul
            className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2"
            aria-label="Points forts"
          >
            {hero.tags.map((t) => (
              <li
                key={t}
                className="inline-flex items-center gap-1.5 text-sm font-medium sm:text-base"
              >
                <CircleCheck aria-hidden className="size-4 text-primary" />
                {t}
              </li>
            ))}
          </ul>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">{hero.subtitle}</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 w-full rounded-full px-7 text-base sm:w-auto">
              <Link href={routes.signUp}>
                {cta.primary}
                <ArrowRight aria-hidden />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="ghost"
              className="h-12 w-full rounded-full px-6 text-base sm:w-auto"
            >
              <Link href="#fonctionnalites">{cta.secondary}</Link>
            </Button>
          </div>
        </div>

        <div className="relative mx-auto mt-14 max-w-5xl md:mt-16">
          <div className="rounded-3xl bg-accent p-2 sm:p-4">
            <DesktopFrame
              shot={hero.images.desktop}
              priority
              sizes="(min-width: 1024px) 64rem, 100vw"
              className="rounded-xl"
            />
          </div>

          <PhoneFrame
            shot={hero.images.mobile}
            priority
            sizes="11rem"
            className="absolute -bottom-10 -left-3 hidden w-40 shadow-xl md:block lg:-left-10 lg:w-44"
          />

          <div className="absolute top-16 -right-3 hidden w-64 rounded-xl border bg-card p-4 shadow-xl md:block lg:-right-10">
            <p className="text-sm font-semibold">Facture électronique</p>
            <p className="mb-3 text-xs text-muted-foreground">
              Situation n° 3 · suivi de la plateforme agréée
            </p>
            <ol className="space-y-2">
              {(["deposited", "approved", "cashed"] as const).map((s) => (
                <li key={s} className="flex items-center justify-between gap-2">
                  <LifecycleStatusBadge status={s} />
                  <Check aria-hidden className="size-4 text-success" />
                </li>
              ))}
            </ol>
          </div>
        </div>

        <ul className="mx-auto mt-16 grid max-w-5xl gap-4 sm:grid-cols-3 md:mt-20">
          {hero.points.map((p) => {
            const Icon = ICONS[p.icon] ?? Check;
            return (
              <li key={p.text} className="flex items-center gap-3 sm:justify-center">
                <span
                  aria-hidden
                  className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-primary"
                >
                  <Icon className="size-4" />
                </span>
                <span className="font-medium">{p.text}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
