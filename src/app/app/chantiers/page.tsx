import { routes } from "@/config/routes";
import Link from "next/link";
import type { Metadata } from "next";
import { HardHat, Plus } from "lucide-react";
import { Amount } from "@/components/app/amount";
import { EmptyState } from "@/components/app/empty-state";
import { ListPagination } from "@/components/app/list-pagination";
import { ListToolbar } from "@/components/app/list-toolbar";
import { PageHeader } from "@/components/app/page-header";
import { ResponsiveList } from "@/components/app/responsive-list";
import { ToneBadge, WorksiteStatusBadge } from "@/components/status/status-badge";
import { WORKSITE_STATUS } from "@/components/status/status-config";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getRequestContext } from "@/composition/request-context";
import { sortOptions } from "@/features/lists/sort-options";
import { WORKSITE_STATUSES } from "@/features/worksites/schemas";
import { formatPercent } from "@/lib/format";
import { listHref } from "@/lib/list-href";
import { paginate } from "@/lib/pagination";
import { formatSort } from "@/lib/sorting";
import { worksiteRows } from "@/services/list-views";

export const metadata: Metadata = { title: "Chantiers" };

const SORT_OPTIONS = sortOptions([
  { key: "nom", label: "Chantier", kind: "text" },
  { key: "client", label: "Client", kind: "text" },
  { key: "avancement", label: "Avancement", kind: "number" },
  { key: "marche", label: "Marché HT", kind: "number" },
]);

function ProgressCell({ value }: { value: string }) {
  return (
    <span className="flex items-center gap-2">
      <Progress
        value={Number(value)}
        className="h-1.5 w-20 [&>*]:bg-brand"
        aria-label={`Avancement facturé ${formatPercent(value)}`}
      />
      <span className="num text-sm">{formatPercent(value)}</span>
    </span>
  );
}

export default async function WorksitesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filtre?: string; tri?: string; page?: string }>;
}) {
  const { q, filtre, tri, page } = await searchParams;
  const ctx = await getRequestContext();
  const { rows, sort, narrowed } = await worksiteRows(ctx, { q, filtre, tri }, WORKSITE_STATUSES);
  const paged = paginate(rows, page);
  const query = { q, filtre, tri };

  return (
    <>
      <PageHeader
        title="Chantiers"
        description="Suivi du marché, de l'avancement facturé et des retenues de garantie."
        actions={
          <Button asChild>
            <Link href={routes.worksites.new()}>
              <Plus aria-hidden />
              Nouveau chantier
            </Link>
          </Button>
        }
      />
      <ListToolbar
        searchLabel="Rechercher un chantier"
        searchPlaceholder="Nom, référence, ville…"
        filterLabel="Statut"
        filterOptions={WORKSITE_STATUSES.map((s) => ({
          value: s,
          label: WORKSITE_STATUS[s].label,
        }))}
        sortOptions={SORT_OPTIONS}
        sortValue={formatSort(sort)}
        exportHref={rows.length ? routes.exportCsv("chantiers") : undefined}
      />
      {rows.length === 0 ? (
        <EmptyState
          icon={HardHat}
          title={
            narrowed
              ? "Aucun chantier ne correspond à votre recherche."
              : "Aucun chantier pour l'instant."
          }
          description="Un chantier se crée aussi en un clic depuis un devis accepté."
          action={
            <Button asChild>
              <Link href={routes.worksites.new()}>Créer un chantier</Link>
            </Button>
          }
        />
      ) : (
        <>
          <ResponsiveList
            caption="Liste des chantiers"
            rows={paged.items}
            getKey={(r) => r.worksite.id}
            href={(r) => routes.worksites.show(r.worksite.id)}
            sort={{
              current: sort,
              href: (s) => listHref(routes.worksites.list(), query, { tri: formatSort(s) }),
            }}
            columns={[
              { header: "Chantier", sortKey: "nom", cell: (r) => r.worksite.name },
              { header: "Client", sortKey: "client", cell: (r) => r.clientName },
              {
                header: "Statut",
                sortKey: "statut",
                cell: ({ worksite: w }) => (
                  <span className="flex flex-wrap gap-1">
                    <WorksiteStatusBadge status={w.status} />
                    {w.reverseCharge ? <ToneBadge tone="pending">Autoliquidation</ToneBadge> : null}
                  </span>
                ),
              },
              {
                header: "Avancement facturé",
                sortKey: "avancement",
                sortFirstDir: "desc",
                cell: (r) => <ProgressCell value={r.progress} />,
              },
              {
                header: "Marché HT",
                align: "right",
                sortKey: "marche",
                sortFirstDir: "desc",
                cell: (r) => <Amount value={r.worksite.contractAmount} />,
              },
            ]}
            mobile={({ worksite: w, clientName, progress }) => ({
              title: w.name,
              subtitle: `${clientName} · ${w.address.city}`,
              amount: <Amount value={w.contractAmount} />,
              meta: (
                <>
                  <WorksiteStatusBadge status={w.status} />
                  {w.reverseCharge ? <ToneBadge tone="pending">Autoliquidation</ToneBadge> : null}
                  <span className="num ml-auto text-sm text-muted-foreground">
                    {formatPercent(progress)} facturé
                  </span>
                </>
              ),
            })}
          />
          <ListPagination
            pagination={paged}
            pathname={routes.worksites.list()}
            query={query}
            label="chantiers"
          />
        </>
      )}
    </>
  );
}
