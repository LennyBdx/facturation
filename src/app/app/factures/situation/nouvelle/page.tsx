import { routes } from "@/config/routes";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { ProgressWizard } from "@/features/invoices/progress-wizard";
import { formatPercent } from "@/lib/format";
import { depositNetForQuote, lastProgressInvoice } from "@/services/builders";
import { getRequestContext } from "@/composition/request-context";

export const metadata: Metadata = { title: "Nouvelle situation de travaux" };

export default async function NewProgressInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ devis?: string }>;
}) {
  const { devis } = await searchParams;
  if (!devis) notFound();
  const { repos, orgId, today } = await getRequestContext();
  const quote = await repos.quotes.get(orgId, devis);
  if (!quote || quote.status !== "accepted") notFound();
  const [client, worksite, invoices] = await Promise.all([
    repos.clients.get(orgId, quote.clientId),
    quote.worksiteId ? repos.worksites.get(orgId, quote.worksiteId) : null,
    repos.invoices.list(orgId, { quoteId: quote.id }),
  ]);
  const previous = lastProgressInvoice(invoices, quote.id);
  const retentionRate =
    worksite && !worksite.retentionReplacedByBond ? worksite.retentionRate : "0.00";

  return (
    <>
      <PageHeader
        title={`Situation n° ${(previous?.progress?.index ?? 0) + 1}`}
        backHref={routes.quotes.show(quote.id)}
        backLabel={quote.number}
        description={
          <>
            {quote.title} — {client?.name}
            {worksite ? (
              <>
                {" · "}
                <Link
                  href={routes.worksites.show(worksite.id)}
                  className="text-primary underline-offset-4 hover:underline"
                >
                  {worksite.name}
                </Link>
              </>
            ) : null}
            {" · "}retenue de garantie {formatPercent(retentionRate)}
          </>
        }
      />
      <ProgressWizard
        quote={{
          id: quote.id,
          sections: quote.sections,
          discount: quote.discount,
          reverseCharge: quote.reverseCharge,
        }}
        previous={previous?.progress?.cumulative ?? null}
        depositNet={depositNetForQuote(invoices, quote.id)}
        retentionRate={retentionRate}
        today={today}
      />
    </>
  );
}
