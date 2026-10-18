"use server";

import { revalidatePath } from "next/cache";
import type { QuoteInput, QuoteStatus } from "@/data/types";
import { parseDecimalInput, toMoney } from "@/domain/money";
import { defaultCategoryForRate } from "@/domain/vat";
import { fieldErrors } from "@/lib/validation";
import { type ActionResult, getContext } from "@/services/context";
import {
  BusinessError,
  createQuote,
  duplicateQuote,
  quoteToInvoice,
  quoteToWorksite,
  setQuoteStatus,
  updateQuote,
} from "@/services/quotes";
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

async function guard<T>(fn: () => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof BusinessError) return { ok: false, error: e.message };
    throw e;
  }
}

export async function saveQuote(id: string | null, values: QuoteFormValues): Promise<ActionResult<{ id: string }>> {
  const parsed = quoteSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: "Le devis contient des erreurs.", fieldErrors: fieldErrors(parsed.error) };
  return guard(async () => {
    const ctx = await getContext();
    if (!(await ctx.repos.clients.get(ctx.orgId, parsed.data.clientId))) return { ok: false, error: "Client introuvable." };
    const quote = id ? await updateQuote(ctx, id, toEntity(parsed.data, "draft")) : await createQuote(ctx, toEntity(parsed.data, "draft"));
    revalidatePath("/devis");
    return { ok: true, data: { id: quote.id }, message: id ? "Devis enregistré." : `Devis ${quote.number} créé.` };
  });
}

export async function changeQuoteStatus(id: string, status: QuoteStatus, reason?: string): Promise<ActionResult> {
  return guard(async () => {
    const ctx = await getContext();
    await setQuoteStatus(ctx, id, status, reason);
    revalidatePath(`/devis/${id}`);
    const messages: Partial<Record<QuoteStatus, string>> = {
      sent: "Devis marqué comme envoyé.",
      accepted: "Devis accepté : vous pouvez créer le chantier et facturer.",
      refused: "Devis marqué comme refusé.",
      draft: "Devis repassé en brouillon.",
    };
    return { ok: true, message: messages[status] };
  });
}

export async function duplicateQuoteAction(id: string): Promise<ActionResult<{ redirectTo: string }>> {
  return guard(async () => {
    const copy = await duplicateQuote(await getContext(), id);
    return { ok: true, data: { redirectTo: `/devis/${copy.id}/modifier` }, message: `Copie créée : ${copy.number}.` };
  });
}

export async function quoteToWorksiteAction(id: string): Promise<ActionResult<{ redirectTo: string }>> {
  return guard(async () => {
    const w = await quoteToWorksite(await getContext(), id);
    return { ok: true, data: { redirectTo: `/chantiers/${w!.id}` }, message: "Chantier créé à partir du devis." };
  });
}

export async function quoteToInvoiceAction(id: string, kind: "standard" | "deposit"): Promise<ActionResult<{ redirectTo: string }>> {
  return guard(async () => {
    const invoice = await quoteToInvoice(await getContext(), id, kind);
    return {
      ok: true,
      data: { redirectTo: `/factures/${invoice.id}` },
      message: kind === "deposit" ? "Facture d'acompte créée en brouillon." : "Facture créée en brouillon.",
    };
  });
}
