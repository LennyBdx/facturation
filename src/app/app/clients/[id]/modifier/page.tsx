import { routes } from "@/config/routes";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { ClientForm } from "@/features/clients/client-form";
import { getRequestContext } from "@/composition/request-context";

export const metadata: Metadata = { title: "Modifier le client" };

export default async function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { repos, orgId } = await getRequestContext();
  const client = await repos.clients.get(orgId, id);
  if (!client) notFound();
  return (
    <>
      <PageHeader
        title={`Modifier — ${client.name}`}
        backHref={routes.clients.show(id)}
        backLabel={client.name}
      />
      <ClientForm
        clientId={client.id}
        defaultValues={{
          kind: client.kind,
          name: client.name,
          siren: client.siren ?? "",
          siret: client.siret ?? "",
          vatNumber: client.vatNumber ?? "",
          billingAddress: {
            line1: client.billingAddress.line1,
            line2: client.billingAddress.line2 ?? "",
            postalCode: client.billingAddress.postalCode,
            city: client.billingAddress.city,
            countryCode: "FR",
          },
          contact: {
            name: client.contact.name ?? "",
            email: client.contact.email ?? "",
            phone: client.contact.phone ?? "",
          },
          paymentTermsDays: client.paymentTermsDays,
          serviceCode: client.serviceCode ?? "",
          notes: client.notes ?? "",
        }}
      />
    </>
  );
}
