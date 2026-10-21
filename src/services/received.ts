/**
 * Factures fournisseurs reçues via la plateforme agréée (obligatoire depuis le
 * 1er septembre 2026) : synchronisation, traitement, rattachement aux chantiers.
 */
import "server-only";
import { allowedReceivedInvoiceActions, type ReceivedInvoiceAction } from "@/domain/lifecycle";
import type { ReceivedInvoice } from "@/data/types";
import type { ServiceContext } from "./context";
import { BusinessError } from "./errors";

/** Récupère les nouvelles factures auprès de la plateforme. */
export async function syncReceivedInvoices(
  ctx: ServiceContext<"receivedInvoices", "listReceivedInvoices">,
): Promise<number> {
  const address = ctx.org.settings.eInvoicing.receptionAddress;
  if (!address || ctx.org.settings.eInvoicing.connectionStatus !== "connected") return 0;
  const incoming = await ctx.provider.listReceivedInvoices(address);
  const known = new Set(
    (await ctx.repos.receivedInvoices.list(ctx.orgId)).map((r) => r.platformInvoiceId),
  );
  let added = 0;
  for (const inv of incoming) {
    if (known.has(inv.platformInvoiceId)) continue;
    const row: ReceivedInvoice = {
      ...inv,
      id: crypto.randomUUID(),
      organizationId: ctx.orgId,
      worksiteId: null,
    };
    await ctx.repos.receivedInvoices.upsert(ctx.orgId, row);
    added += 1;
  }
  return added;
}

const REASON_REQUIRED: ReceivedInvoiceAction[] = ["refuse", "dispute"];

export async function actOnReceivedInvoice(
  ctx: ServiceContext<"receivedInvoices", "updateReceivedInvoiceStatus">,
  id: string,
  action: ReceivedInvoiceAction,
  reason?: string,
) {
  const inv = await ctx.repos.receivedInvoices.get(ctx.orgId, id);
  if (!inv) throw new BusinessError("Facture reçue introuvable.");
  if (!allowedReceivedInvoiceActions(inv.status).includes(action)) {
    throw new BusinessError("Cette action n'est pas possible au statut actuel de la facture.");
  }
  if (REASON_REQUIRED.includes(action) && !reason?.trim()) {
    throw new BusinessError("Indiquez un motif : il est transmis au fournisseur.");
  }
  const event = await ctx.provider.updateReceivedInvoiceStatus(
    inv.platformInvoiceId,
    action,
    reason?.trim() || undefined,
  );
  return ctx.repos.receivedInvoices.update(ctx.orgId, id, {
    status: event.status,
    events: [...inv.events, event],
    statusReason: reason?.trim() || inv.statusReason,
    paidAt: action === "mark_paid" ? ctx.today : inv.paidAt,
  });
}

export async function attachReceivedToWorksite(
  ctx: ServiceContext<"receivedInvoices" | "worksites">,
  id: string,
  worksiteId: string | null,
) {
  if (worksiteId && !(await ctx.repos.worksites.get(ctx.orgId, worksiteId)))
    throw new BusinessError("Chantier introuvable.");
  return ctx.repos.receivedInvoices.update(ctx.orgId, id, { worksiteId });
}
