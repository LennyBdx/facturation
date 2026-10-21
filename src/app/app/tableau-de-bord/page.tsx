import { routes } from "@/config/routes";
import Link from "next/link";
import type { Metadata } from "next";
import {
  AlarmClock,
  ArrowRight,
  CircleCheck,
  FileText,
  HandCoins,
  Inbox,
  Plus,
  Receipt,
  ShieldCheck,
  TriangleAlert,
  Wallet,
} from "lucide-react";
import { Amount } from "@/components/app/amount";
import { KpiCard } from "@/components/app/kpi-card";
import { PageHeader } from "@/components/app/page-header";
import { LifecycleStatusBadge, PaymentStatusBadge } from "@/components/status/status-badge";
import { INVOICE_KIND_LABELS, LIFECYCLE_STATUS } from "@/components/status/status-config";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatDate, formatLongDate, formatPercent } from "@/lib/format";
import { invoicePaymentStatus } from "@/services/builders";
import { getContext } from "@/services/context";
import { getDashboard } from "@/services/dashboard";

export const metadata: Metadata = { title: "Tableau de bord" };

export default async function DashboardPage() {
  const ctx = await getContext();
  const d = await getDashboard(ctx);
  const k = d.kpis;

  return (
    <>
      <PageHeader
        title={`Bonjour ${ctx.user.firstName}`}
        description={`Situation au ${formatLongDate(ctx.today)} — ${ctx.org.name}`}
        actions={
          <>
            <Button asChild variant="outline">
              <Link href={routes.quotes.new()}>
                <Plus aria-hidden />
                Nouveau devis
              </Link>
            </Button>
            <Button asChild>
              <Link href={routes.invoices.new()}>
                <Plus aria-hidden />
                Nouvelle facture
              </Link>
            </Button>
          </>
        }
      />

      {d.toCorrect.length > 0 ? (
        <section aria-labelledby="a-corriger" className="mb-6 rounded-lg border border-danger/30 bg-danger-soft p-4">
          <h2 id="a-corriger" className="mb-3 flex items-center gap-2 font-semibold text-danger">
            <TriangleAlert aria-hidden className="size-5" />
            {d.toCorrect.length} facture{d.toCorrect.length > 1 ? "s" : ""} électronique{d.toCorrect.length > 1 ? "s" : ""} à traiter
          </h2>
          <ul className="space-y-2">
            {d.toCorrect.map((inv) => {
              const last = inv.eInvoicing.events.at(-1);
              return (
                <li key={inv.id}>
                  <Link
                    href={routes.invoices.show(inv.id)}
                    className="flex min-h-11 flex-col gap-1 rounded-md border bg-card p-3 hover:border-primary/40 sm:flex-row sm:items-center sm:gap-3"
                  >
                    <span className="flex items-center gap-2">
                      <LifecycleStatusBadge status={inv.eInvoicing.status} />
                      <span className="font-medium">{inv.number}</span>
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
                      {d.clientName.get(inv.clientId)} — {last?.comment ?? LIFECYCLE_STATUS[inv.eInvoicing.status!].label}
                    </span>
                    <ArrowRight aria-hidden className="hidden size-4 shrink-0 text-muted-foreground sm:block" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <section aria-label="Indicateurs" className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard label="Facturé ce mois-ci (HT)" value={<Amount value={k.billedThisMonth} />} icon={Receipt} href={routes.invoices.list()} emphasis="brand" />
        <KpiCard
          label="Reste à encaisser"
          value={<Amount value={k.outstanding} />}
          hint={`${k.outstandingCount} facture${k.outstandingCount > 1 ? "s" : ""} en attente de paiement`}
          icon={Wallet}
          href={routes.invoices.list({ filtre: "a-encaisser" })}
        />
        <KpiCard
          label="Factures en retard"
          value={<Amount value={k.overdue} />}
          hint={k.overdueCount > 0 ? `${k.overdueCount} facture${k.overdueCount > 1 ? "s" : ""} à relancer` : "Aucun retard"}
          icon={AlarmClock}
          href={routes.invoices.list({ filtre: "overdue" })}
          emphasis={k.overdueCount > 0 ? "danger" : undefined}
        />
        <KpiCard
          label="Devis en attente de réponse"
          value={<Amount value={k.pendingQuotesAmount} />}
          hint={`${k.pendingQuotesCount} devis envoyé${k.pendingQuotesCount > 1 ? "s" : ""} (HT)`}
          icon={FileText}
          href={routes.quotes.list({ filtre: "sent" })}
        />
        <KpiCard
          label="Retenues de garantie retenues"
          value={<Amount value={k.retentionHeld} />}
          hint={
            k.retentionReleasable !== "0.00" ? (
              <span className="text-warning">
                dont <Amount value={k.retentionReleasable} /> à récupérer maintenant
              </span>
            ) : (
              "Aucune retenue libérable à ce jour"
            )
          }
          icon={ShieldCheck}
          href={routes.worksites.list()}
          emphasis={k.retentionReleasable !== "0.00" ? "warning" : undefined}
        />
        <KpiCard
          label="Factures reçues à traiter"
          value={k.receivedToProcess}
          hint={<Amount value={k.receivedToProcessAmount} />}
          icon={Inbox}
          href={routes.received.list({ filtre: "a-traiter" })}
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dernières factures</CardTitle>
            <CardAction>
              <Button asChild variant="link" className="px-0">
                <Link href={routes.invoices.list()}>Tout voir</Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {d.latestInvoices.map((inv) => (
                <li key={inv.id}>
                  <Link href={routes.invoices.show(inv.id)} className="flex min-h-11 flex-col gap-1.5 py-3 hover:bg-accent/30 sm:-mx-2 sm:px-2">
                    <span className="flex items-start justify-between gap-3">
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{d.clientName.get(inv.clientId)}</span>
                        <span className="block truncate text-sm text-muted-foreground">
                          {inv.number ?? "Brouillon"} · {INVOICE_KIND_LABELS[inv.kind]} · {formatDate(inv.issueDate)}
                        </span>
                      </span>
                      <Amount value={inv.totals.netToPay} className="font-semibold" />
                    </span>
                    <span className="flex flex-wrap gap-1.5">
                      <PaymentStatusBadge status={invoicePaymentStatus(inv, ctx.today)} />
                      {inv.issuedAt ? <LifecycleStatusBadge status={inv.eInvoicing.status} outOfScope={inv.buyer?.kind === "individual"} /> : null}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Devis à relancer</CardTitle>
              <CardAction>
                <Button asChild variant="link" className="px-0">
                  <Link href={routes.quotes.list({ filtre: "sent" })}>Tout voir</Link>
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              {d.quotesToFollowUp.length === 0 ? (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CircleCheck aria-hidden className="size-4 text-success" /> Aucun devis sans réponse depuis plus de 15 jours.
                </p>
              ) : (
                <ul className="divide-y">
                  {d.quotesToFollowUp.map(({ quote, days }) => (
                    <li key={quote.id}>
                      <Link href={routes.quotes.show(quote.id)} className="flex min-h-11 items-center justify-between gap-3 py-3 hover:bg-accent/30 sm:-mx-2 sm:px-2">
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{quote.title}</span>
                          <span className="block truncate text-sm text-muted-foreground">
                            {quote.number} · {d.clientName.get(quote.clientId)}
                          </span>
                        </span>
                        <span className="shrink-0 text-sm text-warning">envoyé il y a {days} j</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Chantiers en cours</CardTitle>
              <CardAction>
                <Button asChild variant="link" className="px-0">
                  <Link href={routes.worksites.list()}>Tout voir</Link>
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {d.activeWorksites.map((w) => {
                  const pct = d.progressByWorksite.get(w.id) ?? "0.00";
                  return (
                    <li key={w.id}>
                      <Link href={routes.worksites.show(w.id)} className="block space-y-1.5 rounded-md hover:bg-accent/30 sm:-mx-2 sm:px-2 sm:py-1">
                        <span className="flex items-center justify-between gap-3">
                          <span className="truncate font-medium">{w.name}</span>
                          <span className="num shrink-0 text-sm text-muted-foreground">{formatPercent(pct)} facturé</span>
                        </span>
                        <Progress value={Number(pct)} aria-label={`Avancement facturé : ${formatPercent(pct)}`} className="h-2 [&>*]:bg-brand" />
                        <span className="flex items-center gap-2 text-sm text-muted-foreground">
                          Marché <Amount value={w.contractAmount} /> HT
                          {w.reverseCharge ? <span className="rounded-sm bg-secondary px-1.5 text-xs">Autoliquidation</span> : null}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>

          {d.retentionByWorksite.some((r) => r.releasable) ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <HandCoins aria-hidden className="size-5 text-warning" />
                  Retenues de garantie à récupérer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="divide-y">
                  {d.retentionByWorksite
                    .filter((r) => r.releasable)
                    .map((r) => (
                      <li key={r.worksite.id}>
                        <Link href={routes.worksites.show(r.worksite.id)} className="flex min-h-11 items-center justify-between gap-3 py-3">
                          <span className="min-w-0">
                            <span className="block truncate font-medium">{r.worksite.name}</span>
                            <span className="block text-sm text-muted-foreground">Libérable depuis le {formatDate(r.releaseDate)}</span>
                          </span>
                          <Amount value={r.held} className="font-semibold" />
                        </Link>
                      </li>
                    ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </>
  );
}
