import { routes } from "@/config/routes";
import Link from "next/link";
import type { Metadata } from "next";
import { FileText, Info, Receipt, Undo2, Wallet } from "lucide-react";
import { Amount } from "@/components/app/amount";
import { EmptyState } from "@/components/app/empty-state";
import { PageHeader } from "@/components/app/page-header";
import { ActionButton } from "@/components/forms/action-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { quoteToInvoiceAction } from "@/features/quotes/actions";
import { quoteTotals } from "@/services/builders";
import { getContext } from "@/services/context";

export const metadata: Metadata = { title: "Nouvelle facture" };

export default async function NewInvoicePage() {
  const { repos, orgId } = await getContext();
  const [quotes, clients, invoices] = await Promise.all([
    repos.quotes.list(orgId, { status: "accepted" }),
    repos.clients.list(orgId),
    repos.invoices.list(orgId),
  ]);
  const clientName = new Map(clients.map((c) => [c.id, c.name]));

  return (
    <>
      <PageHeader
        title="Nouvelle facture"
        description="Une facture part toujours d'un devis accepté : choisissez le devis et le type de facture."
        backHref={routes.invoices.list()}
        backLabel="Factures émises"
      />
      <div className="mb-6 grid gap-3 md:grid-cols-4">
        {[
          { icon: Wallet, title: "Facture d'acompte", text: "Pourcentage du marché demandé à la commande, déduit ensuite des situations." },
          { icon: Receipt, title: "Situation de travaux", text: "Avancement cumulé par ligne, acomptes déduits, retenue de garantie." },
          { icon: FileText, title: "Facture unique", text: "Petits travaux : tout le devis facturé en une fois." },
          { icon: Undo2, title: "Avoir", text: "Depuis la fiche d'une facture émise : seule façon de la corriger." },
        ].map((t) => (
          <div key={t.title} className="rounded-lg border bg-card p-4">
            <t.icon aria-hidden className="mb-2 size-5 text-brand" />
            <p className="font-medium">{t.title}</p>
            <p className="text-sm text-muted-foreground">{t.text}</p>
          </div>
        ))}
      </div>

      {quotes.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Aucun devis accepté à facturer."
          description="Marquez un devis comme accepté pour pouvoir le facturer."
          action={
            <Button asChild>
              <Link href={routes.quotes.list({ filtre: "sent" })}>Voir les devis envoyés</Link>
            </Button>
          }
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Devis acceptés</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {quotes.map((q) => {
                const related = invoices.filter((i) => i.quoteId === q.id);
                const hasDeposit = related.some((i) => i.kind === "deposit" && !i.cancelledByCreditNoteId);
                const fullyBilled = related.some((i) => (i.kind === "final" || i.kind === "standard") && !i.cancelledByCreditNoteId);
                return (
                  <li key={q.id} className="flex flex-col gap-3 py-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <Link href={routes.quotes.show(q.id)} className="font-medium text-primary underline-offset-4 hover:underline">
                        {q.title}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {q.number} · {clientName.get(q.clientId)} · <Amount value={quoteTotals(q).net} /> HT
                        {related.length ? ` · ${related.length} facture${related.length > 1 ? "s" : ""}` : ""}
                      </p>
                    </div>
                    {fullyBilled ? (
                      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Info aria-hidden className="size-4" /> Entièrement facturé
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {!hasDeposit && related.length === 0 ? (
                          <ActionButton variant="outline" size="sm" action={quoteToInvoiceAction.bind(null, q.id, "deposit")}>
                            Acompte
                          </ActionButton>
                        ) : null}
                        <Button asChild size="sm">
                          <Link href={routes.invoices.newProgress(q.id)}>Situation</Link>
                        </Button>
                        {related.length === 0 ? (
                          <ActionButton variant="outline" size="sm" action={quoteToInvoiceAction.bind(null, q.id, "standard")}>
                            Facture unique
                          </ActionButton>
                        ) : null}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}
    </>
  );
}
