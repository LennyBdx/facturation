"use server";

import { routes } from "@/config/routes";
import { revalidatePath } from "next/cache";
import type { ClientInput } from "@/data/types";
import { fieldErrors } from "@/lib/validation";
import { type ActionResult, getContext } from "@/services/context";
import { clientSchema, type ClientFormInput, type ClientFormOutput } from "./schemas";

function toEntity(v: ClientFormOutput): ClientInput {
  return {
    kind: v.kind,
    name: v.name,
    siren: v.siren || undefined,
    siret: v.siret || undefined,
    vatNumber: v.vatNumber || undefined,
    billingAddress: { ...v.billingAddress, line2: v.billingAddress.line2 || undefined },
    contact: {
      name: v.contact.name || undefined,
      email: v.contact.email || undefined,
      phone: v.contact.phone || undefined,
    },
    paymentTermsDays: v.paymentTermsDays,
    serviceCode: v.serviceCode || undefined,
    notes: v.notes || undefined,
  };
}

export async function saveClient(id: string | null, input: ClientFormInput): Promise<ActionResult<{ id: string }>> {
  const parsed = clientSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Certains champs sont à corriger.", fieldErrors: fieldErrors(parsed.error) };
  }
  const { repos, orgId } = await getContext();
  const entity = toEntity(parsed.data);
  const client = id ? await repos.clients.update(orgId, id, entity) : await repos.clients.create(orgId, entity);
  revalidatePath(routes.clients.list());
  return { ok: true, data: { id: client.id }, message: id ? "Client mis à jour." : "Client créé." };
}
