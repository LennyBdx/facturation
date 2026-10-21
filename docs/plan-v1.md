# Plan V1 — prototype front-end (validé le 18/10/2026, réalisé)

Nom de travail initial : « Situa ». Nom retenu ensuite : **Factobat** (`src/config/site.ts`, repris par `APP_NAME`).

## 1. Arborescence

```
facturation-btp/
├─ docs/
│  ├─ references/            captures + analyse.md
│  ├─ design-system.md
│  ├─ conventions.md
│  └─ domaine-btp.md
├─ scripts/capture-references.mjs
├─ src/
│  ├─ app/
│  │  ├─ (auth)/             connexion, inscription, mot-de-passe-oublie
│  │  ├─ onboarding/         entreprise → facture-electronique
│  │  ├─ (app)/              coquille : sidebar + en-tête + onglets mobiles
│  │  │  ├─ tableau-de-bord/
│  │  │  ├─ clients/         [id]/, nouveau/, [id]/modifier/
│  │  │  ├─ chantiers/       [id]/, nouveau/
│  │  │  ├─ devis/           [id]/, [id]/modifier/, [id]/apercu/, nouveau/
│  │  │  ├─ factures/        [id]/, [id]/apercu/, nouvelle/, situation/nouvelle?devis=…
│  │  │  ├─ factures-recues/ [id]/
│  │  │  ├─ equipe/
│  │  │  └─ parametres/      entreprise, numerotation, documents, facture-electronique,
│  │  │                      abonnement, expert-comptable
│  │  ├─ globals.css         jetons du design system
│  │  └─ layout.tsx
│  ├─ components/
│  │  ├─ ui/                 composants shadcn (générés)
│  │  ├─ app-shell/          sidebar, sélecteur d'entreprise, menu utilisateur, onglets mobiles
│  │  ├─ status/             pastilles statut (devis, paiement, cycle de vie), frise
│  │  ├─ data/               tableau responsive (table ↔ cartes), état vide, filtres
│  │  ├─ documents/          rendu imprimable devis/facture, mentions légales
│  │  └─ forms/              champs SIREN/SIRET/TVA, montant, adresse
│  ├─ features/              composants et Server Actions par domaine
│  │  ├─ clients/ chantiers/ devis/ factures/ factures-recues/ equipe/ parametres/
│  ├─ domain/                logique métier pure + tests Vitest
│  │  ├─ money.ts            decimal.js, arrondi, formatage
│  │  ├─ vat.ts              taux, catégories EN 16931, autoliquidation
│  │  ├─ quote.ts            totaux de devis (lots, remise)
│  │  ├─ progress-billing.ts situations de travaux, acomptes, retenue de garantie
│  │  ├─ identifiers.ts      SIREN, SIRET, TVA intracom (Luhn + clé FR)
│  │  ├─ numbering.ts        numérotation continue
│  │  ├─ compliance.ts       contrôle des mentions obligatoires
│  │  └─ *.test.ts
│  ├─ data/
│  │  ├─ types.ts            entités (futur schéma)
│  │  ├─ repositories.ts     interfaces
│  │  ├─ memory/             implémentation en mémoire
│  │  ├─ mock/               jeux de données fictives
│  │  └─ index.ts            point d'entrée unique : getRepositories()
│  ├─ integrations/e-invoicing/
│  │  ├─ provider.ts         interface EInvoicingProvider
│  │  ├─ mock-provider.ts    MockEInvoicingProvider (statuts qui évoluent)
│  │  └─ index.ts            getEInvoicingProvider()
│  ├─ lib/
│  │  ├─ session.ts          getCurrentUser(), getCurrentOrganization()
│  │  ├─ format.ts           dates JJ/MM/AAAA, montants « 1 250,00 € »
│  │  └─ utils.ts
│  └─ config/app.ts
└─ README.md
```

Règle d'import : `app/` et `components/` → `features/` → `data/index.ts`, `integrations/e-invoicing/index.ts`, `domain/`, `lib/session.ts`. Jamais `data/mock` ni `data/memory` depuis une page (vérifié par une règle ESLint `no-restricted-imports`).

## 2. Entités (`src/data/types.ts`, résumé)

Conventions : `id: string` (UUID), `organizationId` sur toute entité métier, dates en `string` ISO `AAAA-MM-JJ`, montants `Money = string` (`"1250.00"`), pourcentages `Percent = string` (`"5.00"`).

| Entité                       | Champs principaux                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Organization`               | raison sociale, forme juridique, capital, SIREN, SIRET, TVA, APE, RCS/RM, adresse, contact, assurance décennale (assureur, n° police, zone), IBAN/BIC (affichés fictifs), réglages : préfixes et compteurs, délai de paiement par défaut, taux de retenue de garantie par défaut, mentions personnalisées, logo (URL fictive), couleur d'accent, plateforme agréée choisie + état de connexion + adresse de réception                                                                                                                                                                  |
| `User`, `Membership`         | utilisateur ; rôle `owner` / `admin` / `member` par organisation                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `Invitation`                 | e-mail, rôle, statut `pending` / `expired`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `Client`                     | type `general_contractor` / `private_owner` / `individual` / `public_buyer`, raison sociale ou nom, SIREN, SIRET, TVA, adresse de facturation, contact, conditions de paiement, code service (acheteur public)                                                                                                                                                                                                                                                                                                                                                                         |
| `Worksite` (chantier)        | client, nom, adresse, dates début/fin, statut `planned` / `in_progress` / `completed` / `closed`, montant du marché HT, référence marché, sous-traitance (`isSubcontracting`, donneur d'ordre), autoliquidation, taux de retenue de garantie, caution bancaire éventuelle                                                                                                                                                                                                                                                                                                              |
| `Quote` (devis)              | numéro, client, chantier, statut, dates (émission, validité), objet, `sections: QuoteSection[]` (lots), remise globale (% ou montant), conditions d'acompte (% à la commande), autoliquidation, notes, totaux calculés mis en cache                                                                                                                                                                                                                                                                                                                                                    |
| `QuoteSection` / `QuoteLine` | titre ; désignation, quantité, unité, PU HT, taux TVA, `vatCategory` (EN 16931 : S, AE, Z, E…)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `Invoice` (facture émise)    | numéro, type `deposit` / `progress` / `final` / `credit_note`, statut paiement, statut cycle de vie, client + **instantané vendeur/acheteur** (figé à l'émission), chantier, devis d'origine, facture corrigée (avoir), dates (émission, livraison/prestation, échéance), conditions de paiement, pénalités et indemnité forfaitaire, référence commande/marché, lignes, ventilation TVA, `progress?: ProgressBillingSnapshot` (numéro de situation, avancement par ligne, cumul précédent, acomptes imputés, retenue), totaux, `payments[]`, `lifecycleEvents[]`, `platformInvoiceId` |
| `ReceivedInvoice`            | fournisseur (nom, SIREN, TVA), numéro, dates, montants HT/TVA/TTC, lignes, statut cycle de vie, chantier rattaché, motif de refus/litige, événements                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `LifecycleEvent`             | code (200…213), libellé, date, émetteur, commentaire                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |

## 3. Écrans

| Zone            | Écrans                                                                                                                                                                                                                    |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Accès           | Connexion · Inscription · Mot de passe oublié (Zod, redirection simulée)                                                                                                                                                  |
| Onboarding      | Étape 1 entreprise (SIREN/SIRET/TVA validés) · Étape 2 facture électronique (explication + choix plateforme simulé)                                                                                                       |
| Tableau de bord | 6 indicateurs · dernières factures · devis à relancer · chantiers en cours · factures rejetées/refusées à corriger                                                                                                        |
| Clients         | Liste (recherche + filtre type) · Fiche (solde dû, chantiers, documents) · Création / modification                                                                                                                        |
| Chantiers       | Liste · Fiche (avancement facturé %, situations, retenues, factures reçues rattachées) · Création                                                                                                                         |
| Devis           | Liste par statut · Éditeur (lots/lignes, totaux en direct) · Fiche + actions · Aperçu imprimable                                                                                                                          |
| Factures émises | Liste (double statut) · Création (acompte, solde, avoir) · Assistant de situation depuis un devis accepté · Fiche (frise cycle de vie, paiements, contrôle de conformité, « Émettre et transmettre ») · Aperçu imprimable |
| Factures reçues | Boîte de réception · Fiche (aperçu, données structurées, rattachement chantier, approuver / refuser / litige / payée)                                                                                                     |
| Équipe          | Membres + invitations · Formulaire d'invitation                                                                                                                                                                           |
| Paramètres      | Entreprise · Numérotation · Documents (logo, couleur, mentions) · Facture électronique · Abonnement (maquette) · Expert-comptable (maquette)                                                                              |

## 4. Choix par défaut (notés au README)

- Tailwind v4 + shadcn/ui (dernière version, couleurs en OKLCH dérivées de la palette).
- Données en mémoire dans un singleton `globalThis` (survit au rechargement à chaud, perdu au redémarrage).
- Entreprise active mémorisée dans un cookie (seule « session » du prototype).
- Arrondi : au centime, **demi supérieur (ROUND_HALF_UP)**, appliqué au total HT de chaque ligne, puis TVA calculée par taux sur la somme des bases (méthode EN 16931).
- Date du jour simulée fixée au 18/10/2026 dans les données fictives pour que retards et échéances restent cohérents.
- Icônes : lucide-react (fourni avec shadcn/ui).

## 5. Étapes et commits

1. Initialisation (Next.js, TS strict, Tailwind, shadcn, ESLint/Prettier, Vitest) — _script de captures déjà en place_
2. Références (captures + analyse) — **fait**
3. Design system (jetons CSS, polices, composants de base, pastilles)
4. Couche de données + données fictives
5. Logique métier + tests
6. Intégration facture électronique simulée
7. Coquille de l'application (+ accès, onboarding)
8. Clients et chantiers
9. Devis
10. Factures émises et situations
11. Factures reçues
12. Équipe et paramètres
13. Documentation, puis vérification `pnpm lint`, `pnpm test`, `pnpm build`
