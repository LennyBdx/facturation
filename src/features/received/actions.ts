"use server";

import { revalidatePath } from "next/cache";
import type { ReceivedInvoiceAction } from "@/domain/lifecycle";
import { type ActionResult, getContext } from "@/services/context";
import { BusinessError } from "@/services/quotes";
import { actOnReceivedInvoice, attachReceivedToWorksite } from "@/services/received";

const MESSAGES: Record<ReceivedInvoiceAction, string> = {
  approve: "Facture approuvée : le fournisseur en est informé.",
  refuse: "Facture refusée : le motif est transmis au fournisseur.",
  dispute: "Litige signalé au fournisseur.",
  mark_paid: "Paiement transmis : la facture est marquée comme payée.",
};

export async function receivedInvoiceAction(id: string, action: ReceivedInvoiceAction, reason?: string): Promise<ActionResult> {
  try {
    await actOnReceivedInvoice(await getContext(), id, action, reason);
    revalidatePath("/app/factures-recues");
    revalidatePath(`/app/factures-recues/${id}`);
    return { ok: true, message: MESSAGES[action] };
  } catch (e) {
    if (e instanceof BusinessError) return { ok: false, error: e.message };
    throw e;
  }
}

export async function attachWorksiteAction(id: string, worksiteId: string): Promise<ActionResult> {
  try {
    await attachReceivedToWorksite(await getContext(), id, worksiteId || null);
    revalidatePath(`/app/factures-recues/${id}`);
    return { ok: true, message: worksiteId ? "Facture rattachée au chantier." : "Rattachement retiré." };
  } catch (e) {
    if (e instanceof BusinessError) return { ok: false, error: e.message };
    throw e;
  }
}
