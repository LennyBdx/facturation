"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { PaymentMethod } from "@/data/types";
import { toMoney } from "@/domain/money";
import { ProgressBillingError } from "@/domain/progress-billing";
import { decimalString, fieldErrors, optionalText, requiredText } from "@/lib/validation";
import { type ActionResult, getContext } from "@/services/context";
import {
  BusinessError,
  createCreditNote,
  createProgressDraft,
  deleteDraft,
  issueInvoice,
  recordPayment,
  refreshInvoiceStatus,
  resubmitInvoice,
  updateDraft,
} from "@/services/invoices";

async function guard<T>(fn: () => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof BusinessError || e instanceof ProgressBillingError) return { ok: false, error: e.message };
    throw e;
  }
}

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide.");

export async function issueInvoiceAction(id: string): Promise<ActionResult> {
  return guard(async () => {
    const invoice = await issueInvoice(await getContext(), id);
    revalidatePath("/app/factures");
    return {
      ok: true,
      message: invoice.eInvoicing.platformInvoiceId
        ? `Facture ${invoice.number} émise et déposée sur la plateforme agréée.`
        : `Facture ${invoice.number} émise (client particulier : pas de transmission électronique).`,
    };
  });
}

export async function resubmitInvoiceAction(id: string): Promise<ActionResult> {
  return guard(async () => {
    await resubmitInvoice(await getContext(), id);
    revalidatePath(`/app/factures/${id}`);
    return { ok: true, message: "Facture redéposée sur la plateforme agréée." };
  });
}

/** Rafraîchissement silencieux des statuts (frise vivante). */
export async function refreshInvoiceStatusAction(id: string): Promise<{ status: string | null; count: number }> {
  const invoice = await refreshInvoiceStatus(await getContext(), id);
  return { status: invoice.eInvoicing.status, count: invoice.eInvoicing.events.length };
}

export async function deleteDraftAction(id: string): Promise<ActionResult<{ redirectTo: string }>> {
  return guard(async () => {
    await deleteDraft(await getContext(), id);
    revalidatePath("/app/factures");
    return { ok: true, data: { redirectTo: "/app/factures" }, message: "Brouillon supprimé." };
  });
}

const paymentSchema = z.object({
  date: isoDate,
  amount: decimalString("Montant", { min: 0.01 }),
  method: z.enum(["transfer", "check", "card", "cash", "other"]),
  reference: optionalText(80),
});
export type PaymentInput = z.input<typeof paymentSchema>;

export async function recordPaymentAction(id: string, input: PaymentInput): Promise<ActionResult> {
  const parsed = paymentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Paiement invalide.", fieldErrors: fieldErrors(parsed.error) };
  return guard(async () => {
    const ctx = await getContext();
    const invoice = await recordPayment(ctx, id, {
      date: parsed.data.date,
      amount: toMoney(parsed.data.amount),
      method: parsed.data.method as PaymentMethod,
      reference: parsed.data.reference || undefined,
    });
    revalidatePath(`/app/factures/${id}`);
    return {
      ok: true,
      message: invoice.eInvoicing.status === "cashed" ? "Paiement enregistré : facture soldée, encaissement déclaré à la plateforme." : "Paiement enregistré.",
    };
  });
}

export async function createCreditNoteAction(id: string, reason: string): Promise<ActionResult<{ redirectTo: string }>> {
  const r = requiredText("Motif de l'avoir", 200).safeParse(reason);
  if (!r.success) return { ok: false, error: r.error.issues[0]!.message };
  return guard(async () => {
    const credit = await createCreditNote(await getContext(), id, r.data);
    return { ok: true, data: { redirectTo: `/app/factures/${credit.id}` }, message: "Avoir créé en brouillon : vérifiez-le puis émettez-le." };
  });
}

const draftSchema = z
  .object({
    title: requiredText("Intitulé"),
    issueDate: isoDate,
    dueDate: isoDate,
    paymentTermsLabel: requiredText("Conditions de paiement", 300),
    orderReference: optionalText(80),
    notes: optionalText(1000),
  })
  .refine((v) => v.dueDate >= v.issueDate, { path: ["dueDate"], message: "L'échéance doit suivre la date d'émission." });
export type DraftInput = z.input<typeof draftSchema>;

export async function updateDraftAction(id: string, input: DraftInput): Promise<ActionResult<{ id: string }>> {
  const parsed = draftSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Certains champs sont à corriger.", fieldErrors: fieldErrors(parsed.error) };
  return guard(async () => {
    await updateDraft(await getContext(), id, {
      ...parsed.data,
      orderReference: parsed.data.orderReference || undefined,
      notes: parsed.data.notes || undefined,
    });
    revalidatePath(`/app/factures/${id}`);
    return { ok: true, data: { id }, message: "Brouillon enregistré." };
  });
}

const progressSchema = z.object({
  quoteId: z.string().min(1),
  issueDate: isoDate,
  progress: z.record(z.string(), decimalString("Avancement", { min: 0, max: 100 })),
});

export async function createProgressDraftAction(input: z.input<typeof progressSchema>): Promise<ActionResult<{ redirectTo: string }>> {
  const parsed = progressSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Avancement invalide : saisissez un pourcentage entre 0 et 100.", fieldErrors: fieldErrors(parsed.error) };
  return guard(async () => {
    const invoice = await createProgressDraft(await getContext(), parsed.data.quoteId, parsed.data.progress, parsed.data.issueDate);
    revalidatePath("/app/factures");
    return { ok: true, data: { redirectTo: `/app/factures/${invoice.id}` }, message: "Situation créée en brouillon : contrôlez-la puis émettez-la." };
  });
}
