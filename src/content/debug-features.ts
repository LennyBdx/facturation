/**
 * Inventaire des fonctionnalités par page, pour suivre l'avancement du projet
 * (affiché sur /debug/app). À mettre à jour à chaque évolution.
 *
 * - done : fonctionne réellement dans le prototype ;
 * - mock : présent et cliquable, mais simulé (pas de back-end, de service externe ou d'envoi réel) ;
 * - todo : prévu, pas encore fait.
 */
export type FeatureStatus = "done" | "mock" | "todo";

export interface FeatureItem {
  label: string;
  status: FeatureStatus;
  note?: string;
}

export interface PageEntry {
  page: string;
  route: string;
  /** Lien direct vers un exemple (si la route a un paramètre). */
  href?: string;
  features: FeatureItem[];
}

export interface Area {
  id: string;
  title: string;
  pages: PageEntry[];
}

export const AREAS: Area[] = [
  {
    id: "site",
    title: "Site vitrine",
    pages: [
      {
        page: "Page d'accueil",
        route: "/",
        features: [
          { label: "En-tête collant, tiroir de menu mobile", status: "done" },
          { label: "Hero centré, mot-clé souligné, captures réelles du prototype", status: "done" },
          { label: "Bandeau réforme (dates officielles, lien impots.gouv.fr)", status: "done" },
          { label: "Problèmes du second œuvre", status: "done" },
          {
            label: "Fonctionnalités en grille avec mini-captures + appel intermédiaire",
            status: "done",
          },
          { label: "Comment ça marche, cartes métiers, garanties", status: "done" },
          {
            label: "Preuve sociale (masquée tant qu'aucun témoignage réel)",
            status: "done",
            note: "Liste vide dans src/content/home.ts",
          },
          { label: "Tarifs", status: "mock", note: "Prix et contenus [À DÉFINIR]" },
          { label: "FAQ accordéon accessible", status: "done", note: "3 réponses [À CONFIRMER]" },
          { label: "SEO : métadonnées, Open Graph, JSON-LD, sitemap, robots", status: "done" },
          {
            label: "URL publique définitive du site",
            status: "todo",
            note: "SITE_URL dans src/config/site.ts",
          },
        ],
      },
      {
        page: "Pages légales",
        route: "/mentions-legales",
        features: [
          { label: "Mentions légales", status: "todo", note: "[À RÉDIGER]" },
          { label: "Conditions générales d'utilisation", status: "todo", note: "[À RÉDIGER]" },
          { label: "Politique de confidentialité", status: "todo", note: "[À RÉDIGER]" },
          { label: "Page contact", status: "todo", note: "[À RÉDIGER]" },
        ],
      },
    ],
  },
  {
    id: "acces",
    title: "Accès et onboarding",
    pages: [
      {
        page: "Connexion",
        route: "/connexion",
        features: [
          { label: "Formulaire validé (Zod), affichage du mot de passe", status: "done" },
          {
            label: "Session de démonstration (cookie), retour à la page demandée",
            status: "mock",
            note: "Tout mot de passe accepté",
          },
          { label: "Espace connecté protégé (proxy + vérification serveur)", status: "done" },
          { label: "Authentification réelle", status: "todo" },
        ],
      },
      {
        page: "Inscription",
        route: "/inscription",
        features: [
          { label: "Formulaire validé, acceptation des CGU", status: "done" },
          { label: "Création réelle du compte", status: "todo" },
        ],
      },
      {
        page: "Mot de passe oublié",
        route: "/mot-de-passe-oublie",
        features: [
          { label: "Formulaire et message de confirmation", status: "done" },
          { label: "Envoi réel de l'e-mail de réinitialisation", status: "todo" },
        ],
      },
      {
        page: "Onboarding",
        route: "/onboarding",
        features: [
          { label: "Étape entreprise : SIREN, SIRET, TVA, APE validés", status: "done" },
          { label: "Calcul du n° de TVA depuis le SIREN", status: "done" },
          {
            label: "Étape facture électronique : explication et choix de la plateforme",
            status: "mock",
            note: "Liste de plateformes fictive",
          },
          { label: "Création réelle de l'entreprise en base", status: "todo" },
        ],
      },
    ],
  },
  {
    id: "coquille",
    title: "Coquille de l'application",
    pages: [
      {
        page: "Navigation",
        route: "/app",
        features: [
          { label: "Barre latérale repliable, onglets bas sur mobile (5 entrées)", status: "done" },
          { label: "Pastilles « à traiter » (factures rejetées, factures reçues)", status: "done" },
          { label: "Sélecteur d'entreprise (2 entreprises fictives)", status: "done" },
          { label: "Menu utilisateur, thème sombre", status: "done" },
          {
            label: "Déconnexion (suppression du cookie de session)",
            status: "done",
          },
          { label: "Squelettes de chargement, page d'erreur, page introuvable", status: "done" },
        ],
      },
    ],
  },
  {
    id: "dashboard",
    title: "Tableau de bord",
    pages: [
      {
        page: "Tableau de bord",
        route: "/app/tableau-de-bord",
        features: [
          {
            label:
              "6 indicateurs calculés (CA du mois, à encaisser, retards, devis, retenues, reçues)",
            status: "done",
          },
          {
            label: "Factures électroniques rejetées, refusées, en litige à traiter",
            status: "done",
          },
          { label: "Dernières factures, devis à relancer, chantiers en cours", status: "done" },
          { label: "Retenues de garantie à récupérer", status: "done" },
          { label: "Graphiques d'évolution (CA, encaissements)", status: "todo" },
        ],
      },
    ],
  },
  {
    id: "clients",
    title: "Clients",
    pages: [
      {
        page: "Liste des clients",
        route: "/app/clients",
        features: [
          { label: "Recherche (nom, SIREN, ville) et filtre par type", status: "done" },
          { label: "Solde dû par client, SIREN manquant signalé", status: "done" },
          { label: "Import CSV de clients", status: "todo" },
        ],
      },
      {
        page: "Fiche client",
        route: "/app/clients/[id]",
        href: "/app/clients/cli-batir",
        features: [
          { label: "« Vous doit » et retards", status: "done" },
          { label: "Coordonnées cliquables (e-mail, téléphone)", status: "done" },
          { label: "Factures, devis et chantiers liés", status: "done" },
          {
            label: "Archivage et restauration d'un client",
            status: "done",
            note: "Refusé tant que le client doit de l'argent",
          },
        ],
      },
      {
        page: "Création / modification",
        route: "/app/clients/nouveau",
        features: [
          { label: "Formulaire validé, SIREN obligatoire pour un professionnel", status: "done" },
          { label: "Code service pour un acheteur public", status: "done" },
          {
            label: "Recherche automatique dans l'annuaire des entreprises (API SIRENE)",
            status: "todo",
          },
        ],
      },
    ],
  },
  {
    id: "chantiers",
    title: "Chantiers",
    pages: [
      {
        page: "Liste des chantiers",
        route: "/app/chantiers",
        features: [
          { label: "Recherche, filtre par statut, avancement facturé", status: "done" },
          { label: "Badge autoliquidation", status: "done" },
        ],
      },
      {
        page: "Fiche chantier",
        route: "/app/chantiers/[id]",
        href: "/app/chantiers/ws-terrasses",
        features: [
          { label: "Synthèse : marché, avancement, reste à encaisser, retenue", status: "done" },
          { label: "Tableau des situations", status: "done" },
          { label: "Retenue libérable + « marquer comme récupérée »", status: "done" },
          { label: "Factures fournisseurs rattachées (achats)", status: "done" },
          { label: "Avenants au marché", status: "todo" },
          { label: "Marge du chantier (ventes − achats)", status: "todo" },
        ],
      },
      {
        page: "Création / modification",
        route: "/app/chantiers/nouveau",
        features: [
          {
            label: "Formulaire : marché, sous-traitance, autoliquidation, retenue ≤ 5 %, caution",
            status: "done",
          },
        ],
      },
    ],
  },
  {
    id: "devis",
    title: "Devis",
    pages: [
      {
        page: "Liste des devis",
        route: "/app/devis",
        features: [
          {
            label: "Recherche et filtre par statut (expiré calculé automatiquement)",
            status: "done",
          },
        ],
      },
      {
        page: "Éditeur de devis",
        route: "/app/devis/nouveau",
        features: [
          { label: "Lots et lignes, saisie au clavier (Entrée = ligne suivante)", status: "done" },
          { label: "Totaux HT / TVA par taux / TTC en direct", status: "done" },
          { label: "Remise, acompte, autoliquidation, notes", status: "done" },
          { label: "Monter, descendre, dupliquer, supprimer une ligne", status: "done" },
          { label: "Bibliothèque d'ouvrages et de prix", status: "todo" },
          { label: "Import de métrés", status: "todo" },
        ],
      },
      {
        page: "Fiche devis",
        route: "/app/devis/[id]",
        features: [
          { label: "Envoyé, accepté, refusé (avec motif), repasser en brouillon", status: "done" },
          { label: "Dupliquer", status: "done" },
          { label: "Transformer en chantier", status: "done" },
          { label: "Facturer : acompte, situation, facture unique", status: "done" },
          { label: "Envoi par e-mail au client", status: "todo" },
          { label: "Signature électronique du client", status: "todo" },
        ],
      },
      {
        page: "Aperçu imprimable",
        route: "/app/devis/[id]/apercu",
        features: [
          { label: "Document A4 avec mentions légales et bon pour accord", status: "done" },
          { label: "Génération PDF", status: "todo", note: "Impression navigateur en attendant" },
        ],
      },
    ],
  },
  {
    id: "factures",
    title: "Factures émises",
    pages: [
      {
        page: "Liste des factures",
        route: "/app/factures",
        features: [
          { label: "Double statut : paiement + facture électronique", status: "done" },
          { label: "Filtres : statut, reste à encaisser, à traiter", status: "done" },
          { label: "Relances automatiques des impayés", status: "todo" },
        ],
      },
      {
        page: "Nouvelle facture",
        route: "/app/factures/nouvelle",
        features: [
          {
            label: "Choix du devis accepté et du type (acompte, situation, unique)",
            status: "done",
          },
        ],
      },
      {
        page: "Assistant de situation",
        route: "/app/factures/situation/nouvelle",
        features: [
          { label: "Avancement cumulé par ligne ou par lot, « tout à 100 % »", status: "done" },
          {
            label: "Calcul en direct : période, remise, acompte, TVA, retenue, net à payer",
            status: "done",
          },
          { label: "Contrôle : avancement qui ne diminue pas, 0 à 100 %", status: "done" },
        ],
      },
      {
        page: "Fiche facture",
        route: "/app/factures/[id]",
        features: [
          { label: "Contrôle de conformité bloquant, avec liens de correction", status: "done" },
          { label: "Numérotation continue à l'émission, données figées", status: "done" },
          {
            label: "Émettre et transmettre à la plateforme agréée",
            status: "mock",
            note: "Plateforme simulée",
          },
          {
            label: "Frise du cycle de vie mise à jour en direct",
            status: "mock",
            note: "Statuts simulés",
          },
          { label: "Redéposer une facture rejetée", status: "mock" },
          {
            label: "Enregistrer un paiement, statut « Encaissée » déclaré",
            status: "mock",
            note: "Aucun flux bancaire",
          },
          { label: "Modifier / supprimer un brouillon", status: "done" },
          { label: "Avoir d'annulation totale", status: "done" },
          { label: "Avoir partiel", status: "todo" },
        ],
      },
      {
        page: "Aperçu imprimable",
        route: "/app/factures/[id]/apercu",
        features: [
          {
            label: "Document A4 avec mentions légales (situations, autoliquidation, retenue)",
            status: "done",
          },
          { label: "PDF et fichier Factur-X", status: "todo" },
        ],
      },
    ],
  },
  {
    id: "recues",
    title: "Factures reçues",
    pages: [
      {
        page: "Boîte de réception",
        route: "/app/factures-recues",
        features: [
          {
            label: "Synchronisation avec la plateforme agréée",
            status: "mock",
            note: "Une nouvelle facture arrive 60 s après le démarrage",
          },
          { label: "Filtres : à traiter, approuvées, litiges, refusées, payées", status: "done" },
        ],
      },
      {
        page: "Fiche facture reçue",
        route: "/app/factures-recues/[id]",
        features: [
          { label: "Données structurées, TVA, autoliquidation à déclarer", status: "done" },
          {
            label: "Approuver, refuser (motif), litige, marquer payée",
            status: "mock",
            note: "Statuts envoyés à la plateforme simulée",
          },
          { label: "Rattachement à un chantier", status: "done" },
          { label: "Aperçu du PDF original du fournisseur", status: "todo" },
          { label: "Paiement du fournisseur (virement)", status: "todo" },
        ],
      },
    ],
  },
  {
    id: "equipe",
    title: "Équipe",
    pages: [
      {
        page: "Équipe",
        route: "/app/equipe",
        features: [
          { label: "Membres et rôles, changement de rôle", status: "done" },
          { label: "Invitations en attente, annulation", status: "done" },
          {
            label: "Envoi de l'invitation par e-mail",
            status: "mock",
            note: "Aucun e-mail envoyé",
          },
          {
            label: "Droits appliqués par rôle sur chaque action",
            status: "done",
            note: "Un membre ne peut ni émettre, ni encaisser, ni établir d'avoir",
          },
        ],
      },
    ],
  },
  {
    id: "parametres",
    title: "Paramètres",
    pages: [
      {
        page: "Entreprise",
        route: "/app/parametres/entreprise",
        features: [
          { label: "Identité, identifiants, adresse, assurance décennale, banque", status: "done" },
        ],
      },
      {
        page: "Numérotation et conditions",
        route: "/app/parametres/numerotation",
        features: [
          { label: "Préfixes et prochain numéro (continuité contrôlée)", status: "done" },
          { label: "Délais, pénalités, retenue, acompte, validité par défaut", status: "done" },
        ],
      },
      {
        page: "Personnalisation",
        route: "/app/parametres/documents",
        features: [
          {
            label: "Couleur d'accent avec contrôle de contraste, mentions complémentaires",
            status: "done",
          },
          { label: "Import du logo", status: "todo" },
        ],
      },
      {
        page: "Facture électronique",
        route: "/app/parametres/facture-electronique",
        features: [
          { label: "Choix et connexion de la plateforme agréée", status: "mock" },
          { label: "Explication de la réforme et des statuts", status: "done" },
        ],
      },
      {
        page: "Abonnement",
        route: "/app/parametres/abonnement",
        features: [
          { label: "Offres (maquette)", status: "mock" },
          { label: "Paiement Stripe", status: "todo" },
        ],
      },
      {
        page: "Expert-comptable",
        route: "/app/parametres/expert-comptable",
        features: [
          { label: "Invitation de l'expert-comptable", status: "mock" },
          { label: "Exports comptables (journaux, FEC)", status: "todo" },
        ],
      },
      {
        page: "Mon compte",
        route: "/app/parametres/compte",
        features: [
          { label: "Informations de l'utilisateur", status: "mock", note: "Utilisateur fictif" },
          { label: "Mot de passe, double authentification", status: "todo" },
        ],
      },
    ],
  },
  {
    id: "socle",
    title: "Socle technique",
    pages: [
      {
        page: "Transverse",
        route: "—",
        features: [
          { label: "Logique métier et services testés (Vitest)", status: "done" },
          { label: "Parcours de bout en bout (Playwright) et CI", status: "done" },
          { label: "Prérendu partiel et cache des lectures (Cache Components)", status: "done" },
          { label: "Isolation des données par entreprise", status: "done" },
          { label: "Responsive mobile, accessibilité, thème sombre", status: "done" },
          { label: "Pagination des listes (10 par page, dans l'URL)", status: "done" },
          { label: "Tri des listes (en-têtes cliquables, sélecteur sur mobile)", status: "done" },
          { label: "Export CSV des listes (recherche, filtre et tri appliqués)", status: "done" },
          { label: "Données fictives cohérentes (2 entreprises)", status: "done" },
          { label: "Base de données PostgreSQL", status: "todo" },
          { label: "Authentification réelle", status: "todo" },
          { label: "Connexion réelle à une plateforme agréée", status: "todo" },
          { label: "Génération Factur-X / PDF", status: "todo" },
          { label: "Envoi d'e-mails", status: "todo" },
          { label: "Paiement Stripe", status: "todo" },
          { label: "Déploiement", status: "todo" },
        ],
      },
    ],
  },
];
