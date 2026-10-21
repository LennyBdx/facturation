import "server-only";
import type { Client } from "@/data/types";
import { compareMoney, sumMoney, ZERO } from "@/domain/money";
import { invoiceRemaining } from "./builders";
import type { ServiceContext } from "./context";
import { BusinessError } from "./errors";

async function requireClient(ctx: ServiceContext<"clients">, id: string): Promise<Client> {
  const client = await ctx.repos.clients.get(ctx.orgId, id);
  if (!client) throw new BusinessError("Client introuvable.");
  return client;
}

/**
 * Archive un client : il disparaît des listes et des choix, mais reste sur ses documents
 * (une suppression est impossible dès qu'il a été facturé). Refusé tant qu'il doit de l'argent.
 */
export async function archiveClient(ctx: ServiceContext<"clients" | "invoices">, id: string) {
  const client = await requireClient(ctx, id);
  if (client.archivedAt) return client;
  const invoices = await ctx.repos.invoices.list(ctx.orgId, { clientId: id });
  const due = sumMoney(invoices.map(invoiceRemaining));
  if (compareMoney(due, ZERO) > 0) {
    throw new BusinessError(
      `Ce client vous doit encore ${due.replace(".", ",")} € : encaissez ou annulez ces factures avant de l'archiver.`,
    );
  }
  return ctx.repos.clients.update(ctx.orgId, id, { archivedAt: ctx.clock.now() });
}

export async function restoreClient(ctx: ServiceContext<"clients">, id: string) {
  await requireClient(ctx, id);
  return ctx.repos.clients.update(ctx.orgId, id, { archivedAt: null });
}
