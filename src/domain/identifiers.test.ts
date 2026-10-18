import { describe, expect, it } from "vitest";
import {
  computeFrVatNumber,
  formatSiren,
  formatSiret,
  luhnValid,
  validateApeCode,
  validateSiren,
  validateSiret,
  validateVatNumber,
} from "./identifiers";

describe("SIREN", () => {
  it("accepte un SIREN valide, avec ou sans espaces", () => {
    expect(validateSiren("732 829 320")).toEqual({ valid: true, value: "732829320" });
    expect(validateSiren("552100554").valid).toBe(true);
  });

  it("refuse une clé de Luhn incorrecte", () => {
    const r = validateSiren("123456789");
    expect(r.valid).toBe(false);
  });

  it("explique une longueur incorrecte", () => {
    expect(validateSiren("73282932")).toEqual({
      valid: false,
      error: "Le SIREN doit comporter 9 chiffres (vous en avez saisi 8).",
    });
  });

  it("refuse les lettres et le vide", () => {
    expect(validateSiren("73282932A").valid).toBe(false);
    expect(validateSiren("").valid).toBe(false);
  });

  it("luhn", () => {
    expect(luhnValid("79927398713")).toBe(true);
    expect(luhnValid("79927398710")).toBe(false);
  });
});

describe("SIRET", () => {
  it("accepte un SIRET valide", () => {
    expect(validateSiret("732 829 320 00074").valid).toBe(true);
  });

  it("refuse un SIRET invalide", () => {
    expect(validateSiret("30326504500012").valid).toBe(false);
  });

  it("gère l'exception La Poste", () => {
    expect(validateSiret("35600000000048").valid).toBe(true); // siège, clé de Luhn valide
    expect(validateSiret("35600000012346").valid).toBe(true); // somme des chiffres = 30
    expect(validateSiret("35600000012345").valid).toBe(false); // somme = 29
  });

  it("vérifie la cohérence avec le SIREN", () => {
    const r = validateSiret("73282932000074", "552100554");
    expect(r).toEqual({ valid: false, error: "Le SIRET doit commencer par le SIREN de l'entreprise." });
  });

  it("explique une longueur incorrecte", () => {
    expect(validateSiret("7328293200007").valid).toBe(false);
  });
});

describe("TVA intracommunautaire", () => {
  it("calcule la clé française", () => {
    expect(computeFrVatNumber("303265045")).toBe("FR40303265045");
    expect(computeFrVatNumber("732829320")).toBe("FR44732829320");
  });

  it("accepte un numéro FR cohérent", () => {
    expect(validateVatNumber("FR 44 732 829 320").valid).toBe(true);
    expect(validateVatNumber("FR44732829320", "732829320").valid).toBe(true);
  });

  it("refuse une clé incorrecte", () => {
    expect(validateVatNumber("FR45732829320")).toEqual({
      valid: false,
      error: "La clé du numéro de TVA ne correspond pas au SIREN.",
    });
  });

  it("refuse un numéro sans code pays ou incohérent avec le SIREN", () => {
    expect(validateVatNumber("44732829320").valid).toBe(false);
    expect(validateVatNumber("FR44732829320", "552100554").valid).toBe(false);
  });

  it("accepte un numéro d'un autre État membre au format plausible", () => {
    expect(validateVatNumber("BE0123456789").valid).toBe(true);
    expect(validateVatNumber("DE1").valid).toBe(false);
  });
});

describe("code APE et formatage", () => {
  it("valide le code APE", () => {
    expect(validateApeCode("4321a").valid).toBe(true);
    expect(validateApeCode("432A").valid).toBe(false);
  });

  it("formate SIREN et SIRET", () => {
    expect(formatSiren("732829320")).toBe("732 829 320");
    expect(formatSiret("73282932000074")).toBe("732 829 320 00074");
  });
});
