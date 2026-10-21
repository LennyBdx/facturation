"use server";

import { revalidatePath } from "next/cache";
import { runAction } from "@/composition/action";
import { routes } from "@/config/routes";
import { toMoney } from "@/domain/money";
import type { ActionResult } from "@/lib/action-result";
import { type WorksiteFormInput, worksiteSchema } from "./schemas";

export async function saveWorksite(
  id: string | null,
  input: WorksiteFormInput,
): Promise<ActionResult<{ id: string }>> {
  return runAction(
    { permission: "worksite:write", schema: worksiteSchema },
    input,
    async ({ repos, orgId }, v) => {
      if (!(await repos.clients.get(orgId, v.clientId)))
        return {
          ok: false,
          error: "Client introuvable.",
          fieldErrors: { clientId: "Client introuvable." },
        };
      const entity = {
        ...v,
        endDate: v.endDate || undefined,
        acceptanceDate: v.acceptanceDate || undefined,
        marketReference: v.marketReference || undefined,
        contractAmount: toMoney(v.contractAmount),
        retentionRate: toMoney(v.retentionRate),
      };
      const w = id
        ? await repos.worksites.update(orgId, id, entity)
        : await repos.worksites.create(orgId, { ...entity, retentionReleased: false });
      revalidatePath(routes.worksites.list());
      return {
        ok: true,
        data: { id: w.id },
        message: id ? "Chantier mis à jour." : "Chantier créé.",
      };
    },
  );
}

export async function markRetentionReleased(id: string): Promise<ActionResult> {
  return runAction({ permission: "worksite:write" }, undefined, async ({ repos, orgId }) => {
    await repos.worksites.update(orgId, id, { retentionReleased: true });
    revalidatePath(routes.worksites.show(id));
    return { ok: true, message: "Retenue de garantie marquée comme récupérée." };
  });
}
