import { describe, expect, it } from "vitest";
import { allocate, parseDecimalInput, toMoney } from "./money";
import { computeQuoteTotals, lineNet, type QuoteInput } from "./quote";

const baseQuote = (overrides: Partial<QuoteInput> = {}): QuoteInput => ({
  sections: [
    {
      id: "lot-a",
      lines: [
        { id: "l1", quantity: "10", unitPrice: "45.00", vatRate: "20.00", vatCategory: "S" },
        { id: "l2", quantity: "2.5", unitPrice: "33.33", vatRate: "20.00", vatCategory: "S" },
      ],
    },
    {
      id: "lot-b",
      lines: [
        { id: "l3", quantity: "1", unitPrice: "1000.00", vatRate: "10.00", vatCategory: "S" },
      ],
    },
  ],
  discount: { kind: "none" },
  reverseCharge: false,
  depositPercent: "0",
  ...overrides,
});

describe("arrondis", () => {
  it("arrondit au centime, demi supérieur", () => {
    expect(toMoney("0.005")).toBe("0.01");
    expect(toMoney("0.0049")).toBe("0.00");
    expect(toMoney("83.325")).toBe("83.33");
    expect(toMoney("-0.005")).toBe("-0.01");
  });

  it("calcule une ligne : quantité × prix unitaire arrondi au centime", () => {
    expect(lineNet({ quantity: "2.5", unitPrice: "33.33" })).toBe("83.33");
    expect(lineNet({ quantity: "0.333", unitPrice: "10.00" })).toBe("3.33");
  });

  it("répartit un montant sans perte de centime", () => {
    const shares = allocate("100.00", ["1", "1", "1"]);
    expect(shares).toEqual(["33.34", "33.33", "33.33"]);
    expect(allocate("153.33", ["533.33", "1000.00"])).toEqual(["53.33", "100.00"]);
  });

  it("lit les saisies françaises", () => {
    expect(parseDecimalInput("1 250,5")).toBe("1250.5");
    expect(parseDecimalInput("12.5 €")).toBe("12.5");
    expect(parseDecimalInput("abc")).toBeNull();
  });
});

describe("totaux de devis", () => {
  it("calcule HT, TVA par taux et TTC", () => {
    const t = computeQuoteTotals(baseQuote());
    expect(t.lineNets).toEqual({ l1: "450.00", l2: "83.33", l3: "1000.00" });
    expect(t.sectionSubtotals).toEqual({ "lot-a": "533.33", "lot-b": "1000.00" });
    expect(t.grossNet).toBe("1533.33");
    expect(t.discountAmount).toBe("0.00");
    expect(t.vatBreakdown).toEqual([
      { vatCategory: "S", vatRate: "20.00", base: "533.33", vat: "106.67" },
      { vatCategory: "S", vatRate: "10.00", base: "1000.00", vat: "100.00" },
    ]);
    expect(t.net).toBe("1533.33");
    expect(t.vat).toBe("206.67");
    expect(t.gross).toBe("1740.00");
  });

  it("applique une remise en % répartie entre les taux de TVA", () => {
    const t = computeQuoteTotals(baseQuote({ discount: { kind: "percent", value: "10" } }));
    expect(t.discountAmount).toBe("153.33");
    expect(t.vatBreakdown).toEqual([
      { vatCategory: "S", vatRate: "20.00", base: "480.00", vat: "96.00" },
      { vatCategory: "S", vatRate: "10.00", base: "900.00", vat: "90.00" },
    ]);
    expect(t.net).toBe("1380.00");
    expect(t.vat).toBe("186.00");
    expect(t.gross).toBe("1566.00");
  });

  it("plafonne une remise en montant au total HT", () => {
    const t = computeQuoteTotals(baseQuote({ discount: { kind: "amount", value: "2000.00" } }));
    expect(t.discountAmount).toBe("1533.33");
    expect(t.net).toBe("0.00");
    expect(t.gross).toBe("0.00");
  });

  it("applique une remise en montant", () => {
    const t = computeQuoteTotals(baseQuote({ discount: { kind: "amount", value: "33.33" } }));
    expect(t.net).toBe("1500.00");
  });

  it("met la TVA à zéro en autoliquidation (catégorie AE)", () => {
    const t = computeQuoteTotals(baseQuote({ reverseCharge: true }));
    expect(t.vatBreakdown).toEqual([
      { vatCategory: "AE", vatRate: "0.00", base: "1533.33", vat: "0.00" },
    ]);
    expect(t.vat).toBe("0.00");
    expect(t.gross).toBe("1533.33");
  });

  it("calcule l'acompte demandé sur le TTC", () => {
    const t = computeQuoteTotals(baseQuote({ depositPercent: "30" }));
    expect(t.depositAmount).toBe("522.00");
  });

  it("gère un devis vide", () => {
    const t = computeQuoteTotals({
      sections: [],
      discount: { kind: "none" },
      reverseCharge: false,
      depositPercent: "0",
    });
    expect(t.gross).toBe("0.00");
    expect(t.vatBreakdown).toEqual([]);
  });
});
