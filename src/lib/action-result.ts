/**
 * Résultat standard d'une Server Action (type partagé client / serveur).
 * Jamais d'exception renvoyée au client : soit un succès, soit une erreur lisible.
 */
export type ActionResult<T = undefined> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };
