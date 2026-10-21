"use client";

import { routes } from "@/config/routes";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";
import { ArrowDown, ArrowUp, ChevronDown, Copy, Ellipsis, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Amount } from "@/components/app/amount";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { UNITS } from "@/data/types";
import { parseDecimalInput } from "@/domain/money";
import { computeQuoteTotals, type Discount } from "@/domain/quote";
import { defaultCategoryForRate, formatVatRateLabel, REVERSE_CHARGE_MENTION, VAT_RATES } from "@/domain/vat";
import { cn } from "@/lib/utils";
import { saveQuote } from "./actions";
import { quoteSchema, type QuoteFormValues } from "./schemas";

type Section = QuoteFormValues["sections"][number];
type Line = Section["lines"][number];

const newId = () => crypto.randomUUID();
const emptyLine = (vatRate: Line["vatRate"]): Line => ({ id: newId(), description: "", quantity: "1", unit: "u", unitPrice: "", vatRate });

/** Libellé d'unité lisible. */
const UNIT_LABELS: Record<(typeof UNITS)[number], string> = {
  u: "u",
  m: "m",
  "m²": "m²",
  "m³": "m³",
  ml: "ml",
  h: "h",
  j: "jour",
  forfait: "forfait",
  "ens.": "ens.",
  kg: "kg",
  l: "l",
};

const nativeSelect =
  "h-11 w-full rounded-md border border-input bg-card px-2 text-base md:h-10 md:text-sm focus-visible:outline-2 focus-visible:outline-ring aria-invalid:border-destructive";

function toDomainNumber(v: string): string {
  return parseDecimalInput(v) ?? "0";
}

export function QuoteEditor({
  quoteId,
  number,
  initial,
  clients,
  worksites,
  defaultVatRate,
}: {
  quoteId: string | null;
  number?: string;
  initial: QuoteFormValues;
  clients: { id: string; name: string; kind: string }[];
  worksites: { id: string; name: string; clientId: string; reverseCharge: boolean }[];
  defaultVatRate: Line["vatRate"];
}) {
  const router = useRouter();
  const [values, setValues] = useState<QuoteFormValues>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [optionsOpen, setOptionsOpen] = useState(initial.discountKind !== "none" || initial.reverseCharge || initial.depositPercent !== "0");
  const [pending, startTransition] = useTransition();
  const descRefs = useRef(new Map<string, HTMLTextAreaElement | null>());

  const validate = (next: QuoteFormValues) => {
    const r = quoteSchema.safeParse(next);
    const out: Record<string, string> = {};
    if (!r.success) for (const i of r.error.issues) out[i.path.join(".")] ??= i.message;
    setErrors(out);
    return r.success;
  };

  const update = (fn: (draft: QuoteFormValues) => QuoteFormValues) => {
    setValues((prev) => {
      const next = fn(prev);
      if (submitted) validate(next);
      return next;
    });
  };
  const setField = <K extends keyof QuoteFormValues>(key: K, value: QuoteFormValues[K]) => update((v) => ({ ...v, [key]: value }));
  const setLine = (si: number, li: number, patch: Partial<Line>) =>
    update((v) => ({
      ...v,
      sections: v.sections.map((s, i) => (i !== si ? s : { ...s, lines: s.lines.map((l, j) => (j !== li ? l : { ...l, ...patch })) })),
    }));

  /** Ligne à focaliser dès que son champ est monté (nouvelle ligne) ou existante. */
  const pendingFocus = useRef<string | null>(null);
  const focusLine = (id: string) => {
    const el = descRefs.current.get(id);
    if (el) el.focus();
    else pendingFocus.current = id;
  };

  const addLine = (si: number, after?: number) => {
    const line = emptyLine(values.sections[si]?.lines.at(-1)?.vatRate ?? defaultVatRate);
    update((v) => ({
      ...v,
      sections: v.sections.map((s, i) => {
        if (i !== si) return s;
        const lines = [...s.lines];
        lines.splice(after === undefined ? lines.length : after + 1, 0, line);
        return { ...s, lines };
      }),
    }));
    focusLine(line.id);
  };
  const removeLine = (si: number, li: number) =>
    update((v) => ({ ...v, sections: v.sections.map((s, i) => (i !== si ? s : { ...s, lines: s.lines.filter((_, j) => j !== li) })) }));
  const duplicateLine = (si: number, li: number) => {
    const copy = { ...values.sections[si]!.lines[li]!, id: newId() };
    update((v) => ({
      ...v,
      sections: v.sections.map((s, i) => {
        if (i !== si) return s;
        const lines = [...s.lines];
        lines.splice(li + 1, 0, copy);
        return { ...s, lines };
      }),
    }));
  };
  const moveLine = (si: number, li: number, dir: -1 | 1) =>
    update((v) => ({
      ...v,
      sections: v.sections.map((s, i) => {
        if (i !== si) return s;
        const lines = [...s.lines];
        const target = li + dir;
        if (target < 0 || target >= lines.length) return s;
        [lines[li], lines[target]] = [lines[target]!, lines[li]!];
        return { ...s, lines };
      }),
    }));
  const addSection = () => {
    const line = emptyLine(defaultVatRate);
    update((v) => ({ ...v, sections: [...v.sections, { id: newId(), title: `Lot ${v.sections.length + 1}`, lines: [line] }] }));
    focusLine(line.id);
  };
  const removeSection = (si: number) => update((v) => ({ ...v, sections: v.sections.filter((_, i) => i !== si) }));

  /** Entrée dans une ligne : passe à la ligne suivante ou en crée une. */
  const onLineKeyDown = (e: React.KeyboardEvent, si: number, li: number) => {
    if (e.key !== "Enter" || e.shiftKey || e.nativeEvent.isComposing) return;
    e.preventDefault();
    const section = values.sections[si]!;
    const next = section.lines[li + 1];
    if (next) focusLine(next.id);
    else addLine(si);
  };

  const discount: Discount =
    values.discountKind === "none"
      ? { kind: "none" }
      : { kind: values.discountKind, value: toDomainNumber(values.discountValue) };
  const totals = useMemo(
    () =>
      computeQuoteTotals({
        sections: values.sections.map((s) => ({
          id: s.id,
          lines: s.lines.map((l) => ({
            id: l.id,
            quantity: toDomainNumber(l.quantity),
            unitPrice: toDomainNumber(l.unitPrice),
            vatRate: l.vatRate,
            vatCategory: defaultCategoryForRate(l.vatRate),
          })),
        })),
        discount,
        reverseCharge: values.reverseCharge,
        depositPercent: toDomainNumber(values.depositPercent),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [values],
  );

  const clientWorksites = worksites.filter((w) => w.clientId === values.clientId);

  const submit = () => {
    setSubmitted(true);
    if (!validate(values)) {
      toast.error("Le devis contient des erreurs : elles sont indiquées sous les champs concernés.");
      requestAnimationFrame(() => document.querySelector<HTMLElement>("[aria-invalid=true]")?.focus());
      return;
    }
    startTransition(async () => {
      const result = await saveQuote(quoteId, values);
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        toast.error(result.error);
        return;
      }
      toast.success(result.message);
      router.push(routes.quotes.show(result.data!.id));
    });
  };

  const err = (path: string) => errors[path];
  const errId = (path: string) => (errors[path] ? `err-${path}` : undefined);

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="grid gap-6 pb-28 md:pb-0 xl:grid-cols-[minmax(0,1fr)_18rem]"
    >
      <div className="min-w-0 space-y-6">
        {/* --- Informations générales --- */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informations {number ? <span className="font-mono text-sm text-muted-foreground">· {number}</span> : null}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="q-title">
                Objet du devis <span aria-hidden className="text-destructive">*</span>
              </Label>
              <Input id="q-title" className="mt-1.5" value={values.title} onChange={(e) => setField("title", e.target.value)} aria-invalid={!!err("title") || undefined} aria-describedby={errId("title")} placeholder="Rénovation électrique de…" />
              <ErrorText errors={errors} path="title" />
            </div>
            <div>
              <Label htmlFor="q-client">
                Client <span aria-hidden className="text-destructive">*</span>
              </Label>
              <select
                id="q-client"
                className={cn(nativeSelect, "mt-1.5")}
                value={values.clientId}
                onChange={(e) => update((v) => ({ ...v, clientId: e.target.value, worksiteId: "" }))}
                aria-invalid={!!err("clientId") || undefined}
                aria-describedby={errId("clientId")}
              >
                <option value="">Choisir un client…</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <ErrorText errors={errors} path="clientId" />
            </div>
            <div>
              <Label htmlFor="q-worksite">Chantier</Label>
              <select
                id="q-worksite"
                className={cn(nativeSelect, "mt-1.5")}
                value={values.worksiteId}
                onChange={(e) => {
                  const w = worksites.find((x) => x.id === e.target.value);
                  update((v) => ({ ...v, worksiteId: e.target.value, reverseCharge: w ? w.reverseCharge : v.reverseCharge }));
                }}
                disabled={!values.clientId}
              >
                <option value="">{clientWorksites.length ? "Aucun (à créer plus tard)" : "Aucun chantier pour ce client"}</option>
                {clientWorksites.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="q-date">Date du devis</Label>
              <Input id="q-date" type="date" className="mt-1.5" value={values.issueDate} onChange={(e) => setField("issueDate", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="q-valid">Valable jusqu&apos;au</Label>
              <Input id="q-valid" type="date" className="mt-1.5" value={values.validUntil} onChange={(e) => setField("validUntil", e.target.value)} aria-invalid={!!err("validUntil") || undefined} aria-describedby={errId("validUntil")} />
              <ErrorText errors={errors} path="validUntil" />
            </div>

            <div className="sm:col-span-2">
              <button
                type="button"
                className="flex min-h-11 items-center gap-1 text-sm font-medium text-primary"
                aria-expanded={optionsOpen}
                aria-controls="q-options"
                onClick={() => setOptionsOpen((o) => !o)}
              >
                <ChevronDown aria-hidden className={cn("size-4 transition-transform", optionsOpen && "rotate-180")} />
                Remise, acompte, autoliquidation et notes
              </button>
              {optionsOpen ? (
                <div id="q-options" className="mt-3 grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="q-discount-kind">Remise globale</Label>
                    <div className="mt-1.5 flex gap-2">
                      <select id="q-discount-kind" className={cn(nativeSelect, "w-36")} value={values.discountKind} onChange={(e) => setField("discountKind", e.target.value as QuoteFormValues["discountKind"])}>
                        <option value="none">Aucune</option>
                        <option value="percent">En %</option>
                        <option value="amount">En € HT</option>
                      </select>
                      {values.discountKind !== "none" ? (
                        <Input
                          aria-label={values.discountKind === "percent" ? "Remise en pourcentage" : "Remise en euros hors taxes"}
                          inputMode="decimal"
                          value={values.discountValue}
                          onChange={(e) => setField("discountValue", e.target.value)}
                          aria-invalid={!!err("discountValue") || undefined}
                          aria-describedby={errId("discountValue")}
                        />
                      ) : null}
                    </div>
                    <ErrorText errors={errors} path="discountValue" />
                  </div>
                  <div>
                    <Label htmlFor="q-deposit">Acompte à la commande (% du TTC)</Label>
                    <Input id="q-deposit" inputMode="decimal" className="mt-1.5" value={values.depositPercent} onChange={(e) => setField("depositPercent", e.target.value)} aria-invalid={!!err("depositPercent") || undefined} aria-describedby={errId("depositPercent")} />
                    <ErrorText errors={errors} path="depositPercent" />
                  </div>
                  <div className="flex items-start justify-between gap-4 rounded-lg border p-3 sm:col-span-2">
                    <div>
                      <Label htmlFor="q-reverse">Autoliquidation de la TVA (sous-traitance)</Label>
                      <p className="text-sm text-muted-foreground">Aucune TVA facturée ; la mention légale est ajoutée au devis.</p>
                    </div>
                    <Switch id="q-reverse" checked={values.reverseCharge} onCheckedChange={(c) => setField("reverseCharge", c)} />
                  </div>
                  <div>
                    <Label htmlFor="q-duration">Durée estimée des travaux</Label>
                    <Input id="q-duration" className="mt-1.5" value={values.estimatedDuration ?? ""} onChange={(e) => setField("estimatedDuration", e.target.value)} placeholder="3 semaines" />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="q-notes">Notes et conditions particulières</Label>
                    <Textarea id="q-notes" className="mt-1.5" rows={3} value={values.notes ?? ""} onChange={(e) => setField("notes", e.target.value)} />
                  </div>
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>

        {/* --- Lots et lignes --- */}
        {err("sections") ? (
          <p role="alert" className="rounded-md border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">
            {err("sections")}
          </p>
        ) : null}
        <p className="hidden text-sm text-muted-foreground md:block">
          Astuce : <kbd className="rounded border bg-secondary px-1">Entrée</kbd> passe à la ligne suivante ou en crée une nouvelle.
        </p>

        {values.sections.map((section, si) => {
          const isCollapsed = collapsed[section.id];
          return (
            <section key={section.id} aria-label={`Lot ${si + 1} : ${section.title}`} className="rounded-lg border bg-card">
              <div className="flex flex-wrap items-center gap-2 border-b p-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={isCollapsed ? "Déplier le lot" : "Replier le lot"}
                  aria-expanded={!isCollapsed}
                  onClick={() => setCollapsed((c) => ({ ...c, [section.id]: !c[section.id] }))}
                >
                  <ChevronDown aria-hidden className={cn("transition-transform", isCollapsed && "-rotate-90")} />
                </Button>
                <div className="min-w-0 flex-1">
                  <Input
                    aria-label={`Titre du lot ${si + 1}`}
                    value={section.title}
                    onChange={(e) => update((v) => ({ ...v, sections: v.sections.map((s, i) => (i === si ? { ...s, title: e.target.value } : s)) }))}
                    className="font-medium"
                    aria-invalid={!!err(`sections.${si}.title`) || undefined}
                  />
                  <ErrorText errors={errors} path={`sections.${si}.title`} />
                </div>
                <span className="num text-sm text-muted-foreground">
                  Sous-total <Amount value={totals.sectionSubtotals[section.id]} className="font-semibold text-foreground" />
                </span>
                {values.sections.length > 1 ? (
                  <Button type="button" variant="ghost" size="icon-sm" aria-label={`Supprimer le lot ${section.title}`} onClick={() => removeSection(si)}>
                    <Trash2 aria-hidden />
                  </Button>
                ) : null}
              </div>

              {!isCollapsed ? (
                <div className="@container p-3">
                  <div aria-hidden className="mb-1 hidden grid-cols-[minmax(0,1fr)_4.5rem_5.5rem_6.5rem_5.5rem_6.5rem_2.75rem] gap-2 px-1 text-xs font-medium text-muted-foreground @3xl:grid">
                    <span>Désignation</span>
                    <span>Qté</span>
                    <span>Unité</span>
                    <span>PU HT (€)</span>
                    <span>TVA</span>
                    <span className="text-right">Total HT</span>
                    <span />
                  </div>
                  <ol className="space-y-3 @3xl:space-y-1.5">
                    {section.lines.map((line, li) => {
                      const p = `sections.${si}.lines.${li}`;
                      const n = li + 1;
                      const fid = (f: string) => `l-${line.id}-${f}`;
                      return (
                        <li
                          key={line.id}
                          aria-label={`Ligne ${n}`}
                          className="grid grid-cols-2 gap-x-2 gap-y-3 rounded-md border p-3 @3xl:grid-cols-[minmax(0,1fr)_4.5rem_5.5rem_6.5rem_5.5rem_6.5rem_2.75rem] @3xl:items-start @3xl:gap-y-2 @3xl:border-0 @3xl:p-1"
                          onKeyDown={(e) => {
                            if ((e.target as HTMLElement).tagName !== "TEXTAREA" || !e.shiftKey) onLineKeyDown(e, si, li);
                          }}
                        >
                          <div className="col-span-2 @3xl:col-span-1">
                            <label htmlFor={fid("desc")} className="mb-1 block text-sm font-medium @3xl:sr-only">
                              Désignation, ligne {n}
                            </label>
                            <Textarea
                              id={fid("desc")}
                              ref={(el) => {
                                descRefs.current.set(line.id, el);
                                if (el && pendingFocus.current === line.id) {
                                  pendingFocus.current = null;
                                  el.focus();
                                }
                              }}
                              rows={1}
                              placeholder="Désignation de l'ouvrage"
                              value={line.description}
                              onChange={(e) => setLine(si, li, { description: e.target.value })}
                              className="min-h-11 resize-y md:min-h-10"
                              aria-invalid={!!err(`${p}.description`) || undefined}
                              aria-describedby={errId(`${p}.description`)}
                            />
                            <ErrorText errors={errors} path={`${p}.description`} />
                          </div>
                          <div>
                            <label htmlFor={fid("qty")} className="mb-1 block text-sm font-medium @3xl:sr-only">
                              Quantité<span className="sr-only">, ligne {n}</span>
                            </label>
                            <Input id={fid("qty")} inputMode="decimal" value={line.quantity} onChange={(e) => setLine(si, li, { quantity: e.target.value })} aria-invalid={!!err(`${p}.quantity`) || undefined} aria-describedby={errId(`${p}.quantity`)} />
                            <ErrorText errors={errors} path={`${p}.quantity`} />
                          </div>
                          <div>
                            <label htmlFor={fid("unit")} className="mb-1 block text-sm font-medium @3xl:sr-only">
                              Unité<span className="sr-only">, ligne {n}</span>
                            </label>
                            <select id={fid("unit")} className={nativeSelect} value={line.unit} onChange={(e) => setLine(si, li, { unit: e.target.value as Line["unit"] })}>
                              {UNITS.map((u) => (
                                <option key={u} value={u}>
                                  {UNIT_LABELS[u]}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label htmlFor={fid("price")} className="mb-1 block text-sm font-medium @3xl:sr-only">
                              Prix unitaire HT<span className="sr-only">, ligne {n}</span>
                            </label>
                            <Input id={fid("price")} inputMode="decimal" placeholder="0,00" value={line.unitPrice} onChange={(e) => setLine(si, li, { unitPrice: e.target.value })} aria-invalid={!!err(`${p}.unitPrice`) || undefined} aria-describedby={errId(`${p}.unitPrice`)} />
                            <ErrorText errors={errors} path={`${p}.unitPrice`} />
                          </div>
                          <div>
                            <label htmlFor={fid("vat")} className="mb-1 block text-sm font-medium @3xl:sr-only">
                              TVA<span className="sr-only">, ligne {n}</span>
                            </label>
                            <select
                              id={fid("vat")}
                              className={nativeSelect}
                              value={line.vatRate}
                              onChange={(e) => setLine(si, li, { vatRate: e.target.value as Line["vatRate"] })}
                              disabled={values.reverseCharge}
                              title={values.reverseCharge ? "Autoliquidation : TVA non facturée" : undefined}
                            >
                              {VAT_RATES.map((r) => (
                                <option key={r} value={r}>
                                  {formatVatRateLabel(r)}
                                </option>
                              ))}
                            </select>
                          </div>
                          <p className="num flex h-11 items-center gap-2 font-medium @3xl:h-10 @3xl:justify-end">
                            <span className="text-sm font-normal text-muted-foreground @3xl:hidden">Total HT</span>
                            <Amount value={totals.lineNets[line.id]} />
                          </p>
                          <div className="flex justify-end">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button type="button" variant="ghost" size="icon" aria-label={`Actions de la ligne ${n}`}>
                                  <Ellipsis aria-hidden />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem className="min-h-11 md:min-h-9" disabled={li === 0} onSelect={() => moveLine(si, li, -1)}>
                                  <ArrowUp aria-hidden />
                                  Monter
                                </DropdownMenuItem>
                                <DropdownMenuItem className="min-h-11 md:min-h-9" disabled={li === section.lines.length - 1} onSelect={() => moveLine(si, li, 1)}>
                                  <ArrowDown aria-hidden />
                                  Descendre
                                </DropdownMenuItem>
                                <DropdownMenuItem className="min-h-11 md:min-h-9" onSelect={() => duplicateLine(si, li)}>
                                  <Copy aria-hidden />
                                  Dupliquer
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem variant="destructive" className="min-h-11 md:min-h-9" onSelect={() => removeLine(si, li)}>
                                  <Trash2 aria-hidden />
                                  Supprimer la ligne
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                  <Button type="button" variant="outline" className="mt-3 w-full border-dashed @3xl:w-auto" onClick={() => addLine(si)}>
                    <Plus aria-hidden />
                    Ajouter une ligne
                  </Button>
                </div>
              ) : null}
            </section>
          );
        })}

        <Button type="button" variant="secondary" onClick={addSection} className="w-full sm:w-auto">
          <Plus aria-hidden />
          Ajouter un lot
        </Button>
      </div>

      {/* --- Totaux (colonne collante sur ordinateur) --- */}
      <aside className="hidden xl:block">
        <div className="sticky top-16 space-y-4 rounded-lg border bg-card p-4">
          <TotalsBlock totals={totals} reverseCharge={values.reverseCharge} />
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? <Loader2 aria-hidden className="animate-spin" /> : <Save aria-hidden />}
            Enregistrer le devis
          </Button>
        </div>
      </aside>

      {/* --- Tablette : totaux en bas de page --- */}
      <div className="hidden space-y-4 rounded-lg border bg-card p-4 md:block xl:hidden">
        <TotalsBlock totals={totals} reverseCharge={values.reverseCharge} />
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? <Loader2 aria-hidden className="animate-spin" /> : <Save aria-hidden />}
          Enregistrer le devis
        </Button>
      </div>

      {/* --- Mobile : barre de totaux collante au-dessus des onglets --- */}
      <div className="fixed inset-x-0 bottom-16 z-20 border-t bg-card/95 px-4 py-3 backdrop-blur md:hidden">
        <details className="group">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3">
            <span>
              <span className="block text-xs text-muted-foreground">Total {values.reverseCharge ? "HT (autoliquidation)" : "TTC"}</span>
              <Amount value={totals.gross} className="text-lg font-semibold" />
            </span>
            <span className="flex items-center gap-2">
              <span className="text-sm text-primary group-open:hidden">Détail</span>
              <Button type="submit" disabled={pending} onClick={(e) => e.stopPropagation()}>
                {pending ? <Loader2 aria-hidden className="animate-spin" /> : <Save aria-hidden />}
                Enregistrer
              </Button>
            </span>
          </summary>
          <div className="pt-3">
            <TotalsBlock totals={totals} reverseCharge={values.reverseCharge} />
          </div>
        </details>
      </div>
    </form>
  );
}

function ErrorText({ errors, path }: { errors: Record<string, string>; path: string }) {
  return errors[path] ? (
    <p id={`err-${path}`} role="alert" className="mt-1 text-sm text-destructive">
      {errors[path]}
    </p>
  ) : null;
}

function TotalsBlock({ totals, reverseCharge }: { totals: ReturnType<typeof computeQuoteTotals>; reverseCharge: boolean }) {
  return (
    <dl className="space-y-2 text-sm">
      <div className="flex justify-between">
        <dt className="text-muted-foreground">Total HT avant remise</dt>
        <dd>
          <Amount value={totals.grossNet} />
        </dd>
      </div>
      {totals.discountAmount !== "0.00" ? (
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Remise</dt>
          <dd>
            − <Amount value={totals.discountAmount} />
          </dd>
        </div>
      ) : null}
      <div className="flex justify-between font-medium">
        <dt>Total HT</dt>
        <dd>
          <Amount value={totals.net} />
        </dd>
      </div>
      {totals.vatBreakdown.map((b) => (
        <div key={`${b.vatCategory}${b.vatRate}`} className="flex justify-between">
          <dt className="text-muted-foreground">
            {b.vatCategory === "AE" ? "TVA autoliquidée" : `TVA ${formatVatRateLabel(b.vatRate)}`}
            <span className="block text-xs">sur <Amount value={b.base} /></span>
          </dt>
          <dd>
            <Amount value={b.vat} />
          </dd>
        </div>
      ))}
      <div className="flex justify-between border-t pt-2 text-base font-semibold">
        <dt>Total {reverseCharge ? "à payer" : "TTC"}</dt>
        <dd>
          <Amount value={totals.gross} />
        </dd>
      </div>
      {totals.depositAmount !== "0.00" ? (
        <div className="flex justify-between text-muted-foreground">
          <dt>Acompte demandé</dt>
          <dd>
            <Amount value={totals.depositAmount} />
          </dd>
        </div>
      ) : null}
      {reverseCharge ? <p className="rounded-md bg-pending-soft p-2 text-xs text-pending">{REVERSE_CHARGE_MENTION}</p> : null}
    </dl>
  );
}
