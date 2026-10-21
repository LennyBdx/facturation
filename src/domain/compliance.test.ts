import { describe, expect, it } from "vitest";
import {
  checkInvoiceCompliance,
  type ComplianceBuyer,
  type ComplianceInvoice,
  type ComplianceSeller,
} from "./compliance";
import { computePaymentStatus } from "./lifecycle";

const seller: ComplianceSeller = {
  name: "Électricité Exemple SAS",
  siren: "732829320",
  siret: "73282932000074",
  vatNumber: "FR44732829320",
  address: { line1: "12 rue des Artisans", postalCode: "69003", city: "Lyon", countryCode: "FR" },
  legalForm: "SAS",
  shareCapital: "10000.00",
  registration: "RCS Lyon",
  decennialInsurance: {
    insurer: "Assureur Fictif",
    policyNumber: "DEC-001",
    coverageArea: "France métropolitaine",
  },
};

const buyer: ComplianceBuyer = {
  name: "Bâtiment Général SARL",
  siren: "552100554",
  vatNumber: "FR96552100554",
  address: { line1: "3 avenue du Chantier", postalCode: "69007", city: "Lyon", countryCode: "FR" },
  isProfessional: true,
  isPublicBuyer: false,
};

const invoice: ComplianceInvoice = {
  kind: "progress",
  issueDate: "2026-10-01",
  dueDate: "2026-10-31",
  paymentTerms: "30 jours date de facture",
  latePenaltyRate: "10.00",
  mentionsRecoveryIndemnity: true,
  reverseCharge: false,
  operationCategory: "services",
  lines: [
    {
      description: "Tableau électrique",
      quantity: "1",
      unitPrice: "1200.00",
      vatRate: "20.00",
      vatCategory: "S",
    },
  ],
};

const ids = (r: ReturnType<typeof checkInvoiceCompliance>) => r.issues.map((i) => i.id);

describe("contrôle de conformité avant émission", () => {
  it("valide une facture complète", () => {
    const r = checkInvoiceCompliance({ seller, buyer, invoice });
    expect(r.issues).toEqual([]);
    expect(r.ok).toBe(true);
  });

  it("bloque si le SIREN du client professionnel manque", () => {
    const r = checkInvoiceCompliance({ seller, buyer: { ...buyer, siren: undefined }, invoice });
    expect(r.ok).toBe(false);
    expect(ids(r)).toContain("buyer.siren");
    expect(r.issues.find((i) => i.id === "buyer.siren")?.scope).toBe("buyer");
  });

  it("n'exige pas de SIREN pour un particulier", () => {
    const r = checkInvoiceCompliance({
      seller,
      buyer: { ...buyer, siren: undefined, vatNumber: undefined, isProfessional: false },
      invoice,
    });
    expect(r.ok).toBe(true);
  });

  it("détecte adresse, TVA, échéance et mentions manquantes", () => {
    const r = checkInvoiceCompliance({
      seller: { ...seller, vatNumber: "", decennialInsurance: undefined },
      buyer: {
        ...buyer,
        address: { line1: "", postalCode: "6900", city: "Lyon", countryCode: "FR" },
      },
      invoice: {
        ...invoice,
        dueDate: undefined,
        latePenaltyRate: "",
        mentionsRecoveryIndemnity: false,
        operationCategory: undefined,
      },
    });
    expect(ids(r)).toEqual(
      expect.arrayContaining([
        "seller.vatNumber",
        "seller.insurance",
        "buyer.address",
        "invoice.dueDate",
        "invoice.latePenaltyRate",
        "invoice.recoveryIndemnity",
        "invoice.operationCategory",
      ]),
    );
  });

  it("exige le n° de TVA du client et la catégorie AE en autoliquidation", () => {
    const r = checkInvoiceCompliance({
      seller,
      buyer: { ...buyer, vatNumber: undefined },
      invoice: { ...invoice, reverseCharge: true },
    });
    expect(ids(r)).toEqual(expect.arrayContaining(["buyer.vatNumber", "invoice.lines.0.vat"]));
    const ok = checkInvoiceCompliance({
      seller,
      buyer,
      invoice: {
        ...invoice,
        reverseCharge: true,
        lines: [{ ...invoice.lines[0]!, vatRate: "0.00", vatCategory: "AE" }],
      },
    });
    expect(ok.ok).toBe(true);
  });

  it("exige la facture d'origine pour un avoir", () => {
    const r = checkInvoiceCompliance({
      seller,
      buyer,
      invoice: { ...invoice, kind: "credit_note" },
    });
    expect(ids(r)).toContain("invoice.correctedInvoice");
  });

  it("signale sans bloquer le code service d'un acheteur public", () => {
    const r = checkInvoiceCompliance({ seller, buyer: { ...buyer, isPublicBuyer: true }, invoice });
    expect(r.ok).toBe(true);
    expect(ids(r)).toEqual(["buyer.serviceCode", "invoice.orderReference"]);
  });

  it("détecte une ligne sans désignation et une échéance antérieure à l'émission", () => {
    const r = checkInvoiceCompliance({
      seller,
      buyer,
      invoice: {
        ...invoice,
        dueDate: "2026-09-01",
        lines: [{ ...invoice.lines[0]!, description: " " }],
      },
    });
    expect(ids(r)).toEqual(
      expect.arrayContaining(["invoice.dueDate", "invoice.lines.0.description"]),
    );
  });
});

describe("statut de paiement", () => {
  const base = {
    issued: true,
    cancelled: false,
    amountDue: "1000.00",
    payments: [] as string[],
    dueDate: "2026-10-31",
    today: "2026-10-18",
  };
  it("dérive le statut", () => {
    expect(computePaymentStatus({ ...base, issued: false })).toBe("draft");
    expect(computePaymentStatus(base)).toBe("issued");
    expect(computePaymentStatus({ ...base, payments: ["400.00"] })).toBe("partially_paid");
    expect(computePaymentStatus({ ...base, payments: ["400.00", "600.00"] })).toBe("paid");
    expect(computePaymentStatus({ ...base, today: "2026-11-01" })).toBe("overdue");
    expect(computePaymentStatus({ ...base, cancelled: true })).toBe("cancelled");
  });
});
