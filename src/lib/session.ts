/**
 * Session du prototype : le cookie `factobat_session` désigne l'utilisateur de démonstration.
 * `proxy.ts` fait un contrôle optimiste ; ce module fait la vérification qui fait foi
 * (redirection vers /connexion si la session est absente ou inconnue).
 *
 * Pour brancher une vraie authentification : remplacer la lecture du cookie par la
 * vérification d'un jeton signé. Toutes les pages passent par ce module.
 */
import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { routes } from "@/config/routes";
import { getRepositories, type Membership, type Organization, type User } from "@/data";
import { ACTIVE_ORG_COOKIE, SESSION_COOKIE } from "./session-cookie";

export const getCurrentUser = cache(async (): Promise<User> => {
  const userId = (await cookies()).get(SESSION_COOKIE)?.value;
  const user = userId ? await getRepositories().users.get(userId) : null;
  if (!user) redirect(routes.signIn);
  return user;
});

export const listCurrentUserOrganizations = cache(async (): Promise<Organization[]> => {
  const user = await getCurrentUser();
  return getRepositories().organizations.listForUser(user.id);
});

export const getCurrentOrganization = cache(async (): Promise<Organization> => {
  const orgs = await listCurrentUserOrganizations();
  const wanted = (await cookies()).get(ACTIVE_ORG_COOKIE)?.value;
  const org = orgs.find((o) => o.id === wanted) ?? orgs[0];
  if (!org) throw new Error("Aucune entreprise pour cet utilisateur.");
  return org;
});

export const getCurrentMembership = cache(async (): Promise<Membership> => {
  const [user, org] = await Promise.all([getCurrentUser(), getCurrentOrganization()]);
  const memberships = await getRepositories().memberships.listByOrganization(org.id);
  const m = memberships.find((x) => x.userId === user.id);
  if (!m) throw new Error("Accès refusé à cette entreprise.");
  return m;
});
