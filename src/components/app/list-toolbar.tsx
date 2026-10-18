"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface FilterOption {
  value: string;
  label: string;
}

/**
 * Barre de recherche + filtre, synchronisée avec l'URL (?q=…&filtre=…) : la liste
 * filtrée est partageable et le bouton retour du navigateur fonctionne.
 */
export function ListToolbar({
  searchPlaceholder,
  searchLabel,
  filterLabel,
  filterOptions,
  filterParam = "filtre",
}: {
  searchPlaceholder: string;
  searchLabel: string;
  filterLabel?: string;
  filterOptions?: FilterOption[];
  filterParam?: string;
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
      if (query) next.set("q", query);
      else next.delete("q");
      startTransition(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }));
    }, 250);
    return () => clearTimeout(t);
  }, [query, params, pathname, router]);

  const setFilter = (value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value && value !== "tous") next.set(filterParam, value);
    else next.delete(filterParam);
    startTransition(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }));
  };

  return (
    <div className="mb-4 flex flex-col gap-2 sm:flex-row">
      <div className="relative flex-1">
        <label htmlFor="list-search" className="sr-only">
          {searchLabel}
        </label>
        <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
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
          <Loader2 aria-label="Chargement" className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
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
    </div>
  );
}
