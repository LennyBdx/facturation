import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { WorksiteForm } from "@/features/worksites/worksite-form";
import { getContext } from "@/services/context";

export const metadata: Metadata = { title: "Modifier le chantier" };

export default async function EditWorksitePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { repos, orgId } = await getContext();
  const [w, clients] = await Promise.all([repos.worksites.get(orgId, id), repos.clients.list(orgId)]);
  if (!w) notFound();
  return (
    <>
      <PageHeader title={`Modifier — ${w.name}`} backHref={`/app/chantiers/${id}`} backLabel={w.name} />
      <WorksiteForm
        worksiteId={w.id}
        clients={clients.map((c) => ({ id: c.id, name: c.name }))}
        defaultValues={{
          clientId: w.clientId,
          name: w.name,
          reference: w.reference,
          address: { line1: w.address.line1, postalCode: w.address.postalCode, city: w.address.city, countryCode: "FR" },
          startDate: w.startDate,
          endDate: w.endDate ?? "",
          status: w.status,
          contractAmount: w.contractAmount,
          marketReference: w.marketReference ?? "",
          isSubcontracting: w.isSubcontracting,
          reverseCharge: w.reverseCharge,
          retentionRate: w.retentionRate,
          retentionReplacedByBond: w.retentionReplacedByBond,
          acceptanceDate: w.acceptanceDate ?? "",
        }}
      />
    </>
  );
}
