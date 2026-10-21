import { routes } from "@/config/routes";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { quoteToFormValues } from "@/features/quotes/form-values";
import { QuoteEditor } from "@/features/quotes/quote-editor";
import { getRequestContext } from "@/composition/request-context";

export const metadata: Metadata = { title: "Modifier le devis" };

export default async function EditQuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { repos, orgId } = await getRequestContext();
  const [quote, clients, worksites] = await Promise.all([
    repos.quotes.get(orgId, id),
    repos.clients.list(orgId),
    repos.worksites.list(orgId),
  ]);
  if (!quote) notFound();
  if (quote.status !== "draft" && quote.status !== "sent") redirect(routes.quotes.show(id));
  return (
    <>
      <PageHeader
        title={`Modifier le devis ${quote.number}`}
        description={
          quote.status === "sent"
            ? "Ce devis a déjà été envoyé : il repassera en brouillon après modification."
            : undefined
        }
        backHref={routes.quotes.show(id)}
        backLabel={quote.number}
      />
      <QuoteEditor
        quoteId={quote.id}
        number={quote.number}
        initial={quoteToFormValues(quote)}
        // Un client archivé reste proposé s'il est déjà celui du devis.
        clients={clients
          .filter((c) => !c.archivedAt || c.id === quote.clientId)
          .map((c) => ({ id: c.id, name: c.name, kind: c.kind }))}
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
