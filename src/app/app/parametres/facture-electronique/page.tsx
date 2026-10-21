import type { Metadata } from "next";
import { CalendarClock, CircleCheck, CircleDashed, Network, Send, ShieldCheck } from "lucide-react";
import { ToneBadge } from "@/components/status/status-badge";
import { LIFECYCLE_STATUS } from "@/components/status/status-config";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { E_INVOICING_READY_LABEL } from "@/config/app";
import { LIFECYCLE_STATUSES, type LifecycleStatus } from "@/domain/lifecycle";
import { PlatformPicker } from "@/features/settings/platform-picker";
import { formatDateTime } from "@/lib/format";
import { getContext } from "@/services/context";

export const metadata: Metadata = { title: "Facture électronique — Paramètres" };

export default async function EInvoicingSettingsPage() {
  const { org, provider } = await getContext();
  const platforms = await provider.listPlatforms();
  const e = org.settings.eInvoicing;
  const current = platforms.find((p) => p.id === e.platformId);

  return (
    <section aria-labelledby="s-title" className="space-y-6">
      <div>
        <h2 id="s-title" className="flex items-center gap-2 text-xl font-semibold">
          Facture électronique
          <ToneBadge tone="success" icon={ShieldCheck}>
            {E_INVOICING_READY_LABEL}
          </ToneBadge>
        </h2>
        <p className="text-sm text-muted-foreground">
          Nous préparons vos factures et les transmettons à la plateforme agréée de votre choix. Liste et connexion fictives dans le prototype.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Connexion à votre plateforme agréée</CardTitle>
          <CardDescription>
            {e.connectionStatus === "connected"
              ? `Connectée à ${current?.name ?? "la plateforme"} depuis le ${formatDateTime(e.connectedAt)}.`
              : e.connectionStatus === "pending"
                ? `Connexion à ${current?.name ?? "la plateforme"} en cours de validation.`
                : "Aucune plateforme connectée : vos factures ne peuvent pas être transmises."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="flex items-center gap-2 text-sm">
            {e.connectionStatus === "connected" ? (
              <ToneBadge tone="success" icon={CircleCheck}>
                Connectée
              </ToneBadge>
            ) : e.connectionStatus === "pending" ? (
              <ToneBadge tone="warning" icon={CircleDashed}>
                En attente
              </ToneBadge>
            ) : (
              <ToneBadge tone="danger">Non connectée</ToneBadge>
            )}
            {e.receptionAddress ? (
              <span className="text-muted-foreground">
                Adresse de réception : <span className="font-mono">{e.receptionAddress}</span>
              </span>
            ) : null}
          </p>
          <PlatformPicker platforms={platforms} current={e.platformId} connected={e.connectionStatus === "connected"} />
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <CalendarClock aria-hidden className="mb-2 size-5 text-brand" />
          <p className="font-medium">Calendrier de la réforme</p>
          <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
            <li>1er septembre 2026 : réception obligatoire pour toutes les entreprises ; émission pour les grandes entreprises et ETI.</li>
            <li>1er septembre 2027 : émission obligatoire pour les PME, TPE et micro-entreprises.</li>
          </ul>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <Network aria-hidden className="mb-2 size-5 text-brand" />
          <p className="font-medium">Plateforme agréée</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Immatriculée par l&apos;État, elle émet, transmet et reçoit vos factures électroniques et transmet les données à l&apos;administration.
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <Send aria-hidden className="mb-2 size-5 text-brand" />
          <p className="font-medium">Particuliers et étranger</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Les ventes aux particuliers ne passent pas par la facture électronique : leurs données sont transmises par e-reporting.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Statuts du cycle de vie</CardTitle>
          <CardDescription>
            Statuts échangés entre plateformes. Ceux marqués « obligatoire » sont transmis à l&apos;administration. Pour des travaux (prestations de
            services, TVA exigible à l&apos;encaissement), le statut « Encaissée » doit être déclaré à réception du paiement.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-2 sm:grid-cols-2">
            {(Object.keys(LIFECYCLE_STATUSES) as LifecycleStatus[]).map((k) => {
              const s = LIFECYCLE_STATUS[k];
              return (
                <li key={k} className="flex items-center gap-2 text-sm">
                  <span className="num w-9 text-muted-foreground">{s.code}</span>
                  <ToneBadge tone={s.tone} icon={s.icon}>
                    {s.label}
                  </ToneBadge>
                  {s.mandatory ? <span className="text-xs font-medium text-muted-foreground">obligatoire</span> : null}
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    </section>
  );
}
