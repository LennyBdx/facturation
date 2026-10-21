import { routes } from "@/config/routes";
import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { ClientForm } from "@/features/clients/client-form";
import { getRequestContext } from "@/composition/request-context";

export const metadata: Metadata = { title: "Nouveau client" };

export default async function NewClientPage() {
  const { org } = await getRequestContext();
  return (
    <>
      <PageHeader title="Nouveau client" backHref={routes.clients.list()} backLabel="Clients" />
      <ClientForm
        clientId={null}
        defaultValues={{
          kind: "private_owner",
          name: "",
          siren: "",
          siret: "",
          vatNumber: "",
          billingAddress: { line1: "", postalCode: "", city: "", countryCode: "FR" },
          contact: { name: "", email: "", phone: "" },
          paymentTermsDays: org.settings.defaultPaymentTermsDays,
          serviceCode: "",
          notes: "",
        }}
      />
    </>
  );
}
