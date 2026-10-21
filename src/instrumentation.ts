import type { Instrumentation } from "next";

/** Point d'entrée de l'observabilité (Next.js). Brancher ici Sentry ou équivalent au déploiement. */
export function register() {}

/** Toute erreur serveur non gérée (rendu, Server Action, route) est journalisée de façon structurée. */
export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  const { logger } = await import("@/lib/logger");
  logger.error("Erreur serveur non gérée", err, {
    method: request.method,
    path: request.path,
    routePath: context.routePath,
    routeType: context.routeType,
  });
};
