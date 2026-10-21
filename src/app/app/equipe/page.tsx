import type { Metadata } from "next";
import { Clock, X } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { ActionButton } from "@/components/forms/action-button";
import { ToneBadge } from "@/components/status/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { MemberRole } from "@/data/types";
import { revokeInvitationAction } from "@/features/team/actions";
import { InviteForm, RoleSelect } from "@/features/team/team-widgets";
import { formatDate, initials } from "@/lib/format";
import { can } from "@/domain/permissions";
import { getRequestContext } from "@/composition/request-context";

export const metadata: Metadata = { title: "Équipe" };

const ROLE_LABELS: Record<MemberRole, string> = {
  owner: "Propriétaire",
  admin: "Administrateur",
  member: "Membre",
};

export default async function TeamPage() {
  const ctx = await getRequestContext();
  const [members, invitations] = await Promise.all([
    ctx.repos.memberships.listByOrganization(ctx.orgId),
    ctx.repos.invitations.list(ctx.orgId),
  ]);
  const users = new Map(
    (await ctx.repos.users.listByIds(members.map((m) => m.userId))).map((u) => [u.id, u]),
  );
  const canManage = can(ctx.role, "team:manage");
  const now = new Date(`${ctx.today}T12:00:00Z`).toISOString();

  return (
    <>
      <PageHeader title="Équipe" description={`Les personnes qui ont accès à ${ctx.org.name}.`} />
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Membres ({members.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="divide-y">
                {members.map((m) => {
                  const u = users.get(m.userId)!;
                  const name = `${u.firstName} ${u.lastName}`;
                  return (
                    <li
                      key={m.id}
                      className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          aria-hidden
                          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent font-semibold text-accent-foreground"
                        >
                          {initials(u.firstName, u.lastName)}
                        </span>
                        <div className="min-w-0">
                          <p className="font-medium">
                            {name}
                            {u.id === ctx.user.id ? (
                              <span className="text-sm font-normal text-muted-foreground">
                                {" "}
                                (vous)
                              </span>
                            ) : null}
                          </p>
                          <p className="truncate text-sm text-muted-foreground">
                            {u.jobTitle ? `${u.jobTitle} · ` : ""}
                            {u.email}
                          </p>
                        </div>
                      </div>
                      {canManage && m.role !== "owner" && u.id !== ctx.user.id ? (
                        <RoleSelect membershipId={m.id} role={m.role} name={name} />
                      ) : (
                        <ToneBadge tone={m.role === "owner" ? "info" : "neutral"}>
                          {ROLE_LABELS[m.role]}
                        </ToneBadge>
                      )}
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Invitations en attente ({invitations.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {invitations.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune invitation en attente.</p>
              ) : (
                <ul className="divide-y">
                  {invitations.map((inv) => {
                    const expired = inv.expiresAt < now;
                    return (
                      <li
                        key={inv.id}
                        className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium">{inv.email}</p>
                          <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                            {ROLE_LABELS[inv.role]} · envoyée le {formatDate(inv.createdAt)}
                            {expired ? (
                              <ToneBadge tone="warning" icon={Clock}>
                                Expirée
                              </ToneBadge>
                            ) : (
                              <span>· expire le {formatDate(inv.expiresAt)}</span>
                            )}
                          </p>
                        </div>
                        {canManage ? (
                          <ActionButton
                            variant="ghost"
                            size="sm"
                            action={revokeInvitationAction.bind(null, inv.id)}
                            confirm={{
                              title: "Annuler l'invitation ?",
                              description: `Le lien envoyé à ${inv.email} ne fonctionnera plus.`,
                              confirmLabel: "Annuler l'invitation",
                              destructive: true,
                            }}
                          >
                            <X aria-hidden />
                            Annuler
                          </ActionButton>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {canManage ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Inviter une personne</CardTitle>
                <CardDescription>
                  Conducteur de travaux, assistante, associé… Prototype : aucun e-mail n&apos;est
                  envoyé.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <InviteForm />
              </CardContent>
            </Card>
          ) : null}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Rôles</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="font-medium">Propriétaire</dt>
                  <dd className="text-muted-foreground">
                    Tous les droits, abonnement et suppression de l&apos;entreprise.
                  </dd>
                </div>
                <div>
                  <dt className="font-medium">Administrateur</dt>
                  <dd className="text-muted-foreground">
                    Gère l&apos;équipe, les paramètres et émet les factures.
                  </dd>
                </div>
                <div>
                  <dt className="font-medium">Membre</dt>
                  <dd className="text-muted-foreground">
                    Crée devis, situations et chantiers ; consulte les factures.
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
