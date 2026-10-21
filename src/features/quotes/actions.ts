"use server";

import { revalidatePath } from "next/cache";
import { runAction } from "@/composition/action";
import { routes } from "@/config/routes";
import type { QuoteInput, QuoteStatus } from "@/data/types";
import { parseDecimalInput, toMoney } from "@/domain/money";
import { defaultCategoryForRate } from "@/domain/vat";
import type { ActionResult } from "@/lib/action-result";
import { createQuote, duplicateQuote, quoteToInvoice, quoteToWorksite, setQuoteStatus, updateQuote } from "@/services/quotes";
import { type QuoteFormOutput, quoteSchema, type QuoteFormValues } from "./schemas";

function toEntity(v: QuoteFormOutput, status: QuoteStatus): QuoteInput {
  const discountValue = parseDecimalInput(v.discountValue) ?? "0";
  return {
    clientId: v.clientId,
    worksiteId: v.worksiteId || null,
    status,
    title: v.title,
    issueDate: v.issueDate,
    validUntil: v.validUntil,
    reverseCharge: v.reverseCharge,
    discount:
      v.discountKind === "none"
        ? { kind: "none" }
        : v.discountKind === "percent"
          ? { kind: "percent", value: toMoney(discountValue) }
          : { kind: "amount", value: toMoney(discountValue) },
    depositPercent: toMoney(v.depositPercent),
    estimatedDuration: v.estimatedDuration || undefined,
    notes: v.notes || undefined,
    sections: v.sections.map((s) => ({
      id: s.id,
      title: s.title,
      lines: s.lines.map((l) => ({
        id: l.id,
        description: l.description,
        quantity: l.quantity,
        unit: l.unit,
        unitPrice: toMoney(l.unitPrice),
        vatRate: l.vatRate,
        vatCategory: defaultCategoryForRate(l.vatRate),
      })),
    })),
  };
}

const STATUS_MESSAGES: Partial<Record<QuoteStatus, string>> = {
  sent: "Devis marqué comme envoyé.",
  accepted: "Devis accepté : vous pouvez créer le chantier et facturer.",
  refused: "Devis marqué comme refusé.",
  draft: "Devis repassé en brouillon.",
};

export async function saveQuote(id: string | null, values: QuoteFormValues): Promise<ActionResult<{ id: string }>> {
  return runAction({ permission: "quote:write", schema: quoteSchema, invalidMessage: "Le devis contient des erreurs." }, values, async (ctx, data) => {
    if (!(await ctx.repos.clients.get(ctx.orgId, data.clientId))) return { ok: false, error: "Client introuvable." };
    const quote = id ? await updateQuote(ctx, id, toEntity(data, "draft")) : await createQuote(ctx, toEntity(data, "draft"));
    revalidatePath(routes.quotes.list());
    return { ok: true, data: { id: quote.id }, message: id ? "Devis enregistré." : `Devis ${quote.number} créé.` };
  });
}

export async function changeQuoteStatus(id: string, status: QuoteStatus, reason?: string): Promise<ActionResult> {
  return runAction({ permission: "quote:write" }, undefined, async (ctx) => {
    await setQuoteStatus(ctx, id, status, reason);
    revalidatePath(routes.quotes.show(id));
    return { ok: true, message: STATUS_MESSAGES[status] };
  });
}

export async function duplicateQuoteAction(id: string): Promise<ActionResult<{ redirectTo: string }>> {
  return runAction({ permission: "quote:write" }, undefined, async (ctx) => {
    const copy = await duplicateQuote(ctx, id);
    return { ok: true, data: { redirectTo: routes.quotes.edit(copy.id) }, message: `Copie créée : ${copy.number}.` };
  });
}

export async function quoteToWorksiteAction(id: string): Promise<ActionResult<{ redirectTo: string }>> {
  return runAction({ permission: "worksite:write" }, undefined, async (ctx) => {
    const w = await quoteToWorksite(ctx, id);
    return { ok: true, data: { redirectTo: routes.worksites.show(w.id) }, message: "Chantier créé à partir du devis." };
  });
}

export async function quoteToInvoiceAction(id: string, kind: "standard" | "deposit"): Promise<ActionResult<{ redirectTo: string }>> {
  return runAction({ permission: "invoice:draft" }, undefined, async (ctx) => {
    const invoice = await quoteToInvoice(ctx, id, kind);
    return {
      ok: true,
      data: { redirectTo: routes.invoices.show(invoice.id) },
      message: kind === "deposit" ? "Facture d'acompte créée en brouillon." : "Facture créée en brouillon.",
    };
  });
}
