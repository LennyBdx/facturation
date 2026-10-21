import Link from "next/link";
import { ArrowRight, CircleCheck, Send, ShieldAlert, TriangleAlert } from "lucide-react";
import { ActionButton } from "@/components/forms/action-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { routes } from "@/config/routes";
import type { ComplianceReport, ComplianceScope } from "@/domain/compliance";
import { issueInvoiceAction } from "../actions";

/** Brouillon : contrôle de conformité bloquant, avec liens de correction, puis émission. */
export function CompliancePanel({
  invoiceId,
  clientId,
  report,
  throughPlatform,
}: {
  invoiceId: string;
  clientId: string;
  report: ComplianceReport;
  throughPlatform: boolean;
}) {
  const fix: Record<ComplianceScope, { href: string; label: string }> = {
    seller: { href: routes.settings.company, label: "Compléter les informations de l'entreprise" },
    buyer: { href: routes.clients.edit(clientId), label: "Compléter la fiche client" },
    invoice: { href: routes.invoices.edit(invoiceId), label: "Modifier le brouillon" },
  };

  return (
    <Card className={report.ok ? "mb-6 border-success/40" : "mb-6 border-danger/40"}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          {report.ok ? (
            <CircleCheck aria-hidden className="size-5 text-success" />
          ) : (
            <ShieldAlert aria-hidden className="size-5 text-danger" />
          )}
          Contrôle avant émission
        </CardTitle>
        <CardDescription>
          {report.ok
            ? throughPlatform
              ? "Toutes les mentions obligatoires sont présentes. La facture recevra son numéro définitif puis sera déposée sur votre plateforme agréée."
              : "Toutes les mentions obligatoires sont présentes. Client particulier : la facture est émise sans transmission électronique (e-reporting)."
            : "Des données obligatoires manquent : l'émission est bloquée tant qu'elles ne sont pas corrigées."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {report.issues.length > 0 ? (
          <ul className="space-y-2">
            {report.issues.map((issue) => (
              <li
                key={issue.id}
                className="flex flex-col gap-1 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="flex items-start gap-2 text-sm">
                  <TriangleAlert
                    aria-hidden
                    className={
                      issue.blocking
                        ? "mt-0.5 size-4 shrink-0 text-danger"
                        : "mt-0.5 size-4 shrink-0 text-warning"
                    }
                  />
                  <span>
                    {issue.message}
                    {!issue.blocking ? (
                      <span className="text-muted-foreground"> (recommandé)</span>
                    ) : null}
                  </span>
                </span>
                <Link
                  href={fix[issue.scope].href}
                  className="inline-flex min-h-11 shrink-0 items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline md:min-h-0"
                >
                  {fix[issue.scope].label}
                  <ArrowRight aria-hidden className="size-4" />
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
        <ActionButton
          size="lg"
          disabled={!report.ok}
          action={issueInvoiceAction.bind(null, invoiceId)}
          confirm={{
            title: throughPlatform ? "Émettre et transmettre la facture ?" : "Émettre la facture ?",
            description: (
              <>
                Un numéro définitif sera attribué et la facture ne sera plus modifiable (correction
                par avoir uniquement).
                {throughPlatform
                  ? " Elle sera déposée sur la plateforme agréée qui la transmettra à votre client."
                  : ""}
              </>
            ),
            confirmLabel: throughPlatform ? "Émettre et transmettre" : "Émettre",
          }}
        >
          <Send aria-hidden />
          {throughPlatform ? "Émettre et transmettre" : "Émettre la facture"}
        </ActionButton>
      </CardContent>
    </Card>
  );
}
