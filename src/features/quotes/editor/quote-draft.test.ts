import { describe, expect, it } from "vitest";
import { computeQuoteTotals } from "@/domain/quote";
import type { QuoteFormValues } from "../schemas";
import { addSection, emptyLine, insertLine, moveLine, removeLine, removeSection, toTotalsInput, updateLine } from "./quote-draft";

const base = (): QuoteFormValues => ({
  clientId: "c",
  worksiteId: "",
  title: "Test",
  issueDate: "2026-10-18",
  validUntil: "2026-12-17",
  reverseCharge: false,
  discountKind: "none",
  discountValue: "",
  depositPercent: "0",
  estimatedDuration: "",
  notes: "",
  sections: [{ id: "s1", title: "Lot 1", lines: [{ id: "a", description: "A", quantity: "12,5", unit: "u", unitPrice: "45,10", vatRate: "20.00" }] }],
});

describe("brouillon de devis (opérations pures)", () => {
  it("insère, déplace, modifie et supprime des lignes sans muter l'original", () => {
    const v0 = base();
    const v1 = insertLine(v0, 0, emptyLine("10.00", "b"));
    expect(v0.sections[0]!.lines).toHaveLength(1);
    expect(v1.sections[0]!.lines.map((l) => l.id)).toEqual(["a", "b"]);
    const v2 = moveLine(v1, 0, 1, -1);
    expect(v2.sections[0]!.lines.map((l) => l.id)).toEqual(["b", "a"]);
    expect(moveLine(v2, 0, 0, -1)).toEqual(v2);
    const v3 = updateLine(v2, 0, 0, { description: "Nouvelle" });
    expect(v3.sections[0]!.lines[0]!.description).toBe("Nouvelle");
    expect(removeLine(v3, 0, 0).sections[0]!.lines.map((l) => l.id)).toEqual(["a"]);
  });

  it("ajoute et retire des lots", () => {
    const v = addSection(base(), { id: "s2", title: "Lot 2", lines: [] });
    expect(v.sections).toHaveLength(2);
    expect(removeSection(v, 0).sections.map((s) => s.id)).toEqual(["s2"]);
  });

  it("convertit la saisie française vers le calcul du domaine", () => {
    const totals = computeQuoteTotals(toTotalsInput(base()));
    expect(totals.net).toBe("563.75");
    expect(totals.gross).toBe("676.50");
  });
});
