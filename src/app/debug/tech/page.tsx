import { routes } from "@/config/routes";
import type { Metadata } from "next";
import { ArrowDown, CircleCheck, CircleDashed, CircleDot } from "lucide-react";
import { DebugHeader } from "@/components/debug/debug-header";
import { ToneBadge } from "@/components/status/status-badge";
import type { Tone } from "@/components/status/status-config";
import {
  LAYERS,
  PATTERNS,
  type PracticeStatus,
  PRACTICES,
  SOLID,
  STACK,
} from "@/content/debug-tech";

export const metadata: Metadata = {
  title: "Technique et bonnes pratiques",
  robots: { index: false, follow: false },
};

const STATUS: Record<PracticeStatus, { label: string; tone: Tone; icon: typeof CircleCheck }> = {
  done: { label: "Appliqué", tone: "success", icon: CircleCheck },
  partial: { label: "Partiel", tone: "warning", icon: CircleDot },
  todo: { label: "À faire", tone: "neutral", icon: CircleDashed },
};

const COUNT_LABELS: Record<PracticeStatus, string> = {
  done: "appliquées",
  partial: "partielles",
  todo: "à faire",
};

const SECTIONS = [
  { id: "stack", label: "Stack" },
  { id: "architecture", label: "Architecture" },
  { id: "solid", label: "SOLID" },
  { id: "patterns", label: "Patterns" },
  { id: "pratiques", label: "Bonnes pratiques Next.js" },
];

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={`${id}-title`} className="text-2xl font-bold tracking-tight">
      {children}
    </h2>
  );
}

/** Page de suivi interne : architecture, SOLID, patterns et bonnes pratiques Next.js (appliquées ou à faire). */
export default function DebugTechPage() {
  const all = PRACTICES.flatMap((g) => g.items);
  const counts = { done: 0, partial: 0, todo: 0 };
  for (const p of all) counts[p.status] += 1;

  return (
    <div className="min-h-dvh bg-background">
      <DebugHeader current={routes.debug.tech} />
      <main className="mx-auto max-w-6xl space-y-10 px-4 py-8 sm:px-6">
        <section aria-labelledby="intro-title" className="rounded-2xl border bg-card p-6">
          <h1 id="intro-title" className="text-2xl font-bold tracking-tight">
            Technique du projet
          </h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            Comment le code est organisé, pourquoi, et ce qu&apos;il reste à appliquer pour un
            niveau de qualité « senior ». Contenu tenu dans{" "}
            <code className="rounded bg-secondary px-1 font-mono text-sm">
              src/content/debug-tech.ts
            </code>
            .
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            {(["done", "partial", "todo"] as const).map((s) => (
              <ToneBadge key={s} tone={STATUS[s].tone} icon={STATUS[s].icon}>
                {counts[s]} {COUNT_LABELS[s]}
              </ToneBadge>
            ))}
            <span className="text-sm text-muted-foreground">sur {all.length} bonnes pratiques</span>
          </div>
          <nav aria-label="Sections" className="mt-5 flex flex-wrap gap-2">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="inline-flex min-h-9 items-center rounded-full border bg-background px-3 text-sm hover:bg-secondary"
              >
                {s.label}
              </a>
            ))}
          </nav>
        </section>

        {/* --- Stack --- */}
        <section id="stack" aria-labelledby="stack-title" className="scroll-mt-6 space-y-4">
          <H2 id="stack">Stack en bref</H2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {STACK.map((s) => (
              <li key={s.name} className="rounded-xl border bg-card p-4">
                <p className="font-medium">{s.name}</p>
                <p className="text-sm text-muted-foreground">{s.role}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* --- Architecture --- */}
        <section
          id="architecture"
          aria-labelledby="architecture-title"
          className="scroll-mt-6 space-y-4"
        >
          <H2 id="architecture">Architecture cible (ports et adaptateurs)</H2>
          <p className="max-w-3xl text-muted-foreground">
            Les dépendances vont toujours vers le cœur : l&apos;interface appelle les actions, qui
            appellent les services, qui s&apos;appuient sur le domaine et sur des interfaces. Les
            implémentations (mémoire aujourd&apos;hui, PostgreSQL et plateforme réelle demain) se
            branchent par la racine de composition, sans modifier le reste.
          </p>
          <ol className="space-y-2" aria-label="Couches, de l'interface vers le cœur">
            {LAYERS.map((l, i) => (
              <li key={l.name}>
                <div
                  className={
                    i >= 4
                      ? "rounded-xl border border-dashed bg-card p-4"
                      : "rounded-xl border bg-card p-4"
                  }
                >
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                    <p className="font-semibold">
                      <span className="num mr-2 text-muted-foreground">{i + 1}.</span>
                      {l.name}
                    </p>
                    <code className="font-mono text-xs text-muted-foreground">{l.path}</code>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{l.role}</p>
                </div>
                {i < 3 ? (
                  <ArrowDown aria-hidden className="mx-auto my-1 size-4 text-muted-foreground" />
                ) : null}
              </li>
            ))}
          </ol>
        </section>

        {/* --- SOLID --- */}
        <section id="solid" aria-labelledby="solid-title" className="scroll-mt-6 space-y-4">
          <H2 id="solid">Principes SOLID dans le projet</H2>
          <ul className="space-y-3">
            {SOLID.map((s) => (
              <li
                key={s.letter}
                className="grid gap-4 rounded-xl border bg-card p-5 md:grid-cols-[12rem_minmax(0,1fr)_minmax(0,1fr)]"
              >
                <div className="flex items-center gap-3 md:block">
                  <span
                    aria-hidden
                    className="flex size-10 items-center justify-center rounded-lg bg-primary text-lg font-bold text-primary-foreground"
                  >
                    {s.letter}
                  </span>
                  <p className="font-semibold md:mt-2">{s.name}</p>
                </div>
                <div>
                  <p className="mb-1 text-xs font-semibold tracking-wide text-success uppercase">
                    Aujourd&apos;hui
                  </p>
                  <p className="text-sm">{s.now}</p>
                </div>
                <div>
                  <p className="mb-1 text-xs font-semibold tracking-wide text-brand uppercase">
                    Après correction
                  </p>
                  <p className="text-sm">{s.target}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* --- Patterns --- */}
        <section id="patterns" aria-labelledby="patterns-title" className="scroll-mt-6 space-y-4">
          <H2 id="patterns">Patterns de code utilisés</H2>
          <div className="overflow-hidden rounded-xl border bg-card">
            <ul className="divide-y">
              {PATTERNS.map((p) => (
                <li
                  key={p.name}
                  className="grid gap-1 p-4 md:grid-cols-[14rem_14rem_minmax(0,1fr)] md:gap-4"
                >
                  <p className="font-medium">{p.name}</p>
                  <code className="font-mono text-xs text-muted-foreground md:pt-1">{p.where}</code>
                  <p className="text-sm text-muted-foreground">{p.what}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* --- Bonnes pratiques --- */}
        <section id="pratiques" aria-labelledby="pratiques-title" className="scroll-mt-6 space-y-4">
          <H2 id="pratiques">Bonnes pratiques Next.js à appliquer</H2>
          {PRACTICES.map((g) => (
            <div key={g.id} className="overflow-hidden rounded-xl border bg-card">
              <h3 className="border-b bg-secondary/60 px-5 py-3 font-semibold">{g.title}</h3>
              <ul className="divide-y">
                {g.items.map((p) => {
                  const s = STATUS[p.status];
                  return (
                    <li key={p.title} className="grid gap-2 p-5 md:grid-cols-[7rem_minmax(0,1fr)]">
                      <ToneBadge
                        tone={s.tone}
                        icon={s.icon}
                        className="w-fit md:min-w-[6.5rem] md:justify-center"
                      >
                        {s.label}
                      </ToneBadge>
                      <div className="space-y-1">
                        <p className="font-medium">{p.title}</p>
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">Pourquoi : </span>
                          {p.why}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">Comment : </span>
                          {p.how}
                        </p>
                        {p.where ? (
                          <code className="block font-mono text-xs text-muted-foreground">
                            {p.where}
                          </code>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
