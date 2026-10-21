"use server";

import { revalidatePath } from "next/cache";
import { runAction } from "@/composition/action";
import { routes } from "@/config/routes";
import type { ClientInput } from "@/data/types";
import type { ActionResult } from "@/lib/action-result";
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

export async function saveClient(
  id: string | null,
  input: ClientFormInput,
): Promise<ActionResult<{ id: string }>> {
  return runAction(
    { permission: "client:write", schema: clientSchema },
    input,
    async ({ repos, orgId }, data) => {
      const entity = toEntity(data);
      const client = id
        ? await repos.clients.update(orgId, id, entity)
        : await repos.clients.create(orgId, entity);
      revalidatePath(routes.clients.list());
      return {
        ok: true,
        data: { id: client.id },
        message: id ? "Client mis à jour." : "Client créé.",
      };
    },
  );
}
