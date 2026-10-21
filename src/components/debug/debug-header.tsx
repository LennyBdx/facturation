import { routes } from "@/config/routes";
import Link from "next/link";
import { APP_NAME } from "@/config/app";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: routes.debug.features, label: "Fonctionnalités" },
  { href: routes.debug.tech, label: "Technique" },
  { href: routes.home, label: "Site vitrine" },
  { href: routes.app, label: "Application" },
];

/** En-tête commun aux pages de suivi interne (/debug/*). */
export function DebugHeader({ current }: { current: string }) {
  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-2 font-semibold">
          <span aria-hidden className="flex size-8 items-center justify-center rounded-md bg-primary">
            <span className="size-3 rotate-45 rounded-[2px] bg-brand" />
          </span>
          {APP_NAME} · suivi du projet
        </div>
        <nav aria-label="Pages de suivi" className="flex flex-wrap gap-1 text-sm">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={l.href === current ? "page" : undefined}
              className={cn(
                "inline-flex min-h-9 items-center rounded-full px-3",
                l.href === current ? "bg-accent font-medium text-accent-foreground" : "text-primary hover:bg-secondary",
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
