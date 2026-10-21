"use client";

import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { Amount } from "@/components/app/amount";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { DraftSection } from "./quote-draft";
import { QuoteLineRow } from "./quote-line-row";
import { ErrorText } from "./shared";
import type { QuoteEditorState } from "./use-quote-editor";

/** Un lot : titre, sous-total, repli, lignes et ajout de ligne. */
export function QuoteSectionCard({
  editor,
  section,
  si,
}: {
  editor: QuoteEditorState;
  section: DraftSection;
  si: number;
}) {
  const { errors, totals, collapsed, values, actions } = editor;
  const isCollapsed = collapsed[section.id];

  return (
    <section aria-label={`Lot ${si + 1} : ${section.title}`} className="rounded-lg border bg-card">
      <div className="flex flex-wrap items-center gap-2 border-b p-3">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={isCollapsed ? "Déplier le lot" : "Replier le lot"}
          aria-expanded={!isCollapsed}
          onClick={() => actions.toggleSection(section.id)}
        >
          <ChevronDown
            aria-hidden
            className={cn("transition-transform", isCollapsed && "-rotate-90")}
          />
        </Button>
        <div className="min-w-0 flex-1">
          <Input
            aria-label={`Titre du lot ${si + 1}`}
            value={section.title}
            onChange={(e) => actions.renameSection(si, e.target.value)}
            className="font-medium"
            aria-invalid={!!errors[`sections.${si}.title`] || undefined}
          />
          <ErrorText errors={errors} path={`sections.${si}.title`} />
        </div>
        <span className="num text-sm text-muted-foreground">
          Sous-total{" "}
          <Amount
            value={totals.sectionSubtotals[section.id]}
            className="font-semibold text-foreground"
          />
        </span>
        {values.sections.length > 1 ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Supprimer le lot ${section.title}`}
            onClick={() => actions.removeSection(si)}
          >
            <Trash2 aria-hidden />
          </Button>
        ) : null}
      </div>

      {!isCollapsed ? (
        <div className="@container p-3">
          <div
            aria-hidden
            className="mb-1 hidden grid-cols-[minmax(0,1fr)_4.5rem_5.5rem_6.5rem_5.5rem_6.5rem_2.75rem] gap-2 px-1 text-xs font-medium text-muted-foreground @3xl:grid"
          >
            <span>Désignation</span>
            <span>Qté</span>
            <span>Unité</span>
            <span>PU HT (€)</span>
            <span>TVA</span>
            <span className="text-right">Total HT</span>
            <span />
          </div>
          <ol className="space-y-3 @3xl:space-y-1.5">
            {section.lines.map((line, li) => (
              <QuoteLineRow
                key={line.id}
                editor={editor}
                line={line}
                si={si}
                li={li}
                isLast={li === section.lines.length - 1}
                lineNet={totals.lineNets[line.id]}
              />
            ))}
          </ol>
          <Button
            type="button"
            variant="outline"
            className="mt-3 w-full border-dashed @3xl:w-auto"
            onClick={() => actions.addLine(si)}
          >
            <Plus aria-hidden />
            Ajouter une ligne
          </Button>
        </div>
      ) : null}
    </section>
  );
}
