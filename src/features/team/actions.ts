"use server";

import { routes } from "@/config/routes";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { emailSchema, fieldErrors } from "@/lib/validation";
import { type ActionResult, getContext } from "@/services/context";

const inviteSchema = z.object({
  email: emailSchema,
  role: z.enum(["admin", "member"], { error: "Choisissez un rôle." }),
});
export type InviteInput = z.input<typeof inviteSchema>;

async function requireAdmin() {
  const ctx = await getContext();
  const me = await ctx.membership();
  if (me.role === "member") return { ctx, error: "Seuls les propriétaires et administrateurs peuvent gérer l'équipe." };
  return { ctx, error: null };
}

/** Invitation simulée : aucun e-mail n'est envoyé dans le prototype. */
export async function inviteMemberAction(input: InviteInput): Promise<ActionResult> {
  const parsed = inviteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invitation invalide.", fieldErrors: fieldErrors(parsed.error) };
  const { ctx, error } = await requireAdmin();
  if (error) return { ok: false, error };
  const [members, invitations] = await Promise.all([ctx.repos.memberships.listByOrganization(ctx.orgId), ctx.repos.invitations.list(ctx.orgId)]);
  const users = await ctx.repos.users.listByIds(members.map((m) => m.userId));
  const email = parsed.data.email.toLowerCase();
  if (users.some((u) => u.email.toLowerCase() === email)) {
    return { ok: false, error: "Cette personne fait déjà partie de l'équipe.", fieldErrors: { email: "Déjà membre de l'équipe." } };
  }
  if (invitations.some((i) => i.email.toLowerCase() === email)) {
    return { ok: false, error: "Une invitation est déjà en attente pour cette adresse.", fieldErrors: { email: "Invitation déjà envoyée." } };
  }
  await ctx.repos.invitations.create(ctx.orgId, { email, role: parsed.data.role, invitedByUserId: ctx.user.id });
  revalidatePath(routes.team);
  return { ok: true, message: `Invitation créée pour ${email} (prototype : aucun e-mail envoyé).` };
}

export async function revokeInvitationAction(id: string): Promise<ActionResult> {
  const { ctx, error } = await requireAdmin();
  if (error) return { ok: false, error };
  await ctx.repos.invitations.delete(ctx.orgId, id);
  revalidatePath(routes.team);
  return { ok: true, message: "Invitation annulée." };
}

export async function changeRoleAction(membershipId: string, role: "admin" | "member"): Promise<ActionResult> {
  const { ctx, error } = await requireAdmin();
  if (error) return { ok: false, error };
  const members = await ctx.repos.memberships.listByOrganization(ctx.orgId);
  const target = members.find((m) => m.id === membershipId);
  if (!target) return { ok: false, error: "Membre introuvable." };
  if (target.role === "owner") return { ok: false, error: "Le rôle du propriétaire ne peut pas être modifié." };
  await ctx.repos.memberships.updateRole(ctx.orgId, membershipId, role);
  revalidatePath(routes.team);
  return { ok: true, message: "Rôle mis à jour." };
}
