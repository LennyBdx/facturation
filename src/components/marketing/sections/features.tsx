import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Building2, Check, UserRoundCog, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import { cta, features, midCta } from "@/content/home";
import { cn } from "@/lib/utils";
import { ICONS } from "../icons";

const KICKER_ICONS = ["calculator", "layers", "shield", "inbox", "percent", "users"];

/**
 * Bloc foncé (marine) arrondi : grille de cartes claires avec mini-captures réelles,
 * conclu par un appel à l'action. Seule grande surface sombre de la page.
 */
export function Features() {
  return (
    <section id={features.id} aria-labelledby="features-title" className="px-3 py-8 sm:px-6 md:py-12">
      <div className="mx-auto max-w-7xl rounded-[2rem] bg-primary px-4 py-14 text-primary-foreground sm:px-8 md:py-20">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <ul aria-hidden className="mb-6 flex justify-center gap-2">
            {KICKER_ICONS.map((k) => {
              const Icon = ICONS[k]!;
              return (
                <li key={k} className="flex size-9 items-center justify-center rounded-lg bg-primary-foreground/10">
                  <Icon className="size-4" />
                </li>
              );
            })}
          </ul>
          <h2 id="features-title" className="text-3xl font-bold tracking-tight text-balance md:text-5xl">
            {features.title}
          </h2>
          <p className="mt-4 text-lg text-primary-foreground/80">{features.intro}</p>
        </div>

        <ul className="mx-auto grid max-w-6xl gap-5 md:grid-cols-2">
          {features.items.map((f) => (
            <li key={f.id} id={`fonction-${f.id}`} className="reveal flex flex-col overflow-hidden rounded-2xl bg-card text-card-foreground">
              <div className="relative aspect-[16/10] overflow-hidden bg-accent">
                {f.image ? (
                  f.image.device === "mobile" ? (
                    <div className="absolute inset-x-0 top-6 mx-auto w-44 overflow-hidden rounded-t-[1.75rem] border-[5px] border-b-0 border-foreground/85 bg-card">
                      <Image src={f.image.src} alt={f.image.alt} width={f.image.width} height={f.image.height} sizes="11rem" className="h-auto w-full" />
                    </div>
                  ) : (
                    <div className="absolute inset-x-6 top-6 overflow-hidden rounded-t-lg border border-b-0 bg-card shadow-sm">
                      <Image
                        src={f.image.src}
                        alt={f.image.alt}
                        width={f.image.width}
                        height={f.image.height}
                        sizes="(min-width: 768px) 32rem, 90vw"
                        className="h-auto w-full"
                      />
                    </div>
                  )
                ) : (
                  <RolesIllustration />
                )}
              </div>
              <div className="flex flex-1 flex-col p-6">
                <p className="text-sm font-semibold tracking-wide text-brand uppercase">{f.kicker}</p>
                <h3 className="mt-1.5 text-xl font-semibold tracking-tight text-balance">{f.title}</h3>
                <p className="mt-2 text-muted-foreground">{f.text}</p>
                <ul className="mt-4 space-y-1.5 text-sm">
                  {f.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2">
                      <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-success" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ul>

        <div className="mx-auto mt-14 max-w-2xl text-center">
          <p className="text-2xl font-bold tracking-tight text-balance md:text-3xl">{midCta.title}</p>
          <p className="mt-2 text-primary-foreground/80">{midCta.text}</p>
          <Button asChild size="lg" variant="secondary" className="mt-6 h-12 rounded-full px-7 text-base">
            <Link href={ROUTES.signUp}>
              {cta.primary}
              <ArrowRight aria-hidden />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

/** Pas de capture inventée pour l'équipe : schéma des rôles, purement informatif. */
function RolesIllustration() {
  const roles = [
    { icon: UserRoundCog, title: "Propriétaire", text: "Tous les droits, abonnement" },
    { icon: Users, title: "Administrateur", text: "Équipe, paramètres, émission" },
    { icon: Users, title: "Membre", text: "Devis, situations, chantiers" },
  ];
  return (
    <div className="absolute inset-6 flex flex-col justify-center gap-2">
      <p className="flex items-center gap-2 text-sm font-medium">
        <Building2 aria-hidden className="size-4 text-brand" /> Une entreprise, trois niveaux d&apos;accès
      </p>
      {roles.map((r, i) => (
        <div key={r.title} className={cn("flex items-center gap-3 rounded-lg border bg-card p-2.5 shadow-sm", i === 1 && "ml-6", i === 2 && "ml-12")}>
          <span aria-hidden className="flex size-8 items-center justify-center rounded-full bg-accent text-primary">
            <r.icon className="size-4" />
          </span>
          <span className="text-sm">
            <span className="block font-medium">{r.title}</span>
            <span className="block text-muted-foreground">{r.text}</span>
          </span>
        </div>
      ))}
    </div>
  );
}
