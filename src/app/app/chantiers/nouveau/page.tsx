import { routes } from "@/config/routes";
import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { WorksiteForm } from "@/features/worksites/worksite-form";
import { getRequestContext } from "@/composition/request-context";

export const metadata: Metadata = { title: "Nouveau chantier" };

export default async function NewWorksitePage({ searchParams }: { searchParams: Promise<{ client?: string }> }) {
  const { client } = await searchParams;
  const { repos, orgId, org, today } = await getRequestContext();
  const [clients, worksites] = await Promise.all([repos.clients.list(orgId), repos.worksites.list(orgId)]);
  const reference = `CH-${today.slice(0, 4)}-${String(worksites.length + 1).padStart(3, "0")}`;
  return (
    <>
      <PageHeader title="Nouveau chantier" backHref={routes.worksites.list()} backLabel="Chantiers" />
      <WorksiteForm
        worksiteId={null}
        clients={clients.map((c) => ({ id: c.id, name: c.name }))}
        defaultValues={{
          clientId: client ?? "",
          name: "",
          reference,
          address: { line1: "", postalCode: "", city: "", countryCode: "FR" },
          startDate: today,
          endDate: "",
          status: "planned",
          contractAmount: "0",
          marketReference: "",
          isSubcontracting: false,
          reverseCharge: false,
          retentionRate: org.settings.defaultRetentionRate,
          retentionReplacedByBond: false,
          acceptanceDate: "",
        }}
      />
    </>
  );
}
