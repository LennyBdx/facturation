import { CalendarClock, ExternalLink, ShieldCheck } from "lucide-react";
import { OFFICIAL_PLATFORMS_URL } from "@/config/site";
import { reform } from "@/content/home";

/** Bandeau réforme : faits datés, rôle de la plateforme agréée, lien officiel. Aucun badge officiel. */
export function Reform() {
  return (
    <section id={reform.id} aria-labelledby="reform-title" className="border-y bg-card py-16 md:py-20">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center">
        <div className="reveal">
          <p className="mb-4 inline-flex items-center gap-1.5 rounded-sm border border-success/25 bg-success-soft px-2 py-1 text-sm font-medium text-success">
            <ShieldCheck aria-hidden className="size-4" />
            {reform.badge}
          </p>
          <h2 id="reform-title" className="text-3xl font-semibold tracking-tight text-balance md:text-4xl">
            {reform.title}
          </h2>
          <div className="mt-4 space-y-3 text-lg text-muted-foreground">
            {reform.body.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          <a
            href={OFFICIAL_PLATFORMS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex min-h-11 items-center gap-1.5 font-medium text-primary underline-offset-4 hover:underline"
          >
            {reform.link}
            <ExternalLink aria-hidden className="size-4" />
            <span className="sr-only">(nouvel onglet, impots.gouv.fr)</span>
          </a>
        </div>
        <ol className="reveal grid gap-4 sm:grid-cols-2">
          {reform.dates.map((d) => (
            <li key={d.date} className="rounded-lg border bg-background p-6">
              <CalendarClock aria-hidden className="mb-3 size-6 text-brand" />
              <p className="text-xl font-semibold">{d.date}</p>
              <p className="mt-1 text-muted-foreground">{d.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
