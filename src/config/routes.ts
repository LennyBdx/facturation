/**
 * Routes publiques et points d'entrée de l'application.
 * L'application authentifiée vit sous `/app` ; le site vitrine à la racine.
 */
export const APP_BASE = "/app";

export const ROUTES = {
  home: "/",
  appHome: `${APP_BASE}/tableau-de-bord`,
  signIn: "/connexion",
  signUp: "/inscription",
  forgotPassword: "/mot-de-passe-oublie",
  onboarding: "/onboarding",
  legalNotice: "/mentions-legales",
  terms: "/cgu",
  privacy: "/confidentialite",
  contact: "/contact",
} as const;
