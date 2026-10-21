"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { routes } from "@/config/routes";
import { computeQuoteTotals } from "@/domain/quote";
import { saveQuote } from "../actions";
import { quoteSchema, type QuoteFormValues } from "../schemas";
import * as draft from "./quote-draft";

const newId = () => crypto.randomUUID();

/**
 * État et comportement de l'éditeur de devis : valeurs, validation, totaux en direct,
 * opérations sur les lignes, navigation au clavier, enregistrement.
 * Les composants d'affichage ne font que lire ce hook.
 */
export function useQuoteEditor({
  quoteId,
  initial,
  defaultVatRate,
}: {
  quoteId: string | null;
  initial: QuoteFormValues;
  defaultVatRate: draft.DraftLine["vatRate"];
}) {
  const router = useRouter();
  const [values, setValues] = useState<QuoteFormValues>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [optionsOpen, setOptionsOpen] = useState(initial.discountKind !== "none" || initial.reverseCharge || initial.depositPercent !== "0");
  const [pending, startTransition] = useTransition();

  // Focus clavier : champs « désignation » par ligne ; une nouvelle ligne est focalisée dès son montage.
  const descRefs = useRef(new Map<string, HTMLTextAreaElement | null>());
  const pendingFocus = useRef<string | null>(null);

  const validate = (next: QuoteFormValues) => {
    const r = quoteSchema.safeParse(next);
    const out: Record<string, string> = {};
    if (!r.success) for (const i of r.error.issues) out[i.path.join(".")] ??= i.message;
    setErrors(out);
    return r.success;
  };

  const update = (fn: (v: QuoteFormValues) => QuoteFormValues) =>
    setValues((prev) => {
      const next = fn(prev);
      if (submitted) validate(next);
      return next;
    });

  const focusLine = (id: string) => {
    const el = descRefs.current.get(id);
    if (el) el.focus();
    else pendingFocus.current = id;
  };

  const registerDescription = (lineId: string) => (el: HTMLTextAreaElement | null) => {
    descRefs.current.set(lineId, el);
    if (el && pendingFocus.current === lineId) {
      pendingFocus.current = null;
      el.focus();
    }
  };

  const addLine = (si: number) => {
    const line = draft.emptyLine(values.sections[si]?.lines.at(-1)?.vatRate ?? defaultVatRate, newId());
    update((v) => draft.insertLine(v, si, line));
    focusLine(line.id);
  };

  const actions = {
    setField: <K extends keyof QuoteFormValues>(key: K, value: QuoteFormValues[K]) => update((v) => ({ ...v, [key]: value })),
    selectClient: (clientId: string) => update((v) => ({ ...v, clientId, worksiteId: "" })),
    selectWorksite: (worksiteId: string, reverseCharge?: boolean) =>
      update((v) => ({ ...v, worksiteId, reverseCharge: reverseCharge ?? v.reverseCharge })),
    setLine: (si: number, li: number, patch: Partial<draft.DraftLine>) => update((v) => draft.updateLine(v, si, li, patch)),
    addLine,
    removeLine: (si: number, li: number) => update((v) => draft.removeLine(v, si, li)),
    duplicateLine: (si: number, li: number) => {
      const copy = { ...values.sections[si]!.lines[li]!, id: newId() };
      update((v) => draft.insertLine(v, si, copy, li));
    },
    moveLine: (si: number, li: number, dir: -1 | 1) => update((v) => draft.moveLine(v, si, li, dir)),
    renameSection: (si: number, title: string) => update((v) => draft.renameSection(v, si, title)),
    addSection: () => {
      const line = draft.emptyLine(defaultVatRate, newId());
      update((v) => draft.addSection(v, { id: newId(), title: `Lot ${v.sections.length + 1}`, lines: [line] }));
      focusLine(line.id);
    },
    removeSection: (si: number) => update((v) => draft.removeSection(v, si)),
    toggleSection: (id: string) => setCollapsed((c) => ({ ...c, [id]: !c[id] })),
    toggleOptions: () => setOptionsOpen((o) => !o),
    /** Entrée dans une ligne : passe à la ligne suivante ou en crée une. */
    onLineKeyDown: (e: React.KeyboardEvent, si: number, li: number) => {
      if (e.key !== "Enter" || e.shiftKey || e.nativeEvent.isComposing) return;
      e.preventDefault();
      const next = values.sections[si]!.lines[li + 1];
      if (next) focusLine(next.id);
      else addLine(si);
    },
    registerDescription,
  };

  const totals = useMemo(() => computeQuoteTotals(draft.toTotalsInput(values)), [values]);

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

  return { values, errors, totals, collapsed, optionsOpen, pending, actions, submit };
}

export type QuoteEditorState = ReturnType<typeof useQuoteEditor>;
