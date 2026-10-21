/**
 * Contenu de /debug/tech : bonnes pratiques Next.js et SOLID, architecture et
 * patterns du projet. L'état « done / todo » reflète l'audit du code au moment
 * de l'écriture : à mettre à jour quand une pratique est appliquée.
 */
export type PracticeStatus = "done" | "partial" | "todo";

export interface Practice {
  title: string;
  status: PracticeStatus;
  why: string;
  how: string;
  /** Fichiers concernés. */
  where?: string;
}

export interface PracticeGroup {
  id: string;
  title: string;
  items: Practice[];
}

export const STACK = [
  { name: "Next.js 16 (App Router, Turbopack)", role: "Pages rendues côté serveur, Server Actions pour les mutations." },
  { name: "React 19 + TypeScript strict", role: "Composants serveur par défaut, composants client seulement pour l'interactivité." },
  { name: "Tailwind CSS v4 + shadcn/ui (Radix)", role: "Jetons de design en variables CSS, composants accessibles." },
  { name: "Zod + React Hook Form", role: "Mêmes schémas de validation côté client et côté serveur." },
  { name: "decimal.js", role: "Tous les montants : jamais de nombre flottant pour de l'argent." },
  { name: "Vitest", role: "Tests de la logique métier (calculs, identifiants, conformité, numérotation)." },
  { name: "Playwright", role: "Scripts de captures (références et site vitrine), pas encore de tests de bout en bout." },
  { name: "ESLint + Prettier", role: "Qualité et règles d'architecture (imports interdits entre couches)." },
];

/** Couches, de l'extérieur (interface) vers le cœur (domaine). */
export const LAYERS = [
  {
    name: "Interface",
    path: "src/app, src/components, src/features/*/(*.tsx)",
    role: "Pages (composants serveur), formulaires et widgets (composants client). Aucune règle métier : elles affichent et déclenchent.",
  },
  {
    name: "Actions",
    path: "src/features/*/actions.ts",
    role: "Point d'entrée des mutations : validation Zod, appel d'un service, réponse ActionResult typée.",
  },
  {
    name: "Services (cas d'usage)",
    path: "src/services",
    role: "Orchestration : « émettre une facture » = contrôler, numéroter, figer, déposer. Dépendent d'interfaces, jamais d'implémentations.",
  },
  {
    name: "Domaine",
    path: "src/domain",
    role: "Fonctions pures et testées : montants, TVA, situations, identifiants, numérotation, conformité, statuts. Aucune dépendance au framework.",
  },
  {
    name: "Ports (interfaces)",
    path: "src/data/repositories.ts, src/integrations/e-invoicing/provider.ts",
    role: "Contrats attendus de la persistance et de la plateforme agréée.",
  },
  {
    name: "Adaptateurs",
    path: "src/data/memory, src/integrations/e-invoicing/mock-provider.ts",
    role: "Implémentations actuelles (mémoire, plateforme simulée), remplaçables par PostgreSQL et l'API réelle sans toucher aux couches au-dessus.",
  },
  {
    name: "Racine de composition",
    path: "src/data/index.ts, src/integrations/e-invoicing/index.ts, src/services/context.ts",
    role: "Seul endroit qui choisit les implémentations concrètes et les assemble.",
  },
];

export const SOLID = [
  {
    letter: "S",
    name: "Responsabilité unique",
    now: "Chaque couche a un rôle : le domaine calcule, les services orchestrent, les actions valident, les pages affichent. Les mentions légales, les constructeurs de documents et le tableau de bord ont chacun leur module.",
    target: "Découper les gros fichiers qui cumulent plusieurs rôles : l'éditeur de devis (état, raccourcis clavier, rendu des lignes, totaux) et la fiche facture (calculs d'affichage + rendu).",
  },
  {
    letter: "O",
    name: "Ouvert / fermé",
    now: "Les statuts sont décrits par des tables de correspondance (status-config.ts) : un nouveau statut s'ajoute sans modifier les composants. Une nouvelle plateforme agréée = une nouvelle classe qui implémente EInvoicingProvider.",
    target: "Faire de même pour les types de facture (acompte, situation, solde, avoir) : une stratégie par type plutôt que des conditions réparties dans les services et les pages.",
  },
  {
    letter: "L",
    name: "Substitution de Liskov",
    now: "Les repositories en mémoire et la plateforme simulée respectent exactement leurs interfaces : les services fonctionnent à l'identique avec n'importe quelle implémentation.",
    target: "Ajouter une suite de tests de contrat commune, exécutée sur chaque implémentation (mémoire aujourd'hui, PostgreSQL demain).",
  },
  {
    letter: "I",
    name: "Ségrégation des interfaces",
    now: "Un repository par entité, avec seulement les méthodes utiles.",
    target: "Les services reçoivent aujourd'hui tout le contexte (tous les repositories). Leur passer uniquement ce dont ils ont besoin (ex. { invoices, organizations, provider }).",
  },
  {
    letter: "D",
    name: "Inversion des dépendances",
    now: "Services et pages dépendent des interfaces (Repositories, EInvoicingProvider). Les implémentations sont choisies dans la racine de composition. ESLint interdit d'importer les implémentations depuis l'interface.",
    target: "getContext() fait office de localisateur de services : le remplacer par une injection explicite (fabrique createServices(deps)), ce qui rend chaque service testable avec des doublures.",
  },
];

export const PATTERNS = [
  { name: "Ports et adaptateurs (hexagonal)", where: "data/repositories.ts, integrations/e-invoicing", what: "Le cœur ne connaît que des interfaces ; la base et la plateforme sont branchées de l'extérieur." },
  { name: "Repository", where: "src/data", what: "Accès aux données par entité, filtré par entreprise, avec copies défensives." },
  { name: "Service applicatif", where: "src/services", what: "Un cas d'usage = une fonction (émettre, enregistrer un paiement, créer une situation)." },
  { name: "Cœur fonctionnel, coquille impérative", where: "src/domain", what: "Calculs purs et déterministes ; les effets (base, plateforme) restent dans les services." },
  { name: "Adaptateur", where: "MockEInvoicingProvider", what: "Traduit le contrat EInvoicingProvider vers une plateforme (simulée ici)." },
  { name: "Builder", where: "services/builders.ts", what: "Construction des factures (acompte, situation, avoir) à partir d'un devis." },
  { name: "Snapshot", where: "Invoice.seller / Invoice.buyer", what: "Données figées à l'émission : une facture ne change plus si la fiche client change." },
  { name: "État dérivé", where: "invoicePaymentStatus", what: "Le statut de paiement est recalculé, jamais stocké : pas d'incohérence possible." },
  { name: "Objet valeur", where: "Money, Percent (chaînes décimales)", what: "Montants manipulés uniquement via domain/money.ts." },
  { name: "Résultat typé", where: "ActionResult", what: "Les actions renvoient { ok, data } ou { ok: false, error, fieldErrors }, sans exception vers le client." },
  { name: "Table de correspondance", where: "status-config.ts", what: "Libellé, ton et icône de chaque statut au même endroit." },
  { name: "Contenu séparé du code", where: "src/content", what: "Textes du site vitrine et des pages de suivi modifiables sans toucher aux composants." },
];

export const PRACTICES: PracticeGroup[] = [
  {
    id: "rendu",
    title: "Rendu et composants",
    items: [
      { title: "Composants serveur par défaut", status: "done", why: "Moins de JavaScript envoyé, données lues au plus près.", how: "« use client » uniquement pour les formulaires, menus et widgets interactifs (25 fichiers)." },
      { title: "Requêtes en parallèle", status: "done", why: "Éviter les cascades d'attente.", how: "Promise.all dans les pages qui lisent plusieurs repositories." },
      { title: "Mémoïsation par requête de la session", status: "done", why: "Ne pas relire l'utilisateur et l'entreprise plusieurs fois par rendu.", how: "React.cache dans lib/session.ts." },
      { title: "Streaming avec Suspense", status: "todo", why: "Afficher la page sans attendre les blocs lents quand une vraie base sera branchée.", how: "Envelopper les blocs secondaires (listes du tableau de bord, frise) dans <Suspense> avec un squelette.", where: "app/app/tableau-de-bord, app/app/factures/[id]" },
      { title: "Découper les gros composants client", status: "todo", why: "Lisibilité, tests, re-rendus ciblés.", how: "Extraire de l'éditeur de devis : un hook useQuoteEditor (état et actions), un composant de ligne et un composant de totaux.", where: "features/quotes/quote-editor.tsx (644 lignes)" },
    ],
  },
  {
    id: "donnees",
    title: "Données, cache et mutations",
    items: [
      { title: "Mutations par Server Actions validées avec Zod", status: "done", why: "Ne jamais faire confiance aux données du client.", how: "Chaque action revalide côté serveur avec le même schéma que le formulaire." },
      { title: "Revalidation ciblée après mutation", status: "done", why: "Rafraîchir uniquement les pages concernées.", how: "revalidatePath sur la liste et la fiche modifiées." },
      { title: "Protéger le code serveur", status: "todo", why: "Empêcher qu'un module serveur soit importé par erreur côté client (fuite de secrets).", how: "Ajouter import \"server-only\" en tête de services/, data/ et lib/session.ts.", where: "src/services, src/data, src/lib/session.ts" },
      { title: "Fabrique d'actions commune", status: "todo", why: "La gestion des erreurs métier est recopiée dans plusieurs fichiers d'actions.", how: "Créer createAction(schema, handler) : validation, contexte, autorisation, conversion des erreurs en ActionResult.", where: "features/*/actions.ts" },
      { title: "Stratégie de cache avec la vraie base", status: "todo", why: "Aujourd'hui tout est dynamique (force-dynamic), ce qui convient au prototype en mémoire.", how: "Réactiver Cache Components, mettre « use cache » + cacheTag sur les lectures et revalidateTag dans les actions." },
      { title: "Transactions pour l'émission", status: "todo", why: "Numéro attribué et facture émise doivent réussir ou échouer ensemble.", how: "Transaction PostgreSQL autour de takeNextNumber et de la mise à jour de la facture.", where: "services/invoices.ts › issueInvoice" },
    ],
  },
  {
    id: "securite",
    title: "Sécurité",
    items: [
      { title: "Isolation par entreprise", status: "done", why: "Une entreprise ne doit jamais voir les données d'une autre.", how: "Toutes les méthodes des repositories filtrent par organizationId." },
      { title: "Autorisation dans chaque action", status: "partial", why: "Une action serveur est un point d'accès public : le rôle doit être vérifié côté serveur.", how: "Contrôlé pour l'équipe et les paramètres ; à généraliser (ex. un membre ne peut pas émettre) via la fabrique d'actions.", where: "features/*/actions.ts" },
      { title: "Protection des routes par session", status: "todo", why: "Rediriger vers /connexion sans session.", how: "src/proxy.ts (ancien middleware) sur /app et /debug, puis contrôle de session dans lib/session.ts." },
      { title: "En-têtes de sécurité (CSP, HSTS…)", status: "todo", why: "Limiter les injections et le détournement de clics.", how: "headers() dans next.config.ts ou dans le proxy.", where: "next.config.ts" },
      { title: "Pages /debug fermées en production", status: "todo", why: "Elles exposent l'état interne du projet.", how: "notFound() si NODE_ENV === \"production\" sans variable d'activation, ou accès réservé aux administrateurs.", where: "app/debug" },
      { title: "Validation des variables d'environnement", status: "todo", why: "Échouer au démarrage plutôt qu'en production quand une clé manque.", how: "Schéma Zod des variables (base de données, plateforme, Stripe) au branchement du back-end." },
    ],
  },
  {
    id: "robustesse",
    title: "Erreurs et observabilité",
    items: [
      { title: "error.tsx, not-found.tsx, loading.tsx", status: "done", why: "États d'erreur, d'absence et de chargement soignés.", how: "Présents dans l'application (/app)." },
      { title: "global-error.tsx", status: "todo", why: "Dernier filet si la mise en page racine plante.", how: "Ajouter src/app/global-error.tsx avec son propre <html>." },
      { title: "Journalisation et suivi des erreurs", status: "todo", why: "Savoir ce qui casse en production.", how: "src/instrumentation.ts + un service de suivi (Sentry ou équivalent) au moment du déploiement." },
    ],
  },
  {
    id: "qualite",
    title: "Qualité et outillage",
    items: [
      { title: "TypeScript strict", status: "done", why: "Erreurs détectées à la compilation.", how: "strict: true, aucune erreur de typage." },
      { title: "Règles d'architecture dans ESLint", status: "done", why: "Empêcher le contournement des couches.", how: "no-restricted-imports : l'interface ne peut pas importer les implémentations de données." },
      { title: "Tests du domaine", status: "done", why: "Les calculs d'argent doivent être prouvés.", how: "61 tests Vitest (devis, situations, identifiants, numérotation, conformité, données fictives)." },
      { title: "Tests des services et de bout en bout", status: "todo", why: "Vérifier les parcours complets (émettre, payer, redéposer).", how: "Tests Vitest des services avec repositories en mémoire ; tests Playwright des parcours clés." },
      { title: "Routes typées", status: "todo", why: "99 liens « /app/… » écrits à la main : une faute de frappe n'est pas détectée.", how: "Activer typedRoutes dans next.config.ts, ou des fonctions de route (routes.invoice(id)) dans config/routes.ts." },
      { title: "Intégration continue", status: "todo", why: "Lint, typage, tests et build à chaque push.", how: "GitHub Actions : pnpm install, lint, tsc --noEmit, test, build ; script « typecheck » à ajouter." },
    ],
  },
  {
    id: "perf",
    title: "Performance, accessibilité, SEO",
    items: [
      { title: "next/image et next/font", status: "done", why: "Images optimisées (AVIF/WebP), polices sans décalage.", how: "Captures du site vitrine et IBM Plex via next/font." },
      { title: "Métadonnées, Open Graph, sitemap, robots", status: "done", why: "Référencement et partage.", how: "Site vitrine indexé ; /app, /onboarding et /debug exclus." },
      { title: "Accessibilité", status: "done", why: "Utilisable au clavier et au lecteur d'écran, lisible sur chantier.", how: "Libellés, focus visible, contrastes vérifiés, erreurs annoncées, animations réduites." },
      { title: "Images des captures plus légères", status: "todo", why: "Les PNG sources pèsent 200 à 450 ko.", how: "Les convertir en WebP à la génération (next/image les optimise déjà à l'affichage)." },
    ],
  },
];
