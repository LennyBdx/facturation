import Link from "next/link";
import { RotateCw } from "lucide-react";
import { LifecycleTimeline } from "@/components/app/lifecycle-timeline";
import { ActionButton } from "@/components/forms/action-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { routes } from "@/config/routes";
import type { Invoice } from "@/data/types";
import { resubmitInvoiceAction } from "../actions";
import { LifecyclePoller } from "../invoice-widgets";

/** Cycle de vie de la facture électronique : alertes selon le statut, suivi en direct, frise. */
export function EInvoicingCard({
  invoice,
  clientId,
  throughPlatform,
  canResubmit,
}: {
  invoice: Invoice;
  clientId: string;
  throughPlatform: boolean;
  canResubmit: boolean;
}) {
  const { status, events, platformInvoiceId } = invoice.eInvoicing;
  const lastEvent = events.at(-1);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Facture électronique</CardTitle>
        <CardDescription>
          {throughPlatform
            ? platformInvoiceId
              ? `Identifiant plateforme : ${platformInvoiceId}`
              : "Émise avant la connexion à la plateforme agréée."
            : "Client particulier : pas de facture électronique, les données de la vente sont transmises par e-reporting."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {status === "rejected" ? (
          <div
            role="alert"
            className="space-y-3 rounded-md border border-danger/30 bg-danger-soft p-3 text-sm text-danger"
          >
            <p>
              <strong>Rejetée par la plateforme</strong> : la facture n&apos;a pas été transmise et
              n&apos;existe pas fiscalement. Corrigez la donnée en cause puis redéposez-la (même
              numéro).
            </p>
            {lastEvent?.comment ? <p>Motif : {lastEvent.comment}</p> : null}
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline">
                <Link href={routes.clients.edit(clientId)}>Corriger la fiche client</Link>
              </Button>
              {canResubmit ? (
                <ActionButton size="sm" action={resubmitInvoiceAction.bind(null, invoice.id)}>
                  <RotateCw aria-hidden />
                  Redéposer
                </ActionButton>
              ) : null}
            </div>
          </div>
        ) : null}
        {status === "refused" ? (
          <div
            role="alert"
            className="rounded-md border border-danger/30 bg-danger-soft p-3 text-sm text-danger"
          >
            <strong>Refusée par le client</strong> : la facture existe fiscalement ; annulez-la par
            un avoir puis émettez une facture corrigée.
            {lastEvent?.comment ? <p className="mt-1">Motif : {lastEvent.comment}</p> : null}
          </div>
        ) : null}
        {status === "disputed" || status === "suspended" ? (
          <div
            role="alert"
            className="rounded-md border border-warning/30 bg-warning-soft p-3 text-sm text-warning"
          >
            <strong>{status === "disputed" ? "En litige" : "Suspendue"}</strong> : votre client
            attend une réponse ou un complément.
            {lastEvent?.comment ? <p className="mt-1">« {lastEvent.comment} »</p> : null}
          </div>
        ) : null}
        <LifecyclePoller invoiceId={invoice.id} status={status} eventCount={events.length} />
        {events.length > 0 ? (
          <LifecycleTimeline events={events} />
        ) : (
          <p className="text-sm text-muted-foreground">Aucun événement de cycle de vie.</p>
        )}
      </CardContent>
    </Card>
  );
}
