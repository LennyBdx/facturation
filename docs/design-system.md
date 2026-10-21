# Design system — V1

> Statut : **validé et implémenté**. Les valeurs ci-dessous sont les variables CSS de `src/app/globals.css`
> (shadcn/ui + Tailwind v4, `@theme inline`). Aucune couleur ni taille n'est codée en dur dans les composants.

## Sources

- **Skill ui-ux-pro-max** (v2.13.0), bases de données interrogées :
  - `products.csv` / `ui-reasoning.csv` — profils « Invoice & Billing Tool » (n° 105) et « Construction/Architecture » (n° 51), « B2B Service » (n° 5) ;
  - `colors.csv` — palettes des mêmes profils ;
  - `styles.csv` — « Minimalism & Swiss Style », « Flat Design », « Accessible & Ethical » ;
  - `typography.csv` — paires « Financial Trust » (n° 31) et « Corporate Trust » (n° 16) ;
  - `ux-guidelines.csv`, `references/quick-reference.md`, `stacks/shadcn.csv` — règles formulaires, tableaux, navigation, états.
  - Note : Python n'étant pas installé sur la machine, le script `search.py` n'a pas pu être lancé ; les fichiers CSV du skill ont été interrogés directement (mêmes données, sans le classement automatique).
- **Analyse des références** : `docs/references/analyse.md`.

## Direction

| Décision | Choix | Justification |
|---|---|---|
| Style | Minimalisme suisse + design plat + accessible | Recommandation du skill pour un outil de facturation (n° 105) : « Excessive decoration, complex shadows, 3D » en anti-patterns. Sobre et rassurant pour la cible. |
| Effets | Pas de dégradé, ombres minimales (cartes : bordure 1 px, ombre seulement sur menus/modales), transitions de couleur 150 ms | Skill n° 105 : « Color shift hover + Fast 150ms transitions + No shadows ». |
| Identité | Marine profond + orange chantier | Croisement des profils n° 105 (« professional navy + paid green + overdue red ») et n° 51 (« safety orange »). Se distingue des deux références (violet/indigo, vert vif). |
| Densité | Moyenne-haute sur ordinateur, confortable sur mobile | Outil de gestion quotidien, tableaux longs ; cibles tactiles ≥ 44 px sur mobile. |

## Palette (thème clair, obligatoire)

Rapports de contraste calculés selon WCAG 2.x.

| Jeton | Valeur | Usage | Contraste |
|---|---|---|---|
| `--background` | `#F8FAFC` | Fond d'application | — |
| `--foreground` | `#0F172A` | Texte principal | 17,1:1 sur fond |
| `--card` | `#FFFFFF` | Cartes, tableaux, document | — |
| `--primary` | `#1E3A5F` (marine) | Boutons principaux, navigation active, liens | 11,5:1 sur blanc |
| `--primary-foreground` | `#FFFFFF` | Texte sur primaire | 11,5:1 |
| `--accent-brand` | `#C2410C` (orange chantier) | Accent ponctuel : logo, indicateur d'avancement, mise en avant d'un chiffre clé. Jamais pour un statut. | 5,2:1 sur blanc |
| `--secondary` | `#F1F5F9` | Boutons secondaires, fonds de sections | — |
| `--muted-foreground` | `#475569` | Texte secondaire, libellés de colonnes | 7,6:1 sur blanc, 6,9:1 sur `--secondary` |
| `--border` / `--input` | `#E2E8F0` / `#CBD5E1` | Bordures, champs | — |
| `--ring` | `#1E3A5F` | Anneau de focus (2 px + décalage 2 px) | ≥ 3:1 |
| `--destructive` | `#B91C1C` | Actions destructives, erreurs | 5,9:1 sur son fond clair |

### Couleurs d'état (texte sur fond teinté, toujours accompagnées d'une icône + libellé)

| Jeton | Texte | Fond | Contraste |
|---|---|---|---|
| `--success` | `#047857` | `#ECFDF5` | 5,2:1 |
| `--warning` | `#B45309` | `#FFFBEB` | 4,8:1 |
| `--danger` | `#B91C1C` | `#FEF2F2` | 5,9:1 |
| `--info` | `#1D4ED8` | `#EFF6FF` | 6,2:1 |
| `--neutral` | `#334155` | `#F1F5F9` | 9,5:1 |
| `--pending` | `#0E7490` | `#ECFEFF` | 5,2:1 |

### Statuts des documents

| Document | Statut | Ton | Icône (lucide) |
|---|---|---|---|
| Devis | Brouillon | neutral | `FilePen` |
| | Envoyé | info | `Send` |
| | Accepté | success | `CircleCheck` |
| | Refusé | danger | `CircleX` |
| | Expiré | neutral (texte barré non) | `CalendarX` |
| Facture — paiement | Brouillon | neutral | `FilePen` |
| | Émise | info | `FileCheck` |
| | Payée partiellement | warning | `CircleDashed` |
| | Payée | success | `BadgeEuro` |
| | En retard | danger | `AlarmClock` |
| | Annulée par avoir | neutral | `Undo2` |

### Cycle de vie facture électronique

Codes de la nomenclature de la réforme (200 à 213, à confirmer ligne à ligne dans `docs/domaine-btp.md` contre les spécifications externes officielles). Les 4 statuts obligatoires sont marqués ★.

| Statut | Ton | Icône |
|---|---|---|
| ★ Déposée | info | `Upload` |
| Émise par la plateforme | info | `Send` |
| Reçue par la plateforme | info | `Inbox` |
| Mise à disposition | pending | `MailOpen` |
| Prise en charge | pending | `Eye` |
| Approuvée | success | `ThumbsUp` |
| Approuvée partiellement | warning | `SplitSquareHorizontal` |
| En litige | warning | `MessageSquareWarning` |
| Suspendue | warning | `PauseCircle` |
| Complétée | info | `FilePlus2` |
| ★ Refusée | danger | `ThumbsDown` |
| ★ Rejetée | danger | `OctagonX` |
| Paiement transmis | success | `ArrowRightLeft` |
| ★ Encaissée | success | `BadgeEuro` |

Règle : une pastille = icône + libellé, `rounded-sm`, bordure de la couleur du ton, jamais la couleur seule (skill : `color-only`, sévérité haute).

### Thème sombre (optionnel, prévu dans les variables)

Fond `#0B1220`, cartes `#111A2E`, texte `#F8FAFC` (17,9:1), texte secondaire `#94A3B8`, primaire éclairci `#93C5FD` (10,4:1), accent `#FB923C` (8,3:1). Livré en V1 si le temps le permet, sinon variables seules.

## Typographie

| Rôle | Police | Détails |
|---|---|---|
| Interface et titres | **IBM Plex Sans** (400, 500, 600, 700) | Paire « Financial Trust » du skill : « conveys trust and professionalism, excellent for data ». Bonne lecture des chiffres, accents français complets. Chargée via `next/font/google`, `display: swap`. |
| Chiffres | IBM Plex Sans + `font-variant-numeric: tabular-nums` | Skill `number-tabular` : colonnes de montants alignées, pas de saut de mise en page. |
| Numéros de documents, SIREN | IBM Plex Mono (500) | Lisibilité des identifiants (`DEV-2026-0042`, `732 829 320`). |

Alternative du skill : Lexend + Source Sans 3 (« Corporate Trust », plus arrondie). Écartée : moins dense pour les tableaux.

Échelle (rem, base 16 px — jamais moins de 16 px pour le texte courant sur mobile) :

| Jeton | Taille / interligne | Usage |
|---|---|---|
| `text-xs` | 12 / 16 | Mentions légales du document imprimé uniquement |
| `text-sm` | 14 / 20 | Cellules de tableau sur ordinateur, aides de champ |
| `text-base` | 16 / 24 | Texte courant, champs de formulaire |
| `text-lg` | 18 / 28 | Titres de cartes |
| `text-xl` | 20 / 28 | Titres de sections |
| `text-2xl` | 24 / 32 | Titres de pages |
| `text-3xl` | 30 / 36 | Montant principal d'une fiche |

## Espacements, rayons, élévation

- Base 4 px. Échelle utilisée : 4, 8, 12, 16, 24, 32, 48 (`1, 2, 3, 4, 6, 8, 12` en Tailwind).
- Écart minimal entre cibles tactiles : 8 px.
- Rayons : `--radius: 0.5rem` (8 px) → cartes 8 px, champs et boutons 6 px, pastilles 4 px. Sobre, pas de formes « pilule » sauf compteurs.
- Élévation : niveau 0 (bordure) partout ; niveau 1 (ombre légère) pour menus, popovers, barre de totaux collante ; niveau 2 pour modales.
- Hauteurs de contrôles : 40 px sur ordinateur, 44 px sur mobile.

## Règles UX retenues (skill ui-ux-pro-max)

### Saisie des lignes de devis (priorité n° 1)
- Ordinateur : grille éditable type tableur. `Tab` passe au champ suivant, `Entrée` sur la dernière cellule crée une ligne, `Ctrl+Entrée` crée un lot. Lots repliables avec sous-total.
- Unités et taux de TVA en listes courtes (u, m, m², m³, ml, h, j, forfait, ens. ; 20 %, 10 %, 5,5 %, 0 %).
- Champs numériques : `inputmode="decimal"`, virgule française acceptée.
- Mobile : chaque ligne devient une carte (désignation / « 12 m² × 45,00 € · TVA 10 % » / montant), édition dans un panneau bas (`Sheet side="bottom"`).
- Totaux HT / TVA par taux / TTC toujours visibles : colonne droite collante sur ordinateur, barre collante en bas sur mobile.

### Tableaux longs
- Ordinateur : `Table` shadcn sémantique, en-têtes collants, tri avec `aria-sort`, montants alignés à droite en chiffres tabulaires.
- Mobile (< 768 px) : bascule en **liste de cartes** (pas de défilement horizontal, skill `horizontal-scroll`), deux lignes par élément : titre + montant, puis métadonnées + pastilles.
- Recherche et filtres au-dessus ; filtres en `Sheet` sur mobile.

### Formulaires
- Libellé visible au-dessus de chaque champ (jamais le placeholder seul), astérisque pour les champs obligatoires.
- Validation Zod au blur, message sous le champ relié par `aria-describedby`, `role="alert"`.
- Messages d'erreur en français, concrets et réparateurs : « Le SIREN doit comporter 9 chiffres (vous en avez saisi 8). »
- Bouton de soumission désactivé + indicateur pendant l'envoi ; retour par toast (Sonner) `success`/`error`.
- Confirmation avant action irréversible (émettre une facture, refuser une facture reçue) ; actions destructives en rouge, séparées.

### Navigation
- Ordinateur : barre latérale shadcn `Sidebar` (repliable en icônes), sélecteur d'entreprise en tête, menu utilisateur en pied.
- Mobile : barre latérale en `Sheet` via bouton menu + **barre d'onglets basse à 5 entrées max** (Accueil, Devis, Factures, Reçues, Plus).
- Chaque fiche a une URL propre (lien profond), fil d'Ariane sur ordinateur, bouton retour sur mobile.

### États vides, chargement, erreurs
- État vide = icône + phrase utile + action principale (« Aucun devis pour l'instant. Créer un devis »).
- Chargement : squelettes (`Skeleton`) à la forme du contenu via `loading.tsx`, pas d'écran blanc.
- Erreur : message + bouton « Réessayer » (`error.tsx`).

### Accessibilité
- Contraste AA minimum partout (vérifié ci-dessus), focus visible 2 px sur tous les contrôles, ordre de tabulation = ordre visuel.
- Boutons icône seuls avec `aria-label` ; icônes décoratives `aria-hidden`.
- Respect de `prefers-reduced-motion`.
- Cibles tactiles ≥ 44 × 44 px sur mobile.

## Document imprimable (devis, facture)

- Fond blanc, texte noir, couleur d'accent du client limitée à la bande de titre et aux en-têtes de tableau (contraste vérifié, repli sur marine sinon).
- Feuille A4 via `@media print`, mentions légales en pied.
- Aucun badge officiel : mention « Prêt pour la facture électronique » dans l'interface uniquement.

## Mise en œuvre et écarts par rapport à la proposition

| Sujet | Implémentation |
|---|---|
| Jetons | `src/app/globals.css` : `:root` (clair) et `.dark` (sombre, via next-themes). Couleurs d'état exposées en `text-success`, `bg-success-soft`, etc. |
| Feuille imprimable | Jetons dédiés `--paper*`, toujours clairs, même en thème sombre. Impression A4 via `@media print`. |
| Couleur d'accent des documents | Choisie par l'utilisateur ; refusée si le texte blanc n'atteint pas 4,5:1 (`src/lib/color.ts`). Repli sur le primaire. |
| Composants shadcn | Style « radix-nova ». Ajustements : contrôles de 44 px sur mobile et 40 px sur ordinateur, cartes plates (bordure, rayon de 8 px), pastilles de 4 px. |
| Pastilles de statut | `src/components/status/` : icône lucide + libellé + ton, avec le code du statut en info-bulle (cycle de vie). |
| Listes longues | `ResponsiveList` : tableau sémantique à partir de 768 px, cartes à deux niveaux en dessous. |
| Saisie des lignes de devis | Grille en mode tableau **quand le lot fait au moins 48 rem** (container query `@3xl`), car la colonne des totaux réduit la largeur disponible. Sinon, cartes avec libellés visibles. **Écart** : sur mobile, édition sur place plutôt que dans un panneau bas, pour garder la saisie rapide. |
| Navigation mobile | Barre d'onglets basse : Accueil, Devis, Factures, Reçues, Menu (5 entrées) + barre latérale en panneau. |
| États vides et chargement | `EmptyState` (icône + phrase + action), `loading.tsx` (squelettes), `error.tsx` (message + Réessayer), `not-found.tsx`. |
| Accessibilité | Lien d'évitement « Aller au contenu », focus visible de 2 px, libellés associés, erreurs en `role="alert"` reliées par `aria-describedby`, respect de `prefers-reduced-motion`. |
| Typographie | IBM Plex Sans et IBM Plex Mono via `next/font` (`display: swap`). Chiffres tabulaires via la classe `num`. |
| Couleurs | Hexadécimal (et non OKLCH) pour garder le lien direct avec les rapports de contraste documentés ci-dessus. |

## Site vitrine (page d'accueil)

Ajouts propres au site public (`src/app/(marketing)/`, `src/components/marketing/`). Ils s'appuient sur les mêmes jetons ; il n'y a aucune nouvelle couleur.

| Sujet | Règle |
|---|---|
| Motif de page (skill : « Hero + Features + CTA », profil « Conversion-Optimized + Trust ») | Hero, bandeau réforme, problèmes, fonctionnalités alternées, étapes, métiers, tarifs, FAQ, appel final. Le bouton principal est dans le hero, l'en-tête collant et la section finale. |
| Largeur et rythme | Contenu de 72 rem maximum (`max-w-6xl`). Sections de 64 px (mobile) et 96 px (ordinateur). Alternance fond `background` / `card`. |
| Titres | `h1` unique : 36 px (mobile), 48 px, puis 56 px (`lg`), `text-balance`. Titres de section : 30 px puis 36 px. Surtitres en capitales dans la couleur `brand`. |
| Couleurs | Une seule section en teinte primaire (appel final). L'orange chantier est réservé aux icônes, surtitres et petits repères ; jamais pour du texte courant. Les cartes « problèmes » utilisent le ton `warning`. |
| Visuels | Uniquement des **captures réelles** du prototype (`pnpm screenshots` → `public/screenshots/`), dans des cadres d'appareils en CSS (`DesktopFrame`, `PhoneFrame`), servies par `next/image` (AVIF/WebP). Pas d'illustration décorative ; pour l'équipe, un schéma informatif plutôt qu'une fausse capture. |
| Boutons | Pleine largeur sur mobile, 48 px de haut (`size="lg"`). Libellé principal unique, « Essayer gratuitement » (« Essayer » dans l'en-tête mobile). |
| Navigation | En-tête collant de 64 px ; menu visible à partir de `lg`, tiroir `Sheet` en dessous ; `scroll-padding-top` pour que les ancres ne passent pas sous l'en-tête. |
| FAQ | `<details>`/`<summary>` natifs : clavier, lecteurs d'écran, fonctionne sans JavaScript. |
| Animation | Classe `.reveal` : fondu et translation de 8 px liés au défilement (`animation-timeline: view()`). Active seulement si le navigateur la gère et sans `prefers-reduced-motion`. Défilement doux désactivé dans ce cas aussi. |
| Preuve sociale | Composant `SocialProof` alimenté par `testimonials` (vide) : rien ne s'affiche sans témoignage réel. Aucune note, aucun compteur, aucun logo client. |
| Image de partage | `opengraph-image.tsx` : générée hors navigateur, donc les couleurs y sont écrites en hexadécimal (seule exception à la règle des jetons). |

### Direction artistique du site vitrine (v2, inspirée de Facture.net)

À la demande du produit, le site vitrine reprend les **principes de mise en page** de Facture.net, avec notre palette et nos propres contenus. Aucun logo, texte, illustration ni couleur de marque n'est repris.

| Principe repris | Notre traitement |
|---|---|
| Hero centré, titre très gras, mot-clé souligné d'un trait | `h1` en 700, jusqu'à 72 px ; « payées à temps » souligné d'un trait de pinceau orange chantier (`Highlight`, SVG décoratif `aria-hidden`). |
| Points clés en ligne sous le titre | Trois pastilles cochées (situations, retenue de garantie, autoliquidation). |
| Boutons en pilule | `rounded-full`, 48 px de haut, uniquement sur le site vitrine. L'application garde ses boutons à 6 px. |
| Grande capture du produit avec éléments flottants | Capture réelle du tableau de bord sur fond `accent`, avec deux éléments flottants : un téléphone (situation réelle) et une carte de suivi construite avec nos vraies pastilles de statut. Ombre portée réservée à ces éléments flottants. |
| Bloc foncé arrondi avec grille de fonctionnalités | Bloc `primary` (marine) au rayon de 32 px, avec des cartes claires montrant des mini-captures réelles, conclu par un appel à l'action. Cela **remplace** la règle « pas de section sombre » de la v1 : le contraste du texte blanc sur marine est de 11,5:1. |
| Bandeau teinté arrondi | Bloc réforme sur fond `accent`, avec les dates en cartes flottantes décalées. |
| Grille de garanties avec pastille surlignée | Six garanties réelles du produit ; pastille « Mentions obligatoires intégrées » légèrement inclinée. |
| Pied de page foncé | Fond `primary`, liens à 75 % d'opacité (contraste supérieur à 7:1). |
