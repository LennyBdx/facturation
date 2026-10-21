# Conventions de code

## Couches et sens des dépendances

```
app/ (pages : (marketing) = site, app/ = application, (auth))  ← rendu serveur
  └─ features/<domaine>/          ← formulaires (client), actions.ts, schemas.ts
       └─ composition/            ← racine de composition : contexte, runAction
            └─ services/          ← cas d'usage : orchestration repositories + domaine + intégration
                 ├─ domain/       ← fonctions PURES (calculs, validations, statuts), testées
                 ├─ data/         ← ports (repositories, unité de travail) + adaptateurs
                 └─ integrations/ ← plateforme agréée (EInvoicingProvider)
components/                      ← composants d'interface réutilisables (ui = shadcn)
lib/                             ← session, formats, validation, journal, utilitaires
```

Règles :

- **`src/domain/` n'importe rien d'autre que `decimal.js` et lui-même** (règle ESLint). C'est le code réutilisé tel quel en production.
- `services/`, `data/`, `integrations/` et `composition/` n'importent jamais `app/`, `components/` ni `features/` (règle ESLint).
- Le code serveur (`data`, `services`, `composition`, `lib/session`) importe `server-only`.
- Les pages et composants **n'importent jamais** `@/data/mock`, `@/data/memory` ni un fichier interne de `@/integrations/e-invoicing/*`. Une règle ESLint (`no-restricted-imports`) l'interdit. Les points d'entrée autorisés sont `@/data` (`getRepositories()`) et `@/integrations/e-invoicing` (`getEInvoicingProvider()`).
- Toute page récupère son contexte (entreprise, utilisateur, rôle, dépendances) via `getRequestContext()` (`src/composition/request-context.ts`), qui s'appuie sur `src/lib/session.ts`. Les services reçoivent ce contexte, réduit à ce qu'ils utilisent (`ServiceContext<R, P>`).
- Seule la racine de composition choisit les implémentations concrètes.
- Toute lecture et toute écriture est filtrée par `organizationId` : isolation multi-entreprise dès le prototype.

## Données

- Le fichier `src/data/types.ts` est le futur schéma. Chaque entité métier porte `id` et `organizationId`.
- Les repositories sont **asynchrones** et retournent des **copies**, jamais des références vers la base en mémoire.
- Les documents émis **figent** les données du vendeur et de l'acheteur (`seller`, `buyer`). Un changement ultérieur de la fiche client ne modifie pas une facture émise.
- Le statut de paiement est **dérivé** (`invoicePaymentStatus`), jamais stocké.

## Montants

- Type `Money` = chaîne décimale à 2 décimales (`"1250.00"`).
- Type `Percent` = chaîne décimale (`"5.00"`).
- Les calculs passent **uniquement** par `src/domain/money.ts` (`decimal.js`, arrondi demi supérieur au centime). Il n'y a jamais de `Number(montant)` dans un calcul.
- La conversion en `number` n'a lieu que dans `src/lib/format.ts`, pour l'affichage (`Intl.NumberFormat("fr-FR")`).
- La saisie accepte la virgule française (`parseDecimalInput`). Les formulaires conservent des chaînes jusqu'à la validation Zod.
- Les colonnes de montants utilisent la classe `num` (chiffres tabulaires).

## Dates

- Format ISO `AAAA-MM-JJ` (`ISODate`) ou horodatage ISO (`ISODateTime`).
- Affichage `JJ/MM/AAAA` via `formatDate`, et heure de Paris via `formatDateTime`.
- La date du jour est **simulée** (`DEMO_TODAY` dans `src/config/app.ts`, lue par `src/lib/clock.ts`). Il faudra la supprimer au branchement du back-end.

## Mutations

- Les mutations passent par des **Server Actions** (`features/*/actions.ts`, `"use server"`). Un fichier `"use server"` n'exporte que des fonctions `async` : les schémas sont dans `schemas.ts`.
- Une Server Action passe par `runAction` (`src/composition/action.ts`), qui :
  - construit le contexte sans cache (l'action lit ses propres écritures) ;
  - vérifie la permission du rôle (`src/domain/permissions.ts`) ;
  - valide l'entrée avec Zod ;
  - appelle un service, puis invalide le cache de l'entreprise (`updateTag`) ;
  - renvoie un `ActionResult` (`{ ok: true, data?, message? } | { ok: false, error, fieldErrors? }`).
- Les écritures liées (numéro, données figées, lien d'avoir) passent par l'unité de travail (`ctx.uow.run`).
- Le rendu d'une page ne fait **jamais** d'écriture.
- Les erreurs métier sont des `BusinessError` (ou `ProgressBillingError`), converties en message français.
- Côté client, `applyActionResult` reporte les erreurs serveur sous chaque champ et affiche un toast. `ActionButton` gère le chargement, la confirmation et le rafraîchissement.

## Interface

- Les couleurs passent **uniquement par des jetons** : variables CSS dans `globals.css`, classes `text-success`, `bg-danger-soft`… Il n'y a pas de couleur codée en dur dans les composants. Seule exception : la couleur d'accent choisie par l'utilisateur pour ses documents, appliquée en style en ligne via `safeAccent` (garde-fou de contraste).
- Chaque statut s'affiche avec **icône + libellé** (`components/status`).
- Les listes utilisent `ResponsiveList` : un tableau à partir de 768 px, des cartes en dessous. Pas de défilement horizontal.
- Les formulaires utilisent `components/forms/form-fields.tsx` : libellé visible, astérisque, aide, erreur reliée par `aria-describedby`.
- Les textes de l'interface sont en français ; les erreurs sont concrètes et indiquent comment corriger.

## Tests

- Vitest est la référence : `pnpm test`.
- Fichiers de tests :
  - `src/domain/*.test.ts` : calculs et règles ;
  - `src/services/*.test.ts` : cas d'usage sur données en mémoire et plateforme factice ;
  - `src/data/memory/repositories.test.ts` : suite de contrat (`src/data/contract/`), à réutiliser pour toute nouvelle implémentation ;
  - `src/features/quotes/editor/quote-draft.test.ts` : opérations de l'éditeur de devis ;
  - `src/data/mock/seed.test.ts` : cohérence du jeu de données (numérotation continue, couverture des statuts).
- Playwright (`e2e/`, `pnpm test:e2e`) : parcours sur le build de production.
- Toute nouvelle règle de calcul doit d'abord être ajoutée dans `src/domain/` avec son test.

## Nommage

- Le code (identifiants, types) est en anglais ; l'interface, les messages et les commentaires sont en français.
- Les routes sont en français (`/factures-recues`, `/chantiers/[id]`) et ne sont jamais écrites en dur : `routes` (`src/config/routes.ts`).
