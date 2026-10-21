import { routes } from "@/config/routes";
import Link from "next/link";
import type { Metadata } from "next";
import { HardHat, Plus } from "lucide-react";
import { Amount } from "@/components/app/amount";
import { EmptyState } from "@/components/app/empty-state";
import { ListToolbar } from "@/components/app/list-toolbar";
import { PageHeader } from "@/components/app/page-header";
import { ResponsiveList } from "@/components/app/responsive-list";
import { ToneBadge, WorksiteStatusBadge } from "@/components/status/status-badge";
import { WORKSITE_STATUS } from "@/components/status/status-config";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { WorksiteStatus } from "@/data/types";
import { WORKSITE_STATUSES } from "@/features/worksites/schemas";
import { formatPercent } from "@/lib/format";
import { getRequestContext } from "@/composition/request-context";
import { billedProgress } from "@/services/dashboard";

export const metadata: Metadata = { title: "Chantiers" };

export default async function WorksitesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filtre?: string }>;
}) {
  const { q, filtre } = await searchParams;
  const status = WORKSITE_STATUSES.includes(filtre as WorksiteStatus)
    ? (filtre as WorksiteStatus)
    : undefined;
  const { repos, orgId } = await getRequestContext();
  const [worksites, clients, invoices] = await Promise.all([
    repos.worksites.list(orgId, { search: q, status }),
    repos.clients.list(orgId),
    repos.invoices.list(orgId),
  ]);
  const clientName = new Map(clients.map((c) => [c.id, c.name]));
  const progress = new Map(worksites.map((w) => [w.id, billedProgress(w.id, invoices)]));

  const progressCell = (id: string) => {
    const pct = progress.get(id) ?? "0.00";
    return (
      <span className="flex items-center gap-2">
        <Progress
          value={Number(pct)}
          className="h-1.5 w-20 [&>*]:bg-brand"
          aria-label={`Avancement facturé ${formatPercent(pct)}`}
        />
        <span className="num text-sm">{formatPercent(pct)}</span>
      </span>
    );
  };

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
      />
      {worksites.length === 0 ? (
        <EmptyState
          icon={HardHat}
          title={
            q || status
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
        <ResponsiveList
          caption="Liste des chantiers"
          rows={worksites}
          getKey={(w) => w.id}
          href={(w) => routes.worksites.show(w.id)}
          columns={[
            { header: "Chantier", cell: (w) => w.name },
            { header: "Client", cell: (w) => clientName.get(w.clientId) },
            {
              header: "Statut",
              cell: (w) => (
                <span className="flex flex-wrap gap-1">
                  <WorksiteStatusBadge status={w.status} />
                  {w.reverseCharge ? <ToneBadge tone="pending">Autoliquidation</ToneBadge> : null}
                </span>
              ),
            },
            { header: "Avancement facturé", cell: (w) => progressCell(w.id) },
            {
              header: "Marché HT",
              align: "right",
              cell: (w) => <Amount value={w.contractAmount} />,
            },
          ]}
          mobile={(w) => ({
            title: w.name,
            subtitle: `${clientName.get(w.clientId)} · ${w.address.city}`,
            amount: <Amount value={w.contractAmount} />,
            meta: (
              <>
                <WorksiteStatusBadge status={w.status} />
                {w.reverseCharge ? <ToneBadge tone="pending">Autoliquidation</ToneBadge> : null}
                <span className="num ml-auto text-sm text-muted-foreground">
                  {formatPercent(progress.get(w.id) ?? "0")} facturé
                </span>
              </>
            ),
          })}
        />
      )}
    </>
  );
}
