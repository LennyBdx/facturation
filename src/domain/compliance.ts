import { type InvoiceKind, kindRules } from "./invoice-kinds";
import { Dec } from "./money";
import { validateSiren, validateSiret, validateVatNumber } from "./identifiers";
import type { VatCategory } from "./vat";

/**
 * Contrôle de conformité avant émission d'une facture.
 *
 * Mentions vérifiées (sources : art. L441-9 du Code de commerce, art. 242 nonies A
 * de l'annexe II du CGI, art. L243-2 du Code des assurances, et données exigées par
 * la réforme de la facturation électronique : SIREN de l'acheteur, catégorie de
 * l'opération, option pour la TVA sur les débits, adresse de livraison).
 *
 * Chaque anomalie indique la « portée » à corriger (vendeur → paramètres de
 * l'entreprise, acheteur → fiche client, facture → la facture elle-même).
 */

export interface ComplianceAddress {
  line1: string;
  postalCode: string;
  city: string;
  countryCode: string;
}

export interface ComplianceParty {
  name: string;
  siren?: string;
  siret?: string;
  vatNumber?: string;
  address?: ComplianceAddress;
}

export interface ComplianceSeller extends ComplianceParty {
  legalForm?: string;
  shareCapital?: string;
  /** Immatriculation RCS ou RM (ex. « RCS Lyon »). */
  registration?: string;
  decennialInsurance?: { insurer: string; policyNumber: string; coverageArea: string };
}

export interface ComplianceBuyer extends ComplianceParty {
  /** Professionnel (assujetti) : SIREN requis pour la facture électronique. */
  isProfessional: boolean;
  isPublicBuyer: boolean;
  /** Code service de l'acheteur public (facultatif mais recommandé). */
  serviceCode?: string;
}

export interface ComplianceInvoice {
  kind: InvoiceKind;
  issueDate?: string;
  dueDate?: string;
  paymentTerms?: string;
  /** Taux des pénalités de retard (en %). */
  latePenaltyRate?: string;
  /** Mention de l'indemnité forfaitaire de 40 € pour frais de recouvrement. */
  mentionsRecoveryIndemnity: boolean;
  reverseCharge: boolean;
  operationCategory?: "services" | "goods" | "mixed";
  orderReference?: string;
  /** Pour un avoir : numéro de la facture corrigée. */
  correctedInvoiceNumber?: string;
  lines: readonly {
    description: string;
    quantity: string;
    unitPrice: string;
    vatRate: string;
    vatCategory: VatCategory;
  }[];
}

export type ComplianceScope = "seller" | "buyer" | "invoice";

export interface ComplianceIssue {
  id: string;
  scope: ComplianceScope;
  message: string;
  /** `true` : empêche l'émission. `false` : simple recommandation. */
  blocking: boolean;
}

export interface ComplianceReport {
  ok: boolean;
  issues: ComplianceIssue[];
}

const blank = (v: string | undefined) => !v || !v.trim();

function addressIssues(
  scope: ComplianceScope,
  who: string,
  address?: ComplianceAddress,
): ComplianceIssue[] {
  if (!address || blank(address.line1) || blank(address.postalCode) || blank(address.city)) {
    return [
      {
        id: `${scope}.address`,
        scope,
        message: `Adresse ${who} incomplète (rue, code postal, ville).`,
        blocking: true,
      },
    ];
  }
  if (address.countryCode === "FR" && !/^\d{5}$/.test(address.postalCode)) {
    return [
      {
        id: `${scope}.postalCode`,
        scope,
        message: `Code postal ${who} invalide (5 chiffres).`,
        blocking: true,
      },
    ];
  }
  return [];
}

export function checkInvoiceCompliance(input: {
  seller: ComplianceSeller;
  buyer: ComplianceBuyer;
  invoice: ComplianceInvoice;
}): ComplianceReport {
  const { seller, buyer, invoice } = input;
  const issues: ComplianceIssue[] = [];
  const push = (issue: ComplianceIssue) => issues.push(issue);

  // --- Vendeur -------------------------------------------------------------
  if (blank(seller.name))
    push({
      id: "seller.name",
      scope: "seller",
      message: "Raison sociale de votre entreprise manquante.",
      blocking: true,
    });
  if (!seller.siren || !validateSiren(seller.siren).valid) {
    push({
      id: "seller.siren",
      scope: "seller",
      message: "SIREN de votre entreprise manquant ou invalide.",
      blocking: true,
    });
  }
  if (seller.siret && !validateSiret(seller.siret, seller.siren).valid) {
    push({
      id: "seller.siret",
      scope: "seller",
      message: "SIRET de votre entreprise invalide.",
      blocking: true,
    });
  }
  if (!seller.vatNumber || !validateVatNumber(seller.vatNumber, seller.siren).valid) {
    push({
      id: "seller.vatNumber",
      scope: "seller",
      message: "Numéro de TVA intracommunautaire de votre entreprise manquant ou invalide.",
      blocking: true,
    });
  }
  issues.push(...addressIssues("seller", "de votre entreprise", seller.address));
  if (blank(seller.legalForm))
    push({
      id: "seller.legalForm",
      scope: "seller",
      message: "Forme juridique de votre entreprise manquante.",
      blocking: true,
    });
  if (blank(seller.registration))
    push({
      id: "seller.registration",
      scope: "seller",
      message: "Immatriculation (RCS ou RM) de votre entreprise manquante.",
      blocking: true,
    });
  if (
    !seller.decennialInsurance ||
    blank(seller.decennialInsurance.insurer) ||
    blank(seller.decennialInsurance.policyNumber) ||
    blank(seller.decennialInsurance.coverageArea)
  ) {
    push({
      id: "seller.insurance",
      scope: "seller",
      message: "Assurance décennale incomplète (assureur, n° de contrat, couverture géographique).",
      blocking: true,
    });
  }

  // --- Acheteur ------------------------------------------------------------
  if (blank(buyer.name))
    push({ id: "buyer.name", scope: "buyer", message: "Nom du client manquant.", blocking: true });
  issues.push(...addressIssues("buyer", "de facturation du client", buyer.address));
  if (buyer.isProfessional) {
    if (!buyer.siren || !validateSiren(buyer.siren).valid) {
      push({
        id: "buyer.siren",
        scope: "buyer",
        message: "SIREN du client manquant ou invalide : obligatoire pour la facture électronique.",
        blocking: true,
      });
    }
  }
  if (
    invoice.reverseCharge &&
    (!buyer.vatNumber || !validateVatNumber(buyer.vatNumber, buyer.siren).valid)
  ) {
    push({
      id: "buyer.vatNumber",
      scope: "buyer",
      message: "Numéro de TVA du client obligatoire en autoliquidation.",
      blocking: true,
    });
  } else if (
    buyer.isProfessional &&
    buyer.vatNumber &&
    !validateVatNumber(buyer.vatNumber, buyer.siren).valid
  ) {
    push({
      id: "buyer.vatNumber",
      scope: "buyer",
      message: "Numéro de TVA du client invalide.",
      blocking: true,
    });
  }
  if (buyer.isPublicBuyer && blank(buyer.serviceCode)) {
    push({
      id: "buyer.serviceCode",
      scope: "buyer",
      message: "Code service de l'acheteur public non renseigné (recommandé).",
      blocking: false,
    });
  }

  // --- Facture -------------------------------------------------------------
  if (blank(invoice.issueDate))
    push({
      id: "invoice.issueDate",
      scope: "invoice",
      message: "Date d'émission manquante.",
      blocking: true,
    });
  if (kindRules(invoice.kind).isReceivable) {
    if (blank(invoice.dueDate))
      push({
        id: "invoice.dueDate",
        scope: "invoice",
        message: "Date d'échéance du paiement manquante.",
        blocking: true,
      });
    else if (invoice.issueDate && invoice.dueDate! < invoice.issueDate) {
      push({
        id: "invoice.dueDate",
        scope: "invoice",
        message: "La date d'échéance est antérieure à la date d'émission.",
        blocking: true,
      });
    }
    if (blank(invoice.paymentTerms))
      push({
        id: "invoice.paymentTerms",
        scope: "invoice",
        message: "Conditions de paiement manquantes.",
        blocking: true,
      });
    if (buyer.isProfessional) {
      if (blank(invoice.latePenaltyRate))
        push({
          id: "invoice.latePenaltyRate",
          scope: "invoice",
          message: "Taux des pénalités de retard manquant.",
          blocking: true,
        });
      if (!invoice.mentionsRecoveryIndemnity)
        push({
          id: "invoice.recoveryIndemnity",
          scope: "invoice",
          message:
            "Mention de l'indemnité forfaitaire de 40 € pour frais de recouvrement manquante.",
          blocking: true,
        });
    }
  } else if (blank(invoice.correctedInvoiceNumber)) {
    push({
      id: "invoice.correctedInvoice",
      scope: "invoice",
      message: "Un avoir doit mentionner la facture qu'il corrige.",
      blocking: true,
    });
  }
  if (!invoice.operationCategory) {
    push({
      id: "invoice.operationCategory",
      scope: "invoice",
      message:
        "Catégorie de l'opération (prestations de services, livraison de biens ou mixte) manquante.",
      blocking: true,
    });
  }
  if (invoice.lines.length === 0) {
    push({
      id: "invoice.lines",
      scope: "invoice",
      message: "La facture ne contient aucune ligne.",
      blocking: true,
    });
  }
  invoice.lines.forEach((line, i) => {
    const n = i + 1;
    if (blank(line.description))
      push({
        id: `invoice.lines.${i}.description`,
        scope: "invoice",
        message: `Ligne ${n} : désignation manquante.`,
        blocking: true,
      });
    const qty = new Dec(line.quantity || "NaN");
    if (qty.isNaN())
      push({
        id: `invoice.lines.${i}.quantity`,
        scope: "invoice",
        message: `Ligne ${n} : quantité invalide.`,
        blocking: true,
      });
    if (new Dec(line.unitPrice || "NaN").isNaN())
      push({
        id: `invoice.lines.${i}.unitPrice`,
        scope: "invoice",
        message: `Ligne ${n} : prix unitaire invalide.`,
        blocking: true,
      });
    if (invoice.reverseCharge && (line.vatCategory !== "AE" || !new Dec(line.vatRate).isZero())) {
      push({
        id: `invoice.lines.${i}.vat`,
        scope: "invoice",
        message: `Ligne ${n} : en autoliquidation, la TVA doit être en catégorie AE à 0 %.`,
        blocking: true,
      });
    }
    if (line.vatCategory === "S" && new Dec(line.vatRate).isZero()) {
      push({
        id: `invoice.lines.${i}.vatCategory`,
        scope: "invoice",
        message: `Ligne ${n} : taux de TVA à 0 % incompatible avec la catégorie « taux normal ».`,
        blocking: true,
      });
    }
  });
  if (buyer.isPublicBuyer && blank(invoice.orderReference)) {
    push({
      id: "invoice.orderReference",
      scope: "invoice",
      message: "Référence d'engagement ou de marché public non renseignée (recommandée).",
      blocking: false,
    });
  }

  return { ok: !issues.some((i) => i.blocking), issues };
}
