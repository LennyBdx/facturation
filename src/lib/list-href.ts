/** Paramètres d'URL d'une liste (recherche, filtre, tri, page). */
export type ListQuery = Record<string, string | undefined>;

/**
 * URL d'une liste à partir des paramètres courants et d'une modification.
 * Les valeurs vides sont retirées ; la page n'est conservée que si `patch` la fixe
 * (un nouveau tri ou filtre revient en page 1).
 */
export function listHref(pathname: string, query: ListQuery, patch: ListQuery = {}): string {
  const params = new URLSearchParams();
  const merged: ListQuery = { ...query, page: undefined, ...patch };
  for (const [k, v] of Object.entries(merged)) if (v) params.set(k, v);
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}
