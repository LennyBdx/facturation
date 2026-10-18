/**
 * Session FICTIVE du prototype : un utilisateur est toujours « connecté ».
 * L'entreprise active est mémorisée dans un cookie.
 *
 * Pour brancher une vraie authentification : réimplémenter ces fonctions à partir
 * de la session (cookie signé / JWT) et rediriger vers /connexion si absente.
 * Toutes les pages passent par ce module.
 */
import { cookies } from "next/headers";
import { cache } from "react";
import { DEMO_USER_ID } from "@/config/app";
import { getRepositories, type Membership, type Organization, type User } from "@/data";

export const ACTIVE_ORG_COOKIE = "situa_org";

export const getCurrentUser = cache(async (): Promise<User> => {
  const user = await getRepositories().users.get(DEMO_USER_ID);
  if (!user) throw new Error("Utilisateur de démonstration introuvable.");
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
