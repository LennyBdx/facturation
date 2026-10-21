import { Building2, Check, UserRoundCog, Users } from "lucide-react";
import { features } from "@/content/home";
import { cn } from "@/lib/utils";
import { DesktopFrame, PhoneFrame } from "../device-frame";
import { Section, SectionHeading } from "../section";

/** Fonctionnalités en blocs alternés texte + capture réelle. */
export function Features() {
  return (
    <Section id={features.id} labelledBy="features-title" tone="card">
      <SectionHeading id="features-title" title={features.title} intro={features.intro} />
      <div className="space-y-20 md:space-y-28">
        {features.items.map((f, i) => (
          <article
            key={f.id}
            id={`fonction-${f.id}`}
            aria-labelledby={`fonction-${f.id}-title`}
            className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16"
          >
            <div className={cn("reveal", i % 2 === 1 && "lg:order-2")}>
              <p className="text-sm font-semibold tracking-wide text-brand uppercase">{f.kicker}</p>
              <h3 id={`fonction-${f.id}-title`} className="mt-2 text-2xl font-semibold tracking-tight text-balance md:text-3xl">
                {f.title}
              </h3>
              <p className="mt-3 text-lg text-muted-foreground">{f.text}</p>
              <ul className="mt-5 space-y-2">
                {f.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2">
                    <Check aria-hidden className="mt-1 size-4 shrink-0 text-success" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
            <div className={cn("reveal", i % 2 === 1 && "lg:order-1")}>
              {f.image ? (
                f.image.device === "mobile" ? (
                  <PhoneFrame shot={f.image} className="mx-auto w-64 max-w-[70%]" sizes="16rem" />
                ) : (
                  <DesktopFrame shot={f.image} sizes="(min-width: 1024px) 34rem, 100vw" />
                )
              ) : (
                <RolesIllustration />
              )}
            </div>
          </article>
        ))}
      </div>
    </Section>
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
    <div className="rounded-lg border bg-background p-6">
      <p className="mb-4 flex items-center gap-2 font-medium">
        <Building2 aria-hidden className="size-5 text-brand" /> Une entreprise, trois niveaux d&apos;accès
      </p>
      <ul className="space-y-3">
        {roles.map((r) => (
          <li key={r.title} className="flex items-center gap-3 rounded-md border bg-card p-3">
            <span aria-hidden className="flex size-9 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <r.icon className="size-4" />
            </span>
            <span>
              <span className="block font-medium">{r.title}</span>
              <span className="block text-sm text-muted-foreground">{r.text}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
