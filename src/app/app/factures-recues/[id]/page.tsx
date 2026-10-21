import { routes } from "@/config/routes";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Amount } from "@/components/app/amount";
import { DetailList } from "@/components/app/detail-list";
import { LifecycleTimeline } from "@/components/app/lifecycle-timeline";
import { PageHeader } from "@/components/app/page-header";
import { LifecycleStatusBadge, ToneBadge } from "@/components/status/status-badge";
import { RECEIVED_CATEGORY_LABELS } from "@/components/status/status-config";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatSiren } from "@/domain/identifiers";
import { allowedReceivedInvoiceActions, daysBetween } from "@/domain/lifecycle";
import { formatVatRateLabel, REVERSE_CHARGE_MENTION } from "@/domain/vat";
import { ReceivedActions, WorksiteAttach } from "@/features/received/received-actions";
import { formatAddress, formatDate, formatDueIn, formatQuantity } from "@/lib/format";
import { getRequestContext } from "@/composition/request-context";

export const metadata: Metadata = { title: "Facture reçue" };

const ACTORS = { platform: "Plateforme agréée", buyer: "Votre entreprise", seller: "Fournisseur", administration: "Administration fiscale" } as const;

export default async function ReceivedInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { repos, orgId, today } = await getRequestContext();
  const [inv, worksites] = await Promise.all([repos.receivedInvoices.get(orgId, id), repos.worksites.list(orgId)]);
  if (!inv) notFound();
  const dueIn = daysBetween(today, inv.dueDate);
  const settled = inv.status === "payment_sent" || inv.status === "refused";

  return (
    <>
      <PageHeader
        title={inv.supplier.name}
        backHref={routes.received.list()}
        backLabel="Factures reçues"
        description={<span className="font-mono">Facture {inv.number}</span>}
        meta={
          <>
            <LifecycleStatusBadge status={inv.status} />
            {inv.reverseCharge ? <ToneBadge tone="pending">Autoliquidation</ToneBadge> : null}
            <ToneBadge tone="neutral">{RECEIVED_CATEGORY_LABELS[inv.category]}</ToneBadge>
          </>
        }
      />

      <section aria-label="Montant et actions" className="mb-6 grid gap-3 lg:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Montant TTC</p>
          <p className="num text-3xl font-semibold tracking-tight">
            <Amount value={inv.gross} />
          </p>
          <p className={!settled && dueIn < 0 ? "text-sm text-danger" : "text-sm text-muted-foreground"}>
            {inv.paidAt ? `Payée le ${formatDate(inv.paidAt)}` : `Échéance le ${formatDate(inv.dueDate)}${settled ? "" : ` (${formatDueIn(dueIn)})`}`}
          </p>
        </div>
        <div className="space-y-3 rounded-lg border bg-card p-4 lg:col-span-2">
          <p className="font-medium">Traitement</p>
          <ReceivedActions id={inv.id} allowed={allowedReceivedInvoiceActions(inv.status)} />
          {inv.statusReason ? <p className="rounded-md bg-secondary px-3 py-2 text-sm">Motif : {inv.statusReason}</p> : null}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Aperçu des données de la facture</CardTitle>
              <CardDescription>Données structurées transmises par la plateforme (format électronique).</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Désignation</TableHead>
                      <TableHead className="text-right">Qté</TableHead>
                      <TableHead className="text-right">PU HT</TableHead>
                      <TableHead className="text-right">TVA</TableHead>
                      <TableHead className="text-right">Total HT</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inv.lines.map((l) => (
                      <TableRow key={l.id}>
                        <TableCell className="whitespace-normal">{l.description}</TableCell>
                        <TableCell className="num text-right">
                          {formatQuantity(l.quantity)} {l.unit}
                        </TableCell>
                        <TableCell className="num text-right">
                          <Amount value={l.unitPrice} />
                        </TableCell>
                        <TableCell className="num text-right">{inv.reverseCharge ? "AE" : formatVatRateLabel(l.vatRate)}</TableCell>
                        <TableCell className="num text-right">
                          <Amount value={l.net} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <ul className="divide-y md:hidden">
                {inv.lines.map((l) => (
                  <li key={l.id} className="py-2.5">
                    <p>{l.description}</p>
                    <p className="flex justify-between text-sm text-muted-foreground">
                      <span className="num">
                        {formatQuantity(l.quantity)} {l.unit} × <Amount value={l.unitPrice} />
                      </span>
                      <Amount value={l.net} className="font-medium text-foreground" />
                    </p>
                  </li>
                ))}
              </ul>
              <dl className="mt-4 space-y-1.5 border-t pt-4 text-sm sm:ml-auto sm:max-w-sm">
                <div className="flex justify-between font-medium">
                  <dt>Total HT</dt>
                  <dd>
                    <Amount value={inv.net} />
                  </dd>
                </div>
                {inv.vatBreakdown.map((b) => (
                  <div key={`${b.vatCategory}${b.vatRate}`} className="flex justify-between">
                    <dt className="text-muted-foreground">{b.vatCategory === "AE" ? "TVA à autoliquider" : `TVA ${formatVatRateLabel(b.vatRate)}`}</dt>
                    <dd>
                      <Amount value={b.vat} />
                    </dd>
                  </div>
                ))}
                <div className="flex justify-between border-t pt-2 text-base font-semibold">
                  <dt>Total TTC</dt>
                  <dd>
                    <Amount value={inv.gross} />
                  </dd>
                </div>
              </dl>
              {inv.reverseCharge ? (
                <p className="mt-3 rounded-md bg-pending-soft p-2 text-xs text-pending">
                  {REVERSE_CHARGE_MENTION} Vous devez déclarer et autoliquider cette TVA.
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Historique</CardTitle>
            </CardHeader>
            <CardContent>
              <LifecycleTimeline events={inv.events} actorLabels={ACTORS} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Rattachement</CardTitle>
            </CardHeader>
            <CardContent>
              <WorksiteAttach id={inv.id} current={inv.worksiteId} worksites={worksites.map((w) => ({ id: w.id, name: w.name }))} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Fournisseur</CardTitle>
            </CardHeader>
            <CardContent>
              <DetailList
                columns={1}
                items={[
                  { label: "Raison sociale", value: inv.supplier.name },
                  { label: "SIREN", value: <span className="font-mono">{formatSiren(inv.supplier.siren)}</span> },
                  { label: "TVA", value: inv.supplier.vatNumber },
                  { label: "Adresse", value: formatAddress(inv.supplier.address) },
                  { label: "Date de facture", value: formatDate(inv.issueDate) },
                  { label: "Reçue le", value: formatDate(inv.receivedAt) },
                  { label: "Réf. commande", value: inv.orderReference, hidden: !inv.orderReference },
                  { label: "Identifiant plateforme", value: <span className="font-mono text-xs">{inv.platformInvoiceId}</span> },
                ]}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
