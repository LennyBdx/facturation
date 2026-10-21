import { kindRules } from "@/domain/invoice-kinds";
import { routes } from "@/config/routes";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight, CircleCheck, Eye, Pencil, RotateCw, Send, ShieldAlert, Trash2, TriangleAlert } from "lucide-react";
import { Amount } from "@/components/app/amount";
import { DetailList } from "@/components/app/detail-list";
import { LifecycleTimeline } from "@/components/app/lifecycle-timeline";
import { PageHeader } from "@/components/app/page-header";
import { ActionButton } from "@/components/forms/action-button";
import { LifecycleStatusBadge, PaymentStatusBadge, ToneBadge } from "@/components/status/status-badge";
import { INVOICE_KIND_LABELS } from "@/components/status/status-config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ComplianceScope } from "@/domain/compliance";
import { addMoney, compareMoney, ZERO } from "@/domain/money";
import { formatVatRateLabel, REVERSE_CHARGE_MENTION } from "@/domain/vat";
import { deleteDraftAction, issueInvoiceAction, resubmitInvoiceAction } from "@/features/invoices/actions";
import { CreditNoteDialog, LifecyclePoller, PaymentDialog } from "@/features/invoices/invoice-widgets";
import { formatDate, formatPercent, formatQuantity } from "@/lib/format";
import { invoicePaymentStatus, invoiceRemaining } from "@/services/builders";
import { getRequestContext } from "@/composition/request-context";
import { complianceFor, goesThroughPlatform, refreshInvoiceStatus } from "@/services/invoices";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const { repos, orgId } = await getRequestContext();
  const inv = await repos.invoices.get(orgId, id);
  return { title: inv?.number ? `Facture ${inv.number}` : "Brouillon de facture" };
}

const PAYMENT_METHOD_LABELS = { transfer: "Virement", check: "Chèque", card: "Carte", cash: "Espèces", other: "Autre" } as const;

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getRequestContext();
  const { repos, orgId, today } = ctx;
  const found = await repos.invoices.get(orgId, id);
  if (!found) notFound();
  // Statuts à jour depuis la plateforme agréée (simulée).
  const invoice = await refreshInvoiceStatus(ctx, id);
  const [client, worksite, quote, corrected, creditNote] = await Promise.all([
    repos.clients.get(orgId, invoice.clientId),
    invoice.worksiteId ? repos.worksites.get(orgId, invoice.worksiteId) : null,
    invoice.quoteId ? repos.quotes.get(orgId, invoice.quoteId) : null,
    invoice.correctedInvoiceId ? repos.invoices.get(orgId, invoice.correctedInvoiceId) : null,
    invoice.cancelledByCreditNoteId ? repos.invoices.get(orgId, invoice.cancelledByCreditNoteId) : null,
  ]);
  if (!client) notFound();

  const draft = !invoice.issuedAt;
  const status = invoicePaymentStatus(invoice, today);
  const remaining = invoiceRemaining(invoice);
  const platform = goesThroughPlatform(client);
  const report = draft ? await complianceFor(ctx, invoice, client) : null;
  const fixHref: Record<ComplianceScope, { href: string; label: string }> = {
    seller: { href: routes.settings.company, label: "Compléter les informations de l'entreprise" },
    buyer: { href: routes.clients.edit(client.id), label: "Compléter la fiche client" },
    invoice: { href: routes.invoices.edit(id), label: "Modifier le brouillon" },
  };
  const lastEvent = invoice.eInvoicing.events.at(-1);
  const isProgress = !!invoice.progress;

  return (
    <>
      <PageHeader
        title={
          <>
            {INVOICE_KIND_LABELS[invoice.kind]}
            {invoice.progress ? ` n° ${invoice.progress.index}` : ""} <span className="font-mono text-xl text-muted-foreground">{invoice.number ?? "brouillon"}</span>
          </>
        }
        backHref={routes.invoices.list()}
        backLabel="Factures émises"
        description={
          <>
            <Link href={routes.clients.show(client.id)} className="text-primary underline-offset-4 hover:underline">
              {client.name}
            </Link>
            {worksite ? (
              <>
                {" · "}
                <Link href={routes.worksites.show(worksite.id)} className="text-primary underline-offset-4 hover:underline">
                  {worksite.name}
                </Link>
              </>
            ) : null}
          </>
        }
        meta={
          <>
            <PaymentStatusBadge status={status} />
            {!draft ? <LifecycleStatusBadge status={invoice.eInvoicing.status} outOfScope={!platform} /> : null}
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
                  confirm={{ title: "Supprimer ce brouillon ?", description: "Le brouillon n'a pas de numéro : sa suppression ne crée aucun trou de numérotation.", confirmLabel: "Supprimer", destructive: true }}
                >
                  <Trash2 aria-hidden />
                  Supprimer
                </ActionButton>
              </>
            ) : kindRules(invoice.kind).canBeCredited && !invoice.cancelledByCreditNoteId && invoice.payments.length === 0 ? (
              <CreditNoteDialog invoiceId={id} number={invoice.number!} />
            ) : null}
          </>
        }
      />

      {/* --- Montant principal --- */}
      <section aria-label="Montant" className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-4 sm:col-span-1">
          <p className="text-sm text-muted-foreground">{kindRules(invoice.kind).isReceivable ? "Net à payer" : "Montant de l'avoir"}</p>
          <p className="num text-3xl font-semibold tracking-tight">
            <Amount value={invoice.totals.netToPay} />
          </p>
          {!draft && kindRules(invoice.kind).isReceivable ? (
            <p className="text-sm text-muted-foreground">
              {compareMoney(remaining, ZERO) > 0 ? (
                <>
                  Reste <Amount value={remaining} /> · échéance {formatDate(invoice.dueDate)}
                </>
              ) : invoice.cancelledByCreditNoteId ? (
                "Annulée par avoir"
              ) : (
                "Soldée"
              )}
            </p>
          ) : null}
        </div>
        <div className="rounded-lg border bg-card p-4 sm:col-span-2">
          <DetailList
            columns={3}
            items={[
              { label: "Émission", value: formatDate(invoice.issueDate) },
              { label: "Échéance", value: kindRules(invoice.kind).isReceivable ? formatDate(invoice.dueDate) : "—" },
              { label: "Devis", value: quote ? <Link className="text-primary underline-offset-4 hover:underline" href={routes.quotes.show(quote.id)}>{quote.number}</Link> : "—" },
              { label: "Réf. marché / commande", value: invoice.orderReference },
              { label: "Facture corrigée", value: corrected ? <Link className="text-primary underline-offset-4 hover:underline" href={routes.invoices.show(corrected.id)}>{corrected.number}</Link> : null, hidden: !corrected },
              { label: "Annulée par l'avoir", value: creditNote ? <Link className="text-primary underline-offset-4 hover:underline" href={routes.invoices.show(creditNote.id)}>{creditNote.number ?? "brouillon"}</Link> : null, hidden: !creditNote },
              { label: "Avancement cumulé", value: invoice.progress ? formatPercent(invoice.progress.overallPercent) : null, hidden: !invoice.progress },
            ]}
          />
        </div>
      </section>

      {/* --- Brouillon : contrôle de conformité et émission --- */}
      {draft && report ? (
        <Card className={report.ok ? "mb-6 border-success/40" : "mb-6 border-danger/40"}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              {report.ok ? <CircleCheck aria-hidden className="size-5 text-success" /> : <ShieldAlert aria-hidden className="size-5 text-danger" />}
              Contrôle avant émission
            </CardTitle>
            <CardDescription>
              {report.ok
                ? platform
                  ? "Toutes les mentions obligatoires sont présentes. La facture recevra son numéro définitif puis sera déposée sur votre plateforme agréée."
                  : "Toutes les mentions obligatoires sont présentes. Client particulier : la facture est émise sans transmission électronique (e-reporting)."
                : "Des données obligatoires manquent : l'émission est bloquée tant qu'elles ne sont pas corrigées."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {report.issues.length > 0 ? (
              <ul className="space-y-2">
                {report.issues.map((issue) => (
                  <li key={issue.id} className="flex flex-col gap-1 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between">
                    <span className="flex items-start gap-2 text-sm">
                      <TriangleAlert aria-hidden className={issue.blocking ? "mt-0.5 size-4 shrink-0 text-danger" : "mt-0.5 size-4 shrink-0 text-warning"} />
                      <span>
                        {issue.message}
                        {!issue.blocking ? <span className="text-muted-foreground"> (recommandé)</span> : null}
                      </span>
                    </span>
                    <Link href={fixHref[issue.scope].href} className="inline-flex min-h-11 shrink-0 items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline md:min-h-0">
                      {fixHref[issue.scope].label}
                      <ArrowRight aria-hidden className="size-4" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
            <ActionButton
              size="lg"
              disabled={!report.ok}
              action={issueInvoiceAction.bind(null, id)}
              confirm={{
                title: platform ? "Émettre et transmettre la facture ?" : "Émettre la facture ?",
                description: (
                  <>
                    Un numéro définitif sera attribué et la facture ne sera plus modifiable (correction par avoir uniquement).
                    {platform ? " Elle sera déposée sur la plateforme agréée qui la transmettra à votre client." : ""}
                  </>
                ),
                confirmLabel: platform ? "Émettre et transmettre" : "Émettre",
              }}
            >
              <Send aria-hidden />
              {platform ? "Émettre et transmettre" : "Émettre la facture"}
            </ActionButton>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          {/* --- Lignes --- */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{invoice.title}</CardTitle>
              {isProgress ? <CardDescription>Montants de la période = cumul actuel − cumul de la situation précédente.</CardDescription> : null}
            </CardHeader>
            <CardContent>
              <ul className="divide-y">
                {invoice.lines.map((l) => (
                  <li key={l.id} className="flex flex-col gap-1 py-2.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                    <span className="min-w-0">
                      {l.description}
                      {l.sectionTitle ? <span className="block text-xs text-muted-foreground">{l.sectionTitle}</span> : null}
                    </span>
                    <span className="flex shrink-0 items-baseline justify-between gap-4 sm:justify-end">
                      <span className="num text-sm text-muted-foreground">
                        {l.progress
                          ? `${formatPercent(l.progress.previousPercent)} → ${formatPercent(l.progress.currentPercent)}`
                          : `${formatQuantity(l.quantity)} ${l.unit} × ${l.unitPrice.replace(".", ",")} €`}{" "}
                        · {invoice.reverseCharge ? "AE" : formatVatRateLabel(l.vatRate)}
                      </span>
                      <Amount value={l.net} className="w-28 text-right font-medium" />
                    </span>
                  </li>
                ))}
              </ul>
              <dl className="mt-4 space-y-1.5 border-t pt-4 text-sm sm:ml-auto sm:max-w-sm">
                {isProgress ? <Row label="Travaux de la période HT" value={addMoney(invoice.totals.net, invoice.totals.depositDeduction, invoice.totals.discount)} /> : null}
                {invoice.totals.discount !== "0.00" ? <Row label="Remise" value={invoice.totals.discount} negative /> : null}
                {invoice.totals.depositDeduction !== "0.00" ? <Row label="Acompte déduit (HT)" value={invoice.totals.depositDeduction} negative /> : null}
                <Row label="Total HT" value={invoice.totals.net} strong />
                {invoice.totals.vatBreakdown.map((b) => (
                  <Row key={`${b.vatCategory}${b.vatRate}`} label={b.vatCategory === "AE" ? "TVA autoliquidée" : `TVA ${formatVatRateLabel(b.vatRate)}`} value={b.vat} />
                ))}
                <Row label={invoice.reverseCharge ? "Total" : "Total TTC"} value={invoice.totals.gross} strong />
                {invoice.totals.retention !== "0.00" ? <Row label={`Retenue de garantie ${formatPercent(invoice.progress?.retentionRate ?? "0")}`} value={invoice.totals.retention} negative /> : null}
                <div className="flex justify-between border-t pt-2 text-base font-semibold">
                  <dt>Net à payer</dt>
                  <dd>
                    <Amount value={invoice.totals.netToPay} />
                  </dd>
                </div>
              </dl>
              {invoice.reverseCharge ? <p className="mt-3 rounded-md bg-pending-soft p-2 text-xs text-pending">{REVERSE_CHARGE_MENTION}</p> : null}
            </CardContent>
          </Card>

          {/* --- Paiements --- */}
          {!draft && kindRules(invoice.kind).isReceivable ? (
            <Card>
              <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-lg">Paiements</CardTitle>
                {compareMoney(remaining, ZERO) > 0 ? <PaymentDialog invoiceId={id} remaining={remaining} today={today} /> : null}
              </CardHeader>
              <CardContent>
                {invoice.payments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucun paiement enregistré.</p>
                ) : (
                  <ul className="divide-y">
                    {invoice.payments.map((p) => (
                      <li key={p.id} className="flex justify-between gap-3 py-2.5 text-sm">
                        <span>
                          {formatDate(p.date)} — {PAYMENT_METHOD_LABELS[p.method]}
                          {p.reference ? <span className="text-muted-foreground"> · {p.reference}</span> : null}
                        </span>
                        <Amount value={p.amount} className="font-medium" />
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          ) : null}
        </div>

        {/* --- Cycle de vie facture électronique --- */}
        <div className="space-y-6">
          {!draft ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Facture électronique</CardTitle>
                <CardDescription>
                  {platform
                    ? invoice.eInvoicing.platformInvoiceId
                      ? `Identifiant plateforme : ${invoice.eInvoicing.platformInvoiceId}`
                      : "Émise avant la connexion à la plateforme agréée."
                    : "Client particulier : pas de facture électronique, les données de la vente sont transmises par e-reporting."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {invoice.eInvoicing.status === "rejected" ? (
                  <div role="alert" className="space-y-3 rounded-md border border-danger/30 bg-danger-soft p-3 text-sm text-danger">
                    <p>
                      <strong>Rejetée par la plateforme</strong> : la facture n&apos;a pas été transmise et n&apos;existe pas fiscalement. Corrigez la donnée en cause puis redéposez-la (même numéro).
                    </p>
                    {lastEvent?.comment ? <p>Motif : {lastEvent.comment}</p> : null}
                    <div className="flex flex-wrap gap-2">
                      <Button asChild size="sm" variant="outline">
                        <Link href={routes.clients.edit(client.id)}>Corriger la fiche client</Link>
                      </Button>
                      <ActionButton size="sm" action={resubmitInvoiceAction.bind(null, id)}>
                        <RotateCw aria-hidden />
                        Redéposer
                      </ActionButton>
                    </div>
                  </div>
                ) : null}
                {invoice.eInvoicing.status === "refused" ? (
                  <div role="alert" className="rounded-md border border-danger/30 bg-danger-soft p-3 text-sm text-danger">
                    <strong>Refusée par le client</strong> : la facture existe fiscalement ; annulez-la par un avoir puis émettez une facture corrigée.
                    {lastEvent?.comment ? <p className="mt-1">Motif : {lastEvent.comment}</p> : null}
                  </div>
                ) : null}
                {invoice.eInvoicing.status === "disputed" || invoice.eInvoicing.status === "suspended" ? (
                  <div role="alert" className="rounded-md border border-warning/30 bg-warning-soft p-3 text-sm text-warning">
                    <strong>{invoice.eInvoicing.status === "disputed" ? "En litige" : "Suspendue"}</strong> : votre client attend une réponse ou un complément.
                    {lastEvent?.comment ? <p className="mt-1">« {lastEvent.comment} »</p> : null}
                  </div>
                ) : null}
                <LifecyclePoller invoiceId={id} status={invoice.eInvoicing.status} eventCount={invoice.eInvoicing.events.length} />
                {invoice.eInvoicing.events.length > 0 ? (
                  <LifecycleTimeline events={invoice.eInvoicing.events} />
                ) : (
                  <p className="text-sm text-muted-foreground">Aucun événement de cycle de vie.</p>
                )}
              </CardContent>
            </Card>
          ) : null}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Client</CardTitle>
            </CardHeader>
            <CardContent>
              <DetailList
                columns={1}
                items={[
                  { label: "Nom", value: (invoice.buyer ?? { name: client.name }).name },
                  { label: "SIREN", value: invoice.buyer?.siren ?? client.siren, hidden: client.kind === "individual" },
                  { label: "TVA", value: invoice.buyer?.vatNumber ?? client.vatNumber, hidden: client.kind === "individual" },
                  { label: "Conditions", value: invoice.paymentTermsLabel },
                ]}
              />
              {!draft ? <p className="mt-3 text-xs text-muted-foreground">Données client figées à l&apos;émission.</p> : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function Row({ label, value, negative, strong }: { label: string; value: string; negative?: boolean; strong?: boolean }) {
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
