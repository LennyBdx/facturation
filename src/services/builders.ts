/**
 * Constructeurs purs de documents (aucun accès aux données).
 * Utilisés par les services ET par le jeu de données fictives, pour que les montants
 * fictifs soient produits par les mêmes calculs que l'application.
 */
import "server-only";
import { kindRules } from "@/domain/invoice-kinds";
import { addDays, computePaymentStatus, type PaymentStatus, remainingDue } from "@/domain/lifecycle";
import { compareMoney, type Money, type Percent, sumMoney, ZERO } from "@/domain/money";
import {
  computeDepositInvoice,
  computeProgressInvoice,
  type ProgressContract,
  type ProgressInvoiceResult,
} from "@/domain/progress-billing";
import { computeQuoteTotals, lineNet, type QuoteTotals } from "@/domain/quote";
import { formatVatRateLabel } from "@/domain/vat";
import type {
  BuyerSnapshot,
  Client,
  Invoice,
  InvoiceInput,
  InvoiceLine,
  InvoiceTotals,
  Organization,
  Quote,
  SellerSnapshot,
  Worksite,
} from "@/data/types";

type Id = () => string;

export function quoteTotals(quote: Pick<Quote, "sections" | "discount" | "reverseCharge" | "depositPercent">): QuoteTotals {
  return computeQuoteTotals(quote);
}

export function quoteToContract(quote: Pick<Quote, "sections" | "discount" | "reverseCharge">): ProgressContract {
  return { sections: quote.sections, discount: quote.discount, reverseCharge: quote.reverseCharge };
}

export function sellerSnapshot(org: Organization): SellerSnapshot {
  return {
    name: org.name,
    legalForm: org.legalForm,
    shareCapital: org.shareCapital,
    siren: org.siren,
    siret: org.siret,
    vatNumber: org.vatNumber,
    registration: org.registration,
    address: org.address,
    contact: { email: org.contact.email, phone: org.contact.phone },
    decennialInsurance: org.decennialInsurance,
    bank: org.bank,
  };
}

export function buyerSnapshot(client: Client): BuyerSnapshot {
  return {
    name: client.name,
    kind: client.kind,
    siren: client.siren,
    siret: client.siret,
    vatNumber: client.vatNumber,
    address: client.billingAddress,
    serviceCode: client.serviceCode,
  };
}

export function isProfessionalClient(kind: Client["kind"]): boolean {
  return kind !== "individual";
}

/** Champs communs d'un brouillon de facture. */
function draftBase(params: {
  org: Organization;
  client: Client;
  quote: Quote | null;
  worksite: Worksite | null;
  issueDate: string;
  title: string;
}): Omit<InvoiceInput, "kind" | "lines" | "totals" | "progress"> {
  const { org, client, quote, worksite, issueDate } = params;
  const days = client.paymentTermsDays || org.settings.defaultPaymentTermsDays;
  return {
    number: null,
    clientId: client.id,
    worksiteId: worksite?.id ?? quote?.worksiteId ?? null,
    quoteId: quote?.id ?? null,
    correctedInvoiceId: null,
    cancelledByCreditNoteId: null,
    title: params.title,
    issueDate,
    dueDate: addDays(issueDate, days),
    paymentTermsLabel: `Paiement à ${days} jours date de facture, par virement.`,
    latePenaltyRate: org.settings.latePenaltyRate,
    operationCategory: "services",
    orderReference: worksite?.marketReference,
    reverseCharge: quote?.reverseCharge ?? worksite?.reverseCharge ?? false,
    seller: null,
    buyer: null,
    issuedAt: null,
    payments: [],
    eInvoicing: { platformInvoiceId: null, status: null, events: [] },
  };
}

function simpleTotals(t: { vatBreakdown: InvoiceTotals["vatBreakdown"]; net: Money; vat: Money; gross: Money }, discount: Money = ZERO): InvoiceTotals {
  return { ...t, discount, depositDeduction: ZERO, retention: ZERO, netToPay: t.gross };
}

export type InvoiceContent = Pick<Quote, "title" | "sections" | "discount" | "reverseCharge">;

/** Facture unique reprenant toutes les lignes d'un devis (ou d'un contenu libre). */
export function buildStandardInvoice(params: {
  org: Organization;
  client: Client;
  /** Devis d'origine, `null` pour une facture directe (dépannage). */
  quote: Quote | null;
  /** Contenu facturé ; par défaut celui du devis. */
  content?: InvoiceContent;
  worksite: Worksite | null;
  issueDate: string;
  newId: Id;
}): InvoiceInput {
  const quote = params.content ?? params.quote;
  if (!quote) throw new Error("Contenu de facture manquant.");
  const totals = quoteTotals({ ...quote, depositPercent: "0" });
  const lines: InvoiceLine[] = quote.sections.flatMap((s) =>
    s.lines.map((l) => ({
      id: params.newId(),
      quoteLineId: l.id,
      sectionTitle: s.title,
      description: l.description,
      quantity: l.quantity,
      unit: l.unit,
      unitPrice: l.unitPrice,
      vatRate: quote.reverseCharge ? "0.00" : l.vatRate,
      vatCategory: quote.reverseCharge ? "AE" : l.vatCategory,
      net: totals.lineNets[l.id] ?? lineNet(l),
    })),
  );
  return {
    ...draftBase({ ...params, quote: params.quote, title: quote.title }),
    reverseCharge: quote.reverseCharge,
    kind: "standard",
    lines,
    totals: simpleTotals(totals, totals.discountAmount),
    progress: null,
  };
}

/** Facture d'acompte : `percent` % du marché HT. */
export function buildDepositInvoice(params: {
  org: Organization;
  client: Client;
  quote: Quote;
  worksite: Worksite | null;
  issueDate: string;
  percent: Percent;
  newId: Id;
}): InvoiceInput {
  const { quote, percent } = params;
  const deposit = computeDepositInvoice({ contract: quoteToContract(quote), percent });
  const lines: InvoiceLine[] = deposit.vatBreakdown.map((b) => ({
    id: params.newId(),
    description:
      deposit.vatBreakdown.length > 1
        ? `Acompte de ${formatVatRateLabel(percent)} sur devis ${quote.number} (TVA ${formatVatRateLabel(b.vatRate)})`
        : `Acompte de ${formatVatRateLabel(percent)} sur devis ${quote.number}`,
    quantity: "1",
    unit: "forfait",
    unitPrice: b.base,
    vatRate: b.vatRate,
    vatCategory: b.vatCategory,
    net: b.base,
  }));
  return {
    ...draftBase({ ...params, title: `Acompte — ${quote.title}` }),
    kind: "deposit",
    depositPercent: percent,
    lines,
    totals: simpleTotals(deposit),
    progress: null,
  };
}

/** Montant HT des acomptes émis et non annulés sur un devis. */
export function depositNetForQuote(invoices: readonly Invoice[], quoteId: string): Money {
  return sumMoney(
    invoices
      .filter((i) => i.quoteId === quoteId && i.kind === "deposit" && i.issuedAt && !i.cancelledByCreditNoteId)
      .map((i) => i.totals.net),
  );
}

/** Dernière situation émise (non annulée) d'un devis. */
export function lastProgressInvoice(invoices: readonly Invoice[], quoteId: string): Invoice | null {
  const list = invoices
    .filter((i) => i.quoteId === quoteId && kindRules(i.kind).isProgress && i.issuedAt && !i.cancelledByCreditNoteId && i.progress)
    .sort((a, b) => a.progress!.index - b.progress!.index);
  return list.at(-1) ?? null;
}

export function progressToInvoiceParts(
  quote: Quote,
  result: ProgressInvoiceResult,
  newId: Id,
): Pick<InvoiceInput, "lines" | "totals" | "progress"> & { retentionRate: Percent } {
  const byId = new Map(result.lines.map((l) => [l.lineId, l]));
  const lines: InvoiceLine[] = quote.sections.flatMap((s) =>
    s.lines.map((l) => {
      const r = byId.get(l.id)!;
      return {
        id: newId(),
        quoteLineId: l.id,
        sectionTitle: s.title,
        description: l.description,
        quantity: l.quantity,
        unit: l.unit,
        unitPrice: l.unitPrice,
        vatRate: quote.reverseCharge ? "0.00" : l.vatRate,
        vatCategory: quote.reverseCharge ? "AE" : l.vatCategory,
        net: r.periodAmount,
        progress: {
          contractNet: r.contractNet,
          previousPercent: r.previousPercent,
          currentPercent: r.currentPercent,
          previousAmount: r.previousAmount,
          cumulativeAmount: r.cumulativeAmount,
        },
      };
    }),
  );
  return {
    lines,
    totals: {
      vatBreakdown: result.vatBreakdown,
      net: result.net,
      vat: result.vat,
      gross: result.gross,
      discount: result.periodDiscount,
      depositDeduction: result.periodDepositDeduction,
      retention: result.periodRetention,
      netToPay: result.netToPay,
    },
    progress: {
      index: result.index,
      retentionRate: result.retentionRate,
      overallPercent: result.overallPercent,
      cumulative: result.cumulative,
    },
    retentionRate: result.retentionRate,
  };
}

/** Situation de travaux (ou facture de solde si tout est à 100 %). */
export function buildProgressInvoice(params: {
  org: Organization;
  client: Client;
  quote: Quote;
  worksite: Worksite | null;
  issueDate: string;
  progress: Record<string, Percent>;
  previous: Invoice | null;
  depositNet: Money;
  retentionRate: Percent;
  newId: Id;
}): InvoiceInput {
  const { quote, previous } = params;
  const result = computeProgressInvoice({
    contract: quoteToContract(quote),
    progress: params.progress,
    previous: previous?.progress?.cumulative ?? null,
    deposit: compareMoney(params.depositNet, ZERO) > 0 ? { net: params.depositNet } : null,
    retentionRate: params.retentionRate,
  });
  const parts = progressToInvoiceParts(quote, result, params.newId);
  const isFinal = result.overallPercent === "100.00";
  return {
    ...draftBase({
      ...params,
      title: isFinal ? `Solde — ${quote.title}` : `Situation n° ${result.index} — ${quote.title}`,
    }),
    kind: isFinal ? "final" : "progress",
    lines: parts.lines,
    totals: parts.totals,
    progress: parts.progress,
  };
}

/** Avoir d'annulation totale d'une facture émise. */
export function buildCreditNote(params: { invoice: Invoice; issueDate: string; reason: string; newId: Id }): InvoiceInput {
  const { invoice } = params;
  return {
    number: null,
    kind: "credit_note",
    clientId: invoice.clientId,
    worksiteId: invoice.worksiteId,
    quoteId: invoice.quoteId,
    correctedInvoiceId: invoice.id,
    cancelledByCreditNoteId: null,
    title: `Avoir sur facture ${invoice.number ?? ""} — ${params.reason}`.trim(),
    issueDate: params.issueDate,
    dueDate: params.issueDate,
    paymentTermsLabel: "Remboursement ou imputation sur la prochaine facture.",
    latePenaltyRate: invoice.latePenaltyRate,
    operationCategory: invoice.operationCategory,
    orderReference: invoice.orderReference,
    reverseCharge: invoice.reverseCharge,
    progress: null,
    lines: invoice.lines.map((l) => ({ ...l, id: params.newId() })),
    totals: structuredClone(invoice.totals),
    seller: null,
    buyer: null,
    issuedAt: null,
    payments: [],
    eInvoicing: { platformInvoiceId: null, status: null, events: [] },
    notes: params.reason,
  };
}

export function invoicePaymentStatus(invoice: Invoice, today: string): PaymentStatus {
  if (!kindRules(invoice.kind).isReceivable) return invoice.issuedAt ? "issued" : "draft";
  return computePaymentStatus({
    issued: invoice.issuedAt !== null,
    cancelled: invoice.cancelledByCreditNoteId !== null,
    amountDue: invoice.totals.netToPay,
    payments: invoice.payments.map((p) => p.amount),
    dueDate: invoice.dueDate,
    today,
  });
}

export function invoiceRemaining(invoice: Invoice): Money {
  if (!invoice.issuedAt || invoice.cancelledByCreditNoteId || !kindRules(invoice.kind).isReceivable) return ZERO;
  return remainingDue(invoice.totals.netToPay, invoice.payments.map((p) => p.amount));
}

/** Retenue de garantie cumulée retenue sur un ensemble de factures émises. */
export function retentionHeld(invoices: readonly Invoice[]): Money {
  return sumMoney(
    invoices.filter((i) => i.issuedAt && !i.cancelledByCreditNoteId && kindRules(i.kind).isReceivable).map((i) => i.totals.retention),
  );
}
