import { LIFECYCLE_STATUS, TONE_CLASSES } from "@/components/status/status-config";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { LifecycleEvent } from "@/data/types";

const ACTOR_LABELS: Record<LifecycleEvent["actor"], string> = {
  platform: "Plateforme agréée",
  buyer: "Client",
  seller: "Votre entreprise",
  administration: "Administration fiscale",
};

/** Frise chronologique du cycle de vie d'une facture électronique (plus récent en haut). */
export function LifecycleTimeline({
  events,
  actorLabels = ACTOR_LABELS,
}: {
  events: LifecycleEvent[];
  actorLabels?: Record<LifecycleEvent["actor"], string>;
}) {
  const ordered = [...events].sort((a, b) => b.at.localeCompare(a.at));
  return (
    <ol className="relative space-y-4" aria-label="Historique du cycle de vie">
      {ordered.map((e, i) => {
        const s = LIFECYCLE_STATUS[e.status];
        const Icon = s.icon;
        return (
          <li key={e.id} className="relative flex gap-3">
            {i < ordered.length - 1 ? (
              <span aria-hidden className="absolute top-8 -bottom-4 left-[0.9375rem] w-px bg-border" />
            ) : null}
            <span
              className={cn(
                "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border",
                TONE_CLASSES[s.tone],
              )}
            >
              <Icon aria-hidden className="size-4" />
            </span>
            <div className="min-w-0 pt-1">
              <p className="font-medium">
                {s.label} <span className="num text-xs font-normal text-muted-foreground">· {s.code}</span>
                {s.mandatory ? <span className="ml-1 text-xs font-normal text-muted-foreground">(statut obligatoire)</span> : null}
              </p>
              <p className="text-sm text-muted-foreground">
                {formatDateTime(e.at)} — {actorLabels[e.actor]}
              </p>
              {e.comment ? <p className="mt-1 rounded-md bg-secondary px-2 py-1 text-sm">{e.comment}</p> : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
