import { BadgeEuro, CircleCheck, Send, ThumbsUp } from "lucide-react";
import { steps } from "@/content/home";
import { cn } from "@/lib/utils";

type Visual = (typeof steps.items)[number]["visual"];

/**
 * « Comment ça marche » : bandeau sombre (jetons « band ») qui rompt le rythme des grilles blanches.
 * Étapes reliées par un fil, grands numéros en contour, et pour chacune une mini-interface
 * du produit (contrôles de la fiche, cumul des situations, suivi de la facture).
 */
export function Steps() {
  return (
    <section aria-labelledby="steps-title" className="px-3 py-8 sm:px-6 md:py-12">
      <div className="mx-auto max-w-7xl rounded-[2rem] bg-band px-5 py-12 text-band-foreground ring-1 ring-white/5 sm:px-10 md:py-16 lg:px-16">
        <div className="reveal grid gap-4 lg:grid-cols-2 lg:items-end lg:gap-16">
          <h2
            id="steps-title"
            className="text-3xl font-bold tracking-tight text-balance md:text-5xl"
          >
            {steps.title}
          </h2>
          <p className="max-w-xl text-lg text-band-foreground/75">{steps.intro}</p>
        </div>

        <ol className="relative mt-12 grid gap-12 lg:mt-16 lg:grid-cols-3 lg:gap-8">
          {/* Fil qui relie les étapes (ordinateur). */}
          <span
            aria-hidden
            className="absolute top-8 right-0 left-0 hidden h-px bg-band-foreground/20 lg:block"
          />
          {steps.items.map((s, i) => (
            <li key={s.title} className="reveal relative flex flex-col">
              <div className="flex items-center">
                <span
                  aria-hidden
                  className="num relative bg-band pr-3 text-6xl leading-none font-bold text-transparent [-webkit-text-stroke:1.5px_var(--band-accent)]"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  aria-hidden
                  className="relative size-3 rounded-full bg-band-accent ring-4 ring-band"
                />
              </div>
              <h3 className="mt-6 text-xl font-semibold">{s.title}</h3>
              <p className="mt-2 text-band-foreground/75">{s.text}</p>
              <div className="mt-6 lg:mt-auto lg:pt-6">
                <StepVisual visual={s.visual} />
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/** Mini-interface illustrative (décorative : le texte de l'étape porte l'information). */
function StepVisual({ visual }: { visual: Visual }) {
  return (
    <div
      aria-hidden
      className="rounded-2xl bg-card p-5 text-card-foreground shadow-xl ring-1 ring-black/5"
    >
      <p className="mb-4 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {visual.heading}
      </p>
      {visual.kind === "checklist" ? (
        <ul className="space-y-2.5">
          {visual.rows.map((row) => (
            <li key={row} className="flex items-center gap-2.5 text-sm">
              <CircleCheck className="size-4 shrink-0 text-success" />
              {row}
            </li>
          ))}
        </ul>
      ) : visual.kind === "progress" ? (
        <ul className="space-y-3.5">
          {visual.rows.map((row, i) => {
            const previous = i > 0 ? visual.rows[i - 1].percent : 0;
            return (
              <li key={row.label}>
                <div className="mb-1.5 flex items-baseline justify-between text-sm">
                  <span>{row.label}</span>
                  <span className="num font-semibold">
                    {row.percent} %
                    {previous > 0 ? (
                      <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                        +{row.percent - previous}
                      </span>
                    ) : null}
                  </span>
                </div>
                {/* Cumul précédent en teinte claire, avancement de la période en plein. */}
                <div className="flex h-2 overflow-hidden rounded-full bg-secondary">
                  <span className="bg-brand/35" style={{ width: `${previous}%` }} />
                  <span className="bg-brand" style={{ width: `${row.percent - previous}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <ol className="space-y-0">
          {visual.rows.map((row, i) => {
            const Icon = [Send, ThumbsUp, BadgeEuro][i] ?? CircleCheck;
            const last = i === visual.rows.length - 1;
            return (
              <li key={row} className="relative flex items-center gap-3 pb-4 last:pb-0">
                {!last ? (
                  <span className="absolute top-8 bottom-0 left-4 w-px -translate-x-1/2 bg-border" />
                ) : null}
                <span
                  className={cn(
                    "relative flex size-8 shrink-0 items-center justify-center rounded-full",
                    last ? "bg-success-soft text-success" : "bg-info-soft text-info",
                  )}
                >
                  <Icon className="size-4" />
                </span>
                <span className={cn("text-sm", last && "font-semibold text-success")}>{row}</span>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
