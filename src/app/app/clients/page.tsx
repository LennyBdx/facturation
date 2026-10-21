import { routes } from "@/config/routes";
import Link from "next/link";
import type { Metadata } from "next";
import { Plus, Users } from "lucide-react";
import { Amount } from "@/components/app/amount";
import { EmptyState } from "@/components/app/empty-state";
import { ListToolbar } from "@/components/app/list-toolbar";
import { PageHeader } from "@/components/app/page-header";
import { ListPagination } from "@/components/app/list-pagination";
import { ResponsiveList } from "@/components/app/responsive-list";
import { paginate } from "@/lib/pagination";
import { ToneBadge } from "@/components/status/status-badge";
import { CLIENT_KIND_LABELS } from "@/components/status/status-config";
import { Button } from "@/components/ui/button";
import type { ClientKind } from "@/data/types";
import { sumMoney } from "@/domain/money";
import { formatSiren } from "@/domain/identifiers";
import { CLIENT_KINDS } from "@/features/clients/schemas";
import { invoiceRemaining } from "@/services/builders";
import { getRequestContext } from "@/composition/request-context";

export const metadata: Metadata = { title: "Clients" };

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filtre?: string; page?: string }>;
}) {
  const { q, filtre, page } = await searchParams;
  const kind = CLIENT_KINDS.includes(filtre as ClientKind) ? (filtre as ClientKind) : undefined;
  const { repos, orgId } = await getRequestContext();
  const [clients, invoices] = await Promise.all([
    repos.clients.list(orgId, { search: q, kind }),
    repos.invoices.list(orgId),
  ]);
  const due = new Map(
    clients.map((c) => [
      c.id,
      sumMoney(invoices.filter((i) => i.clientId === c.id).map(invoiceRemaining)),
    ]),
  );

  const paged = paginate(clients, page);

  return (
    <>
      <PageHeader
        title="Clients"
        description="Entreprises générales, maîtres d'ouvrage, particuliers et acheteurs publics."
        actions={
          <Button asChild>
            <Link href={routes.clients.new()}>
              <Plus aria-hidden />
              Nouveau client
            </Link>
          </Button>
        }
      />
      <ListToolbar
        searchLabel="Rechercher un client"
        searchPlaceholder="Nom, SIREN, ville, contact…"
        filterLabel="Type"
        filterOptions={CLIENT_KINDS.map((k) => ({ value: k, label: CLIENT_KIND_LABELS[k] }))}
      />
      {clients.length === 0 ? (
        <EmptyState
          icon={Users}
          title={
            q || kind
              ? "Aucun client ne correspond à votre recherche."
              : "Aucun client pour l'instant."
          }
          description={
            q || kind
              ? "Modifiez la recherche ou le filtre."
              : "Ajoutez votre premier client pour lui adresser un devis."
          }
          action={
            <Button asChild>
              <Link href={routes.clients.new()}>Créer un client</Link>
            </Button>
          }
        />
      ) : (
        <>
          <ResponsiveList
            caption="Liste des clients"
            rows={paged.items}
            getKey={(c) => c.id}
            href={(c) => routes.clients.show(c.id)}
            columns={[
              { header: "Client", cell: (c) => c.name },
              {
                header: "Type",
                cell: (c) => <ToneBadge tone="neutral">{CLIENT_KIND_LABELS[c.kind]}</ToneBadge>,
              },
              {
                header: "SIREN",
                cell: (c) =>
                  c.siren ? (
                    <span className="num font-mono text-sm">{formatSiren(c.siren)}</span>
                  ) : c.kind === "individual" ? (
                    <span className="text-muted-foreground">—</span>
                  ) : (
                    <ToneBadge tone="warning">À compléter</ToneBadge>
                  ),
              },
              { header: "Ville", cell: (c) => c.billingAddress.city },
              { header: "Solde dû", align: "right", cell: (c) => <Amount value={due.get(c.id)} /> },
            ]}
            mobile={(c) => ({
              title: c.name,
              subtitle: `${CLIENT_KIND_LABELS[c.kind]} · ${c.billingAddress.city}`,
              amount: due.get(c.id) !== "0.00" ? <Amount value={due.get(c.id)} /> : undefined,
              meta:
                !c.siren && c.kind !== "individual" ? (
                  <ToneBadge tone="warning">SIREN à compléter</ToneBadge>
                ) : undefined,
            })}
          />
          <ListPagination
            pagination={paged}
            pathname={routes.clients.list()}
            query={{ q, filtre }}
            label="clients"
          />
        </>
      )}
    </>
  );
}
