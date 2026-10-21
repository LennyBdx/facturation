import { kindRules } from "@/domain/invoice-kinds";
import { routes } from "@/config/routes";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { DocumentSheet, type SheetSection } from "@/components/documents/document-sheet";
import { PrintButton } from "@/components/documents/print-button";
import { INVOICE_KIND_LABELS } from "@/components/status/status-config";
import { addMoney } from "@/domain/money";
import { formatDate, formatPercent } from "@/lib/format";
import { buyerSnapshot, sellerSnapshot } from "@/services/builders";
import { getRequestContext } from "@/composition/request-context";
import { invoiceMentions, sellerIdentityLine } from "@/services/legal-mentions";

export const metadata: Metadata = { title: "Aperçu de la facture" };

export default async function InvoicePreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { repos, orgId, org } = await getRequestContext();
  const invoice = await repos.invoices.get(orgId, id);
  if (!invoice) notFound();
  const [client, worksite, corrected] = await Promise.all([
    repos.clients.get(orgId, invoice.clientId),
    invoice.worksiteId ? repos.worksites.get(orgId, invoice.worksiteId) : null,
    invoice.correctedInvoiceId ? repos.invoices.get(orgId, invoice.correctedInvoiceId) : null,
  ]);
  if (!client) notFound();
  // Brouillon : données courantes ; facture émise : données figées.
  const seller = invoice.seller ?? sellerSnapshot(org);
  const buyer = invoice.buyer ?? buyerSnapshot(client);

  const sections: SheetSection[] = [];
  for (const l of invoice.lines) {
    const title = l.sectionTitle;
    const current = sections.at(-1);
    if (current && current.title === title) current.lines.push(l);
    else sections.push({ title, lines: [l] });
  }

  const t = invoice.totals;
  const label = `${INVOICE_KIND_LABELS[invoice.kind]}${invoice.progress ? ` n° ${invoice.progress.index}` : ""}`;

  return (
    <>
      <div className="no-print">
        <PageHeader
          title={`Aperçu — ${label}`}
          description={!invoice.issuedAt ? "Brouillon : le numéro définitif sera attribué à l'émission." : undefined}
          backHref={routes.invoices.show(id)}
          backLabel={invoice.number ?? "Brouillon"}
          actions={<PrintButton />}
        />
      </div>
      <DocumentSheet
        docLabel={label}
        number={invoice.number ?? "BROUILLON — non numérotée"}
        meta={[
          { label: "Date d'émission", value: formatDate(invoice.issueDate) },
          ...(kindRules(invoice.kind).isReceivable ? [{ label: "Échéance", value: formatDate(invoice.dueDate) }] : []),
          ...(invoice.orderReference ? [{ label: "Réf. commande", value: invoice.orderReference }] : []),
          ...(invoice.progress ? [{ label: "Avancement cumulé", value: formatPercent(invoice.progress.overallPercent) }] : []),
        ]}
        seller={{ ...seller, email: seller.contact.email, phone: seller.contact.phone }}
        sellerIdentity={sellerIdentityLine(seller, org.apeCode)}
        buyer={{ ...buyer, extra: buyer.serviceCode ? [`Code service : ${buyer.serviceCode}`] : undefined }}
        worksite={worksite ? { name: worksite.name, address: worksite.address, reference: worksite.marketReference } : null}
        subject={invoice.title}
        sections={sections}
        vatBreakdown={t.vatBreakdown}
        totals={[
          ...(invoice.progress ? [{ label: "Travaux de la période HT", value: addMoney(t.net, t.depositDeduction, t.discount) }] : []),
          ...(t.discount !== "0.00" ? [{ label: "Remise", value: t.discount, negative: true }] : []),
          ...(t.depositDeduction !== "0.00" ? [{ label: "Acompte déduit HT", value: t.depositDeduction, negative: true }] : []),
          { label: "Total HT", value: t.net },
          { label: "Total TVA", value: t.vat },
          { label: invoice.reverseCharge ? "Total (TVA autoliquidée)" : "Total TTC", value: t.gross },
          ...(t.retention !== "0.00" ? [{ label: "Retenue de garantie", value: t.retention, negative: true }] : []),
          { label: kindRules(invoice.kind).isReceivable ? "Net à payer" : "Montant de l'avoir", value: t.netToPay, strong: true },
        ]}
        mentions={invoiceMentions({ invoice, seller, buyer, org, correctedInvoice: corrected })}
        accentColor={org.settings.branding.accentColor}
        reverseCharge={invoice.reverseCharge}
        progressMode={!!invoice.progress}
      />
    </>
  );
}
