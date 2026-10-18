import { daysBetween, LIFECYCLE_NEEDS_ACTION } from "@/domain/lifecycle";
import { compareMoney, sumMoney, ZERO } from "@/domain/money";
import type { Invoice, Quote, ReceivedInvoice, Worksite } from "@/data/types";
import { invoicePaymentStatus, invoiceRemaining, quoteTotals } from "./builders";
import type { Context } from "./context";

/** Statuts de factures reçues demandant une action (à traiter). */
export const RECEIVED_TO_PROCESS = ["received", "made_available", "in_hand"] as const;

export function receivedNeedsAction(r: ReceivedInvoice): boolean {
  return (RECEIVED_TO_PROCESS as readonly string[]).includes(r.status);
}

export function invoiceNeedsCorrection(i: Invoice): boolean {
  return !!i.issuedAt && !i.cancelledByCreditNoteId && !!i.eInvoicing.status && LIFECYCLE_NEEDS_ACTION.includes(i.eInvoicing.status);
}

/** Retenue de garantie à récupérer : réception + 1 an dépassé (loi n° 71-584). */
export function retentionReleaseDate(w: Worksite): string | null {
  if (!w.acceptanceDate) return null;
  const d = new Date(`${w.acceptanceDate}T00:00:00Z`);
  d.setUTCFullYear(d.getUTCFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

export async function getNavBadges(ctx: Context) {
  const [received, invoices] = await Promise.all([
    ctx.repos.receivedInvoices.list(ctx.orgId),
    ctx.repos.invoices.list(ctx.orgId),
  ]);
  return {
    received: received.filter(receivedNeedsAction).length,
    rejected: invoices.filter(invoiceNeedsCorrection).length,
  };
}

export async function getDashboard(ctx: Context) {
  const { repos, orgId, today } = ctx;
  const [invoices, quotes, worksites, received, clients] = await Promise.all([
    repos.invoices.list(orgId),
    repos.quotes.list(orgId),
    repos.worksites.list(orgId),
    repos.receivedInvoices.list(orgId),
    repos.clients.list(orgId),
  ]);
  const clientName = new Map(clients.map((c) => [c.id, c.name]));
  const month = today.slice(0, 7);

  const issued = invoices.filter((i) => i.issuedAt && !i.cancelledByCreditNoteId);
  const billedThisMonth = sumMoney(
    issued
      .filter((i) => i.issueDate.startsWith(month))
      .map((i) => (i.kind === "credit_note" ? `-${i.totals.net}` : i.totals.net)),
  );
  const outstanding = issued.map((i) => ({ invoice: i, remaining: invoiceRemaining(i) })).filter((x) => compareMoney(x.remaining, ZERO) > 0);
  const overdue = outstanding.filter((x) => invoicePaymentStatus(x.invoice, today) === "overdue");

  const pendingQuotes = quotes.filter((q) => q.status === "sent");
  const quotesToFollowUp = pendingQuotes
    .map((q) => ({ quote: q, days: daysBetween(q.sentAt?.slice(0, 10) ?? q.issueDate, today) }))
    .filter((x) => x.days >= 15)
    .sort((a, b) => b.days - a.days);

  // Retenues : montants retenus sur les chantiers dont la retenue n'est pas libérée.
  const retentionByWorksite = worksites
    .filter((w) => !w.retentionReleased)
    .map((w) => {
      const held = sumMoney(issued.filter((i) => i.worksiteId === w.id && i.kind !== "credit_note").map((i) => i.totals.retention));
      const releaseDate = retentionReleaseDate(w);
      return { worksite: w, held, releaseDate, releasable: releaseDate !== null && releaseDate <= today };
    })
    .filter((r) => compareMoney(r.held, ZERO) > 0);

  const toCorrect = invoices.filter(invoiceNeedsCorrection);

  return {
    clientName,
    kpis: {
      billedThisMonth,
      outstanding: sumMoney(outstanding.map((x) => x.remaining)),
      outstandingCount: outstanding.length,
      overdue: sumMoney(overdue.map((x) => x.remaining)),
      overdueCount: overdue.length,
      pendingQuotesAmount: sumMoney(pendingQuotes.map(quoteNet)),
      pendingQuotesCount: pendingQuotes.length,
      retentionHeld: sumMoney(retentionByWorksite.map((r) => r.held)),
      retentionReleasable: sumMoney(retentionByWorksite.filter((r) => r.releasable).map((r) => r.held)),
      receivedToProcess: received.filter(receivedNeedsAction).length,
      receivedToProcessAmount: sumMoney(received.filter(receivedNeedsAction).map((r) => r.gross)),
    },
    latestInvoices: invoices.slice(0, 6),
    quotesToFollowUp: quotesToFollowUp.slice(0, 5),
    activeWorksites: worksites.filter((w) => w.status === "in_progress"),
    progressByWorksite: new Map(worksites.map((w) => [w.id, billedProgress(w.id, invoices)])),
    toCorrect,
    retentionByWorksite,
  };
}

function quoteNet(q: Quote) {
  return quoteTotals(q).net;
}

/**
 * Avancement facturé d'un chantier, en % du marché : avancement global de la
 * dernière situation, ou 100 % si une facture unique / de solde a été émise.
 */
export function billedProgress(worksiteId: string, invoices: readonly Invoice[]): string {
  const relevant = invoices.filter(
    (i) => i.worksiteId === worksiteId && i.issuedAt && !i.cancelledByCreditNoteId && i.kind !== "deposit" && i.kind !== "credit_note",
  );
  if (relevant.some((i) => i.kind === "final" || (i.kind === "standard" && i.quoteId))) return "100.00";
  const last = relevant.filter((i) => i.progress).sort((a, b) => b.progress!.index - a.progress!.index)[0];
  return last?.progress?.overallPercent ?? "0.00";
}
