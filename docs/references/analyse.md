# Analyse des références de design

> Usage interne uniquement. Les captures de ce dossier servent à analyser des **principes** et des **parcours**.
> Aucun logo, nom, texte, illustration, couleur de marque ou badge de ces produits ne doit être repris.
> Captures relancées avec `pnpm references` (script `scripts/capture-references.mjs`).

## Fichiers

| Fichier | Contenu |
|---|---|
| `facturenet-desktop.png` / `facturenet-mobile.png` | Page d'accueil Facture.net, 1440 px et 390 px, pleine page |
| `tiime-factures-desktop.png` / `tiime-factures-mobile.png` | Page module factures Tiime, 1440 px et 390 px, pleine page |
| `tiime-app-hero-factures.png` | Maquette produit : facture sur mobile + aperçu du document sur bureau |
| `tiime-app-section-factures.png` | Maquette produit : écran « nouvelle facture » sur mobile |
| `tiime-app-factures-brouillon.png` | Facture en brouillon (mobile) |
| `tiime-app-factures-parametres.png` | Paramètres de facturation (mobile) |
| `tiime-app-factures-fiche-client.png` | Fiche client avec « vous doit » et factures associées |
| `tiime-app-factures-repetition.png` | Facturation récurrente |
| `tiime-app-factures-facture.png` | Fiche d'une facture émise |

Toutes les captures ont réussi le 18/10/2026 (pas de blocage anti-robot).

Remarque : il s'agit de pages marketing. On y voit des maquettes du produit, pas l'application réelle. Ce qu'on en tire porte sur la logique d'écran et la hiérarchie, pas sur le détail d'implémentation.

---

## 1. Ce qui fonctionne bien

### Hiérarchie de l'information
- **Le montant d'abord.** La fiche facture (Tiime) ouvre sur le montant TTC en très gros, puis le statut sous forme de bouton-pastille cliquable, puis l'intitulé et la date en petit. On sait en une seconde « combien » et « où en est-on ».
- **« Vous doit »** sur la fiche client : le solde dû est la première information, en couleur d'alerte, avant les coordonnées (repliées par défaut). C'est exactement la question qu'un dirigeant se pose.
- **Tableau de bord orienté encaissement** (Facture.net) : chiffre d'affaires à encaisser et retards de paiement en premier, courbe ensuite.

### Navigation
- Facture.net : barre latérale gauche groupée par domaine (facturation, clients, notes de frais…), sélecteur d'organisation en haut de la barre latérale. Simple et prévisible.
- Tiime mobile : navigation par pile (croix pour fermer, chevron retour, menu « ⋮ » pour les actions secondaires). Les actions principales d'une facture (envoyer, télécharger, dupliquer) sont trois gros boutons icône + libellé.

### Présentation des statuts
- Statuts en **pastilles bordées avec libellé texte** (« Facturée », « Envoyée », « Payée ») et une couleur par état. Le montant prend aussi la couleur « payé » (vert) — lisible, mais l'information repose en partie sur la couleur seule.
- Icône de document différente selon le statut dans les listes : bon repère visuel.

### Densité des tableaux
- Aperçu du document : tableau classique Quantité / Unité / PU / TVA / Montant HT, totaux alignés à droite, TTC mis en avant. Chiffres alignés à droite.
- Sur mobile, les lignes deviennent des **cartes à deux niveaux** : désignation en titre, puis « TVA 20 % | 3 heures × 900,00 € » et le montant à droite. Très bonne transposition d'un tableau large sur petit écran.

### Parcours de création
- Brouillon Tiime : sections empilées **Client → Intitulé → Lignes → Totaux → Date d'émission**, avec des zones en pointillés « + Ajouter un client » / « + Ajouter une ligne ». Les totaux HT/TTC sont toujours visibles sous les lignes.
- Mode **« Rapide / Complet »** dans les paramètres : saisie minimale (désignation, TVA, prix) ou complète. Bonne idée de divulgation progressive.
- Duplication et transformation devis → facture en un clic.
- Personnalisation du document limitée à logo + couleur : suffisant, pas d'éditeur de mise en page.

### Réassurance
- Facture.net met la conformité au centre (Réception / Émission / E-reporting en trois puces, bloc « documents conformes et sécurisés » : conformité, sécurité, inaltérabilité, archivage). Le vocabulaire de la réforme est expliqué simplement.

## 2. Ce qui est moins adapté à notre cible BTP

- **Pensé pour la facture « simple »** (prestation, forfait, heures). Rien sur les situations de travaux, l'avancement cumulé, la retenue de garantie, l'autoliquidation, les lots. Notre cœur métier est absent ; il faut le concevoir nous-mêmes.
- **Un seul statut par facture.** En facture électronique, il y a deux dimensions indépendantes : le paiement (émise, payée, en retard…) et le cycle de vie plateforme (déposée, rejetée, refusée, encaissée…). Une pastille unique ne suffit plus.
- **Pas de notion de chantier.** Dans le BTP, le chantier (et le marché) est l'objet pivot : devis, situations, factures fournisseurs et retenues s'y rattachent.
- **Lignes « plates ».** Un devis BTP comporte des lots/chapitres avec sous-totaux, et souvent 30 à 150 lignes : la saisie ligne par ligne en modale ou en écran plein (pattern mobile Tiime) serait trop lente sur ordinateur.
- **Esthétique « startup »** : dégradés violets, formes décoratives, illustrations 3D, confettis. Notre public (patrons de PME, conducteurs de travaux, assistant(e)s) attend un outil de gestion sobre ; le skill ui-ux-pro-max classe d'ailleurs les dégradés violet/rose comme anti-pattern pour un outil de facturation B2B.
- **Couleur seule pour le statut « payé »** (montant vert) : insuffisant pour l'accessibilité et en plein soleil sur chantier.
- **Badges officiels** mis en avant : nous ne pouvons pas afficher de label avant de l'avoir obtenu.
- **Facturation récurrente** : peu pertinente pour des travaux (hors contrats de maintenance), à ne pas prioriser.

## 3. Idées retenues pour notre produit

1. **Montant + statut en tête de chaque fiche** (devis, facture émise, facture reçue, client) : montant TTC ou « reste à payer » en grand, puis les pastilles de statut, puis les actions.
2. **Deux pastilles côte à côte** pour une facture émise : paiement et cycle de vie facture électronique, chacune avec icône + libellé (jamais la couleur seule), et une **frise chronologique** détaillée sur la fiche.
3. **« Vous doit » / « Reste à encaisser »** sur la fiche client et la fiche chantier ; tableau de bord centré sur l'argent dû et les retards, plus les **retenues de garantie à récupérer** (spécifique BTP).
4. **Chantier comme objet pivot**, avec barre d'avancement facturé (%) et liste des documents liés.
5. **Éditeur de devis en tableau sur ordinateur** (saisie clavier : Tab / Entrée crée une ligne, lots repliables, sous-totaux par lot) et **en cartes à deux niveaux sur mobile** (pattern ligne-carte observé chez Tiime), totaux collants en bas d'écran.
6. **Divulgation progressive** : champs avancés (remise, code catégorie TVA, référence marché) repliés par défaut.
7. **Contrôle de conformité visible avant émission** : liste à cocher des mentions manquantes avec lien direct vers le champ à corriger (inspiré de la réassurance Facture.net, mais rendu actionnable).
8. **Actions principales en gros boutons icône + libellé** sur mobile (émettre, aperçu, dupliquer), actions secondaires dans un menu « ⋮ ».
9. **Personnalisation du document limitée** : logo + couleur d'accent, avec garde-fou de contraste.
10. **Mention neutre** « Prêt pour la facture électronique » à la place de tout badge officiel.
11. **Identité propre** : palette marine + orange chantier (pas de violet), style plat, sans dégradé ni illustration décorative.
