import { describe, expect, it } from "vitest";
import { checkContinuity } from "@/domain/numbering";
import { addMoney, sumMoney } from "@/domain/money";
import { checkInvoiceCompliance } from "@/domain/compliance";
import { invoicePaymentStatus } from "@/services/builders";
import { buildSeed } from "./seed";

const seed = buildSeed();
const TODAY = "2026-10-18";

describe("jeu de données fictives", () => {
  it("respecte les volumes attendus", () => {
    expect(seed.organizations).toHaveLength(2);
    expect(seed.clients.length).toBeGreaterThanOrEqual(15);
    expect(seed.worksites.length).toBeGreaterThanOrEqual(10);
    expect(seed.quotes.length).toBeGreaterThanOrEqual(20);
    expect(seed.invoices.length).toBeGreaterThanOrEqual(30);
    expect(seed.receivedInvoices.length).toBeGreaterThanOrEqual(15);
  });

  it("numérote les factures sans trou, par entreprise et par série", () => {
    for (const org of seed.organizations) {
      const issued = seed.invoices.filter((i) => i.organizationId === org.id && i.number);
      const invoices = issued.filter((i) => i.kind !== "credit_note").map((i) => i.number!);
      const credits = issued.filter((i) => i.kind === "credit_note").map((i) => i.number!);
      expect(checkContinuity(invoices, org.settings.numbering.invoice.prefix).ok).toBe(true);
      expect(checkContinuity(credits, org.settings.numbering.creditNote.prefix).ok).toBe(true);
      expect(org.settings.numbering.invoice.nextValue).toBe(invoices.length + 1);
    }
  });

  it("n'attribue aucun numéro aux brouillons", () => {
    expect(seed.invoices.filter((i) => !i.issuedAt).every((i) => i.number === null)).toBe(true);
  });

  it("couvre tous les types et statuts demandés", () => {
    const kinds = new Set(seed.invoices.map((i) => i.kind));
    expect([...kinds].sort()).toEqual(["credit_note", "deposit", "final", "progress", "standard"]);
    const payment = new Set(seed.invoices.map((i) => invoicePaymentStatus(i, TODAY)));
    for (const s of ["draft", "issued", "partially_paid", "paid", "overdue", "cancelled"])
      expect(payment).toContain(s);
    const lifecycle = new Set(seed.invoices.map((i) => i.eInvoicing.status));
    for (const s of [
      "deposited",
      "made_available",
      "in_hand",
      "approved",
      "disputed",
      "suspended",
      "refused",
      "rejected",
      "cashed",
    ]) {
      expect(lifecycle).toContain(s);
    }
  });

  it("contient un chantier à 3 situations avec autoliquidation et retenue de garantie", () => {
    const situations = seed.invoices.filter(
      (i) => i.worksiteId === "ws-terrasses" && i.kind === "progress",
    );
    expect(situations.map((s) => s.progress!.index)).toEqual([1, 2, 3]);
    expect(situations.every((s) => s.reverseCharge && s.totals.vat === "0.00")).toBe(true);
    expect(sumMoney(situations.map((s) => s.totals.retention))).not.toBe("0.00");
  });

  it("solde à 100 % : acompte + solde = marché TTC (Maison Durand)", () => {
    const list = seed.invoices.filter((i) => i.worksiteId === "ws-durand");
    const total = addMoney(...list.map((i) => i.totals.gross));
    const quote = seed.quotes.find((q) => q.worksiteId === "ws-durand")!;
    expect(list.map((i) => i.kind).sort()).toEqual(["deposit", "final"]);
    // 14 540 € à 10 % + 520 € à 20 % = 16 618,00 € TTC
    expect(total).toBe("16618.00");
    expect(quote.status).toBe("accepted");
  });

  it("le brouillon de situation de l'hôtel est bloqué par le SIREN client manquant", () => {
    const draft = seed.invoices.find((i) => i.worksiteId === "ws-cedre" && !i.issuedAt)!;
    const org = seed.organizations.find((o) => o.id === draft.organizationId)!;
    const client = seed.clients.find((c) => c.id === draft.clientId)!;
    const report = checkInvoiceCompliance({
      seller: org,
      buyer: {
        ...client,
        address: client.billingAddress,
        isProfessional: true,
        isPublicBuyer: false,
      },
      invoice: { ...draft, mentionsRecoveryIndemnity: true, lines: draft.lines },
    });
    expect(report.issues.map((i) => i.id)).toContain("buyer.siren");
  });
});
