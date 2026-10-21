"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACTIVE_ORG_COOKIE, listCurrentUserOrganizations } from "@/lib/session";

/** Change l'entreprise active (cookie), si l'utilisateur en est membre. */
export async function switchOrganization(organizationId: string) {
  const orgs = await listCurrentUserOrganizations();
  if (!orgs.some((o) => o.id === organizationId)) return;
  (await cookies()).set(ACTIVE_ORG_COOKIE, organizationId, { path: "/", sameSite: "lax", httpOnly: true });
  redirect("/app/tableau-de-bord");
}

/** Déconnexion simulée : retour à l'écran de connexion. */
export async function signOut() {
  redirect("/connexion");
}
