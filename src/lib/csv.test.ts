import { describe, expect, it } from "vitest";
import { csvCell, csvDate, csvMoney, toCsv } from "./csv";

describe("csvCell", () => {
  it("échappe séparateurs, guillemets et retours à la ligne", () => {
    expect(csvCell("Dupont; Fils")).toBe('"Dupont; Fils"');
    expect(csvCell('Le "Cèdre"')).toBe('"Le ""Cèdre"""');
    expect(csvCell("ligne 1\nligne 2")).toBe('"ligne 1\nligne 2"');
    expect(csvCell(null)).toBe("");
  });

  it("neutralise les formules mais garde les nombres négatifs", () => {
    expect(csvCell("=1+1")).toBe("'=1+1");
    expect(csvCell('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`);
    expect(csvCell("@SUM(A1)")).toBe("'@SUM(A1)");
    expect(csvCell("-504,00")).toBe("-504,00");
  });
});

describe("toCsv", () => {
  it("produit un en-tête, des lignes CRLF et un BOM UTF-8", () => {
    const csv = toCsv(
      [{ n: "Élise", m: "12.50" }],
      [
        { header: "Nom", value: (r) => r.n },
        { header: "Montant", value: (r) => csvMoney(r.m) },
      ],
    );
    expect(csv).toBe("﻿Nom;Montant\r\nÉlise;12,50\r\n");
  });
});

describe("formats", () => {
  it("convertit montants et dates", () => {
    expect(csvMoney("1234.50")).toBe("1234,50");
    expect(csvDate("2026-10-18")).toBe("18/10/2026");
    expect(csvDate("2026-10-18T10:00:00.000Z")).toBe("18/10/2026");
  });
});
