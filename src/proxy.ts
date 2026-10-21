import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/session-cookie";

/**
 * Contrôle optimiste : sans cookie de session, l'espace connecté redirige vers /connexion.
 * La vérification qui fait foi reste côté serveur (`lib/session.ts`), au plus près des données.
 */
export function proxy(request: NextRequest) {
  if (request.cookies.has(SESSION_COOKIE)) return NextResponse.next();
  const url = request.nextUrl.clone();
  url.pathname = "/connexion";
  url.search = "";
  url.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/app/:path*", "/onboarding/:path*"],
};
