"use client";

import { routes } from "@/config/routes";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export const SETTINGS_SECTIONS = [
  { href: routes.settings.company, label: "Entreprise" },
  { href: routes.settings.numbering, label: "Numérotation et conditions" },
  { href: routes.settings.documents, label: "Personnalisation" },
  { href: routes.settings.eInvoicing, label: "Facture électronique" },
  { href: routes.settings.subscription, label: "Abonnement" },
  { href: routes.settings.accountant, label: "Expert-comptable" },
  { href: routes.settings.account, label: "Mon compte" },
];

/** Sous-navigation des paramètres : liste verticale (bureau), défilement horizontal de puces (mobile). */
export function SettingsNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Sections des paramètres"
      className="-mx-4 overflow-x-auto px-4 md:mx-0 md:overflow-visible md:px-0"
    >
      <ul className="flex gap-1 md:flex-col">
        {SETTINGS_SECTIONS.map((s) => {
          const active = pathname === s.href;
          return (
            <li key={s.href} className="shrink-0">
              <Link
                href={s.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center rounded-md px-3 text-sm whitespace-nowrap md:min-h-9",
                  active
                    ? "bg-accent font-medium text-accent-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                {s.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
