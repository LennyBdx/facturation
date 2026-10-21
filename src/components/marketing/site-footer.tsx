import Link from "next/link";
import { ExternalLink, ShieldCheck } from "lucide-react";
import { OFFICIAL_PLATFORMS_URL, PRODUCT_NAME } from "@/config/site";
import { footer, READY_LABEL } from "@/content/home";

export function SiteFooter() {
  return (
    <footer className="border-t bg-card">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.5fr_repeat(3,1fr)]">
        <div className="space-y-3">
          <p className="font-semibold">{PRODUCT_NAME}</p>
          <p className="max-w-xs text-sm text-muted-foreground">{footer.tagline}</p>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <ShieldCheck aria-hidden className="size-4 text-success" />
            {READY_LABEL}
          </p>
        </div>
        {footer.columns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <p className="mb-3 text-sm font-semibold">{col.title}</p>
            <ul className="space-y-1">
              {col.links.map((l) =>
                l.href === "OFFICIAL_PLATFORMS" ? (
                  <li key={l.label}>
                    <a
                      href={OFFICIAL_PLATFORMS_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 items-center gap-1 text-sm text-muted-foreground hover:text-foreground md:min-h-8"
                    >
                      {l.label}
                      <ExternalLink aria-hidden className="size-3.5" />
                      <span className="sr-only">(nouvel onglet, impots.gouv.fr)</span>
                    </a>
                  </li>
                ) : (
                  <li key={l.label}>
                    <Link href={l.href} className="inline-flex min-h-11 items-center text-sm text-muted-foreground hover:text-foreground md:min-h-8">
                      {l.label}
                    </Link>
                  </li>
                ),
              )}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t">
        <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-muted-foreground sm:px-6">
          © {new Date().getFullYear()} {PRODUCT_NAME}. Aucun cookie de suivi n&apos;est utilisé sur ce site.
        </p>
      </div>
    </footer>
  );
}
