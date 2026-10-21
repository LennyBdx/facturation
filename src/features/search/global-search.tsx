"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore, useTransition } from "react";
import { FileText, HardHat, Inbox, Loader2, Receipt, Search, Users } from "lucide-react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { routes } from "@/config/routes";
import type { SearchResult, SearchResultType } from "@/services/search";
import { searchAction } from "./actions";

const GROUPS: Record<
  SearchResultType,
  { label: string; icon: typeof Users; href: (id: string) => string }
> = {
  client: { label: "Clients", icon: Users, href: routes.clients.show },
  worksite: { label: "Chantiers", icon: HardHat, href: routes.worksites.show },
  quote: { label: "Devis", icon: FileText, href: routes.quotes.show },
  invoice: { label: "Factures émises", icon: Receipt, href: routes.invoices.show },
  received: { label: "Factures reçues", icon: Inbox, href: routes.received.show },
};

const ORDER = Object.keys(GROUPS) as SearchResultType[];

const noopSubscribe = () => () => {};

/** Recherche globale : bouton dans l'en-tête et raccourci ⌘K / Ctrl+K. */
export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [pending, startTransition] = useTransition();
  const latest = useRef(0);
  // Raccourci affiché selon le système ; « Ctrl K » au rendu serveur.
  const isMac = useSyncExternalStore(
    noopSubscribe,
    () => /Mac|iPhone|iPad/.test(navigator.userAgent),
    () => false,
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) return;
    const id = ++latest.current;
    const t = setTimeout(() => {
      startTransition(async () => {
        const r = await searchAction(query);
        // Ignore une réponse arrivée après une saisie plus récente.
        if (id === latest.current) setResults(r.ok ? (r.data ?? []) : []);
      });
    }, 200);
    return () => clearTimeout(t);
  }, [query]);

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setQuery("");
      setResults([]);
    }
  };

  const go = (r: SearchResult) => {
    onOpenChange(false);
    router.push(GROUPS[r.type].href(r.id));
  };

  const searching = query.trim().length >= 2;
  const visible = searching ? results : [];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-keyshortcuts="Meta+K Control+K"
        className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-md border bg-card px-3 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground md:min-h-9 md:w-64 md:justify-start"
      >
        <Search aria-hidden className="size-4" />
        <span className="sr-only md:not-sr-only">Rechercher…</span>
        <kbd className="ml-auto hidden rounded border bg-secondary px-1.5 font-mono text-[11px] md:inline">
          {isMac ? "⌘K" : "Ctrl K"}
        </kbd>
      </button>
      <CommandDialog
        open={open}
        onOpenChange={onOpenChange}
        title="Recherche globale"
        description="Clients, chantiers, devis et factures"
      >
        <Command shouldFilter={false}>
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder="Client, chantier, numéro de devis ou de facture…"
          />
          <CommandList>
            {!searching ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                Tapez au moins 2 caractères.
              </p>
            ) : pending && visible.length === 0 ? (
              <p className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 aria-hidden className="size-4 animate-spin" />
                Recherche…
              </p>
            ) : (
              <CommandEmpty>Aucun résultat pour « {query.trim()} ».</CommandEmpty>
            )}
            {ORDER.map((type) => {
              const items = visible.filter((r) => r.type === type);
              if (items.length === 0) return null;
              const { label, icon: Icon } = GROUPS[type];
              return (
                <CommandGroup key={type} heading={label}>
                  {items.map((r) => (
                    <CommandItem key={r.id} value={`${type}-${r.id}`} onSelect={() => go(r)}>
                      <Icon aria-hidden className="text-muted-foreground" />
                      <span className="min-w-0">
                        <span className="block truncate">{r.title}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {r.subtitle}
                        </span>
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              );
            })}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
