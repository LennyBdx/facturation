"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DraftLine } from "./editor/quote-draft";
import { type EditorClient, type EditorWorksite, QuoteInfoCard } from "./editor/quote-info-card";
import { QuoteSectionCard } from "./editor/quote-section-card";
import { QuoteTotalsPanels } from "./editor/quote-totals";
import { useQuoteEditor } from "./editor/use-quote-editor";
import type { QuoteFormValues } from "./schemas";

/**
 * Éditeur de devis : assemble l'en-tête, les lots et les totaux.
 * L'état et le comportement sont dans `useQuoteEditor`, les opérations pures dans `quote-draft`.
 */
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
  clients: EditorClient[];
  worksites: EditorWorksite[];
  defaultVatRate: DraftLine["vatRate"];
}) {
  const editor = useQuoteEditor({ quoteId, initial, defaultVatRate });
  const { values, errors, totals, pending, actions, submit } = editor;

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
        <QuoteInfoCard editor={editor} number={number} clients={clients} worksites={worksites} />

        {errors.sections ? (
          <p
            role="alert"
            className="rounded-md border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger"
          >
            {errors.sections}
          </p>
        ) : null}
        <p className="hidden text-sm text-muted-foreground md:block">
          Astuce : <kbd className="rounded border bg-secondary px-1">Entrée</kbd> passe à la ligne
          suivante ou en crée une nouvelle.
        </p>

        {values.sections.map((section, si) => (
          <QuoteSectionCard key={section.id} editor={editor} section={section} si={si} />
        ))}

        <Button
          type="button"
          variant="secondary"
          onClick={actions.addSection}
          className="w-full sm:w-auto"
        >
          <Plus aria-hidden />
          Ajouter un lot
        </Button>
      </div>

      <QuoteTotalsPanels totals={totals} reverseCharge={values.reverseCharge} pending={pending} />
    </form>
  );
}
