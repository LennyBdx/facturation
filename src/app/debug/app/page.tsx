import Link from "next/link";
import type { Metadata } from "next";
import { CircleCheck, CircleDashed, ExternalLink, FlaskConical } from "lucide-react";
import { ToneBadge } from "@/components/status/status-badge";
import type { Tone } from "@/components/status/status-config";
import { APP_NAME } from "@/config/app";
import { AREAS, type FeatureItem, type FeatureStatus } from "@/content/debug-features";

export const metadata: Metadata = {
  title: "Suivi des fonctionnalités",
  robots: { index: false, follow: false },
};

const STATUS: Record<FeatureStatus, { label: string; tone: Tone; icon: typeof CircleCheck; bar: string }> = {
  done: { label: "Fait", tone: "success", icon: CircleCheck, bar: "bg-success" },
  mock: { label: "Simulé", tone: "info", icon: FlaskConical, bar: "bg-info" },
  todo: { label: "À faire", tone: "neutral", icon: CircleDashed, bar: "bg-border" },
};

function count(items: FeatureItem[]) {
  const c = { done: 0, mock: 0, todo: 0 };
  for (const i of items) c[i.status] += 1;
  return { ...c, total: items.length };
}

function ProgressBar({ c, label }: { c: ReturnType<typeof count>; label: string }) {
  const pct = (n: number) => (c.total ? (n / c.total) * 100 : 0);
  return (
    <div
      role="img"
      aria-label={`${label} : ${c.done} fait, ${c.mock} simulé, ${c.todo} à faire sur ${c.total}`}
      className="flex h-2.5 w-full overflow-hidden rounded-full bg-secondary"
    >
      <span className={STATUS.done.bar} style={{ width: `${pct(c.done)}%` }} />
      <span className={STATUS.mock.bar} style={{ width: `${pct(c.mock)}%` }} />
    </div>
  );
}

/** Page de suivi interne : fonctionnalités par page, avec leur état. Non indexée. */
export default function DebugAppPage() {
  const all = AREAS.flatMap((a) => a.pages.flatMap((p) => p.features));
  const total = count(all);
  const pct = (n: number) => Math.round((n / total.total) * 100);

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2 font-semibold">
            <span aria-hidden className="flex size-8 items-center justify-center rounded-md bg-primary">
              <span className="size-3 rotate-45 rounded-[2px] bg-brand" />
            </span>
            {APP_NAME} · suivi du projet
          </div>
          <nav aria-label="Accès rapides" className="flex gap-4 text-sm">
            <Link href="/" className="text-primary underline-offset-4 hover:underline">
              Site vitrine
            </Link>
            <Link href="/app" className="text-primary underline-offset-4 hover:underline">
              Application
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
        <section aria-labelledby="global-title" className="rounded-2xl border bg-card p-6">
          <h1 id="global-title" className="text-2xl font-bold tracking-tight">
            Fonctionnalités par page
          </h1>
          <p className="mt-1 text-muted-foreground">
            Inventaire tenu dans <code className="rounded bg-secondary px-1 font-mono text-sm">src/content/debug-features.ts</code>. « Simulé » : présent et
            cliquable, mais sans back-end ni service externe réel.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="num text-3xl font-semibold">{total.total}</p>
            </div>
            {(["done", "mock", "todo"] as const).map((s) => (
              <div key={s}>
                <p className="text-sm text-muted-foreground">{STATUS[s].label}</p>
                <p className="num text-3xl font-semibold">
                  {total[s]} <span className="text-base font-normal text-muted-foreground">({pct(total[s])} %)</span>
                </p>
              </div>
            ))}
          </div>
          <div className="mt-5">
            <ProgressBar c={total} label="Avancement global" />
          </div>
          <ul className="mt-3 flex flex-wrap gap-3 text-sm text-muted-foreground" aria-label="Légende">
            {(["done", "mock", "todo"] as const).map((s) => (
              <li key={s} className="flex items-center gap-1.5">
                <span aria-hidden className={`size-3 rounded-full ${STATUS[s].bar}`} />
                {STATUS[s].label}
              </li>
            ))}
          </ul>
        </section>

        <nav aria-label="Zones" className="flex flex-wrap gap-2">
          {AREAS.map((a) => (
            <a key={a.id} href={`#${a.id}`} className="inline-flex min-h-9 items-center rounded-full border bg-card px-3 text-sm hover:bg-secondary">
              {a.title}
            </a>
          ))}
        </nav>

        {AREAS.map((area) => {
          const c = count(area.pages.flatMap((p) => p.features));
          return (
            <section key={area.id} id={area.id} aria-labelledby={`${area.id}-title`} className="scroll-mt-6 rounded-2xl border bg-card">
              <div className="flex flex-col gap-3 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
                <h2 id={`${area.id}-title`} className="text-xl font-semibold">
                  {area.title}
                </h2>
                <div className="w-full space-y-1 sm:w-72">
                  <ProgressBar c={c} label={area.title} />
                  <p className="num text-right text-xs text-muted-foreground">
                    {c.done} fait · {c.mock} simulé · {c.todo} à faire
                  </p>
                </div>
              </div>
              <div className="divide-y">
                {area.pages.map((p) => {
                  const href = p.href ?? (p.route.startsWith("/") && !p.route.includes("[") ? p.route : null);
                  return (
                    <div key={p.page + p.route} className="grid gap-3 p-5 md:grid-cols-[16rem_minmax(0,1fr)]">
                      <div>
                        <p className="font-medium">{p.page}</p>
                        {href ? (
                          <Link href={href} className="inline-flex items-center gap-1 font-mono text-sm text-primary underline-offset-4 hover:underline">
                            {p.route}
                            <ExternalLink aria-hidden className="size-3" />
                          </Link>
                        ) : (
                          <p className="font-mono text-sm text-muted-foreground">{p.route}</p>
                        )}
                      </div>
                      <ul className="space-y-2">
                        {p.features.map((f) => {
                          const s = STATUS[f.status];
                          return (
                            <li key={f.label} className="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-3">
                              <ToneBadge tone={s.tone} icon={s.icon} className="w-fit sm:min-w-[5.75rem] sm:justify-center">
                                {s.label}
                              </ToneBadge>
                              <span className="text-sm">
                                {f.label}
                                {f.note ? <span className="text-muted-foreground"> — {f.note}</span> : null}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
}
