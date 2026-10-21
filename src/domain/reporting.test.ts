import { describe, expect, it } from "vitest";
import { lastMonths, monthlyBilling } from "./reporting";

describe("lastMonths", () => {
  it("remonte les mois en franchissant l'année", () => {
    expect(lastMonths("2026-02-15", 4)).toEqual(["2025-11", "2025-12", "2026-01", "2026-02"]);
  });
});

describe("monthlyBilling", () => {
  const docs = [
    {
      issueDate: "2026-09-30",
      amount: "1000.00",
      credit: false,
      payments: [
        { date: "2026-10-05", amount: "400.00" },
        { date: "2026-10-20", amount: "600.00" }, // après « aujourd'hui » : ignoré
      ],
    },
    { issueDate: "2026-10-02", amount: "250.50", credit: false, payments: [] },
    { issueDate: "2026-10-10", amount: "100.00", credit: true, payments: [] },
    { issueDate: "2025-01-10", amount: "999.00", credit: false, payments: [] }, // hors période
  ];

  it("cumule le facturé (avoirs déduits) et l'encaissé par mois", () => {
    const months = monthlyBilling(docs, "2026-10-18", 3);
    expect(months).toEqual([
      { month: "2026-08", billed: "0.00", collected: "0.00" },
      { month: "2026-09", billed: "1000.00", collected: "0.00" },
      { month: "2026-10", billed: "150.50", collected: "400.00" },
    ]);
  });

  it("renvoie 12 mois par défaut, même vides", () => {
    expect(monthlyBilling([], "2026-10-18")).toHaveLength(12);
  });
});
