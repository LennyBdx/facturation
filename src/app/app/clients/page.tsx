import { routes } from "@/config/routes";
import Link from "next/link";
import type { Metadata } from "next";
import { Plus, Users } from "lucide-react";
import { Amount } from "@/components/app/amount";
import { EmptyState } from "@/components/app/empty-state";
import { ListPagination } from "@/components/app/list-pagination";
import { ListToolbar } from "@/components/app/list-toolbar";
import { PageHeader } from "@/components/app/page-header";
import { ResponsiveList } from "@/components/app/responsive-list";
import { ToneBadge } from "@/components/status/status-badge";
import { CLIENT_KIND_LABELS } from "@/components/status/status-config";
import { Button } from "@/components/ui/button";
import { getRequestContext } from "@/composition/request-context";
import { formatSiren } from "@/domain/identifiers";
import { CLIENT_KINDS } from "@/features/clients/schemas";
import { sortOptions } from "@/features/lists/sort-options";
import { listHref } from "@/lib/list-href";
import { paginate } from "@/lib/pagination";
import { formatSort } from "@/lib/sorting";
import { clientRows } from "@/services/list-views";

export const metadata: Metadata = { title: "Clients" };

const SORT_OPTIONS = sortOptions([
  { key: "nom", label: "Nom", kind: "text" },
  { key: "ville", label: "Ville", kind: "text" },
  { key: "solde", label: "Solde dû", kind: "number" },
]);

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filtre?: string; tri?: string; page?: string }>;
}) {
  const { q, filtre, tri, page } = await searchParams;
  const ctx = await getRequestContext();
  const { rows, sort, narrowed } = await clientRows(ctx, { q, filtre, tri }, CLIENT_KINDS);
  const paged = paginate(rows, page);
  const query = { q, filtre, tri };

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
        sortOptions={SORT_OPTIONS}
        sortValue={formatSort(sort)}
        exportHref={rows.length ? routes.exportCsv("clients") : undefined}
      />
      {rows.length === 0 ? (
        <EmptyState
          icon={Users}
          title={
            narrowed
              ? "Aucun client ne correspond à votre recherche."
              : "Aucun client pour l'instant."
          }
          description={
            narrowed
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
            getKey={(r) => r.client.id}
            href={(r) => routes.clients.show(r.client.id)}
            sort={{
              current: sort,
              href: (s) => listHref(routes.clients.list(), query, { tri: formatSort(s) }),
            }}
            columns={[
              { header: "Client", sortKey: "nom", cell: (r) => r.client.name },
              {
                header: "Type",
                sortKey: "type",
                cell: (r) => (
                  <ToneBadge tone="neutral">{CLIENT_KIND_LABELS[r.client.kind]}</ToneBadge>
                ),
              },
              {
                header: "SIREN",
                cell: ({ client: c }) =>
                  c.siren ? (
                    <span className="num font-mono text-sm">{formatSiren(c.siren)}</span>
                  ) : c.kind === "individual" ? (
                    <span className="text-muted-foreground">—</span>
                  ) : (
                    <ToneBadge tone="warning">À compléter</ToneBadge>
                  ),
              },
              { header: "Ville", sortKey: "ville", cell: (r) => r.client.billingAddress.city },
              {
                header: "Solde dû",
                align: "right",
                sortKey: "solde",
                sortFirstDir: "desc",
                cell: (r) => <Amount value={r.due} />,
              },
            ]}
            mobile={({ client: c, due }) => ({
              title: c.name,
              subtitle: `${CLIENT_KIND_LABELS[c.kind]} · ${c.billingAddress.city}`,
              amount: due !== "0.00" ? <Amount value={due} /> : undefined,
              meta:
                !c.siren && c.kind !== "individual" ? (
                  <ToneBadge tone="warning">SIREN à compléter</ToneBadge>
                ) : undefined,
            })}
          />
          <ListPagination
            pagination={paged}
            pathname={routes.clients.list()}
            query={query}
            label="clients"
          />
        </>
      )}
    </>
  );
}
