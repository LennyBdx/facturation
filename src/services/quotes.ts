/**
 * Cas d'usage des devis. Orchestration uniquement : les calculs sont dans
 * `@/domain`, la persistance passe par les repositories reçus en paramètre.
 */
import "server-only";
import { addDays } from "@/domain/lifecycle";
import type { Quote, QuoteInput, QuoteStatus } from "@/data/types";
import { buildDepositInvoice, buildStandardInvoice, quoteTotals } from "./builders";
import type { ServiceContext } from "./context";
import { BusinessError } from "./errors";

const EDITABLE: QuoteStatus[] = ["draft", "sent"];

const TRANSITIONS: Record<QuoteStatus, QuoteStatus[]> = {
  draft: ["sent"],
  sent: ["accepted", "refused", "draft"],
  accepted: [],
  refused: ["draft"],
  expired: ["draft"],
};

export async function requireQuote(ctx: ServiceContext<"quotes">, id: string): Promise<Quote> {
  const quote = await ctx.repos.quotes.get(ctx.orgId, id);
  if (!quote) throw new BusinessError("Devis introuvable.");
  return quote;
}

export async function createQuote(ctx: ServiceContext<"quotes" | "organizations">, input: QuoteInput): Promise<Quote> {
  const number = await ctx.repos.organizations.takeNextNumber(ctx.orgId, "quote", input.issueDate);
  return ctx.repos.quotes.create(ctx.orgId, { ...input, number });
}

export async function updateQuote(ctx: ServiceContext<"quotes">, id: string, input: QuoteInput): Promise<Quote> {
  const quote = await requireQuote(ctx, id);
  if (!EDITABLE.includes(quote.status)) {
    throw new BusinessError("Un devis accepté, refusé ou expiré n'est plus modifiable : dupliquez-le.");
  }
  // Un devis envoyé puis modifié repasse en brouillon pour être renvoyé.
  return ctx.repos.quotes.update(ctx.orgId, id, { ...input, status: quote.status === "sent" ? "draft" : input.status });
}

export async function duplicateQuote(ctx: ServiceContext<"quotes" | "organizations">, id: string): Promise<Quote> {
  const q = await requireQuote(ctx, id);
  const newId = () => crypto.randomUUID();
  return createQuote(ctx, {
    clientId: q.clientId,
    worksiteId: q.worksiteId,
    status: "draft",
    title: `${q.title} (copie)`,
    issueDate: ctx.today,
    validUntil: addDays(ctx.today, ctx.org.settings.defaultQuoteValidityDays),
    sections: q.sections.map((s) => ({ ...s, id: newId(), lines: s.lines.map((l) => ({ ...l, id: newId() })) })),
    discount: q.discount,
    reverseCharge: q.reverseCharge,
    depositPercent: q.depositPercent,
    estimatedDuration: q.estimatedDuration,
    notes: q.notes,
  });
}

export async function setQuoteStatus(ctx: ServiceContext<"quotes">, id: string, status: QuoteStatus, reason?: string): Promise<Quote> {
  const q = await requireQuote(ctx, id);
  if (!TRANSITIONS[q.status].includes(status)) {
    throw new BusinessError("Ce changement de statut n'est pas possible pour ce devis.");
  }
  if (status === "sent" && q.sections.every((s) => s.lines.length === 0)) {
    throw new BusinessError("Le devis ne contient aucune ligne.");
  }
  const now = ctx.clock.now();
  return ctx.repos.quotes.update(ctx.orgId, id, {
    status,
    sentAt: status === "sent" ? now : q.sentAt,
    decidedAt: status === "accepted" || status === "refused" ? now : q.decidedAt,
    refusalReason: status === "refused" ? reason : undefined,
  });
}

/** Crée le chantier correspondant à un devis accepté. */
export async function quoteToWorksite(ctx: ServiceContext<"quotes" | "clients" | "worksites">, id: string) {
  const q = await requireQuote(ctx, id);
  if (q.status !== "accepted") throw new BusinessError("Seul un devis accepté peut devenir un chantier.");
  if (q.worksiteId) {
    const existing = await ctx.repos.worksites.get(ctx.orgId, q.worksiteId);
    if (existing) return existing;
  }
  const client = await ctx.repos.clients.get(ctx.orgId, q.clientId);
  if (!client) throw new BusinessError("Client introuvable.");
  const count = (await ctx.repos.worksites.list(ctx.orgId)).length;
  const worksite = await ctx.repos.worksites.create(ctx.orgId, {
    clientId: q.clientId,
    reference: `CH-${ctx.today.slice(0, 4)}-${String(count + 1).padStart(3, "0")}`,
    name: q.title,
    address: client.billingAddress,
    startDate: ctx.today,
    status: "planned",
    contractAmount: quoteTotals(q).net,
    isSubcontracting: q.reverseCharge,
    reverseCharge: q.reverseCharge,
    retentionRate: client.kind === "individual" ? "0.00" : ctx.org.settings.defaultRetentionRate,
    retentionReplacedByBond: false,
    retentionReleased: false,
  });
  await ctx.repos.quotes.update(ctx.orgId, id, { worksiteId: worksite.id });
  return worksite;
}

/** Brouillon de facture unique ou d'acompte à partir d'un devis accepté. */
export async function quoteToInvoice(ctx: ServiceContext<"quotes" | "clients" | "worksites" | "invoices">, id: string, kind: "standard" | "deposit") {
  const q = await requireQuote(ctx, id);
  if (q.status !== "accepted") throw new BusinessError("Acceptez d'abord le devis pour le facturer.");
  const client = await ctx.repos.clients.get(ctx.orgId, q.clientId);
  if (!client) throw new BusinessError("Client introuvable.");
  const worksite = q.worksiteId ? await ctx.repos.worksites.get(ctx.orgId, q.worksiteId) : null;
  const params = { org: ctx.org, client, quote: q, worksite, issueDate: ctx.today, newId: () => crypto.randomUUID() };
  if (kind === "deposit") {
    const percent = q.depositPercent !== "0.00" ? q.depositPercent : ctx.org.settings.defaultDepositPercent;
    return ctx.repos.invoices.create(ctx.orgId, buildDepositInvoice({ ...params, percent }));
  }
  return ctx.repos.invoices.create(ctx.orgId, buildStandardInvoice(params));
}
