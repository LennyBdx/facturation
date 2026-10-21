"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { routes } from "@/config/routes";
import { DEMO_USER_ID } from "@/config/app";
import { listCurrentUserOrganizations } from "@/lib/session";
import {
  ACTIVE_ORG_COOKIE,
  safeNextPath,
  SESSION_COOKIE,
  SESSION_COOKIE_OPTIONS,
} from "@/lib/session-cookie";

/**
 * Ouvre la session de démonstration puis redirige.
 * Avec une vraie authentification : vérifier les identifiants, puis poser un jeton signé.
 */
export async function startSession(next?: string) {
  (await cookies()).set(SESSION_COOKIE, DEMO_USER_ID, SESSION_COOKIE_OPTIONS);
  redirect(safeNextPath(next, routes.dashboard));
}

/** Change l'entreprise active (cookie), si l'utilisateur en est membre. */
export async function switchOrganization(organizationId: string) {
  const orgs = await listCurrentUserOrganizations();
  if (!orgs.some((o) => o.id === organizationId)) return;
  (await cookies()).set(ACTIVE_ORG_COOKIE, organizationId, SESSION_COOKIE_OPTIONS);
  redirect(routes.dashboard);
}

/** Ferme la session et revient à l'écran de connexion. */
export async function signOut() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  store.delete(ACTIVE_ORG_COOKIE);
  redirect(routes.signIn);
}
