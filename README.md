# Factobat — devis et factures de situation pour le BTP (prototype V1)

« Factobat » est le nom du produit (site vitrine et application) ; on le change en un seul endroit, `src/config/site.ts`.

Factobat est un SaaS de devis et de facturation pour les entreprises du second œuvre (5 à 50 salariés) qui facturent à l'avancement. Il gère :

- les acomptes et les situations de travaux ;
- la retenue de garantie ;
- l'autoliquidation de la TVA en sous-traitance ;
- les factures fournisseurs reçues.

Il est conçu comme une **solution compatible** avec la réforme de la facturation électronique : il se connecte à une plateforme agréée.

> **Prototype front-end complet et cliquable.** Il n'y a ni base de données, ni authentification réelle, ni paiement, ni connexion réelle à une plateforme agréée.
>
> - Les données fictives sont en mémoire : elles sont perdues au redémarrage du serveur.
> - Un utilisateur fictif est toujours connecté.
> - La plateforme agréée est simulée.

## Lancer le projet

Prérequis : Node.js 20 ou plus récent et pnpm. Si `pnpm` n'est pas installé, `corepack enable` l'active (ou préfixez chaque commande par `corepack`).

```bash
pnpm install
pnpm dev
```

Ouvrez ensuite http://localhost:3000 (site vitrine) ; l'application est sous http://localhost:3000/app (connexion simulée : n'importe quel mot de passe). Aucune variable d'environnement n'est nécessaire ; `NEXT_PUBLIC_SITE_URL` et `ENABLE_DEBUG_PAGES` sont optionnelles (validées dans `src/config/env.ts`).

| Script                              | Rôle                                                                                                                                                                                                                                                             |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm dev`                          | Serveur de développement                                                                                                                                                                                                                                         |
| `pnpm build`                        | Build de production                                                                                                                                                                                                                                              |
| `pnpm lint`                         | ESLint (inclut les règles d'architecture)                                                                                                                                                                                                                        |
| `pnpm typecheck`                    | Génère les types de routes puis vérifie TypeScript                                                                                                                                                                                                               |
| `pnpm test`                         | Tests Vitest : domaine, services, contrat des repositories, jeu de données                                                                                                                                                                                       |
| `pnpm test:e2e`                     | Parcours Playwright sur le build de production (lancer `pnpm build` avant)                                                                                                                                                                                       |
| `pnpm check`                        | format:check + lint + typecheck + test (identique à la CI)                                                                                                                                                                                                       |
| `pnpm screenshots`                  | Refait les captures du prototype pour le site vitrine (`public/screenshots/*.jpg`, session de démo injectée) et les aperçus de la page d'accueil (`docs/references/home-v1-*.png`). Utilise `BASE_URL` s'il est défini, sinon lance `next dev` sur le port 3210. |
| `pnpm references`                   | Refait les captures de référence (Playwright) dans `docs/references/`                                                                                                                                                                                            |
| `pnpm format` / `pnpm format:check` | Prettier (écriture / vérification)                                                                                                                                                                                                                               |

Pour les captures, installez d'abord le navigateur de Playwright : `pnpm exec playwright install chromium`.

### Parcours conseillé pour une démo

0. **Site vitrine** sur `/`, puis « Se connecter » pour entrer dans l'application.
1. **Tableau de bord** (`/app/tableau-de-bord`) : indicateurs, factures électroniques à traiter, retenues de garantie à récupérer.
2. **Factures émises → filtre « Brouillon » → Situation n° 2 de l'Hôtel Le Cèdre Bleu.**
   - L'émission est bloquée : le SIREN du client manque.
   - Suivez le lien « Compléter la fiche client » et utilisez le SIREN fictif `812 345 601`.
   - Revenez sur la situation et cliquez sur **Émettre et transmettre**. La frise du cycle de vie avance seule (déposée → … → approuvée) en environ 35 s.
3. **Chantier « Résidence Les Terrasses du Parc »** : 3 situations en autoliquidation avec retenue de garantie. Cliquez sur **Nouvelle situation** pour l'assistant avec calcul en direct.
4. **Devis → Nouveau devis** : saisie au clavier (Entrée crée la ligne suivante), lots, totaux en direct, aperçu imprimable.
5. **Factures reçues** :
   - approuver, refuser avec un motif, signaler un litige, marquer comme payée ;
   - une nouvelle facture fournisseur « arrive » 60 s après le démarrage du serveur.
6. **Facture FA-…-0019 (École, rejetée)** : comprendre la différence entre **rejet** (plateforme, on redépose) et **refus** (client, on fait un avoir).
7. Le **sélecteur d'entreprise** (en haut de la barre latérale) permet de passer à « Chêne & Fil Agencement ».

## Site vitrine

- Page d'accueil sur `/` : groupe de routes `src/app/(marketing)/`, avec son en-tête et son pied de page.
- Tous les textes sont dans `src/content/home.ts`. Le nom du produit (« Factobat »), l'URL publique et le lien officiel sont dans `src/config/site.ts`.
- Routes publiques et entrée de l'application : `src/config/routes.ts`. L'application vit sous `/app` et n'est pas indexée (`robots`, `noindex`).
- SEO : `opengraph-image.tsx`, JSON-LD (`components/marketing/json-ld.tsx`), `app/sitemap.ts`, `app/robots.ts`.
- Plan et contenus à compléter : [docs/plan-home.md](docs/plan-home.md). Les marqueurs `[À DÉFINIR]`, `[À CONFIRMER]` et `[À RÉDIGER]` signalent ce qui reste à décider.

## Suivi de l'avancement

La page **`/debug/app`** liste toutes les fonctionnalités par page, avec leur état : « Fait », « Simulé » (présent mais sans back-end ni service réel) ou « À faire ». Elle donne aussi des barres d'avancement par zone et au global. L'inventaire est dans `src/content/debug-features.ts` et se met à jour à chaque évolution. La page n'est pas indexée.

La page **`/debug/tech`** est la fiche technique : stack, découpage du code, couches et sens des dépendances, flux de lecture et d'écriture, SOLID tel qu'appliqué, patterns, rendu et cache, sécurité, qualité, conventions et points de branchement. Contenu : `src/content/debug-tech.ts`. Les pages `/debug` sont désactivées en production (sauf `ENABLE_DEBUG_PAGES=true`).

## Structure

```
docs/
  references/         captures Facture.net / Tiime + analyse.md
  design-system.md    choix issus du skill ui-ux-pro-max et des références
  conventions.md      couches, montants, organisation du code
  domaine-btp.md      règles de calcul et statuts de facture électronique (avec sources)
  plan-v1.md          plan validé
e2e/                  parcours Playwright
scripts/              captures (références, site vitrine)
src/
  proxy.ts            redirection vers /connexion sans cookie de session
  app/                routes (App Router) : (marketing) = site vitrine, app/ = application sous /app, (auth), onboarding, debug
  components/         ui (shadcn), app (listes, en-têtes, frise), app-shell, status, forms, documents, marketing
  features/           par domaine : formulaires et widgets, actions.ts (Server Actions), schemas.ts (Zod)
  composition/        racine de composition : contexte de requête / d'action, fabrique runAction
  services/           cas d'usage (devis, factures, factures reçues, tableau de bord, mentions légales)
  domain/             logique métier pure + tests  ← réutilisée telle quelle en production
  data/               types, ports (repositories, unité de travail), adaptateur mémoire, cache des lectures, suite de contrat
  integrations/e-invoicing/   port EInvoicingProvider + plateforme simulée
  config/             env (Zod), routes typées, nom du produit
  content/            textes du site vitrine et des pages /debug
  lib/                session, formats français, validation, journal, horloge simulée
```

## Brancher le back-end

L'architecture isole tout ce qui est simulé. **Les pages, les composants et `src/domain/` ne changent pas.**

### 1. PostgreSQL

| Remplacer / ajouter                      | Détail                                                                                                                                                                                                                                                                                                                                                                                       |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/data/postgres/` (nouveau)           | Implémentation de chaque interface de `src/data/repositories.ts` : `OrganizationRepository`, `ClientRepository`, `QuoteRepository`, `InvoiceRepository`, `ReceivedInvoiceRepository`… Le schéma découle de `src/data/types.ts`. Les lots, lignes, paiements et événements deviennent des tables filles ; les instantanés `seller`, `buyer` et `progress.cumulative` peuvent rester en JSONB. |
| `src/data/index.ts`                      | `getRepositories()` / `getUnitOfWork()` renvoient l'implémentation PostgreSQL (transaction SQL pour l'unité de travail). La suite `src/data/contract/repository-contract.ts` doit passer telle quelle ; le décorateur de cache (`cached-repositories.ts`) s'applique sans changement.                                                                                                        |
| `OrganizationRepository.takeNextNumber`  | À implémenter de façon **atomique** (`UPDATE … SET next_value = next_value + 1 RETURNING`) dans la même transaction que l'émission de la facture (`src/services/invoices.ts › issueInvoice`).                                                                                                                                                                                                |
| `src/data/mock/`                         | Ne sert plus qu'au peuplement d'une base de démonstration (`buildSeed()`).                                                                                                                                                                                                                                                                                                                   |
| `src/config/app.ts` + `src/lib/clock.ts` | Supprimer `DEMO_TODAY` : `today()` renvoie la vraie date (fuseau Europe/Paris).                                                                                                                                                                                                                                                                                                              |

### 2. Authentification

| Remplacer / ajouter                                 | Détail                                                                                                                                                                         |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/lib/session.ts`                                | Remplacer la lecture du cookie de démonstration par la vérification d'un jeton signé (ou d'un fournisseur d'identité). Toutes les pages et actions passent déjà par ce module. |
| `src/proxy.ts`                                      | Déjà en place (contrôle optimiste du cookie sur `/app` et `/onboarding`) ; seul le nom du cookie peut changer.                                                                 |
| `src/features/auth/auth-forms.tsx` + `startSession` | Vérifier les identifiants avant de poser la session. Les schémas Zod restent.                                                                                                  |
| `src/features/session/actions.ts`                   | `signOut()` supprime déjà les cookies ; invalider aussi la session côté serveur.                                                                                               |
| `src/features/organization/onboarding-wizard.tsx`   | `finish()` : créer l'entreprise et le membership « propriétaire » via une Server Action.                                                                                       |

### 3. Stripe (abonnements)

| Remplacer / ajouter                              | Détail                                                              |
| ------------------------------------------------ | ------------------------------------------------------------------- |
| `src/integrations/billing/` (nouveau)            | Client Stripe : Checkout, portail client, webhooks.                 |
| `src/app/api/webhooks/stripe/route.ts` (nouveau) | Mettre à jour `organization.settings.plan`.                         |
| `src/app/app/parametres/abonnement/page.tsx`     | Remplacer les boutons désactivés par un Checkout ou par le portail. |

### 4. Plateforme agréée

| Remplacer / ajouter                                               | Détail                                                                                                                                                                                                                                  |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/integrations/e-invoicing/<plateforme>-provider.ts` (nouveau) | Implémenter `EInvoicingProvider` (`provider.ts`) avec l'API de la plateforme choisie : `submitInvoice`, `getInvoiceStatus`, `reportPayment` (statut 212), `listReceivedInvoices`, `updateReceivedInvoiceStatus`.                        |
| `src/integrations/e-invoicing/index.ts`                           | `getEInvoicingProvider()` renvoie ce nouvel adaptateur.                                                                                                                                                                                 |
| Génération Factur-X / UBL / CII                                   | Elle vient de `Invoice` : les champs EN 16931 sont déjà présents (SIREN et TVA des parties, catégorie de TVA par ligne, ventilation de TVA, échéance, conditions, références). Voir les points ouverts dans `docs/domaine-btp.md` § 10. |
| `src/app/api/webhooks/e-invoicing/route.ts` (nouveau)             | Réception des statuts poussés par la plateforme, qui remplace l'interrogation périodique de `LifecyclePoller`.                                                                                                                          |
| Variables d'environnement                                         | Clés d'API de la plateforme et de Stripe, URL de la base de données (seulement à ce moment-là).                                                                                                                                         |

## Choix par défaut pris pendant la réalisation

Les options les plus simples et standard ont été retenues quand le cahier des charges ne précisait rien.

- **Dossier** : le projet est dans `facturation-btp/`, car la racine contient déjà un autre projet. Le dépôt git est propre à ce dossier.
- **Next.js 16.4** (dernière version stable) :
  - Cache Components et le prérendu partiel sont **activés** : site vitrine statique, coquille de l'application prérendue, session et données en streaming sous `Suspense` ;
  - les lectures du rendu passent par `"use cache"` avec l'étiquette `org:<id>`, invalidée par `updateTag` après chaque Server Action réussie ; les actions lisent sans cache ;
  - aucune écriture pendant le rendu (statuts plateforme et factures reçues : via des actions déclenchées côté client).
- **shadcn/ui** : style « radix-nova ».
  - Les hauteurs des contrôles sont agrandies (44 px sur mobile, 40 px sur ordinateur) et les cartes aplaties (bordure, rayon de 8 px), conformément au design system.
  - Les jetons sont en hexadécimal, pas en OKLCH, pour garder le lien avec les rapports de contraste documentés.
- **Données** :
  - les données en mémoire sont un singleton `globalThis` : elles survivent au rechargement à chaud (les repositories, eux, sont reconstruits avec le code courant), mais pas au redémarrage ;
  - l'entreprise active est mémorisée dans un cookie ;
  - la date du jour est simulée au **18/10/2026**.
- **Numérotation** : `{préfixe}-{année}-{compteur}`, compteur non remis à zéro chaque année, numéro attribué à l'émission, avoirs dans une série distincte.
- **Situations** : calcul en cumul. L'acompte est récupéré au prorata de l'avancement ; la retenue de garantie est calculée sur le TTC des travaux (voir `docs/domaine-btp.md`).
- **Particuliers** : il n'y a pas de dépôt sur la plateforme (e-reporting) et pas de retenue de garantie par défaut.
- **Facture rejetée** : elle est redéposée avec le même numéro après correction.
- **Avoir** : seulement un avoir d'annulation totale, et seulement pour une facture sans paiement.
- **Éditeur de devis** :
  - la grille passe en mode tableau quand le lot fait au moins 48 rem de large (container query) ; sinon, elle s'affiche en cartes avec des libellés visibles ;
  - les actions de ligne sont dans un menu « ⋯ » ;
  - sur mobile, les lignes sont éditées sur place plutôt que dans un panneau bas (plus rapide à saisir) ;
  - les totaux restent visibles (colonne collante ou barre collante).
- **Thème** : clair par défaut ; le thème sombre est disponible dans le menu utilisateur.
- **Pas de PDF** : l'aperçu est en HTML imprimable (`Imprimer / PDF` du navigateur).
- **Skill ui-ux-pro-max** : Python n'est pas installé sur la machine de développement, donc ses bases de données CSV ont été interrogées directement, sans le script `search.py`.

## Documentation

- [docs/plan-v1.md](docs/plan-v1.md) : plan validé
- [docs/design-system.md](docs/design-system.md) : palette, typographie, règles UX
- [docs/conventions.md](docs/conventions.md) : organisation du code
- [docs/domaine-btp.md](docs/domaine-btp.md) : règles métier et sources
- [docs/references/analyse.md](docs/references/analyse.md) : analyse de Facture.net et Tiime
