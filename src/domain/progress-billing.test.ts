import { describe, expect, it } from "vitest";
import { addMoney } from "./money";
import {
  computeDepositInvoice,
  computeProgressInvoice,
  isValidRetentionRate,
  ProgressBillingError,
  type ProgressContract,
} from "./progress-billing";

const contract: ProgressContract = {
  sections: [
    {
      id: "lot-1",
      lines: [
        { id: "a", quantity: "1", unitPrice: "10000.00", vatRate: "20.00", vatCategory: "S" },
        { id: "b", quantity: "1", unitPrice: "5000.00", vatRate: "20.00", vatCategory: "S" },
      ],
    },
  ],
  discount: { kind: "none" },
  reverseCharge: false,
};

describe("facture d'acompte", () => {
  it("calcule 30 % du marché HT et sa TVA", () => {
    const d = computeDepositInvoice({ contract, percent: "30" });
    expect(d.net).toBe("4500.00");
    expect(d.vat).toBe("900.00");
    expect(d.gross).toBe("5400.00");
  });
});

describe("situations de travaux successives", () => {
  const deposit = { net: "4500.00" };

  const s1 = computeProgressInvoice({ contract, progress: { a: "30", b: "0" }, previous: null, deposit, retentionRate: "5" });
  const s2 = computeProgressInvoice({ contract, progress: { a: "60", b: "50" }, previous: s1.cumulative, deposit, retentionRate: "5" });
  const s3 = computeProgressInvoice({ contract, progress: { a: "100", b: "100" }, previous: s2.cumulative, deposit, retentionRate: "5" });

  it("situation 1 : travaux, déduction d'acompte au prorata, retenue de garantie", () => {
    expect(s1.index).toBe(1);
    expect(s1.periodWorksNet).toBe("3000.00");
    expect(s1.periodDepositDeduction).toBe("900.00");
    expect(s1.net).toBe("2100.00");
    expect(s1.vat).toBe("420.00");
    expect(s1.gross).toBe("2520.00");
    expect(s1.periodRetention).toBe("180.00");
    expect(s1.netToPay).toBe("2340.00");
    expect(s1.overallPercent).toBe("20.00");
  });

  it("situation 2 : montant de la période = cumul actuel − cumul précédent", () => {
    expect(s2.index).toBe(2);
    const lineA = s2.lines.find((l) => l.lineId === "a")!;
    expect(lineA).toMatchObject({ previousPercent: "30.00", currentPercent: "60.00", previousAmount: "3000.00", cumulativeAmount: "6000.00", periodAmount: "3000.00" });
    expect(s2.periodWorksNet).toBe("5500.00");
    expect(s2.periodDepositDeduction).toBe("1650.00");
    expect(s2.net).toBe("3850.00");
    expect(s2.vat).toBe("770.00");
    expect(s2.gross).toBe("4620.00");
    expect(s2.periodRetention).toBe("330.00");
    expect(s2.netToPay).toBe("4290.00");
  });

  it("situation 3 (100 %) : acompte entièrement récupéré", () => {
    expect(s3.periodWorksNet).toBe("6500.00");
    expect(s3.periodDepositDeduction).toBe("1950.00");
    expect(s3.gross).toBe("5460.00");
    expect(s3.periodRetention).toBe("390.00");
    expect(s3.netToPay).toBe("5070.00");
    expect(s3.overallPercent).toBe("100.00");
    expect(s3.cumulative.depositDeduction).toBe("4500.00");
  });

  it("acompte + situations = marché TTC ; retenue totale = 5 % du TTC", () => {
    const deposited = computeDepositInvoice({ contract, percent: "30" }).gross;
    expect(addMoney(deposited, s1.gross, s2.gross, s3.gross)).toBe("18000.00");
    expect(addMoney(s1.periodRetention, s2.periodRetention, s3.periodRetention)).toBe("900.00");
  });

  it("refuse un avancement qui diminue", () => {
    expect(() =>
      computeProgressInvoice({ contract, progress: { a: "20" }, previous: s1.cumulative, deposit, retentionRate: "5" }),
    ).toThrow(ProgressBillingError);
  });

  it("refuse un avancement hors 0–100 %", () => {
    expect(() =>
      computeProgressInvoice({ contract, progress: { a: "120" }, previous: null, deposit: null, retentionRate: "5" }),
    ).toThrow(ProgressBillingError);
  });
});

describe("arrondis cumulés", () => {
  const c: ProgressContract = {
    sections: [{ id: "s", lines: [{ id: "x", quantity: "1", unitPrice: "333.33", vatRate: "10.00", vatCategory: "S" }] }],
    discount: { kind: "none" },
    reverseCharge: false,
  };

  it("à 100 %, la somme des périodes égale exactement le marché", () => {
    const p1 = computeProgressInvoice({ contract: c, progress: { x: "33" }, previous: null, deposit: null, retentionRate: "0" });
    const p2 = computeProgressInvoice({ contract: c, progress: { x: "66" }, previous: p1.cumulative, deposit: null, retentionRate: "0" });
    const p3 = computeProgressInvoice({ contract: c, progress: { x: "100" }, previous: p2.cumulative, deposit: null, retentionRate: "0" });
    expect([p1.periodWorksNet, p2.periodWorksNet, p3.periodWorksNet]).toEqual(["110.00", "110.00", "113.33"]);
    expect(addMoney(p1.net, p2.net, p3.net)).toBe("333.33");
  });

  it("conserve l'avancement précédent d'une ligne non saisie", () => {
    const p1 = computeProgressInvoice({ contract: c, progress: { x: "50" }, previous: null, deposit: null, retentionRate: "0" });
    const p2 = computeProgressInvoice({ contract: c, progress: {}, previous: p1.cumulative, deposit: null, retentionRate: "0" });
    expect(p2.net).toBe("0.00");
    expect(p2.lines[0]!.currentPercent).toBe("50.00");
  });
});

describe("autoliquidation et remise", () => {
  it("autoliquidation : TVA nulle, retenue calculée sur le HT", () => {
    const c: ProgressContract = {
      sections: [{ id: "s", lines: [{ id: "x", quantity: "1", unitPrice: "10000.00", vatRate: "20.00", vatCategory: "S" }] }],
      discount: { kind: "none" },
      reverseCharge: true,
    };
    const p = computeProgressInvoice({ contract: c, progress: { x: "50" }, previous: null, deposit: null, retentionRate: "5" });
    expect(p.vatBreakdown).toEqual([{ vatCategory: "AE", vatRate: "0.00", base: "5000.00", vat: "0.00" }]);
    expect(p.gross).toBe("5000.00");
    expect(p.periodRetention).toBe("250.00");
    expect(p.netToPay).toBe("4750.00");
  });

  it("remise du marché appliquée au prorata de l'avancement", () => {
    const c: ProgressContract = {
      sections: [{ id: "s", lines: [{ id: "x", quantity: "1", unitPrice: "10000.00", vatRate: "20.00", vatCategory: "S" }] }],
      discount: { kind: "percent", value: "10" },
      reverseCharge: false,
    };
    const p = computeProgressInvoice({ contract: c, progress: { x: "50" }, previous: null, deposit: null, retentionRate: "0" });
    expect(p.contractNet).toBe("9000.00");
    expect(p.periodWorksGrossNet).toBe("5000.00");
    expect(p.periodDiscount).toBe("500.00");
    expect(p.net).toBe("4500.00");
    expect(p.gross).toBe("5400.00");
    expect(p.overallPercent).toBe("50.00");
  });

  it("taux de retenue de garantie plafonné à 5 %", () => {
    expect(isValidRetentionRate("5")).toBe(true);
    expect(isValidRetentionRate("0")).toBe(true);
    expect(isValidRetentionRate("5.01")).toBe(false);
  });
});
