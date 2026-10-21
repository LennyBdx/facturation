"use server";

import { revalidatePath } from "next/cache";
import { runAction } from "@/composition/action";
import { routes } from "@/config/routes";
import type { ActionResult } from "@/lib/action-result";
import { inviteSchema, type InviteInput } from "./schemas";

/** Invitation simulée : aucun e-mail n'est envoyé dans le prototype. */
export async function inviteMemberAction(input: InviteInput): Promise<ActionResult> {
  return runAction(
    { permission: "team:manage", schema: inviteSchema, invalidMessage: "Invitation invalide." },
    input,
    async (ctx, data) => {
      const [members, invitations] = await Promise.all([
        ctx.repos.memberships.listByOrganization(ctx.orgId),
        ctx.repos.invitations.list(ctx.orgId),
      ]);
      const users = await ctx.repos.users.listByIds(members.map((m) => m.userId));
      const email = data.email.toLowerCase();
      if (users.some((u) => u.email.toLowerCase() === email)) {
        return {
          ok: false,
          error: "Cette personne fait déjà partie de l'équipe.",
          fieldErrors: { email: "Déjà membre de l'équipe." },
        };
      }
      if (invitations.some((i) => i.email.toLowerCase() === email)) {
        return {
          ok: false,
          error: "Une invitation est déjà en attente pour cette adresse.",
          fieldErrors: { email: "Invitation déjà envoyée." },
        };
      }
      await ctx.repos.invitations.create(ctx.orgId, {
        email,
        role: data.role,
        invitedByUserId: ctx.user.id,
      });
      revalidatePath(routes.team);
      return {
        ok: true,
        message: `Invitation créée pour ${email} (prototype : aucun e-mail envoyé).`,
      };
    },
  );
}

export async function revokeInvitationAction(id: string): Promise<ActionResult> {
  return runAction({ permission: "team:manage" }, undefined, async (ctx) => {
    await ctx.repos.invitations.delete(ctx.orgId, id);
    revalidatePath(routes.team);
    return { ok: true, message: "Invitation annulée." };
  });
}

export async function changeRoleAction(
  membershipId: string,
  role: "admin" | "member",
): Promise<ActionResult> {
  return runAction({ permission: "team:manage" }, undefined, async (ctx) => {
    const members = await ctx.repos.memberships.listByOrganization(ctx.orgId);
    const target = members.find((m) => m.id === membershipId);
    if (!target) return { ok: false, error: "Membre introuvable." };
    if (target.role === "owner")
      return { ok: false, error: "Le rôle du propriétaire ne peut pas être modifié." };
    await ctx.repos.memberships.updateRole(ctx.orgId, membershipId, role);
    revalidatePath(routes.team);
    return { ok: true, message: "Rôle mis à jour." };
  });
}
