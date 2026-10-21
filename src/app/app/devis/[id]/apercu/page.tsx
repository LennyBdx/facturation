import { routes } from "@/config/routes";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { DocumentSheet } from "@/components/documents/document-sheet";
import { PrintButton } from "@/components/documents/print-button";
import { formatDate } from "@/lib/format";
import { quoteTotals } from "@/services/builders";
import { getContext } from "@/services/context";
import { quoteMentions, sellerIdentityLine } from "@/services/legal-mentions";

export const metadata: Metadata = { title: "Aperçu du devis" };

export default async function QuotePreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { repos, orgId, org } = await getContext();
  const quote = await repos.quotes.get(orgId, id);
  if (!quote) notFound();
  const [client, worksite] = await Promise.all([
    repos.clients.get(orgId, quote.clientId),
    quote.worksiteId ? repos.worksites.get(orgId, quote.worksiteId) : null,
  ]);
  if (!client) notFound();
  const totals = quoteTotals(quote);

  return (
    <>
      <div className="no-print">
        <PageHeader title={`Aperçu — devis ${quote.number}`} backHref={routes.quotes.show(id)} backLabel={quote.number} actions={<PrintButton />} />
      </div>
      <DocumentSheet
        docLabel="Devis"
        number={quote.number}
        meta={[
          { label: "Date", value: formatDate(quote.issueDate) },
          { label: "Valable jusqu'au", value: formatDate(quote.validUntil) },
        ]}
        seller={{ ...org, email: org.contact.email, phone: org.contact.phone }}
        sellerIdentity={sellerIdentityLine(org, org.apeCode)}
        buyer={{ name: client.name, address: client.billingAddress, siren: client.siren, vatNumber: client.vatNumber }}
        worksite={worksite ? { name: worksite.name, address: worksite.address, reference: worksite.marketReference } : null}
        subject={quote.title}
        sections={quote.sections.map((s) => ({
          title: s.title,
          subtotal: totals.sectionSubtotals[s.id],
          lines: s.lines.map((l) => ({ ...l, net: totals.lineNets[l.id] ?? "0.00" })),
        }))}
        vatBreakdown={totals.vatBreakdown}
        totals={[
          ...(totals.discountAmount !== "0.00"
            ? [
                { label: "Total HT avant remise", value: totals.grossNet },
                { label: "Remise", value: totals.discountAmount, negative: true },
              ]
            : []),
          { label: "Total HT", value: totals.net },
          { label: "Total TVA", value: totals.vat },
          { label: quote.reverseCharge ? "Net à payer (HT)" : "Total TTC", value: totals.gross, strong: true },
        ]}
        mentions={quoteMentions({ quote, org, buyerKind: client.kind, depositAmount: totals.depositAmount })}
        accentColor={org.settings.branding.accentColor}
        reverseCharge={quote.reverseCharge}
        signature
      />
    </>
  );
}
