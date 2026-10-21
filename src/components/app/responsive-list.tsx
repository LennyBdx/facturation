import Link from "next/link";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type Sort, type SortDir, toggleSort } from "@/lib/sorting";
import { cn } from "@/lib/utils";

export interface Column<T> {
  header: string;
  cell: (row: T) => React.ReactNode;
  align?: "left" | "right";
  className?: string;
  /** Clé de tri (paramètre `tri`) : rend l'en-tête cliquable. */
  sortKey?: string;
  /** Sens au premier clic (décroissant pour les montants et dates, en général). */
  sortFirstDir?: SortDir;
}

export interface ListSort {
  current: Sort;
  /** URL de la liste triée selon `sort`. */
  href: (sort: Sort) => string;
}

export interface MobileCard {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  amount?: React.ReactNode;
  meta?: React.ReactNode;
}

/**
 * Liste de données responsive (règle du skill : pas de défilement horizontal sur mobile).
 * - ≥ 768 px : tableau sémantique, montants alignés à droite ;
 * - < 768 px : cartes à deux niveaux (titre + montant, puis métadonnées et statuts).
 * Chaque ligne est un lien vers la fiche. Avec `sort`, les en-têtes des colonnes
 * ayant une `sortKey` deviennent des liens de tri (aria-sort sur l'en-tête actif).
 */
export function ResponsiveList<T>({
  rows,
  columns,
  mobile,
  href,
  getKey,
  caption,
  sort,
}: {
  rows: readonly T[];
  columns: Column<T>[];
  mobile: (row: T) => MobileCard;
  href: (row: T) => string;
  getKey: (row: T) => string;
  caption: string;
  sort?: ListSort;
}) {
  return (
    <>
      <div className="hidden overflow-hidden rounded-lg border bg-card md:block">
        <Table>
          <caption className="sr-only">{caption}</caption>
          <TableHeader className="bg-secondary/60">
            <TableRow>
              {columns.map((c) => (
                <TableHead
                  key={c.header}
                  scope="col"
                  aria-sort={
                    sort && c.sortKey && sort.current.key === c.sortKey
                      ? sort.current.dir === "asc"
                        ? "ascending"
                        : "descending"
                      : undefined
                  }
                  className={cn(
                    "h-10 text-muted-foreground",
                    c.align === "right" && "text-right",
                    c.className,
                  )}
                >
                  {sort && c.sortKey ? (
                    <SortLink column={c} sort={sort} sortKey={c.sortKey} />
                  ) : (
                    c.header
                  )}
                </TableHead>
              ))}
              <TableHead className="w-8">
                <span className="sr-only">Ouvrir</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={getKey(row)} className="group relative">
                {columns.map((c, i) => (
                  <TableCell
                    key={c.header}
                    className={cn("py-3", c.align === "right" && "num text-right", c.className)}
                  >
                    {i === 0 ? (
                      <Link href={href(row)} className="font-medium after:absolute after:inset-0">
                        {c.cell(row)}
                      </Link>
                    ) : (
                      c.cell(row)
                    )}
                  </TableCell>
                ))}
                <TableCell className="text-muted-foreground">
                  <ChevronRight
                    aria-hidden
                    className="size-4 transition-transform group-hover:translate-x-0.5"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ul className="space-y-2 md:hidden" aria-label={caption}>
        {rows.map((row) => {
          const card = mobile(row);
          return (
            <li key={getKey(row)}>
              <Link
                href={href(row)}
                className="flex min-h-11 flex-col gap-2 rounded-lg border bg-card p-4 active:bg-accent/50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{card.title}</div>
                    {card.subtitle ? (
                      <div className="truncate text-sm text-muted-foreground">{card.subtitle}</div>
                    ) : null}
                  </div>
                  {card.amount ? (
                    <div className="num shrink-0 text-right font-semibold">{card.amount}</div>
                  ) : null}
                </div>
                {card.meta ? (
                  <div className="flex flex-wrap items-center gap-2">{card.meta}</div>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function SortLink<T>({
  column,
  sort,
  sortKey,
}: {
  column: Column<T>;
  sort: ListSort;
  sortKey: string;
}) {
  const active = sort.current.key === sortKey;
  const Icon = !active ? ArrowUpDown : sort.current.dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <Link
      href={sort.href(toggleSort(sort.current, sortKey, column.sortFirstDir))}
      scroll={false}
      className={cn(
        "-mx-2 inline-flex min-h-9 items-center gap-1 rounded-md px-2 hover:bg-secondary hover:text-foreground",
        column.align === "right" && "flex-row-reverse",
        active && "text-foreground",
      )}
    >
      {column.header}
      <Icon aria-hidden className={cn("size-3.5", !active && "opacity-50")} />
      <span className="sr-only">
        {active
          ? sort.current.dir === "asc"
            ? " (tri croissant, cliquer pour inverser)"
            : " (tri décroissant, cliquer pour inverser)"
          : " (trier)"}
      </span>
    </Link>
  );
}
