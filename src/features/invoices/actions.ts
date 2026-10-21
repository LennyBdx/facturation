"use server";

import { revalidatePath } from "next/cache";
import { runAction } from "@/composition/action";
import { routes } from "@/config/routes";
import type { PaymentMethod } from "@/data/types";
import { toMoney } from "@/domain/money";
import type { ActionResult } from "@/lib/action-result";
import {
  createCreditNote,
  createProgressDraft,
  deleteDraft,
  issueInvoice,
  recordPayment,
  refreshInvoiceStatus,
  resubmitInvoice,
  updateDraft,
} from "@/services/invoices";
import {
  creditNoteReasonSchema,
  draftSchema,
  type DraftInput,
  paymentSchema,
  type PaymentInput,
  progressSchema,
  type ProgressInput,
} from "./schemas";

export async function issueInvoiceAction(id: string): Promise<ActionResult> {
  return runAction({ permission: "invoice:issue" }, undefined, async (ctx) => {
    const invoice = await issueInvoice(ctx, id);
    revalidatePath(routes.invoices.list());
    return {
      ok: true,
      message: invoice.eInvoicing.platformInvoiceId
        ? `Facture ${invoice.number} émise et déposée sur la plateforme agréée.`
        : `Facture ${invoice.number} émise (client particulier : pas de transmission électronique).`,
    };
  });
}

export async function resubmitInvoiceAction(id: string): Promise<ActionResult> {
  return runAction({ permission: "invoice:issue" }, undefined, async (ctx) => {
    await resubmitInvoice(ctx, id);
    revalidatePath(routes.invoices.show(id));
    return { ok: true, message: "Facture redéposée sur la plateforme agréée." };
  });
}

/** Rafraîchissement silencieux des statuts (frise mise à jour en direct). */
export async function refreshInvoiceStatusAction(
  id: string,
): Promise<ActionResult<{ status: string | null; count: number }>> {
  return runAction({}, undefined, async (ctx) => {
    const invoice = await refreshInvoiceStatus(ctx, id);
    return {
      ok: true,
      data: { status: invoice.eInvoicing.status, count: invoice.eInvoicing.events.length },
    };
  });
}

export async function deleteDraftAction(id: string): Promise<ActionResult<{ redirectTo: string }>> {
  return runAction({ permission: "invoice:draft" }, undefined, async (ctx) => {
    await deleteDraft(ctx, id);
    revalidatePath(routes.invoices.list());
    return {
      ok: true,
      data: { redirectTo: routes.invoices.list() },
      message: "Brouillon supprimé.",
    };
  });
}

export async function recordPaymentAction(id: string, input: PaymentInput): Promise<ActionResult> {
  return runAction(
    { permission: "invoice:payment", schema: paymentSchema, invalidMessage: "Paiement invalide." },
    input,
    async (ctx, p) => {
      const invoice = await recordPayment(ctx, id, {
        date: p.date,
        amount: toMoney(p.amount),
        method: p.method as PaymentMethod,
        reference: p.reference || undefined,
      });
      revalidatePath(routes.invoices.show(id));
      return {
        ok: true,
        message:
          invoice.eInvoicing.status === "cashed"
            ? "Paiement enregistré : facture soldée, encaissement déclaré à la plateforme."
            : "Paiement enregistré.",
      };
    },
  );
}

export async function createCreditNoteAction(
  id: string,
  reason: string,
): Promise<ActionResult<{ redirectTo: string }>> {
  return runAction(
    {
      permission: "invoice:credit",
      schema: creditNoteReasonSchema,
      invalidMessage: "Indiquez le motif de l'avoir.",
    },
    reason,
    async (ctx, why) => {
      const credit = await createCreditNote(ctx, id, why);
      return {
        ok: true,
        data: { redirectTo: routes.invoices.show(credit.id) },
        message: "Avoir créé en brouillon : vérifiez-le puis émettez-le.",
      };
    },
  );
}

export async function updateDraftAction(
  id: string,
  input: DraftInput,
): Promise<ActionResult<{ id: string }>> {
  return runAction({ permission: "invoice:draft", schema: draftSchema }, input, async (ctx, d) => {
    await updateDraft(ctx, id, {
      ...d,
      orderReference: d.orderReference || undefined,
      notes: d.notes || undefined,
    });
    revalidatePath(routes.invoices.show(id));
    return { ok: true, data: { id }, message: "Brouillon enregistré." };
  });
}

export async function createProgressDraftAction(
  input: ProgressInput,
): Promise<ActionResult<{ redirectTo: string }>> {
  return runAction(
    {
      permission: "invoice:draft",
      schema: progressSchema,
      invalidMessage: "Avancement invalide : saisissez un pourcentage entre 0 et 100.",
    },
    input,
    async (ctx, d) => {
      const invoice = await createProgressDraft(ctx, d.quoteId, d.progress, d.issueDate);
      revalidatePath(routes.invoices.list());
      return {
        ok: true,
        data: { redirectTo: routes.invoices.show(invoice.id) },
        message: "Situation créée en brouillon : contrôlez-la puis émettez-la.",
      };
    },
  );
}
