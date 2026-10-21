import { routes } from "@/config/routes";
import type { Metadata } from "next";
import { Inbox, Info } from "lucide-react";
import { Amount } from "@/components/app/amount";
import { EmptyState } from "@/components/app/empty-state";
import { ListToolbar } from "@/components/app/list-toolbar";
import { PageHeader } from "@/components/app/page-header";
import { ResponsiveList } from "@/components/app/responsive-list";
import { LifecycleStatusBadge, ToneBadge } from "@/components/status/status-badge";
import { RECEIVED_CATEGORY_LABELS } from "@/components/status/status-config";
import type { ReceivedInvoice } from "@/data/types";
import { formatDate } from "@/lib/format";
import { getRequestContext } from "@/composition/request-context";
import { receivedNeedsAction } from "@/services/dashboard";
import { syncReceivedInvoices } from "@/services/received";

export const metadata: Metadata = { title: "Factures reçues" };

const FILTERS: { value: string; label: string; test: (r: ReceivedInvoice) => boolean }[] = [
  { value: "a-traiter", label: "À traiter", test: receivedNeedsAction },
  { value: "approuvees", label: "Approuvées, à payer", test: (r) => r.status === "approved" || r.status === "partially_approved" },
  { value: "litiges", label: "En litige ou suspendues", test: (r) => r.status === "disputed" || r.status === "suspended" },
  { value: "refusees", label: "Refusées", test: (r) => r.status === "refused" },
  { value: "payees", label: "Payées", test: (r) => r.status === "payment_sent" },
];

export default async function ReceivedInvoicesPage({ searchParams }: { searchParams: Promise<{ q?: string; filtre?: string }> }) {
  const { q, filtre } = await searchParams;
  const ctx = await getRequestContext();
  const added = await syncReceivedInvoices(ctx);
  const [all, worksites] = await Promise.all([ctx.repos.receivedInvoices.list(ctx.orgId, { search: q }), ctx.repos.worksites.list(ctx.orgId)]);
  const worksiteName = new Map(worksites.map((w) => [w.id, w.name]));
  const filter = FILTERS.find((f) => f.value === filtre);
  const rows = filter ? all.filter(filter.test) : all;
  const connected = ctx.org.settings.eInvoicing.connectionStatus === "connected";

  return (
    <>
      <PageHeader
        title="Factures reçues"
        description="Factures de vos fournisseurs et sous-traitants, reçues via votre plateforme agréée."
      />
      {!connected ? (
        <div role="status" className="mb-4 flex gap-2 rounded-lg border border-warning/30 bg-warning-soft p-3 text-sm text-warning">
          <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
          La connexion à votre plateforme agréée n&apos;est pas finalisée : les nouvelles factures n&apos;arrivent pas encore. Voir Paramètres → Facture électronique.
        </div>
      ) : added > 0 ? (
        <p role="status" className="mb-4 rounded-lg border border-info/25 bg-info-soft p-3 text-sm text-info">
          {added} nouvelle{added > 1 ? "s" : ""} facture{added > 1 ? "s" : ""} reçue{added > 1 ? "s" : ""} depuis votre dernière visite.
        </p>
      ) : null}
      <ListToolbar
        searchLabel="Rechercher une facture reçue"
        searchPlaceholder="Fournisseur ou numéro…"
        filterLabel="Statut"
        filterOptions={FILTERS.map(({ value, label }) => ({ value, label }))}
      />
      {rows.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={q || filter ? "Aucune facture ne correspond à votre recherche." : "Aucune facture reçue pour l'instant."}
          description="Les factures de vos fournisseurs arrivent ici automatiquement depuis la plateforme agréée."
        />
      ) : (
        <ResponsiveList
          caption="Factures fournisseurs reçues"
          rows={rows}
          getKey={(r) => r.id}
          href={(r) => routes.received.show(r.id)}
          columns={[
            {
              header: "Fournisseur",
              cell: (r) => (
                <span className="block max-w-60">
                  <span className="block truncate">{r.supplier.name}</span>
                  <span className="block truncate font-mono text-xs text-muted-foreground">{r.number}</span>
                </span>
              ),
            },
            { header: "Catégorie", cell: (r) => <span className="text-sm">{RECEIVED_CATEGORY_LABELS[r.category]}</span> },
            { header: "Chantier", cell: (r) => <span className="line-clamp-1 text-sm">{r.worksiteId ? worksiteName.get(r.worksiteId) : "—"}</span> },
            { header: "Échéance", cell: (r) => <span className="num">{formatDate(r.dueDate)}</span> },
            {
              header: "Statut",
              cell: (r) => (
                <span className="flex flex-wrap gap-1">
                  <LifecycleStatusBadge status={r.status} />
                  {receivedNeedsAction(r) ? <ToneBadge tone="info">À traiter</ToneBadge> : null}
                </span>
              ),
            },
            { header: "TTC", align: "right", cell: (r) => <Amount value={r.gross} /> },
          ]}
          mobile={(r) => ({
            title: r.supplier.name,
            subtitle: `${r.number} · échéance ${formatDate(r.dueDate)}`,
            amount: <Amount value={r.gross} />,
            meta: (
              <>
                <LifecycleStatusBadge status={r.status} />
                {receivedNeedsAction(r) ? <ToneBadge tone="info">À traiter</ToneBadge> : null}
              </>
            ),
          })}
        />
      )}
    </>
  );
}
