import { describe, expect, it } from "vitest";
import { by, formatSort, parseSort, sortRows, toggleSort } from "./sorting";

const KEYS = ["nom", "montant"] as const;
const fallback = { key: "nom", dir: "asc" } as const;

describe("parseSort / formatSort", () => {
  it("lit le sens et la clé", () => {
    expect(parseSort("montant", KEYS, fallback)).toEqual({ key: "montant", dir: "asc" });
    expect(parseSort("-montant", KEYS, fallback)).toEqual({ key: "montant", dir: "desc" });
    expect(formatSort({ key: "montant", dir: "desc" })).toBe("-montant");
  });

  it("revient au tri par défaut pour une clé inconnue ou absente", () => {
    expect(parseSort("-inconnu", KEYS, fallback)).toEqual(fallback);
    expect(parseSort(undefined, KEYS, fallback)).toEqual(fallback);
  });
});

describe("toggleSort", () => {
  it("inverse la colonne active, sinon applique le premier sens", () => {
    expect(toggleSort({ key: "nom", dir: "asc" }, "nom")).toEqual({ key: "nom", dir: "desc" });
    expect(toggleSort({ key: "nom", dir: "asc" }, "montant", "desc")).toEqual({
      key: "montant",
      dir: "desc",
    });
  });
});

describe("sortRows", () => {
  const rows = [
    { nom: "Éric", montant: "9.50" },
    { nom: "alice", montant: "100.00" },
    { nom: "Bruno", montant: "9.50" },
  ];
  const cmp = {
    nom: by.text<(typeof rows)[number]>((r) => r.nom),
    montant: by.decimal<(typeof rows)[number]>((r) => r.montant),
  };

  it("trie le texte dans l'ordre français, sans tenir compte de la casse ni des accents", () => {
    expect(sortRows(rows, { key: "nom", dir: "asc" }, cmp).map((r) => r.nom)).toEqual([
      "alice",
      "Bruno",
      "Éric",
    ]);
  });

  it("trie les montants numériquement, de façon stable", () => {
    expect(sortRows(rows, { key: "montant", dir: "desc" }, cmp).map((r) => r.nom)).toEqual([
      "alice",
      "Éric",
      "Bruno",
    ]);
    expect(sortRows(rows, { key: "montant", dir: "asc" }, cmp).map((r) => r.nom)).toEqual([
      "Éric",
      "Bruno",
      "alice",
    ]);
  });

  it("ne modifie pas la liste d'origine", () => {
    sortRows(rows, { key: "nom", dir: "desc" }, cmp);
    expect(rows[0].nom).toBe("Éric");
  });
});
