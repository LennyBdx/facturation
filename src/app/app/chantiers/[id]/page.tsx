import { routes } from "@/config/routes";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarDays, FilePlus2, HandCoins, MapPin, Pencil, Plus, Receipt, ShieldCheck } from "lucide-react";
import { Amount } from "@/components/app/amount";
import { InvoiceMiniList, QuoteMiniList, ReceivedMiniList } from "@/components/app/document-lists";
import { PageHeader } from "@/components/app/page-header";
import { ActionButton } from "@/components/forms/action-button";
import { LifecycleStatusBadge, PaymentStatusBadge, ToneBadge, WorksiteStatusBadge } from "@/components/status/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { compareMoney, sumMoney, ZERO } from "@/domain/money";
import { REVERSE_CHARGE_MENTION } from "@/domain/vat";
import { markRetentionReleased } from "@/features/worksites/actions";
import { formatAddress, formatDate, formatPercent } from "@/lib/format";
import { invoicePaymentStatus, invoiceRemaining } from "@/services/builders";
import { getContext } from "@/services/context";
import { billedProgress, retentionReleaseDate } from "@/services/dashboard";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const { repos, orgId } = await getContext();
  return { title: (await repos.worksites.get(orgId, id))?.name ?? "Chantier" };
}

export default async function WorksitePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { repos, orgId, today } = await getContext();
  const w = await repos.worksites.get(orgId, id);
  if (!w) notFound();
  const [client, invoices, quotes, received] = await Promise.all([
    repos.clients.get(orgId, w.clientId),
    repos.invoices.list(orgId, { worksiteId: id }),
    repos.quotes.list(orgId, { worksiteId: id }),
    repos.receivedInvoices.list(orgId, { worksiteId: id }),
  ]);
  const acceptedQuote = quotes.find((q) => q.status === "accepted");
  const issued = invoices.filter((i) => i.issuedAt && !i.cancelledByCreditNoteId);
  const situations = issued.filter((i) => i.progress).sort((a, b) => a.progress!.index - b.progress!.index);
  const pct = billedProgress(id, invoices);
  const retention = sumMoney(issued.filter((i) => i.kind !== "credit_note").map((i) => i.totals.retention));
  const releaseDate = retentionReleaseDate(w);
  const releasable = !w.retentionReleased && compareMoney(retention, ZERO) > 0 && releaseDate !== null && releaseDate <= today;
  const remaining = sumMoney(invoices.map(invoiceRemaining));
  const purchases = sumMoney(received.filter((r) => r.status !== "refused").map((r) => r.net));

  return (
    <>
      <PageHeader
        title={w.name}
        backHref={routes.worksites.list()}
        backLabel="Chantiers"
        description={
          <>
            {w.reference} · Client :{" "}
            <Link href={routes.clients.show(w.clientId)} className="text-primary underline-offset-4 hover:underline">
              {client?.name}
            </Link>
          </>
        }
        meta={
          <>
            <WorksiteStatusBadge status={w.status} />
            {w.isSubcontracting ? <ToneBadge tone="neutral">Sous-traitance</ToneBadge> : null}
            {w.reverseCharge ? <ToneBadge tone="pending">Autoliquidation de la TVA</ToneBadge> : null}
          </>
        }
        actions={
          <>
            <Button asChild variant="outline">
              <Link href={routes.worksites.edit(id)}>
                <Pencil aria-hidden />
                Modifier
              </Link>
            </Button>
            {acceptedQuote ? (
              <Button asChild>
                <Link href={routes.invoices.newProgress(acceptedQuote.id)}>
                  <Plus aria-hidden />
                  Nouvelle situation
                </Link>
              </Button>
            ) : (
              <Button asChild>
                <Link href={routes.quotes.new({ client: w.clientId, chantier: id })}>
                  <FilePlus2 aria-hidden />
                  Créer le devis
                </Link>
              </Button>
            )}
          </>
        }
      />

      <section aria-label="Synthèse du chantier" className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Marché HT</p>
          <p className="num text-2xl font-semibold">
            <Amount value={w.contractAmount} />
          </p>
          {w.marketReference ? <p className="text-sm text-muted-foreground">Réf. {w.marketReference}</p> : null}
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Avancement facturé</p>
          <p className="num text-2xl font-semibold">{formatPercent(pct)}</p>
          <Progress value={Number(pct)} className="mt-2 h-2 [&>*]:bg-brand" aria-label={`Avancement facturé ${formatPercent(pct)}`} />
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Reste à encaisser</p>
          <p className="num text-2xl font-semibold">
            <Amount value={remaining} />
          </p>
          <p className="text-sm text-muted-foreground">
            Achats rattachés : <Amount value={purchases} /> HT
          </p>
        </div>
        <div className={releasable ? "rounded-lg border border-warning/40 bg-warning-soft p-4" : "rounded-lg border bg-card p-4"}>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <ShieldCheck aria-hidden className="size-4" /> Retenue de garantie ({formatPercent(w.retentionRate)})
          </p>
          <p className="num text-2xl font-semibold">
            <Amount value={w.retentionReleased ? ZERO : retention} />
          </p>
          <p className="text-sm text-muted-foreground">
            {w.retentionReleased
              ? "Retenue récupérée."
              : w.retentionReplacedByBond
                ? "Remplacée par une caution bancaire."
                : releaseDate
                  ? `Libérable le ${formatDate(releaseDate)} (réception + 1 an)`
                  : "Libérable un an après la réception."}
          </p>
          {releasable ? (
            <ActionButton
              action={markRetentionReleased.bind(null, id)}
              size="sm"
              variant="outline"
              className="mt-2"
              confirm={{
                title: "Retenue récupérée ?",
                description: "Confirmez que le client vous a reversé la retenue de garantie de ce chantier.",
                confirmLabel: "Confirmer",
              }}
            >
              <HandCoins aria-hidden />
              Marquer comme récupérée
            </ActionButton>
          ) : null}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Situations de travaux</CardTitle>
            </CardHeader>
            <CardContent>
              {situations.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aucune situation émise.{" "}
                  {acceptedQuote ? (
                    <Link href={routes.invoices.newProgress(acceptedQuote.id)} className="text-primary underline-offset-4 hover:underline">
                      Créer la situation n° 1
                    </Link>
                  ) : null}
                </p>
              ) : (
                <>
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>N°</TableHead>
                          <TableHead>Facture</TableHead>
                          <TableHead className="text-right">Cumul</TableHead>
                          <TableHead className="text-right">HT période</TableHead>
                          <TableHead className="text-right">Retenue</TableHead>
                          <TableHead className="text-right">Net à payer</TableHead>
                          <TableHead>Statuts</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {situations.map((s) => (
                          <TableRow key={s.id}>
                            <TableCell className="num">{s.progress!.index}</TableCell>
                            <TableCell>
                              <Link href={routes.invoices.show(s.id)} className="font-medium text-primary underline-offset-4 hover:underline">
                                {s.number}
                              </Link>
                              <span className="block text-xs text-muted-foreground">{formatDate(s.issueDate)}</span>
                            </TableCell>
                            <TableCell className="num text-right">{formatPercent(s.progress!.overallPercent)}</TableCell>
                            <TableCell className="num text-right">
                              <Amount value={s.totals.net} />
                            </TableCell>
                            <TableCell className="num text-right">
                              <Amount value={s.totals.retention} />
                            </TableCell>
                            <TableCell className="num text-right font-medium">
                              <Amount value={s.totals.netToPay} />
                            </TableCell>
                            <TableCell>
                              <span className="flex flex-wrap gap-1">
                                <PaymentStatusBadge status={invoicePaymentStatus(s, today)} />
                                <LifecycleStatusBadge status={s.eInvoicing.status} outOfScope={s.buyer?.kind === "individual"} />
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <ul className="space-y-2 md:hidden">
                    {situations.map((s) => (
                      <li key={s.id}>
                        <Link href={routes.invoices.show(s.id)} className="flex flex-col gap-1.5 rounded-md border p-3">
                          <span className="flex justify-between gap-2 font-medium">
                            Situation n° {s.progress!.index} — {s.number}
                            <Amount value={s.totals.netToPay} />
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(s.issueDate)} · cumul {formatPercent(s.progress!.overallPercent)}
                          </span>
                          <span className="flex flex-wrap gap-1">
                            <PaymentStatusBadge status={invoicePaymentStatus(s, today)} />
                            <LifecycleStatusBadge status={s.eInvoicing.status} outOfScope={s.buyer?.kind === "individual"} />
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Receipt aria-hidden className="size-5 text-muted-foreground" /> Toutes les factures ({invoices.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <InvoiceMiniList invoices={invoices} today={today} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="flex gap-2">
                <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                {formatAddress(w.address)}
              </p>
              <p className="flex gap-2">
                <CalendarDays aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                Du {formatDate(w.startDate)} {w.endDate ? `au ${formatDate(w.endDate)}` : "(fin non définie)"}
              </p>
              {w.acceptanceDate ? <p>Réception des travaux : {formatDate(w.acceptanceDate)}</p> : null}
              {w.reverseCharge ? <p className="rounded-md bg-pending-soft p-2 text-pending">{REVERSE_CHARGE_MENTION}</p> : null}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Devis</CardTitle>
            </CardHeader>
            <CardContent>
              <QuoteMiniList quotes={quotes} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Factures fournisseurs</CardTitle>
            </CardHeader>
            <CardContent>
              <ReceivedMiniList invoices={received} />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
