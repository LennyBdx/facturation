import { routes } from "@/config/routes";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  CircleCheck,
  Copy,
  Eye,
  HardHat,
  Pencil,
  Receipt,
  RotateCcw,
  Send,
  Wallet,
} from "lucide-react";
import { Amount } from "@/components/app/amount";
import { DetailList } from "@/components/app/detail-list";
import { InvoiceMiniList } from "@/components/app/document-lists";
import { PageHeader } from "@/components/app/page-header";
import { ActionButton } from "@/components/forms/action-button";
import { QuoteStatusBadge, ToneBadge } from "@/components/status/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatQuantity, formatDate, formatMoney } from "@/lib/format";
import { formatVatRateLabel, REVERSE_CHARGE_MENTION } from "@/domain/vat";
import {
  changeQuoteStatus,
  duplicateQuoteAction,
  quoteToInvoiceAction,
  quoteToWorksiteAction,
} from "@/features/quotes/actions";
import { effectiveQuoteStatus } from "@/features/quotes/form-values";
import { RefuseQuoteButton } from "@/features/quotes/refuse-quote-button";
import { quoteTotals } from "@/services/builders";
import { getRequestContext } from "@/composition/request-context";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { repos, orgId } = await getRequestContext();
  return { title: `Devis ${(await repos.quotes.get(orgId, id))?.number ?? ""}` };
}

export default async function QuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { repos, orgId, today } = await getRequestContext();
  const quote = await repos.quotes.get(orgId, id);
  if (!quote) notFound();
  const [client, worksite, invoices] = await Promise.all([
    repos.clients.get(orgId, quote.clientId),
    quote.worksiteId ? repos.worksites.get(orgId, quote.worksiteId) : null,
    repos.invoices.list(orgId, { quoteId: id }),
  ]);
  const totals = quoteTotals(quote);
  const status = effectiveQuoteStatus(quote, today);
  const editable = quote.status === "draft" || quote.status === "sent";
  const hasDeposit = invoices.some((i) => i.kind === "deposit" && !i.cancelledByCreditNoteId);

  return (
    <>
      <PageHeader
        title={quote.title}
        backHref={routes.quotes.list()}
        backLabel="Devis"
        description={
          <>
            <span className="font-mono">{quote.number}</span> ·{" "}
            <Link
              href={routes.clients.show(quote.clientId)}
              className="text-primary underline-offset-4 hover:underline"
            >
              {client?.name}
            </Link>
          </>
        }
        meta={
          <>
            <QuoteStatusBadge status={status} />
            {quote.reverseCharge ? <ToneBadge tone="pending">Autoliquidation</ToneBadge> : null}
          </>
        }
        actions={
          <>
            <Button asChild variant="outline">
              <Link href={routes.quotes.preview(id)}>
                <Eye aria-hidden />
                Aperçu
              </Link>
            </Button>
            {editable ? (
              <Button asChild variant="outline">
                <Link href={routes.quotes.edit(id)}>
                  <Pencil aria-hidden />
                  Modifier
                </Link>
              </Button>
            ) : null}
            <ActionButton variant="outline" action={duplicateQuoteAction.bind(null, id)}>
              <Copy aria-hidden />
              Dupliquer
            </ActionButton>
          </>
        }
      />

      {/* Barre d'étape : ce qu'il y a à faire maintenant. */}
      <section
        aria-label="Étape suivante"
        className="mb-6 flex flex-col gap-3 rounded-lg border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <p className="text-sm">
          {quote.status === "draft" &&
            "Brouillon : relisez le devis puis envoyez-le à votre client."}
          {quote.status === "sent" &&
            status === "sent" &&
            `Envoyé le ${formatDate(quote.sentAt)} : en attente de la réponse du client.`}
          {status === "expired" &&
            `Validité dépassée depuis le ${formatDate(quote.validUntil)}. Dupliquez-le pour proposer un nouveau devis.`}
          {quote.status === "accepted" &&
            `Accepté le ${formatDate(quote.decidedAt)} : créez le chantier et facturez.`}
          {quote.status === "refused" &&
            `Refusé le ${formatDate(quote.decidedAt)}${quote.refusalReason ? ` — « ${quote.refusalReason} »` : ""}.`}
        </p>
        <div className="flex flex-wrap gap-2">
          {quote.status === "draft" ? (
            <ActionButton action={changeQuoteStatus.bind(null, id, "sent")}>
              <Send aria-hidden />
              Marquer comme envoyé
            </ActionButton>
          ) : null}
          {quote.status === "sent" ? (
            <>
              <ActionButton
                action={changeQuoteStatus.bind(null, id, "accepted")}
                confirm={{
                  title: "Le client a accepté le devis ?",
                  description:
                    "Le devis ne sera plus modifiable. Vous pourrez ensuite créer le chantier et facturer.",
                  confirmLabel: "Oui, devis accepté",
                }}
              >
                <CircleCheck aria-hidden />
                Accepté
              </ActionButton>
              <RefuseQuoteButton quoteId={id} />
            </>
          ) : null}
          {quote.status === "refused" || quote.status === "expired" ? (
            <ActionButton variant="outline" action={changeQuoteStatus.bind(null, id, "draft")}>
              <RotateCcw aria-hidden />
              Repasser en brouillon
            </ActionButton>
          ) : null}
          {quote.status === "accepted" ? (
            <>
              {worksite ? (
                <Button asChild variant="outline">
                  <Link href={routes.worksites.show(worksite.id)}>
                    <HardHat aria-hidden />
                    Voir le chantier
                  </Link>
                </Button>
              ) : (
                <ActionButton variant="outline" action={quoteToWorksiteAction.bind(null, id)}>
                  <HardHat aria-hidden />
                  Créer le chantier
                </ActionButton>
              )}
              {!hasDeposit && quote.depositPercent !== "0.00" ? (
                <ActionButton
                  variant="outline"
                  action={quoteToInvoiceAction.bind(null, id, "deposit")}
                >
                  <Wallet aria-hidden />
                  Facture d&apos;acompte
                </ActionButton>
              ) : null}
              <Button asChild>
                <Link href={routes.invoices.newProgress(id)}>
                  <Receipt aria-hidden />
                  Situation de travaux
                </Link>
              </Button>
              {invoices.length === 0 ? (
                <ActionButton
                  variant="outline"
                  action={quoteToInvoiceAction.bind(null, id, "standard")}
                >
                  <Receipt aria-hidden />
                  Facture unique
                </ActionButton>
              ) : null}
            </>
          ) : null}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          {quote.sections.map((s) => (
            <Card key={s.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">{s.title}</CardTitle>
                <Amount value={totals.sectionSubtotals[s.id]} className="font-semibold" />
              </CardHeader>
              <CardContent>
                <ul className="divide-y">
                  {s.lines.map((l) => (
                    <li
                      key={l.id}
                      className="flex flex-col gap-1 py-2.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4"
                    >
                      <span className="min-w-0">{l.description}</span>
                      <span className="flex shrink-0 items-baseline justify-between gap-4 sm:justify-end">
                        <span className="num text-sm text-muted-foreground">
                          {formatQuantity(l.quantity)} {l.unit} × {formatMoney(l.unitPrice)} ·{" "}
                          {quote.reverseCharge ? "AE" : formatVatRateLabel(l.vatRate)}
                        </span>
                        <Amount
                          value={totals.lineNets[l.id]}
                          className="w-28 text-right font-medium"
                        />
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
          {invoices.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Factures liées</CardTitle>
              </CardHeader>
              <CardContent>
                <InvoiceMiniList invoices={invoices} today={today} />
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Totaux</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2 text-sm">
                {totals.discountAmount !== "0.00" ? (
                  <>
                    <Row label="Total HT avant remise" value={totals.grossNet} />
                    <Row label="Remise" value={totals.discountAmount} negative />
                  </>
                ) : null}
                <Row label="Total HT" value={totals.net} strong />
                {totals.vatBreakdown.map((b) => (
                  <Row
                    key={`${b.vatCategory}${b.vatRate}`}
                    label={
                      b.vatCategory === "AE"
                        ? "TVA autoliquidée"
                        : `TVA ${formatVatRateLabel(b.vatRate)}`
                    }
                    value={b.vat}
                  />
                ))}
                <div className="flex justify-between border-t pt-2 text-lg font-semibold">
                  <dt>{quote.reverseCharge ? "Net à payer" : "Total TTC"}</dt>
                  <dd>
                    <Amount value={totals.gross} />
                  </dd>
                </div>
                {totals.depositAmount !== "0.00" ? (
                  <Row label={`Acompte demandé`} value={totals.depositAmount} />
                ) : null}
              </dl>
              {quote.reverseCharge ? (
                <p className="mt-3 rounded-md bg-pending-soft p-2 text-xs text-pending">
                  {REVERSE_CHARGE_MENTION}
                </p>
              ) : null}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Détails</CardTitle>
            </CardHeader>
            <CardContent>
              <DetailList
                columns={1}
                items={[
                  { label: "Date", value: formatDate(quote.issueDate) },
                  { label: "Valable jusqu'au", value: formatDate(quote.validUntil) },
                  {
                    label: "Chantier",
                    value: worksite ? (
                      <Link
                        className="text-primary underline-offset-4 hover:underline"
                        href={routes.worksites.show(worksite.id)}
                      >
                        {worksite.name}
                      </Link>
                    ) : (
                      "Non rattaché"
                    ),
                  },
                  {
                    label: "Durée estimée",
                    value: quote.estimatedDuration,
                    hidden: !quote.estimatedDuration,
                  },
                  { label: "Notes", value: quote.notes, hidden: !quote.notes },
                ]}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function Row({
  label,
  value,
  negative,
  strong,
}: {
  label: string;
  value: string;
  negative?: boolean;
  strong?: boolean;
}) {
  return (
    <div className={strong ? "flex justify-between font-medium" : "flex justify-between"}>
      <dt className={strong ? undefined : "text-muted-foreground"}>{label}</dt>
      <dd>
        {negative ? "− " : ""}
        <Amount value={value} />
      </dd>
    </div>
  );
}
