import { CalendarClock, ExternalLink, ShieldCheck } from "lucide-react";
import { OFFICIAL_PLATFORMS_URL } from "@/config/site";
import { reform } from "@/content/home";

/** Bandeau réforme : bloc teinté arrondi, dates en cartes flottantes, lien officiel. Aucun badge officiel. */
export function Reform() {
  return (
    <section id={reform.id} aria-labelledby="reform-title" className="px-3 py-8 sm:px-6 md:py-12">
      <div className="mx-auto grid max-w-7xl gap-10 rounded-[2rem] bg-accent px-5 py-12 sm:px-10 md:py-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-center lg:px-16">
        <div className="reveal">
          <p className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-success/25 bg-card px-3 py-1 text-sm font-medium text-success">
            <ShieldCheck aria-hidden className="size-4" />
            {reform.badge}
          </p>
          <h2
            id="reform-title"
            className="text-3xl font-bold tracking-tight text-balance md:text-5xl"
          >
            {reform.title}
          </h2>
          <div className="mt-5 space-y-3 text-lg text-muted-foreground">
            {reform.body.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          <a
            href={OFFICIAL_PLATFORMS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex min-h-11 items-center gap-1.5 font-semibold text-primary underline-offset-4 hover:underline"
          >
            {reform.link}
            <ExternalLink aria-hidden className="size-4" />
            <span className="sr-only">(nouvel onglet, impots.gouv.fr)</span>
          </a>
        </div>
        <ol className="reveal space-y-4 lg:pl-6">
          {reform.dates.map((d, i) => (
            <li
              key={d.date}
              className={
                i === 1
                  ? "rounded-2xl bg-card p-6 shadow-lg lg:ml-10"
                  : "rounded-2xl bg-card p-6 shadow-lg lg:mr-10"
              }
            >
              <span className="flex items-center gap-3">
                <span
                  aria-hidden
                  className="flex size-10 items-center justify-center rounded-lg bg-accent text-brand"
                >
                  <CalendarClock className="size-5" />
                </span>
                <span className="text-xl font-bold">{d.date}</span>
              </span>
              <p className="mt-3 text-muted-foreground">{d.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
