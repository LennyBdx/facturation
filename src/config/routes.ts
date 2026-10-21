/**
 * Toutes les routes de l'application, en un seul endroit.
 * Jamais de chemin écrit à la main dans les composants : `routes.invoices.show(id)`
 * plutôt que `/app/factures/${id}`. Un renommage de route se fait ici uniquement.
 */
export const APP_BASE = "/app";

type Query = Record<string, string | number | undefined | null>;

/** Ajoute une chaîne de requête en ignorant les valeurs vides. */
function withQuery(path: string, query?: Query): string {
  if (!query) return path;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) if (v !== undefined && v !== null && v !== "") params.set(k, String(v));
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

const resource = (base: string) => ({
  list: (query?: Query) => withQuery(base, query),
  show: (id: string) => `${base}/${encodeURIComponent(id)}`,
  edit: (id: string) => `${base}/${encodeURIComponent(id)}/modifier`,
});

export const routes = {
  // --- Public ---
  home: "/",
  signIn: "/connexion",
  signUp: "/inscription",
  forgotPassword: "/mot-de-passe-oublie",
  onboarding: "/onboarding",
  legalNotice: "/mentions-legales",
  terms: "/cgu",
  privacy: "/confidentialite",
  contact: "/contact",

  // --- Application ---
  app: APP_BASE,
  dashboard: `${APP_BASE}/tableau-de-bord`,
  clients: { ...resource(`${APP_BASE}/clients`), new: () => `${APP_BASE}/clients/nouveau` },
  worksites: { ...resource(`${APP_BASE}/chantiers`), new: (query?: { client?: string }) => withQuery(`${APP_BASE}/chantiers/nouveau`, query) },
  quotes: {
    ...resource(`${APP_BASE}/devis`),
    new: (query?: { client?: string; chantier?: string }) => withQuery(`${APP_BASE}/devis/nouveau`, query),
    preview: (id: string) => `${APP_BASE}/devis/${encodeURIComponent(id)}/apercu`,
  },
  invoices: {
    ...resource(`${APP_BASE}/factures`),
    new: () => `${APP_BASE}/factures/nouvelle`,
    newProgress: (quoteId: string) => withQuery(`${APP_BASE}/factures/situation/nouvelle`, { devis: quoteId }),
    preview: (id: string) => `${APP_BASE}/factures/${encodeURIComponent(id)}/apercu`,
  },
  received: resource(`${APP_BASE}/factures-recues`),
  team: `${APP_BASE}/equipe`,
  settings: {
    index: `${APP_BASE}/parametres`,
    company: `${APP_BASE}/parametres/entreprise`,
    numbering: `${APP_BASE}/parametres/numerotation`,
    documents: `${APP_BASE}/parametres/documents`,
    eInvoicing: `${APP_BASE}/parametres/facture-electronique`,
    subscription: `${APP_BASE}/parametres/abonnement`,
    accountant: `${APP_BASE}/parametres/expert-comptable`,
    account: `${APP_BASE}/parametres/compte`,
  },

  // --- Suivi interne ---
  debug: { features: "/debug/app", tech: "/debug/tech" },
} as const;
