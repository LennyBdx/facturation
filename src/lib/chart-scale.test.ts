import { describe, expect, it } from "vitest";
import { compactEuros, niceScale } from "./chart-scale";

describe("niceScale", () => {
  it("arrondit le maximum à un pas lisible", () => {
    expect(niceScale(47_710)).toEqual({ max: 60_000, ticks: [0, 20_000, 40_000, 60_000] });
    expect(niceScale(9_000)).toEqual({ max: 10_000, ticks: [0, 2_500, 5_000, 7_500, 10_000] });
    expect(niceScale(130)).toEqual({ max: 150, ticks: [0, 50, 100, 150] });
  });

  it("gère une série vide", () => {
    expect(niceScale(0)).toEqual({ max: 1, ticks: [0] });
  });
});

describe("compactEuros", () => {
  it("abrège les milliers", () => {
    expect(compactEuros(12_500).replace(/\s/g, " ")).toBe("12,5 k €");
  });
});
