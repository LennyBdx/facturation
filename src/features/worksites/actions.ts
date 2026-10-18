"use server";

import { revalidatePath } from "next/cache";
import { toMoney } from "@/domain/money";
import { fieldErrors } from "@/lib/validation";
import { type ActionResult, getContext } from "@/services/context";
import { type WorksiteFormInput, worksiteSchema } from "./schemas";

export async function saveWorksite(id: string | null, input: WorksiteFormInput): Promise<ActionResult<{ id: string }>> {
  const parsed = worksiteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Certains champs sont à corriger.", fieldErrors: fieldErrors(parsed.error) };
  const { repos, orgId } = await getContext();
  const v = parsed.data;
  if (!(await repos.clients.get(orgId, v.clientId))) return { ok: false, error: "Client introuvable.", fieldErrors: { clientId: "Client introuvable." } };
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
  revalidatePath("/chantiers");
  return { ok: true, data: { id: w.id }, message: id ? "Chantier mis à jour." : "Chantier créé." };
}

export async function markRetentionReleased(id: string): Promise<ActionResult> {
  const { repos, orgId } = await getContext();
  await repos.worksites.update(orgId, id, { retentionReleased: true });
  revalidatePath(`/chantiers/${id}`);
  return { ok: true, message: "Retenue de garantie marquée comme récupérée." };
}
