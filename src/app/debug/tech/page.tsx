import { routes } from "@/config/routes";
import type { Metadata } from "next";
import { ArrowDown, ArrowRight, Folder } from "lucide-react";
import { DebugHeader } from "@/components/debug/debug-header";
import {
  CONVENTIONS,
  type Fact,
  type FlowStep,
  LAYERS,
  PATTERNS,
  QUALITY,
  READ_FLOW,
  RENDERING,
  SECURITY,
  SOLID,
  STACK,
  SWAP_POINTS,
  TREE,
  type TreeNode,
  WRITE_FLOW,
} from "@/content/debug-tech";

export const metadata: Metadata = {
  title: "Fiche technique",
  robots: { index: false, follow: false },
};

const SECTIONS = [
  { id: "stack", label: "Stack" },
  { id: "decoupage", label: "Découpage" },
  { id: "couches", label: "Couches" },
  { id: "flux", label: "Flux" },
  { id: "solid", label: "SOLID" },
  { id: "patterns", label: "Patterns" },
  { id: "rendu", label: "Rendu et cache" },
  { id: "securite", label: "Sécurité" },
  { id: "qualite", label: "Qualité" },
  { id: "conventions", label: "Conventions" },
  { id: "branchement", label: "Branchement" },
];

function Section({
  id,
  title,
  intro,
  children,
}: {
  id: string;
  title: string;
  intro?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-6 space-y-4">
      <div className="space-y-1">
        <h2 id={`${id}-title`} className="text-2xl font-bold tracking-tight">
          {title}
        </h2>
        {intro ? <p className="max-w-3xl text-muted-foreground">{intro}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Path({ children }: { children: React.ReactNode }) {
  return <code className="font-mono text-xs break-words text-muted-foreground">{children}</code>;
}

function TreeList({ nodes, nested }: { nodes: TreeNode[]; nested?: boolean }) {
  return (
    <ul className={nested ? "mt-2 space-y-2 border-l pl-4" : "space-y-3"}>
      {nodes.map((n) => (
        <li key={n.path}>
          <div
            className={
              nested
                ? "grid gap-1 md:grid-cols-[calc(15rem-1px)_minmax(0,1fr)] md:gap-4"
                : "grid gap-1 md:grid-cols-[16rem_minmax(0,1fr)] md:gap-4"
            }
          >
            <span className="flex items-center gap-2 font-mono text-sm font-medium">
              <Folder aria-hidden className="size-4 shrink-0 text-brand" />
              {n.path}
            </span>
            <span className="text-sm text-muted-foreground">{n.role}</span>
          </div>
          {n.children ? <TreeList nodes={n.children} nested /> : null}
        </li>
      ))}
    </ul>
  );
}

function Flow({ title, steps }: { title: string; steps: FlowStep[] }) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <h3 className="mb-4 font-semibold">{title}</h3>
      <ol className="space-y-1">
        {steps.map((s, i) => (
          <li key={s.label}>
            <div className="rounded-lg bg-secondary/60 p-3">
              <p className="text-sm font-medium">
                <span className="num mr-2 text-muted-foreground">{i + 1}.</span>
                {s.label}
              </p>
              <p className="text-sm text-muted-foreground">{s.detail}</p>
              <Path>{s.where}</Path>
            </div>
            {i < steps.length - 1 ? (
              <ArrowDown aria-hidden className="mx-auto my-1 size-4 text-muted-foreground" />
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}

function FactGrid({ facts }: { facts: Fact[] }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {facts.map((f) => (
        <li key={f.title} className="space-y-1 rounded-xl border bg-card p-4">
          <p className="font-medium">{f.title}</p>
          <p className="text-sm text-muted-foreground">{f.detail}</p>
          <Path>{f.where}</Path>
        </li>
      ))}
    </ul>
  );
}

/** Fiche technique : la stack, le découpage du code et l'architecture telle qu'elle est. */
export default function DebugTechPage() {
  return (
    <div className="min-h-dvh bg-background">
      <DebugHeader current={routes.debug.tech} />
      <main className="mx-auto max-w-6xl space-y-12 px-4 py-8 sm:px-6">
        <section aria-labelledby="intro-title" className="rounded-2xl border bg-card p-6">
          <h1 id="intro-title" className="text-2xl font-bold tracking-tight">
            Fiche technique
          </h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            Application Next.js de devis et de facturation pour le BTP, organisée en ports et
            adaptateurs : un domaine pur et testé au centre, des services qui orchestrent les cas
            d&apos;usage, et des implémentations (données en mémoire, plateforme agréée simulée)
            interchangeables depuis une racine de composition unique.
          </p>
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

        <Section id="stack" title="Stack technique">
          <div className="grid gap-4 md:grid-cols-2">
            {STACK.map((g) => (
              <div key={g.title} className="overflow-hidden rounded-xl border bg-card">
                <h3 className="border-b bg-secondary/60 px-4 py-2.5 text-sm font-semibold">
                  {g.title}
                </h3>
                <ul className="divide-y">
                  {g.items.map((s) => (
                    <li key={s.name} className="space-y-0.5 px-4 py-3">
                      <p className="flex flex-wrap items-baseline gap-x-2">
                        <span className="font-medium">{s.name}</span>
                        {s.version ? (
                          <span className="font-mono text-xs text-muted-foreground">
                            {s.version}
                          </span>
                        ) : null}
                      </p>
                      <p className="text-sm text-muted-foreground">{s.role}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>

        <Section
          id="decoupage"
          title="Découpage du code"
          intro={
            <>
              Contenu de <Path>src/</Path>. Les routes restent minces : le code d&apos;une
              fonctionnalité vit dans <Path>features/</Path>, la logique dans <Path>services/</Path>{" "}
              et <Path>domain/</Path>.
            </>
          }
        >
          <div className="rounded-xl border bg-card p-5">
            <TreeList nodes={TREE} />
          </div>
        </Section>

        <Section
          id="couches"
          title="Couches et sens des dépendances"
          intro="Chaque couche ne dépend que de celles du dessous. Les règles marquées ESLint sont vérifiées à chaque lint et en CI."
        >
          <ol className="space-y-1" aria-label="Couches, de l'interface vers les adaptateurs">
            {LAYERS.map((l, i) => (
              <li key={l.name}>
                <div className="grid gap-2 rounded-xl border bg-card p-4 md:grid-cols-[12rem_minmax(0,1fr)_minmax(0,1fr)] md:gap-4">
                  <div>
                    <p className="font-semibold">
                      <span className="num mr-2 text-muted-foreground">{i + 1}.</span>
                      {l.name}
                    </p>
                    <Path>{l.path}</Path>
                  </div>
                  <p className="text-sm text-muted-foreground">{l.role}</p>
                  <p className="text-sm">{l.rule}</p>
                </div>
                {i < LAYERS.length - 1 ? (
                  <ArrowDown aria-hidden className="mx-auto my-1 size-4 text-muted-foreground" />
                ) : null}
              </li>
            ))}
          </ol>
        </Section>

        <Section id="flux" title="Flux d'une requête">
          <div className="grid gap-4 md:grid-cols-2">
            <Flow title="Lecture : afficher une page" steps={READ_FLOW} />
            <Flow title="Écriture : soumettre un formulaire" steps={WRITE_FLOW} />
          </div>
        </Section>

        <Section id="solid" title="SOLID dans le projet">
          <ul className="space-y-3">
            {SOLID.map((s) => (
              <li
                key={s.letter}
                className="grid gap-4 rounded-xl border bg-card p-5 md:grid-cols-[14rem_minmax(0,1fr)]"
              >
                <div className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-lg font-bold text-primary-foreground"
                  >
                    {s.letter}
                  </span>
                  <div>
                    <p className="font-semibold">{s.name}</p>
                    <p className="text-sm text-muted-foreground">{s.principle}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm">{s.inProject}</p>
                  <Path>{s.where}</Path>
                </div>
              </li>
            ))}
          </ul>
        </Section>

        <Section id="patterns" title="Patterns de code">
          <div className="overflow-hidden rounded-xl border bg-card">
            <ul className="divide-y">
              {PATTERNS.map((p) => (
                <li
                  key={p.name}
                  className="grid gap-1 p-4 md:grid-cols-[16rem_14rem_minmax(0,1fr)] md:gap-4"
                >
                  <p className="font-medium">{p.name}</p>
                  <Path>{p.where}</Path>
                  <p className="text-sm text-muted-foreground">{p.what}</p>
                </li>
              ))}
            </ul>
          </div>
        </Section>

        <Section
          id="rendu"
          title="Rendu et cache"
          intro="Cache Components et prérendu partiel sont activés : ce qui ne dépend pas de la requête est statique, le reste arrive en streaming."
        >
          <div className="overflow-hidden rounded-xl border bg-card">
            <ul className="divide-y">
              {RENDERING.map((r) => (
                <li
                  key={r.zone}
                  className="grid gap-1 p-4 md:grid-cols-[16rem_12rem_minmax(0,1fr)] md:gap-4"
                >
                  <p className="font-medium">{r.zone}</p>
                  <p className="font-mono text-sm text-brand">{r.mode}</p>
                  <p className="text-sm text-muted-foreground">{r.detail}</p>
                </li>
              ))}
            </ul>
          </div>
        </Section>

        <Section id="securite" title="Sécurité">
          <FactGrid facts={SECURITY} />
        </Section>

        <Section id="qualite" title="Qualité et tests">
          <FactGrid facts={QUALITY} />
        </Section>

        <Section id="conventions" title="Conventions">
          <FactGrid facts={CONVENTIONS} />
        </Section>

        <Section
          id="branchement"
          title="Points de branchement"
          intro="Passer du prototype à la production remplace des implémentations, sans modifier les services ni les pages."
        >
          <ul className="space-y-2">
            {SWAP_POINTS.map((s) => (
              <li
                key={s.what}
                className="grid gap-1 rounded-xl border bg-card p-4 md:grid-cols-[12rem_minmax(0,1fr)] md:gap-4"
              >
                <p className="flex items-center gap-2 font-medium">
                  <ArrowRight aria-hidden className="size-4 text-brand" />
                  {s.what}
                </p>
                <p className="text-sm text-muted-foreground">{s.how}</p>
              </li>
            ))}
          </ul>
        </Section>
      </main>
    </div>
  );
}
