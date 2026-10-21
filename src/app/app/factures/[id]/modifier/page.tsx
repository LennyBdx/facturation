import { routes } from "@/config/routes";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { DraftForm } from "@/features/invoices/draft-form";
import { getContext } from "@/services/context";

export const metadata: Metadata = { title: "Modifier le brouillon" };

export default async function EditDraftPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { repos, orgId } = await getContext();
  const invoice = await repos.invoices.get(orgId, id);
  if (!invoice) notFound();
  if (invoice.issuedAt) redirect(routes.invoices.show(id));
  return (
    <>
      <PageHeader title="Modifier le brouillon" description={invoice.title} backHref={routes.invoices.show(id)} backLabel="Brouillon" />
      <DraftForm
        invoiceId={id}
        defaultValues={{
          title: invoice.title,
          issueDate: invoice.issueDate,
          dueDate: invoice.dueDate,
          paymentTermsLabel: invoice.paymentTermsLabel,
          orderReference: invoice.orderReference ?? "",
          notes: invoice.notes ?? "",
        }}
      />
    </>
  );
}
