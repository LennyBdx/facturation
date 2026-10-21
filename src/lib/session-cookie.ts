/**
 * Noms et options des cookies de session. Module sans dépendance serveur :
 * importable par `proxy.ts`, les Server Actions et les scripts.
 */
export const SESSION_COOKIE = "factobat_session";
export const ACTIVE_ORG_COOKIE = "factobat_org";

export const SESSION_COOKIE_OPTIONS = {
  path: "/",
  sameSite: "lax",
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 24 * 7,
} as const;

/** N'accepte qu'un chemin interne (évite les redirections ouvertes `//evil.com`). */
export function safeNextPath(next: string | null | undefined, fallback: string): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\"))
    return fallback;
  return next;
}
