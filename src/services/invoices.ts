/**
 * Cas d'usage des factures émises : brouillons, contrôle de conformité, émission
 * et transmission à la plateforme agréée, suivi des statuts, paiements, avoirs.
 */
import { checkInvoiceCompliance, type ComplianceReport } from "@/domain/compliance";
import { TERMINAL_LIFECYCLE_STATUSES } from "@/domain/lifecycle";
import { compareMoney, type Money, type Percent, sumMoney, ZERO } from "@/domain/money";
import type { Client, Invoice, InvoiceInput, LifecycleEvent, Payment, PaymentMethod } from "@/data/types";
import {
  buildCreditNote,
  buildProgressInvoice,
  buyerSnapshot,
  depositNetForQuote,
  invoiceRemaining,
  isProfessionalClient,
  lastProgressInvoice,
  sellerSnapshot,
} from "./builders";
import type { Context } from "./context";
import { BusinessError, requireQuote } from "./quotes";

export { BusinessError };

export async function requireInvoice(ctx: Context, id: string): Promise<Invoice> {
  const invoice = await ctx.repos.invoices.get(ctx.orgId, id);
  if (!invoice) throw new BusinessError("Facture introuvable.");
  return invoice;
}

/** Une facture B2C n'est pas une facture électronique (e-reporting) : pas de transmission. */
export function goesThroughPlatform(client: Pick<Client, "kind">): boolean {
  return isProfessionalClient(client.kind);
}

export async function complianceFor(ctx: Context, invoice: Invoice, client: Client): Promise<ComplianceReport> {
  const pro = isProfessionalClient(client.kind);
  return checkInvoiceCompliance({
    seller: ctx.org,
    buyer: {
      name: client.name,
      siren: client.siren,
      siret: client.siret,
      vatNumber: client.vatNumber,
      address: client.billingAddress,
      isProfessional: pro,
      isPublicBuyer: client.kind === "public_buyer",
      serviceCode: client.serviceCode,
    },
    invoice: {
      kind: invoice.kind,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      paymentTerms: invoice.paymentTermsLabel,
      latePenaltyRate: invoice.latePenaltyRate,
      mentionsRecoveryIndemnity: true, // ajoutée automatiquement au document (voir legal-mentions)
      reverseCharge: invoice.reverseCharge,
      operationCategory: invoice.operationCategory,
      orderReference: invoice.orderReference,
      correctedInvoiceNumber: invoice.correctedInvoiceId
        ? ((await ctx.repos.invoices.get(ctx.orgId, invoice.correctedInvoiceId))?.number ?? undefined)
        : undefined,
      lines: invoice.lines,
    },
  });
}

/** Situation de travaux (brouillon) à partir d'un devis accepté. */
export async function createProgressDraft(ctx: Context, quoteId: string, progress: Record<string, Percent>, issueDate: string) {
  const quote = await requireQuote(ctx, quoteId);
  if (quote.status !== "accepted") throw new BusinessError("Le devis doit être accepté pour facturer une situation.");
  const [client, invoices] = await Promise.all([ctx.repos.clients.get(ctx.orgId, quote.clientId), ctx.repos.invoices.list(ctx.orgId, { quoteId })]);
  if (!client) throw new BusinessError("Client introuvable.");
  if (invoices.some((i) => (i.kind === "progress" || i.kind === "final") && !i.issuedAt)) {
    throw new BusinessError("Une situation est déjà en brouillon pour ce devis : émettez-la ou supprimez-la d'abord.");
  }
  const worksite = quote.worksiteId ? await ctx.repos.worksites.get(ctx.orgId, quote.worksiteId) : null;
  const retentionRate = worksite && !worksite.retentionReplacedByBond ? worksite.retentionRate : "0.00";
  const input = buildProgressInvoice({
    org: ctx.org,
    client,
    quote,
    worksite,
    issueDate,
    progress,
    previous: lastProgressInvoice(invoices, quoteId),
    depositNet: depositNetForQuote(invoices, quoteId),
    retentionRate,
    newId: () => crypto.randomUUID(),
  });
  return ctx.repos.invoices.create(ctx.orgId, input);
}

export async function updateDraft(
  ctx: Context,
  id: string,
  patch: Pick<InvoiceInput, "issueDate" | "dueDate" | "paymentTermsLabel" | "orderReference" | "notes" | "title">,
) {
  const invoice = await requireInvoice(ctx, id);
  if (invoice.issuedAt) throw new BusinessError("Une facture émise n'est plus modifiable : établissez un avoir.");
  return ctx.repos.invoices.update(ctx.orgId, id, patch);
}

export async function deleteDraft(ctx: Context, id: string) {
  const invoice = await requireInvoice(ctx, id);
  if (invoice.issuedAt) throw new BusinessError("Une facture émise ne peut pas être supprimée : établissez un avoir.");
  await ctx.repos.invoices.delete(ctx.orgId, id);
}

/**
 * Émission : contrôle de conformité bloquant, attribution du numéro (séquence
 * continue), figement des données vendeur/acheteur, puis dépôt sur la plateforme
 * agréée pour un client professionnel.
 */
export async function issueInvoice(ctx: Context, id: string): Promise<Invoice> {
  const invoice = await requireInvoice(ctx, id);
  if (invoice.issuedAt) throw new BusinessError("Cette facture est déjà émise.");
  const client = await ctx.repos.clients.get(ctx.orgId, invoice.clientId);
  if (!client) throw new BusinessError("Client introuvable.");
  const report = await complianceFor(ctx, invoice, client);
  if (!report.ok) throw new BusinessError("Des mentions obligatoires manquent : corrigez-les avant d'émettre.");

  const number = await ctx.repos.organizations.takeNextNumber(ctx.orgId, invoice.kind === "credit_note" ? "creditNote" : "invoice", invoice.issueDate);
  let issued = await ctx.repos.invoices.update(ctx.orgId, id, {
    number,
    issuedAt: new Date().toISOString(),
    seller: sellerSnapshot(ctx.org),
    buyer: buyerSnapshot(client),
  });

  if (invoice.kind === "credit_note" && invoice.correctedInvoiceId) {
    await ctx.repos.invoices.update(ctx.orgId, invoice.correctedInvoiceId, { cancelledByCreditNoteId: id });
  }

  if (goesThroughPlatform(client)) issued = await submit(ctx, issued);
  return issued;
}

async function submit(ctx: Context, invoice: Invoice): Promise<Invoice> {
  const result = await ctx.provider.submitInvoice(invoice);
  return ctx.repos.invoices.update(ctx.orgId, invoice.id, {
    eInvoicing: { platformInvoiceId: result.platformInvoiceId, status: result.status, events: [...invoice.eInvoicing.events, ...result.events] },
  });
}

/** Facture rejetée par la plateforme (213) : correction puis nouveau dépôt. */
export async function resubmitInvoice(ctx: Context, id: string): Promise<Invoice> {
  const invoice = await requireInvoice(ctx, id);
  if (invoice.eInvoicing.status !== "rejected") throw new BusinessError("Seule une facture rejetée peut être redéposée.");
  const client = await ctx.repos.clients.get(ctx.orgId, invoice.clientId);
  if (!client) throw new BusinessError("Client introuvable.");
  const report = await complianceFor(ctx, invoice, client);
  if (!report.ok) throw new BusinessError("Corrigez d'abord les données signalées.");
  if (client.kind === "public_buyer" && !client.serviceCode) {
    throw new BusinessError("Le code service de l'acheteur public est toujours absent : complétez la fiche client.");
  }
  // Les données de l'acheteur sont re-figées à partir de la fiche client corrigée.
  const refreshed = await ctx.repos.invoices.update(ctx.orgId, id, { buyer: buyerSnapshot(client) });
  return submit(ctx, refreshed);
}

/** Synchronise les statuts depuis la plateforme (appelé à l'affichage de la fiche). */
export async function refreshInvoiceStatus(ctx: Context, id: string): Promise<Invoice> {
  const invoice = await requireInvoice(ctx, id);
  const pid = invoice.eInvoicing.platformInvoiceId;
  if (!pid || (invoice.eInvoicing.status && TERMINAL_LIFECYCLE_STATUSES.includes(invoice.eInvoicing.status))) return invoice;
  const status = await ctx.provider.getInvoiceStatus(pid);
  if (!status) return invoice;
  const known = new Set(invoice.eInvoicing.events.map((e) => `${e.status}|${e.at}`));
  const fresh = status.events.filter((e) => !known.has(`${e.status}|${e.at}`));
  if (fresh.length === 0) return invoice;
  const events = mergeEvents(invoice.eInvoicing.events, fresh);
  return ctx.repos.invoices.update(ctx.orgId, id, { eInvoicing: { ...invoice.eInvoicing, status: events.at(-1)!.status, events } });
}

function mergeEvents(current: LifecycleEvent[], fresh: LifecycleEvent[]): LifecycleEvent[] {
  const byKey = new Map(current.map((e) => [`${e.status}|${e.at}`, e]));
  for (const e of fresh) byKey.set(`${e.status}|${e.at}`, e);
  return [...byKey.values()].sort((a, b) => a.at.localeCompare(b.at));
}

/** Enregistre un paiement ; à solde nul, déclare l'encaissement (statut 212). */
export async function recordPayment(ctx: Context, id: string, payment: { date: string; amount: Money; method: PaymentMethod; reference?: string }) {
  const invoice = await requireInvoice(ctx, id);
  if (!invoice.issuedAt) throw new BusinessError("Émettez la facture avant d'enregistrer un paiement.");
  if (invoice.kind === "credit_note") throw new BusinessError("Un avoir ne reçoit pas de paiement.");
  if (invoice.cancelledByCreditNoteId) throw new BusinessError("Cette facture est annulée par un avoir.");
  const remaining = invoiceRemaining(invoice);
  if (compareMoney(payment.amount, ZERO) <= 0) throw new BusinessError("Le montant doit être positif.");
  if (compareMoney(payment.amount, remaining) > 0) {
    throw new BusinessError(`Le montant dépasse le reste à payer (${remaining.replace(".", ",")} €).`);
  }
  const payments: Payment[] = [...invoice.payments, { id: crypto.randomUUID(), ...payment }];
  let updated = await ctx.repos.invoices.update(ctx.orgId, id, { payments });
  const fullyPaid = compareMoney(sumMoney(payments.map((p) => p.amount)), invoice.totals.netToPay) >= 0;
  if (fullyPaid && invoice.eInvoicing.platformInvoiceId) {
    const event = await ctx.provider.reportPayment(invoice.eInvoicing.platformInvoiceId, payment);
    updated = await ctx.repos.invoices.update(ctx.orgId, id, {
      eInvoicing: { ...updated.eInvoicing, status: "cashed", events: [...updated.eInvoicing.events, event] },
    });
  }
  return updated;
}

/** Avoir d'annulation totale (brouillon), à émettre ensuite. */
export async function createCreditNote(ctx: Context, id: string, reason: string) {
  const invoice = await requireInvoice(ctx, id);
  if (!invoice.issuedAt) throw new BusinessError("Un brouillon se supprime ; l'avoir concerne une facture émise.");
  if (invoice.kind === "credit_note") throw new BusinessError("Un avoir ne peut pas être annulé par un autre avoir dans le prototype.");
  if (invoice.cancelledByCreditNoteId) throw new BusinessError("Cette facture est déjà annulée par un avoir.");
  if (invoice.payments.length > 0) throw new BusinessError("Cette facture a reçu des paiements : traitez le remboursement avant l'avoir.");
  const existing = (await ctx.repos.invoices.list(ctx.orgId)).find((i) => i.correctedInvoiceId === id && !i.issuedAt);
  if (existing) return existing;
  return ctx.repos.invoices.create(ctx.orgId, buildCreditNote({ invoice, issueDate: ctx.today, reason, newId: () => crypto.randomUUID() }));
}
