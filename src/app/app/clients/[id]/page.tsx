import { routes } from "@/config/routes";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  Archive,
  ArchiveRestore,
  FilePlus2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  TriangleAlert,
  UserRound,
} from "lucide-react";
import { Amount } from "@/components/app/amount";
import { DetailList } from "@/components/app/detail-list";
import { InvoiceMiniList, QuoteMiniList, WorksiteMiniList } from "@/components/app/document-lists";
import { PageHeader } from "@/components/app/page-header";
import { ActionButton } from "@/components/forms/action-button";
import { ToneBadge } from "@/components/status/status-badge";
import { CLIENT_KIND_LABELS } from "@/components/status/status-config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatSiren, formatSiret } from "@/domain/identifiers";
import { compareMoney, sumMoney, ZERO } from "@/domain/money";
import { formatAddress } from "@/lib/format";
import { invoicePaymentStatus, invoiceRemaining } from "@/services/builders";
import { getRequestContext } from "@/composition/request-context";
import { can } from "@/domain/permissions";
import { archiveClientAction, restoreClientAction } from "@/features/clients/actions";
import { formatDate } from "@/lib/format";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { repos, orgId } = await getRequestContext();
  return { title: (await repos.clients.get(orgId, id))?.name ?? "Client" };
}

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { repos, orgId, today, role } = await getRequestContext();
  const client = await repos.clients.get(orgId, id);
  if (!client) notFound();
  const [invoices, quotes, worksites] = await Promise.all([
    repos.invoices.list(orgId, { clientId: id }),
    repos.quotes.list(orgId, { clientId: id }),
    repos.worksites.list(orgId, { clientId: id }),
  ]);
  const due = sumMoney(invoices.map(invoiceRemaining));
  const overdue = sumMoney(
    invoices.filter((i) => invoicePaymentStatus(i, today) === "overdue").map(invoiceRemaining),
  );
  const isPro = client.kind !== "individual";
  const archived = !!client.archivedAt;
  const canWrite = can(role, "client:write");

  return (
    <>
      <PageHeader
        title={client.name}
        backHref={routes.clients.list()}
        backLabel="Clients"
        meta={
          <>
            <ToneBadge tone="neutral">{CLIENT_KIND_LABELS[client.kind]}</ToneBadge>
            {archived ? (
              <ToneBadge tone="warning" icon={Archive}>
                Archivé
              </ToneBadge>
            ) : null}
          </>
        }
        actions={
          <>
            <Button asChild variant="outline">
              <Link href={routes.clients.edit(id)}>
                <Pencil aria-hidden />
                Modifier
              </Link>
            </Button>
            {canWrite && archived ? (
              <ActionButton action={restoreClientAction.bind(null, id)}>
                <ArchiveRestore aria-hidden />
                Restaurer
              </ActionButton>
            ) : null}
            {canWrite && !archived ? (
              <ActionButton
                variant="ghost"
                action={archiveClientAction.bind(null, id)}
                confirm={{
                  title: "Archiver ce client ?",
                  description:
                    "Il n'apparaîtra plus dans la liste ni dans les choix de client. Ses devis, chantiers et factures sont conservés ; vous pourrez le restaurer à tout moment.",
                  confirmLabel: "Archiver",
                }}
              >
                <Archive aria-hidden />
                Archiver
              </ActionButton>
            ) : null}
            {!archived ? (
              <Button asChild>
                <Link href={routes.quotes.new({ client: id })}>
                  <FilePlus2 aria-hidden />
                  Nouveau devis
                </Link>
              </Button>
            ) : null}
          </>
        }
      />

      {archived ? (
        <p
          role="status"
          className="mb-6 flex items-center gap-2 rounded-lg border border-warning/30 bg-warning-soft p-4 text-sm text-warning"
        >
          <Archive aria-hidden className="size-4 shrink-0" />
          Client archivé le {formatDate(client.archivedAt!.slice(0, 10))} : il n&apos;apparaît plus
          dans les listes ni dans les choix de client.
        </p>
      ) : null}

      {isPro && !client.siren ? (
        <div
          role="status"
          className="mb-6 flex items-start gap-3 rounded-lg border border-warning/30 bg-warning-soft p-4 text-warning"
        >
          <TriangleAlert aria-hidden className="mt-0.5 size-5 shrink-0" />
          <div>
            <p className="font-medium">SIREN manquant</p>
            <p className="text-sm">
              Sans SIREN, aucune facture électronique ne peut être émise pour ce client.
            </p>
            <Link
              href={routes.clients.edit(id)}
              className="mt-1 inline-block text-sm font-medium underline underline-offset-4"
            >
              Compléter la fiche
            </Link>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <Card className={compareMoney(overdue, ZERO) > 0 ? "border-danger/40" : undefined}>
            <CardContent className="space-y-1">
              <p className="text-sm text-muted-foreground">Vous doit</p>
              <p className="num text-3xl font-semibold tracking-tight">
                <Amount value={due} />
              </p>
              {compareMoney(overdue, ZERO) > 0 ? (
                <p className="text-sm text-danger">
                  dont <Amount value={overdue} /> en retard
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">Aucun retard de paiement</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Coordonnées</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="flex gap-2">
                <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                {formatAddress(client.billingAddress)}
              </p>
              {client.contact.name ? (
                <p className="flex gap-2">
                  <UserRound aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  {client.contact.name}
                </p>
              ) : null}
              {client.contact.email ? (
                <a
                  href={`mailto:${client.contact.email}`}
                  className="flex min-h-11 items-center gap-2 text-primary underline-offset-4 hover:underline md:min-h-0"
                >
                  <Mail aria-hidden className="size-4 shrink-0" />
                  {client.contact.email}
                </a>
              ) : null}
              {client.contact.phone ? (
                <a
                  href={`tel:${client.contact.phone.replace(/\s/g, "")}`}
                  className="flex min-h-11 items-center gap-2 text-primary underline-offset-4 hover:underline md:min-h-0"
                >
                  <Phone aria-hidden className="size-4 shrink-0" />
                  {client.contact.phone}
                </a>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informations</CardTitle>
            </CardHeader>
            <CardContent>
              <DetailList
                columns={1}
                items={[
                  {
                    label: "SIREN",
                    value: client.siren ? (
                      <span className="font-mono">{formatSiren(client.siren)}</span>
                    ) : null,
                    hidden: !isPro,
                  },
                  {
                    label: "SIRET",
                    value: client.siret ? (
                      <span className="font-mono">{formatSiret(client.siret)}</span>
                    ) : null,
                    hidden: !isPro,
                  },
                  { label: "N° de TVA", value: client.vatNumber, hidden: !isPro },
                  {
                    label: "Code service",
                    value: client.serviceCode,
                    hidden: client.kind !== "public_buyer",
                  },
                  {
                    label: "Délai de paiement",
                    value:
                      client.paymentTermsDays === 0
                        ? "À réception"
                        : `${client.paymentTermsDays} jours`,
                  },
                  { label: "Notes", value: client.notes, hidden: !client.notes },
                ]}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Factures ({invoices.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <InvoiceMiniList invoices={invoices} today={today} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Devis ({quotes.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <QuoteMiniList quotes={quotes} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Chantiers ({worksites.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <WorksiteMiniList worksites={worksites} />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
