/**
 * Mentions légales des documents (devis et factures), en fonction du contexte.
 * Sources principales : art. L441-9 et L441-10 du Code de commerce, art. 242 nonies A
 * annexe II du CGI, art. 283-2 nonies du CGI, art. L243-2 du Code des assurances,
 * loi n° 71-584 du 16 juillet 1971 (retenue de garantie).
 */
import { formatSiren } from "@/domain/identifiers";
import { REVERSE_CHARGE_MENTION } from "@/domain/vat";
import type { BuyerSnapshot, Invoice, Organization, Quote, SellerSnapshot } from "@/data/types";
import { formatDate, formatMoney, formatPercent } from "@/lib/format";

export function sellerIdentityLine(s: Pick<SellerSnapshot, "name" | "legalForm" | "shareCapital" | "siren" | "registration" | "vatNumber">, apeCode?: string): string {
  return [
    `${s.name} — ${s.legalForm} au capital de ${formatMoney(s.shareCapital)}`,
    `SIREN ${formatSiren(s.siren)} — ${s.registration}`,
    `TVA ${s.vatNumber}`,
    apeCode ? `APE ${apeCode}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

export function insuranceMention(i: SellerSnapshot["decennialInsurance"]): string {
  return `Assurance responsabilité civile décennale : ${i.insurer}, contrat n° ${i.policyNumber}, couverture géographique : ${i.coverageArea}.`;
}

const hasReducedRate = (rates: string[]) => rates.some((r) => r === "10.00" || r === "5.50");

export function invoiceMentions(params: {
  invoice: Invoice;
  seller: SellerSnapshot;
  buyer: BuyerSnapshot;
  org: Organization;
  correctedInvoice?: Pick<Invoice, "number" | "issueDate"> | null;
}): string[] {
  const { invoice, seller, buyer, org, correctedInvoice } = params;
  const pro = buyer.kind !== "individual";
  const m: string[] = [];
  if (invoice.kind === "credit_note" && correctedInvoice) {
    m.push(`Avoir se rapportant à la facture n° ${correctedInvoice.number} du ${formatDate(correctedInvoice.issueDate)}.`);
  }
  if (invoice.kind === "deposit") m.push("Facture d'acompte : le montant sera déduit des factures de situation ou de solde.");
  if (invoice.reverseCharge) m.push(REVERSE_CHARGE_MENTION);
  if (!invoice.reverseCharge && !pro && hasReducedRate(invoice.lines.map((l) => l.vatRate))) {
    m.push("Taux réduit de TVA appliqué aux travaux dans un logement achevé depuis plus de deux ans (art. 279-0 bis du CGI), sur attestation du client.");
  }
  m.push(
    `Catégorie de l'opération : ${invoice.operationCategory === "services" ? "prestation de services" : invoice.operationCategory === "goods" ? "livraison de biens" : "mixte (biens et services)"}. TVA exigible à l'encaissement.`,
  );
  if (invoice.totals.retention !== "0.00" && invoice.progress) {
    m.push(`Retenue de garantie de ${formatPercent(invoice.progress.retentionRate)} (loi n° 71-584 du 16 juillet 1971), restituée un an après la réception des travaux sauf réserves.`);
  }
  if (invoice.kind !== "credit_note") {
    m.push(`Conditions de paiement : ${invoice.paymentTermsLabel} Échéance : ${formatDate(invoice.dueDate)}.`);
    m.push(
      pro
        ? `En cas de retard de paiement : pénalités au taux annuel de ${formatPercent(invoice.latePenaltyRate)} et indemnité forfaitaire pour frais de recouvrement de 40 € (art. L441-10 et D441-5 du Code de commerce).`
        : `En cas de retard de paiement, des pénalités au taux annuel de ${formatPercent(invoice.latePenaltyRate)} pourront être appliquées.`,
    );
  }
  if (org.settings.customLegalMentions) m.push(org.settings.customLegalMentions);
  m.push(insuranceMention(seller.decennialInsurance));
  m.push(`Règlement par virement : IBAN ${seller.bank.iban} — BIC ${seller.bank.bic}.`);
  return m;
}

export function quoteMentions(params: { quote: Quote; org: Organization; buyerKind: BuyerSnapshot["kind"]; depositAmount: string }): string[] {
  const { quote, org, buyerKind, depositAmount } = params;
  const m: string[] = [];
  m.push(`Devis gratuit, valable jusqu'au ${formatDate(quote.validUntil)}.`);
  if (quote.estimatedDuration) m.push(`Durée estimée des travaux : ${quote.estimatedDuration}.`);
  if (quote.depositPercent !== "0.00") {
    m.push(`Acompte de ${formatPercent(quote.depositPercent)} à la commande, soit ${formatMoney(depositAmount)}.`);
  }
  if (quote.reverseCharge) m.push(REVERSE_CHARGE_MENTION);
  if (!quote.reverseCharge && buyerKind === "individual" && hasReducedRate(quote.sections.flatMap((s) => s.lines.map((l) => l.vatRate)))) {
    m.push("TVA à taux réduit sous réserve de la remise de l'attestation prévue à l'art. 279-0 bis du CGI.");
  }
  m.push(`Conditions de paiement : ${org.settings.paymentTermsLabel}`);
  if (org.settings.customLegalMentions) m.push(org.settings.customLegalMentions);
  m.push(insuranceMention(org.decennialInsurance));
  return m;
}
