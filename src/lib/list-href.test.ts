import { describe, expect, it } from "vitest";
import { listHref } from "./list-href";

describe("listHref", () => {
  it("conserve recherche et filtre, retire les valeurs vides", () => {
    expect(listHref("/app/devis", { q: "toit", filtre: undefined, tri: "" })).toBe(
      "/app/devis?q=toit",
    );
  });

  it("revient en page 1 sauf si la page est demandée", () => {
    expect(listHref("/app/devis", { q: "a", page: "3" }, { tri: "-montant" })).toBe(
      "/app/devis?q=a&tri=-montant",
    );
    expect(listHref("/app/devis", { q: "a", tri: "nom" }, { page: "2" })).toBe(
      "/app/devis?q=a&tri=nom&page=2",
    );
  });

  it("encode les caractères spéciaux", () => {
    expect(listHref("/app/clients", { q: "Dupont & Fils" })).toBe("/app/clients?q=Dupont+%26+Fils");
  });
});
