import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { DetailList } from "@/components/app/detail-list";
import { PageHeader } from "@/components/app/page-header";
import { ActionButton } from "@/components/forms/action-button";
import {
  LifecycleStatusBadge,
  PaymentStatusBadge,
  ToneBadge,
} from "@/components/status/status-badge";
import { INVOICE_KIND_LABELS } from "@/components/status/status-config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRequestContext } from "@/composition/request-context";
import { routes } from "@/config/routes";
import { kindRules } from "@/domain/invoice-kinds";
import { can } from "@/domain/permissions";
import { deleteDraftAction } from "@/features/invoices/actions";
import { CompliancePanel } from "@/features/invoices/detail/compliance-panel";
import { EInvoicingCard } from "@/features/invoices/detail/e-invoicing-card";
import { InvoiceLinesCard } from "@/features/invoices/detail/invoice-lines-card";
import { InvoiceSummary } from "@/features/invoices/detail/invoice-summary";
import { PaymentsCard } from "@/features/invoices/detail/payments-card";
import { CreditNoteDialog } from "@/features/invoices/invoice-widgets";
import { invoicePaymentStatus, invoiceRemaining } from "@/services/builders";
import { complianceFor, goesThroughPlatform } from "@/services/invoices";

export const metadata: Metadata = { title: "Facture" };

const linkClass = "text-primary underline-offset-4 hover:underline";

/** Fiche facture : assemble les blocs de `features/invoices/detail`. */
export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getRequestContext();
  const { repos, orgId, today, role } = ctx;
  const invoice = await repos.invoices.get(orgId, id);
  if (!invoice) notFound();
  const [client, worksite, quote, corrected, creditNote] = await Promise.all([
    repos.clients.get(orgId, invoice.clientId),
    invoice.worksiteId ? repos.worksites.get(orgId, invoice.worksiteId) : null,
    invoice.quoteId ? repos.quotes.get(orgId, invoice.quoteId) : null,
    invoice.correctedInvoiceId ? repos.invoices.get(orgId, invoice.correctedInvoiceId) : null,
    invoice.cancelledByCreditNoteId
      ? repos.invoices.get(orgId, invoice.cancelledByCreditNoteId)
      : null,
  ]);
  if (!client) notFound();

  const draft = !invoice.issuedAt;
  const rules = kindRules(invoice.kind);
  const remaining = invoiceRemaining(invoice);
  const throughPlatform = goesThroughPlatform(client);
  const report = draft ? await complianceFor(ctx, invoice, client) : null;
  const canCredit =
    can(role, "invoice:credit") &&
    rules.canBeCredited &&
    !invoice.cancelledByCreditNoteId &&
    invoice.payments.length === 0;

  return (
    <>
      <PageHeader
        title={
          <>
            {INVOICE_KIND_LABELS[invoice.kind]}
            {invoice.progress ? ` n° ${invoice.progress.index}` : ""}{" "}
            <span className="font-mono text-xl text-muted-foreground">
              {invoice.number ?? "brouillon"}
            </span>
          </>
        }
        backHref={routes.invoices.list()}
        backLabel="Factures émises"
        description={
          <>
            <Link href={routes.clients.show(client.id)} className={linkClass}>
              {client.name}
            </Link>
            {worksite ? (
              <>
                {" · "}
                <Link href={routes.worksites.show(worksite.id)} className={linkClass}>
                  {worksite.name}
                </Link>
              </>
            ) : null}
          </>
        }
        meta={
          <>
            <PaymentStatusBadge status={invoicePaymentStatus(invoice, today)} />
            {!draft ? (
              <LifecycleStatusBadge
                status={invoice.eInvoicing.status}
                outOfScope={!throughPlatform}
              />
            ) : null}
            {invoice.reverseCharge ? <ToneBadge tone="pending">Autoliquidation</ToneBadge> : null}
          </>
        }
        actions={
          <>
            <Button asChild variant="outline">
              <Link href={routes.invoices.preview(id)}>
                <Eye aria-hidden />
                Aperçu
              </Link>
            </Button>
            {draft ? (
              <>
                <Button asChild variant="outline">
                  <Link href={routes.invoices.edit(id)}>
                    <Pencil aria-hidden />
                    Modifier
                  </Link>
                </Button>
                <ActionButton
                  variant="ghost"
                  className="text-destructive"
                  action={deleteDraftAction.bind(null, id)}
                  confirm={{
                    title: "Supprimer ce brouillon ?",
                    description:
                      "Le brouillon n'a pas de numéro : sa suppression ne crée aucun trou de numérotation.",
                    confirmLabel: "Supprimer",
                    destructive: true,
                  }}
                >
                  <Trash2 aria-hidden />
                  Supprimer
                </ActionButton>
              </>
            ) : canCredit ? (
              <CreditNoteDialog invoiceId={id} number={invoice.number!} />
            ) : null}
          </>
        }
      />

      <InvoiceSummary
        invoice={invoice}
        remaining={remaining}
        quote={quote}
        corrected={corrected}
        creditNote={creditNote}
      />

      {report ? (
        can(role, "invoice:issue") ? (
          <CompliancePanel
            invoiceId={id}
            clientId={client.id}
            report={report}
            throughPlatform={throughPlatform}
          />
        ) : (
          <p
            role="status"
            className="mb-6 rounded-lg border border-info/25 bg-info-soft p-4 text-sm text-info"
          >
            Brouillon prêt à être vérifié : l&apos;émission est réservée aux administrateurs de
            l&apos;entreprise.
          </p>
        )
      ) : null}

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <InvoiceLinesCard invoice={invoice} />
          {!draft && rules.isReceivable ? (
            <PaymentsCard
              invoice={invoice}
              remaining={remaining}
              today={today}
              canRecord={can(role, "invoice:payment")}
            />
          ) : null}
        </div>
        <div className="space-y-6">
          {!draft ? (
            <EInvoicingCard
              invoice={invoice}
              clientId={client.id}
              throughPlatform={throughPlatform}
              canResubmit={can(role, "invoice:issue")}
            />
          ) : null}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Client</CardTitle>
            </CardHeader>
            <CardContent>
              <DetailList
                columns={1}
                items={[
                  { label: "Nom", value: invoice.buyer?.name ?? client.name },
                  {
                    label: "SIREN",
                    value: invoice.buyer?.siren ?? client.siren,
                    hidden: client.kind === "individual",
                  },
                  {
                    label: "TVA",
                    value: invoice.buyer?.vatNumber ?? client.vatNumber,
                    hidden: client.kind === "individual",
                  },
                  { label: "Conditions", value: invoice.paymentTermsLabel },
                ]}
              />
              {!draft ? (
                <p className="mt-3 text-xs text-muted-foreground">
                  Données client figées à l&apos;émission.
                </p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
