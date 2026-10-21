import { routes } from "@/config/routes";
import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { emptyQuoteValues } from "@/features/quotes/form-values";
import { QuoteEditor } from "@/features/quotes/quote-editor";
import { getRequestContext } from "@/composition/request-context";

export const metadata: Metadata = { title: "Nouveau devis" };

export default async function NewQuotePage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string; chantier?: string }>;
}) {
  const { client, chantier } = await searchParams;
  const { repos, orgId, org, today } = await getRequestContext();
  const [clients, worksites] = await Promise.all([
    repos.clients.list(orgId),
    repos.worksites.list(orgId),
  ]);
  const worksite = worksites.find((w) => w.id === chantier);
  return (
    <>
      <PageHeader title="Nouveau devis" backHref={routes.quotes.list()} backLabel="Devis" />
      <QuoteEditor
        quoteId={null}
        initial={emptyQuoteValues(
          org,
          today,
          client ?? "",
          worksite?.id ?? "",
          worksite?.reverseCharge ?? false,
        )}
        clients={clients.map((c) => ({ id: c.id, name: c.name, kind: c.kind }))}
        worksites={worksites.map((w) => ({
          id: w.id,
          name: w.name,
          clientId: w.clientId,
          reverseCharge: w.reverseCharge,
        }))}
        defaultVatRate="20.00"
      />
    </>
  );
}
