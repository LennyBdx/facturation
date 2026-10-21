/**
 * Contenu de /debug/tech : fiche technique du projet (stack, découpage, couches,
 * flux, SOLID, patterns, rendu et cache, sécurité, qualité, conventions).
 * Décrit le code tel qu'il est : à tenir à jour avec l'architecture.
 */

export interface StackItem {
  name: string;
  version: string;
  role: string;
}

export interface StackGroup {
  title: string;
  items: StackItem[];
}

export const STACK: StackGroup[] = [
  {
    title: "Socle",
    items: [
      {
        name: "Next.js",
        version: "16.4 · App Router · Turbopack",
        role: "Rendu serveur, Server Actions, Cache Components et prérendu partiel, proxy.ts.",
      },
      {
        name: "React",
        version: "19.3",
        role: "Composants serveur par défaut ; composants client uniquement pour l'interactivité.",
      },
      {
        name: "TypeScript",
        version: "5 · strict",
        role: "Types de routes générés (next typegen), aucun any implicite.",
      },
    ],
  },
  {
    title: "Interface",
    items: [
      {
        name: "Tailwind CSS",
        version: "4",
        role: "Jetons de design en variables CSS (clair / sombre), classes triées par Prettier.",
      },
      {
        name: "shadcn/ui + Radix",
        version: "radix-ui 1.8",
        role: "Primitives accessibles (dialogues, menus, sélecteurs) copiées dans components/ui.",
      },
      {
        name: "lucide-react · sonner · next-themes",
        version: "",
        role: "Icônes SVG, notifications, thème clair / sombre / système.",
      },
    ],
  },
  {
    title: "Formulaires et calculs",
    items: [
      {
        name: "Zod",
        version: "4",
        role: "Schémas partagés : validation du formulaire ET de la Server Action, variables d'environnement.",
      },
      {
        name: "React Hook Form",
        version: "7",
        role: "État des formulaires, branché sur Zod via zodResolver.",
      },
      {
        name: "decimal.js",
        version: "10",
        role: "Tous les montants en chaînes décimales, arrondi commercial (ROUND_HALF_UP).",
      },
    ],
  },
  {
    title: "Qualité",
    items: [
      {
        name: "Vitest",
        version: "5",
        role: "Domaine, services, opérations de l'éditeur, contrat des repositories.",
      },
      {
        name: "Playwright",
        version: "1.64",
        role: "Parcours de bout en bout sur le build de production, scripts de captures.",
      },
      {
        name: "ESLint + Prettier",
        version: "9 · 3",
        role: "Règles Next.js, règles d'architecture entre couches, formatage vérifié en CI.",
      },
      {
        name: "pnpm + GitHub Actions",
        version: "",
        role: "Installation figée ; CI : format, lint, typage, tests, build, puis e2e.",
      },
    ],
  },
];

export interface TreeNode {
  path: string;
  role: string;
  children?: TreeNode[];
}

/** Arborescence de `src/`, de l'extérieur vers le cœur. */
export const TREE: TreeNode[] = [
  {
    path: "proxy.ts",
    role: "Contrôle optimiste de session : /app et /onboarding sans cookie → /connexion?next=.",
  },
  { path: "instrumentation.ts", role: "Journalise les erreurs serveur (onRequestError)." },
  {
    path: "app/",
    role: "Routes uniquement : chaque page lit le contexte, appelle les services et assemble des composants.",
    children: [
      {
        path: "(marketing)/",
        role: "Site vitrine statique : accueil, mentions légales, CGU, contact.",
      },
      { path: "(auth)/", role: "Connexion, inscription, mot de passe oublié (pages statiques)." },
      {
        path: "app/",
        role: "Espace connecté : tableau de bord, clients, chantiers, devis, factures, équipe, paramètres.",
      },
      { path: "onboarding/", role: "Assistant de création de l'entreprise." },
      {
        path: "debug/",
        role: "Pages internes (inventaire, fiche technique), désactivées en production.",
      },
    ],
  },
  {
    path: "features/<domaine>/",
    role: "Tout ce qui est propre à une fonctionnalité : formulaires, widgets, actions.ts (Server Actions), schemas.ts (Zod).",
    children: [
      {
        path: "quotes/editor/",
        role: "Éditeur de devis : hook d'état, opérations pures testées, sous-composants.",
      },
      {
        path: "invoices/detail/",
        role: "Blocs de la fiche facture : récapitulatif, conformité, lignes, paiements, cycle de vie.",
      },
    ],
  },
  {
    path: "components/",
    role: "Composants partagés sans logique métier.",
    children: [
      { path: "ui/", role: "Primitives shadcn/ui (non modifiées)." },
      {
        path: "app/ · app-shell/ · forms/ · status/",
        role: "Briques de l'application : montants, listes, coquille, champs, badges.",
      },
      {
        path: "marketing/ · documents/",
        role: "Sections du site vitrine, rendu imprimable des devis et factures.",
      },
    ],
  },
  {
    path: "composition/",
    role: "Racine de composition : contexte de requête, contexte d'action, fabrique runAction.",
  },
  {
    path: "services/",
    role: "Cas d'usage : émettre, encaisser, convertir un devis… Reçoivent leurs dépendances en paramètre.",
  },
  {
    path: "domain/",
    role: "Règles métier pures : montants, TVA, situations, conformité, numérotation, permissions.",
  },
  {
    path: "data/",
    role: "Accès aux données derrière des interfaces.",
    children: [
      {
        path: "repositories.ts · types.ts",
        role: "Ports : contrats des repositories et de l'unité de travail, types des entités.",
      },
      { path: "memory/ · mock/", role: "Adaptateur en mémoire et jeu de démonstration." },
      {
        path: "cached-repositories.ts",
        role: "Décorateur de cache des lectures (use cache + étiquette par entreprise).",
      },
      { path: "contract/", role: "Suite de tests que toute implémentation doit passer." },
    ],
  },
  {
    path: "integrations/e-invoicing/",
    role: "Port de la plateforme agréée et son adaptateur simulé.",
  },
  {
    path: "config/",
    role: "Variables d'environnement validées, routes typées, nom du produit, constantes.",
  },
  { path: "content/", role: "Textes du site vitrine et des pages internes, séparés du code." },
  {
    path: "lib/",
    role: "Utilitaires techniques : session, formatage, journal, résultat d'action, validation.",
  },
];

export interface Layer {
  name: string;
  path: string;
  role: string;
  rule: string;
}

/** Couches, de l'extérieur vers le cœur. Les dépendances pointent toujours vers le bas. */
export const LAYERS: Layer[] = [
  {
    name: "Interface",
    path: "app/ · components/ · features/*.tsx",
    role: "Affiche et déclenche. Pages en composants serveur, formulaires et widgets en composants client.",
    rule: "N'importe jamais les implémentations de données ou de plateforme (règle ESLint).",
  },
  {
    name: "Actions",
    path: "features/*/actions.ts → composition/action.ts",
    role: "Porte d'entrée des mutations : session, permission, validation Zod, appel du service, invalidation du cache.",
    rule: "Une action = un appel de service ; retour ActionResult typé.",
  },
  {
    name: "Services",
    path: "services/",
    role: "Orchestrent un cas d'usage : lisent, appliquent le domaine, écrivent dans une transaction, appellent la plateforme.",
    rule: "Ne connaissent ni l'interface ni Next.js ; dépendances reçues par ServiceContext (règle ESLint).",
  },
  {
    name: "Domaine",
    path: "domain/",
    role: "Fonctions pures et déterministes : calculs, contrôles, transitions de statut.",
    rule: "Aucun import hors du domaine, ni React ni Next.js (règle ESLint).",
  },
  {
    name: "Ports",
    path: "data/repositories.ts · integrations/e-invoicing/provider.ts",
    role: "Interfaces dont dépendent les services : repositories, unité de travail, plateforme agréée.",
    rule: "Décrivent le besoin, pas la technologie.",
  },
  {
    name: "Adaptateurs",
    path: "data/memory · data/cached-repositories · integrations/e-invoicing/mock-provider",
    role: "Implémentations interchangeables des ports (mémoire aujourd'hui, PostgreSQL et plateforme réelle ensuite).",
    rule: "Choisis à un seul endroit : la racine de composition.",
  },
];

export interface FlowStep {
  label: string;
  detail: string;
  where: string;
}

export const READ_FLOW: FlowStep[] = [
  {
    label: "Proxy",
    detail: "Pas de cookie de session → redirection vers la connexion.",
    where: "src/proxy.ts",
  },
  {
    label: "Coquille statique",
    detail: "Le squelette de l'application est prérendu et s'affiche immédiatement.",
    where: "app/app/layout.tsx",
  },
  {
    label: "Contexte",
    detail: "Session vérifiée, entreprise active, rôle, horloge, dépendances.",
    where: "getRequestContext()",
  },
  {
    label: "Lecture",
    detail: "Repositories en cache, étiquetés par entreprise ; services de lecture.",
    where: "data/cached-repositories.ts",
  },
  {
    label: "Rendu",
    detail: "La page assemble les composants ; le contenu arrive en streaming.",
    where: "app/app/**/page.tsx",
  },
];

export const WRITE_FLOW: FlowStep[] = [
  {
    label: "Formulaire",
    detail: "React Hook Form + schéma Zod : erreurs affichées sous chaque champ.",
    where: "features/*/…-form.tsx",
  },
  {
    label: "Server Action",
    detail: "Appel typé, sans route d'API à maintenir.",
    where: "features/*/actions.ts",
  },
  {
    label: "runAction",
    detail: "Contexte sans cache, permission du rôle, revalidation Zod côté serveur.",
    where: "composition/action.ts",
  },
  {
    label: "Service",
    detail: "Règles métier, transaction (unité de travail), puis appel de la plateforme.",
    where: "services/*.ts",
  },
  {
    label: "Résultat",
    detail:
      "ActionResult { ok, data | error, fieldErrors } ; cache de l'entreprise invalidé (updateTag).",
    where: "lib/action-result.ts",
  },
];

export interface SolidItem {
  letter: string;
  name: string;
  principle: string;
  inProject: string;
  where: string;
}

export const SOLID: SolidItem[] = [
  {
    letter: "S",
    name: "Responsabilité unique",
    principle: "Un module n'a qu'une raison de changer.",
    inProject:
      "Pages = assemblage, actions = entrée (contrôles), services = cas d'usage, domaine = règles. L'éditeur de devis sépare état (hook), opérations pures et rendu ; la fiche facture est découpée en blocs.",
    where: "features/quotes/editor/ · features/invoices/detail/",
  },
  {
    letter: "O",
    name: "Ouvert / fermé",
    principle: "On étend sans modifier le code existant.",
    inProject:
      "Les variantes de facture (standard, acompte, situation, avoir) sont décrites par une table de règles : un nouveau type s'ajoute dans la table, pas dans des conditions dispersées. Le cache est un décorateur ajouté sans toucher aux repositories.",
    where: "domain/invoice-kinds.ts · data/cached-repositories.ts",
  },
  {
    letter: "L",
    name: "Substitution de Liskov",
    principle: "Toute implémentation d'un contrat est interchangeable.",
    inProject:
      "Repositories en mémoire, en cache ou demain PostgreSQL respectent le même contrat, vérifié par une suite de tests commune ; la plateforme simulée et la plateforme réelle implémentent le même port.",
    where: "data/contract/repository-contract.ts",
  },
  {
    letter: "I",
    name: "Ségrégation des interfaces",
    principle: "Ne dépendre que de ce qu'on utilise.",
    inProject:
      'Chaque service déclare les seuls repositories et méthodes de plateforme qu\'il utilise : ServiceContext<"invoices" | "clients", "submitInvoice">. Un test fournit uniquement ces dépendances.',
    where: "services/context.ts",
  },
  {
    letter: "D",
    name: "Inversion des dépendances",
    principle: "Le cœur dépend d'abstractions, pas d'implémentations.",
    inProject:
      "Les services reçoivent repositories, unité de travail, plateforme et horloge en paramètre. Seule la racine de composition choisit les implémentations ; ESLint interdit aux couches internes d'importer l'interface.",
    where: "composition/request-context.ts · eslint.config.mjs",
  },
];

export interface PatternItem {
  name: string;
  where: string;
  what: string;
}

export const PATTERNS: PatternItem[] = [
  {
    name: "Ports et adaptateurs",
    where: "data/ · integrations/",
    what: "Le métier ne connaît que des interfaces ; la technique se branche autour.",
  },
  {
    name: "Racine de composition",
    where: "composition/",
    what: "Un seul endroit assemble les implémentations concrètes.",
  },
  {
    name: "Repository",
    where: "data/repositories.ts",
    what: "Accès aux données par entité, toujours filtré par entreprise.",
  },
  {
    name: "Unité de travail",
    where: "data/memory/repositories.ts",
    what: "Numérotation + données figées + lien d'avoir : tout ou rien.",
  },
  {
    name: "Décorateur",
    where: "data/cached-repositories.ts",
    what: "Ajoute le cache aux lectures sans modifier les repositories.",
  },
  {
    name: "Adaptateur",
    where: "integrations/e-invoicing/",
    what: "La plateforme agréée simulée derrière le port EInvoicingProvider.",
  },
  {
    name: "Service applicatif",
    where: "services/",
    what: "Un cas d'usage par fonction, dépendances injectées.",
  },
  {
    name: "Cœur fonctionnel, coquille impérative",
    where: "domain/ · services/",
    what: "Calculs purs testés ; les effets restent dans les services.",
  },
  {
    name: "Fabrique d'actions",
    where: "composition/action.ts",
    what: "Contrôles communs à toutes les Server Actions, écrits une seule fois.",
  },
  {
    name: "Résultat typé",
    where: "lib/action-result.ts",
    what: "Les erreurs attendues sont des valeurs, pas des exceptions.",
  },
  {
    name: "Table de stratégies",
    where: "domain/invoice-kinds.ts",
    what: "Comportement par type de facture : série, code EN 16931, signe, paiements.",
  },
  {
    name: "Matrice de permissions",
    where: "domain/permissions.ts",
    what: "Rôle → permissions, vérifiée côté serveur et reflétée dans l'interface.",
  },
  {
    name: "Builder",
    where: "services/builders.ts",
    what: "Construction des factures à partir d'un devis, d'une situation ou d'un avoir.",
  },
  {
    name: "Snapshot",
    where: "services/builders.ts",
    what: "Vendeur et acheteur figés à l'émission : la facture ne change plus.",
  },
  {
    name: "État dérivé",
    where: "services/builders.ts",
    what: "Statut de paiement calculé (payée, en retard…) plutôt que stocké.",
  },
  {
    name: "Hook + opérations pures",
    where: "features/quotes/editor/",
    what: "État de formulaire complexe testé sans navigateur.",
  },
  {
    name: "Contenu séparé du code",
    where: "content/",
    what: "Textes modifiables sans toucher aux composants.",
  },
];

export interface RenderZone {
  zone: string;
  mode: string;
  detail: string;
}

export const RENDERING: RenderZone[] = [
  {
    zone: "Site vitrine, connexion, inscription",
    mode: "Statique",
    detail:
      "Prérendu au build ; aucune donnée de requête. L'année du pied de page est mise en cache (use cache).",
  },
  {
    zone: "Espace connecté",
    mode: "Prérendu partiel",
    detail: "Coquille statique immédiate ; session et données en streaming sous Suspense.",
  },
  {
    zone: "Lectures de données",
    mode: "use cache + cacheTag",
    detail:
      "Étiquette org:<id> ; durée « hours » ; invalidées par updateTag après chaque action réussie.",
  },
  {
    zone: "Server Actions",
    mode: "Sans cache",
    detail: "Lisent directement la source : une action voit toujours ses propres écritures.",
  },
  {
    zone: "Cycle de vie e-facture",
    mode: "Client",
    detail:
      "LifecyclePoller interroge la plateforme via une action ; le rendu ne fait jamais d'écriture.",
  },
];

export interface Fact {
  title: string;
  detail: string;
  where: string;
}

export const SECURITY: Fact[] = [
  {
    title: "Session en deux temps",
    detail:
      "proxy.ts redirige sans cookie ; lib/session.ts vérifie l'utilisateur au plus près des données.",
    where: "proxy.ts · lib/session.ts",
  },
  {
    title: "Permissions côté serveur",
    detail:
      "Chaque action déclare sa permission ; un membre ne peut ni émettre, ni encaisser, ni gérer l'équipe.",
    where: "domain/permissions.ts",
  },
  {
    title: "Isolation multi-entreprise",
    detail:
      "Toutes les méthodes de repository prennent l'identifiant d'entreprise ; testé par le contrat.",
    where: "data/repositories.ts",
  },
  {
    title: "Code serveur protégé",
    detail:
      "server-only sur les données, services et session : un import côté client casse le build.",
    where: "server-only",
  },
  {
    title: "Validation des entrées",
    detail:
      "Zod dans le formulaire et de nouveau dans l'action ; variables d'environnement validées au démarrage.",
    where: "features/*/schemas.ts · config/env.ts",
  },
  {
    title: "En-têtes HTTP",
    detail:
      "CSP, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy, HSTS en production, sans X-Powered-By.",
    where: "next.config.ts",
  },
  {
    title: "Redirections sûres",
    detail: "Le paramètre next n'accepte qu'un chemin interne (pas de //domaine).",
    where: "lib/session-cookie.ts",
  },
  {
    title: "Cookies",
    detail: "httpOnly, SameSite=Lax, Secure en production ; aucun cookie de suivi.",
    where: "lib/session-cookie.ts",
  },
];

export const QUALITY: Fact[] = [
  {
    title: "Tests du domaine",
    detail:
      "Montants, TVA, situations cumulées, identifiants (SIREN, TVA), conformité, numérotation, permissions.",
    where: "domain/*.test.ts",
  },
  {
    title: "Tests des services",
    detail:
      "Émission, numérotation sans trou, émission bloquée, encaissement 212, avoir, rollback.",
    where: "services/invoices.test.ts",
  },
  {
    title: "Contrat des repositories",
    detail: "Isolation, copies défensives, création, recherche, numéros croissants, atomicité.",
    where: "data/contract/",
  },
  {
    title: "Parcours e2e",
    detail:
      "Accueil, redirection de connexion puis retour, création d'un client visible aussitôt, déconnexion.",
    where: "e2e/",
  },
  {
    title: "Intégration continue",
    detail: "format:check → lint → typecheck → test → build, puis Playwright sur le build.",
    where: ".github/workflows/ci.yml",
  },
  {
    title: "Erreurs et journal",
    detail:
      "error.tsx par zone, global-error.tsx, journal structuré, erreurs serveur remontées par instrumentation.",
    where: "lib/logger.ts",
  },
];

export const CONVENTIONS: Fact[] = [
  {
    title: "Argent",
    detail: 'Chaînes décimales ("1234.50"), jamais de number ; calculs via domain/money.ts.',
    where: "domain/money.ts",
  },
  {
    title: "Dates",
    detail: "Chaînes ISO (AAAA-MM-JJ) ; la date du jour vient de l'horloge injectée.",
    where: "lib/clock.ts",
  },
  {
    title: "Routes",
    detail: "Aucun chemin en dur : routes.invoices.show(id), routes.quotes.new({ client }).",
    where: "config/routes.ts",
  },
  {
    title: "Fichiers",
    detail:
      "kebab-case ; un dossier par fonctionnalité ; actions.ts et schemas.ts séparés (use server n'exporte que des fonctions).",
    where: "features/",
  },
  {
    title: "Interface en français",
    detail: "Libellés métier BTP, statuts e-facture avec leur code (200 à 213).",
    where: "components/status/",
  },
  {
    title: "Accessibilité",
    detail:
      "Libellés visibles, erreurs reliées aux champs, cibles de 44 px sur mobile, focus visible, lien d'évitement.",
    where: "components/forms/",
  },
];

export interface SwapPoint {
  what: string;
  how: string;
}

/** Points de branchement prévus pour passer du prototype à la production. */
export const SWAP_POINTS: SwapPoint[] = [
  {
    what: "Base de données",
    how: "Implémenter Repositories et UnitOfWork (PostgreSQL), faire passer la suite de contrat, l'assembler dans composition/request-context.ts.",
  },
  {
    what: "Authentification",
    how: "Remplacer le cookie de démonstration par un jeton signé dans lib/session.ts et startSession ; proxy.ts reste inchangé.",
  },
  {
    what: "Plateforme agréée",
    how: "Écrire l'adaptateur du port EInvoicingProvider et le retourner depuis integrations/e-invoicing/index.ts.",
  },
  {
    what: "Horloge",
    how: "Remplacer l'horloge de démonstration par l'horloge système dans getAppDeps().",
  },
];
