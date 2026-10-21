/**
 * Opérations pures sur le brouillon de devis édité (formulaire) : ajout, retrait,
 * déplacement de lignes et de lots, et conversion vers le calcul du domaine.
 * Aucune dépendance à React : testées unitairement.
 */
import { parseDecimalInput } from "@/domain/money";
import type { QuoteInput as DomainQuoteInput } from "@/domain/quote";
import { defaultCategoryForRate } from "@/domain/vat";
import type { QuoteFormValues } from "../schemas";

export type DraftSection = QuoteFormValues["sections"][number];
export type DraftLine = DraftSection["lines"][number];

export function emptyLine(vatRate: DraftLine["vatRate"], id: string): DraftLine {
  return { id, description: "", quantity: "1", unit: "u", unitPrice: "", vatRate };
}

function mapSection(values: QuoteFormValues, si: number, fn: (s: DraftSection) => DraftSection): QuoteFormValues {
  return { ...values, sections: values.sections.map((s, i) => (i === si ? fn(s) : s)) };
}

export function updateLine(values: QuoteFormValues, si: number, li: number, patch: Partial<DraftLine>): QuoteFormValues {
  return mapSection(values, si, (s) => ({ ...s, lines: s.lines.map((l, j) => (j === li ? { ...l, ...patch } : l)) }));
}

/** Insère `line` après l'indice `after` (en fin de lot si omis). */
export function insertLine(values: QuoteFormValues, si: number, line: DraftLine, after?: number): QuoteFormValues {
  return mapSection(values, si, (s) => {
    const lines = [...s.lines];
    lines.splice(after === undefined ? lines.length : after + 1, 0, line);
    return { ...s, lines };
  });
}

export function removeLine(values: QuoteFormValues, si: number, li: number): QuoteFormValues {
  return mapSection(values, si, (s) => ({ ...s, lines: s.lines.filter((_, j) => j !== li) }));
}

export function moveLine(values: QuoteFormValues, si: number, li: number, dir: -1 | 1): QuoteFormValues {
  return mapSection(values, si, (s) => {
    const target = li + dir;
    if (target < 0 || target >= s.lines.length) return s;
    const lines = [...s.lines];
    [lines[li], lines[target]] = [lines[target]!, lines[li]!];
    return { ...s, lines };
  });
}

export function renameSection(values: QuoteFormValues, si: number, title: string): QuoteFormValues {
  return mapSection(values, si, (s) => ({ ...s, title }));
}

export function addSection(values: QuoteFormValues, section: DraftSection): QuoteFormValues {
  return { ...values, sections: [...values.sections, section] };
}

export function removeSection(values: QuoteFormValues, si: number): QuoteFormValues {
  return { ...values, sections: values.sections.filter((_, i) => i !== si) };
}

const num = (v: string) => parseDecimalInput(v) ?? "0";

/** Saisie (chaînes à la française) → entrée du calcul de totaux du domaine. */
export function toTotalsInput(values: QuoteFormValues): DomainQuoteInput {
  return {
    sections: values.sections.map((s) => ({
      id: s.id,
      lines: s.lines.map((l) => ({
        id: l.id,
        quantity: num(l.quantity),
        unitPrice: num(l.unitPrice),
        vatRate: l.vatRate,
        vatCategory: defaultCategoryForRate(l.vatRate),
      })),
    })),
    discount: values.discountKind === "none" ? { kind: "none" } : { kind: values.discountKind, value: num(values.discountValue) },
    reverseCharge: values.reverseCharge,
    depositPercent: num(values.depositPercent),
  };
}
