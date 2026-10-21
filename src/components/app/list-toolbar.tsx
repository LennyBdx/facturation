"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Download, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface FilterOption {
  value: string;
  label: string;
}

/**
 * Barre de recherche + filtre, synchronisée avec l'URL (?q=…&filtre=…) : la liste
 * filtrée est partageable et le bouton retour du navigateur fonctionne. Toute nouvelle
 * recherche ou tout changement de filtre revient à la première page.
 */
export function ListToolbar({
  searchPlaceholder,
  searchLabel,
  filterLabel,
  filterOptions,
  filterParam = "filtre",
  sortOptions,
  sortValue,
  exportHref,
}: {
  searchPlaceholder: string;
  searchLabel: string;
  filterLabel?: string;
  filterOptions?: FilterOption[];
  filterParam?: string;
  /** Choix du tri sur mobile (sur ordinateur, on trie en cliquant les en-têtes). */
  sortOptions?: FilterOption[];
  /** Tri courant (valeur de `tri`, y compris le tri par défaut). */
  sortValue?: string;
  /** Route d'export CSV : la recherche, le filtre et le tri courants y sont transmis. */
  exportHref?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState(params.get("q") ?? "");

  useEffect(() => {
    if (query === (params.get("q") ?? "")) return;
    const t = setTimeout(() => {
      const next = new URLSearchParams(params.toString());
      next.delete("page");
      if (query) next.set("q", query);
      else next.delete("q");
      startTransition(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }));
    }, 250);
    return () => clearTimeout(t);
  }, [query, params, pathname, router]);

  const setFilter = (value: string) => {
    const next = new URLSearchParams(params.toString());
    next.delete("page");
    if (value && value !== "tous") next.set(filterParam, value);
    else next.delete(filterParam);
    startTransition(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }));
  };

  const setSort = (value: string) => {
    const next = new URLSearchParams(params.toString());
    next.delete("page");
    next.set("tri", value);
    startTransition(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }));
  };

  const exportQuery = new URLSearchParams(params.toString());
  exportQuery.delete("page");
  const exportUrl = exportHref
    ? `${exportHref}${exportQuery.size ? `?${exportQuery.toString()}` : ""}`
    : null;

  return (
    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap md:flex-nowrap">
      <div className="relative flex-1">
        <label htmlFor="list-search" className="sr-only">
          {searchLabel}
        </label>
        <Search
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          id="list-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchPlaceholder}
          className="pl-9"
          autoComplete="off"
        />
        {pending ? (
          <Loader2
            aria-label="Chargement"
            className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
          />
        ) : null}
      </div>
      {filterOptions ? (
        <Select value={params.get(filterParam) ?? "tous"} onValueChange={setFilter}>
          <SelectTrigger aria-label={filterLabel} className="w-full sm:w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tous">{filterLabel ? `${filterLabel} : tous` : "Tous"}</SelectItem>
            {filterOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
      {sortOptions && sortValue ? (
        <Select value={sortValue} onValueChange={setSort}>
          <SelectTrigger aria-label="Trier" className="w-full sm:w-64 md:hidden">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
      {exportUrl ? (
        <Button asChild variant="outline" className="sm:shrink-0">
          <a href={exportUrl} download>
            <Download aria-hidden />
            Exporter (CSV)
          </a>
        </Button>
      ) : null}
    </div>
  );
}
