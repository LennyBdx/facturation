# Plan — page d'accueil (site vitrine) — à valider

Le nom du produit est « Factobat » (choisi après validation du plan), centralisé dans `src/config/site.ts`. L'application porte le même nom depuis la v2 du site vitrine.

Skill ui-ux-pro-max : il est utilisé. Python n'est pas installé, donc ses bases de données CSV sont interrogées directement.

## Recommandations du skill retenues

- **Profil** « Invoice & Billing Tool » → motif de page « Conversion-Optimized + Trust ». Pas d'effets décoratifs, transitions courtes.
- **Motif de page** « Hero + Features + CTA », complété par « Pricing » et « FAQ » :
  - appel à l'action principal dans le hero et dans l'en-tête collant, répété en bas de page ;
  - texte du bouton contrasté à au moins 4,5:1.
- **Pas de carrousel de témoignages** : le skill exige des avis vérifiés. Nous n'en avons pas, d'où le composant masqué.
- **Animations** : 1 ou 2 éléments animés par écran au maximum, et rien sous `prefers-reduced-motion` (règle « Excessive Motion »).
- **Rythme** : alternance fond clair / carte. Une seule section en teinte primaire, l'appel à l'action final. Pas de section entièrement sombre.
- **Mobile d'abord** :
  - boutons de 44 px minimum et pleine largeur sur mobile ;
  - pas de défilement horizontal ;
  - en-tête compact avec « Essayer » toujours visible ;
  - tiroir de menu.

## Organisation technique

| Élément | Décision |
|---|---|
| Accueil | `src/app/(marketing)/page.tsx` → `/`, avec son layout (en-tête et pied de page publics). |
| Application | Déplacée de la racine vers **`/app`** : `/app/tableau-de-bord`, `/app/devis`, `/app/factures/...`. Tous les liens internes sont mis à jour via un module unique `src/config/routes.ts`. `/connexion`, `/inscription`, `/mot-de-passe-oublie` et `/onboarding` restent à la racine. Après connexion : `/app/tableau-de-bord`. |
| Textes | `src/content/home.ts` (typé), y compris la FAQ et les offres. |
| Pages légales | `/mentions-legales`, `/cgu`, `/confidentialite`, `/contact` : pages minimales `[À RÉDIGER]`. |
| SEO | `metadata` + Open Graph (image générée), un seul `h1`, JSON-LD `SoftwareApplication` et `FAQPage`, `app/sitemap.ts`, `app/robots.ts` (`/app` exclu de l'indexation). |
| Captures | Script `pnpm screenshots` (Playwright) : il démarre l'application en production sur un port libre, puis capture le tableau de bord (ordinateur), l'assistant de situation (mobile), l'éditeur de devis, la fiche facture avec frise, la boîte des factures reçues et la fiche chantier. Sortie dans `public/screenshots/*.webp` + aperçus `docs/references/home-v1-*.png` en fin de travail. |
| Interactivité | Composants serveur partout. Code client uniquement pour le tiroir mobile et l'accordéon de la FAQ (`<details>` natif, donc accessible sans JavaScript). |

## Sections, titres et accroches (propositions)

**1. En-tête collant**
- Logo texte `[NOM DU PRODUIT]`.
- Menu : Fonctionnalités · Facture électronique · Tarifs · FAQ.
- Boutons : « Se connecter », « Essayer gratuitement ».
- Sur mobile, le menu passe dans un tiroir et le bouton « Essayer » reste visible.

**2. Hero** (deux colonnes sur ordinateur, empilé sur mobile)
- Surtitre : « Logiciel de devis et de facturation pour le second œuvre »
- `h1` : **« Vos situations de travaux, facturées juste et payées à temps. »**
- Sous-titre : « Devis par lots, situations à l'avancement, retenue de garantie et autoliquidation calculées pour vous. Prêt pour la facture électronique. »
- Boutons : « Essayer gratuitement » (principal) · « Voir les fonctionnalités » (ancre).
- Trois points clés :
  - « Situations et retenue de garantie calculées automatiquement » ;
  - « Prêt pour la facture électronique » ;
  - « Utilisable sur chantier, depuis le téléphone ».
- Visuel :
  - capture réelle du tableau de bord dans un cadre d'ordinateur sobre (bordure, barre de fenêtre neutre) ;
  - capture de l'assistant de situation dans un cadre de téléphone superposé en bas à droite ;
  - pas de décor ajouté.

**3. Bandeau réforme** (`id="facture-electronique"`)
- Pastille neutre : « Prêt pour la facture électronique ».
- Deux dates :
  - **1er septembre 2026** : réception obligatoire pour toutes les entreprises ;
  - **1er septembre 2027** : émission obligatoire pour les TPE et PME.
- Deux phrases : « Les factures transitent par une plateforme agréée par l'État, qui les transmet à vos clients et à l'administration. `[NOM DU PRODUIT]` prépare vos factures et les envoie à la plateforme de votre choix. »
- Lien « Consulter la liste officielle des plateformes agréées », vers impots.gouv.fr (nouvel onglet, signalé).

**4. Le problème** — « Ce qui fait perdre du temps (et de l'argent) aux entreprises du second œuvre »
- Cinq cartes avec icône :
  - situations tenues sur Excel ;
  - retenues de garantie oubliées ;
  - erreurs d'autoliquidation ;
  - relances faites à la main ;
  - factures fournisseurs éparpillées.
- Chaque carte compte une phrase.

**5. Fonctionnalités** (`id="fonctionnalites"`) — 6 blocs alternés texte + capture

| Bloc | Titre proposé | Capture |
|---|---|---|
| Devis par lots | « Un devis complet en quelques minutes, même à 80 lignes » | éditeur de devis |
| Situations | « Saisissez l'avancement, le reste se calcule » | assistant de situation |
| Facture électronique | « Contrôlée avant l'envoi, suivie après » | fiche facture (contrôle et frise) |
| Factures reçues | « Toutes vos factures fournisseurs au même endroit » | boîte des factures reçues |
| Encaissements et retenues | « Sachez qui vous doit quoi, et quand récupérer vos retenues » | fiche chantier |
| Équipe et multi-entreprises | « Le patron, le conducteur de travaux et l'assistante, chacun son rôle » | liste ou icônes (pas de capture inventée) |

Chaque bloc comporte 3 puces factuelles, uniquement sur ce que fait le prototype.

**6. Comment ça marche** : 3 étapes
1. Créez votre entreprise (SIREN vérifié).
2. Faites vos devis puis vos situations.
3. Émettez : la plateforme agréée transmet, vous suivez le paiement.

**7. Pour qui** : 5 cartes métier
- Électricité ;
- plomberie-chauffage ;
- menuiserie-agencement ;
- peinture ;
- plâtrerie.

Chaque carte donne un exemple concret d'usage (« Situations par lot sur un chantier de 24 logements »…), sans chiffres inventés.

**8. Tarifs** (`id="tarifs"`) : 3 offres
- Essentiel / Pro / Entreprise. Prix et contenus `[À DÉFINIR]`.
- Une offre mise en avant (« Pro ») par bordure, sans faux « le plus populaire ».
- Bouton → `/inscription`.

**9. FAQ** (`id="faq"`) : 8 questions en accordéon `<details>`/`<summary>`
1. Suis-je concerné par la facture électronique, et quand ?
2. `[NOM DU PRODUIT]` est-il une plateforme agréée ? → Non : solution qui se connecte à une plateforme agréée.
3. Quelle plateforme agréée utiliser ? `[À CONFIRMER]`
4. Le logiciel gère-t-il l'autoliquidation en sous-traitance ?
5. Comment est calculée la retenue de garantie ?
6. Puis-je l'utiliser sur téléphone, sur chantier ?
7. Où sont hébergées mes données ? `[À CONFIRMER]`
8. Y a-t-il un engagement ? Puis-je exporter mes données ? `[À CONFIRMER]`

**10. Appel à l'action final** (fond primaire)
- Titre : « Prêt à facturer vos chantiers sans tableur ? »
- Bouton « Essayer gratuitement ».
- Mention « Sans carte bancaire » marquée `[À CONFIRMER]`.

**11. Pied de page**
- Produit : fonctionnalités, tarifs, facture électronique.
- Ressources : FAQ, liste officielle des plateformes agréées.
- Légal : mentions légales, CGU, confidentialité.
- Contact.
- Mention « Prêt pour la facture électronique ».

**Preuve sociale** : un composant `SocialProof` est alimenté par `testimonials: []` dans `home.ts`. Il ne s'affiche pas tant que la liste est vide.

## Ajouts au design system (site vitrine)

- Largeur de contenu 72 rem, sections espacées de 64 px sur mobile et 96 px sur ordinateur.
- Échelle de titres plus grande : `h1` de 36 px sur mobile à 56 px sur ordinateur (`text-balance`), titres de section de 30 px à 40 px.
- Cadres d'appareils en CSS uniquement (bordure, rayon, barre neutre), sans image d'appareil.
- Une seule teinte forte, le primaire marine, pour l'appel à l'action final. L'orange chantier sert seulement aux icônes et aux petits accents.
- Apparition au défilement : fondu de 8 px en CSS (`@starting-style` / `animation-timeline`), désactivé avec `prefers-reduced-motion`. Si le navigateur ne le gère pas, le contenu est simplement affiché.

## Étapes et commits

1. Déplacement de l'application sous `/app` + `routes.ts` + `site.ts`.
2. Script `pnpm screenshots` + captures.
3. Layout vitrine (en-tête, tiroir, pied de page) + pages légales.
4. Hero + bandeau réforme.
5. Problème + fonctionnalités.
6. Comment ça marche + pour qui.
7. Tarifs + FAQ + appel final + preuve sociale.
8. SEO (métadonnées, OG, JSON-LD, sitemap, robots).
9. Documentation (design system, README) + captures `home-v1-*` + vérification lint et build.
