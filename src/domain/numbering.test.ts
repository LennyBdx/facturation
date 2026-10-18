import { describe, expect, it } from "vitest";
import { assignNextNumber, checkContinuity, formatDocumentNumber, validateNextValue } from "./numbering";

describe("numérotation continue", () => {
  const series = { prefix: "FA", nextValue: 41, padding: 4 };

  it("formate le numéro avec l'année d'émission", () => {
    expect(formatDocumentNumber(series, 7, "2026-10-18")).toBe("FA-2026-0007");
  });

  it("attribue des numéros successifs sans trou", () => {
    const a = assignNextNumber(series, "2026-10-18");
    const b = assignNextNumber(a.series, "2026-10-19");
    const c = assignNextNumber(b.series, "2027-01-02");
    expect([a.number, b.number, c.number]).toEqual(["FA-2026-0041", "FA-2026-0042", "FA-2027-0043"]);
    expect(c.series.nextValue).toBe(44);
    // la série d'origine n'est pas modifiée (fonction pure)
    expect(series.nextValue).toBe(41);
  });

  it("détecte trous, doublons et numéros hors format", () => {
    expect(checkContinuity(["FA-2026-0001", "FA-2026-0002", "FA-2026-0003"], "FA").ok).toBe(true);
    const report = checkContinuity(["FA-2026-0001", "FA-2026-0003", "FA-2026-0003", "AV-2026-0001"], "FA");
    expect(report.ok).toBe(false);
    expect(report.gaps).toEqual([2]);
    expect(report.duplicates).toEqual(["FA-2026-0003"]);
    expect(report.invalid).toEqual(["AV-2026-0001"]);
  });

  it("interdit de paramétrer un prochain numéro qui créerait un trou ou un doublon", () => {
    expect(validateNextValue(43, 42)).toBeNull();
    expect(validateNextValue(45, 42)).toMatch(/doit être 43/);
    expect(validateNextValue(40, 42)).toMatch(/doit être 43/);
    expect(validateNextValue(100, null)).toBeNull();
    expect(validateNextValue(0, null)).not.toBeNull();
  });

  it("refuse un compteur invalide", () => {
    expect(() => assignNextNumber({ ...series, nextValue: 0 }, "2026-01-01")).toThrow();
  });
});
