import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { type Page, pageWindow } from "@/lib/pagination";
import { cn } from "@/lib/utils";

const itemClass =
  "inline-flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-md px-3 text-sm md:min-h-9 md:min-w-9";

/**
 * Pagination d'une liste, en liens (?page=N) : sans JavaScript, partageable, compatible
 * avec le bouton retour. Conserve la recherche et le filtre en cours.
 */
export function ListPagination({
  pagination,
  pathname,
  query,
  label = "éléments",
}: {
  pagination: Pick<Page<unknown>, "page" | "pageCount" | "total" | "from" | "to">;
  pathname: string;
  /** Paramètres courants de l'URL à conserver (recherche, filtre…). */
  query: Record<string, string | undefined>;
  /** Nom des éléments au pluriel, pour le récapitulatif (« 21–40 sur 45 factures »). */
  label?: string;
}) {
  const { page, pageCount, total, from, to } = pagination;
  if (total === 0) return null;

  const href = (p: number) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) if (v && k !== "page") params.set(k, v);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  return (
    <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
      <p className="num text-sm text-muted-foreground" aria-live="polite">
        {pageCount > 1 ? `${from}–${to} sur ${total} ${label}` : `${total} ${label}`}
      </p>
      {pageCount > 1 ? (
        <nav aria-label="Pagination">
          <ul className="flex items-center gap-1">
            <li>
              <PageLink href={page > 1 ? href(page - 1) : null} label="Page précédente">
                <ChevronLeft aria-hidden className="size-4" />
                <span className="hidden sm:inline">Précédent</span>
              </PageLink>
            </li>
            {/* Mobile : position seule ; à partir de 640 px : numéros de page. */}
            <li className="num px-2 text-sm sm:hidden">
              {page} / {pageCount}
            </li>
            {pageWindow(page, pageCount).map((p, i) =>
              p === null ? (
                <li
                  key={`gap-${i}`}
                  aria-hidden
                  className="hidden px-1 text-muted-foreground sm:block"
                >
                  …
                </li>
              ) : (
                <li key={p} className="hidden sm:block">
                  {p === page ? (
                    <span
                      aria-current="page"
                      className={cn(
                        itemClass,
                        "num bg-primary font-medium text-primary-foreground",
                      )}
                    >
                      <span className="sr-only">Page </span>
                      {p}
                    </span>
                  ) : (
                    <Link
                      href={href(p)}
                      className={cn(itemClass, "num border bg-card hover:bg-secondary")}
                    >
                      <span className="sr-only">Page </span>
                      {p}
                    </Link>
                  )}
                </li>
              ),
            )}
            <li>
              <PageLink href={page < pageCount ? href(page + 1) : null} label="Page suivante">
                <span className="hidden sm:inline">Suivant</span>
                <ChevronRight aria-hidden className="size-4" />
              </PageLink>
            </li>
          </ul>
        </nav>
      ) : null}
    </div>
  );
}

function PageLink({
  href,
  label,
  children,
}: {
  href: string | null;
  label: string;
  children: React.ReactNode;
}) {
  if (!href) {
    return (
      <span
        aria-disabled="true"
        aria-label={label}
        className={cn(itemClass, "border text-muted-foreground opacity-50")}
      >
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      aria-label={label}
      className={cn(itemClass, "border bg-card hover:bg-secondary")}
    >
      {children}
    </Link>
  );
}
