"use server";

import { revalidatePath } from "next/cache";
import { runAction } from "@/composition/action";
import { routes } from "@/config/routes";
import type { ReceivedInvoiceAction } from "@/domain/lifecycle";
import type { ActionResult } from "@/lib/action-result";
import { actOnReceivedInvoice, attachReceivedToWorksite, syncReceivedInvoices } from "@/services/received";

const MESSAGES: Record<ReceivedInvoiceAction, string> = {
  approve: "Facture approuvée : le fournisseur en est informé.",
  refuse: "Facture refusée : le motif est transmis au fournisseur.",
  dispute: "Litige signalé au fournisseur.",
  mark_paid: "Paiement transmis : la facture est marquée comme payée.",
};

export async function receivedInvoiceAction(id: string, action: ReceivedInvoiceAction, reason?: string): Promise<ActionResult> {
  return runAction({ permission: "received:process" }, undefined, async (ctx) => {
    await actOnReceivedInvoice(ctx, id, action, reason);
    revalidatePath(routes.received.list());
    revalidatePath(routes.received.show(id));
    return { ok: true, message: MESSAGES[action] };
  });
}

export async function attachWorksiteAction(id: string, worksiteId: string): Promise<ActionResult> {
  return runAction({ permission: "received:process" }, undefined, async (ctx) => {
    await attachReceivedToWorksite(ctx, id, worksiteId || null);
    revalidatePath(routes.received.show(id));
    return { ok: true, message: worksiteId ? "Facture rattachée au chantier." : "Rattachement retiré." };
  });
}

/** Récupère les nouvelles factures auprès de la plateforme (appelée par la boîte de réception). */
export async function syncReceivedAction(): Promise<ActionResult<{ added: number }>> {
  return runAction({}, undefined, async (ctx) => {
    const added = await syncReceivedInvoices(ctx);
    if (added > 0) revalidatePath(routes.received.list());
    return { ok: true, data: { added } };
  });
}
