/**
 * Contenu de la page d'accueil (site vitrine). Tout le texte est ici.
 *
 * Règles :
 * - aucun faux avis, aucune fausse note, aucun faux logo, aucune fausse statistique ;
 * - aucun badge officiel : mention neutre « Prêt pour la facture électronique » ;
 * - ce qui n'est pas décidé est marqué [À DÉFINIR] ou [À CONFIRMER].
 */
import { routes } from "@/config/routes";
import { PRODUCT_NAME } from "@/config/site";

export const READY_LABEL = "Prêt pour la facture électronique";

export const nav = [
  { href: "/#fonctionnalites", label: "Fonctionnalités" },
  { href: "/#facture-electronique", label: "Facture électronique" },
  { href: "/#tarifs", label: "Tarifs" },
  { href: "/#faq", label: "FAQ" },
] as const;

export const cta = {
  primary: "Essayer gratuitement",
  signIn: "Se connecter",
  secondary: "Voir les fonctionnalités",
};

export const hero = {
  title: "Vos situations de travaux, facturées juste et payées à temps.",
  /** Partie du titre soulignée (doit figurer telle quelle dans `title`). */
  titleHighlight: "payées à temps",
  /** Pastilles sous le titre. */
  tags: ["Situations de travaux", "Retenue de garantie", "Autoliquidation"],
  subtitle:
    "Devis par lots, situations à l'avancement, retenue de garantie et autoliquidation calculées pour vous. Vos factures sont prêtes pour la facture électronique.",
  points: [
    { icon: "calculator", text: "Situations et retenue de garantie calculées automatiquement" },
    { icon: "shield", text: READY_LABEL },
    { icon: "smartphone", text: "Utilisable sur chantier, depuis le téléphone" },
  ],
  images: {
    desktop: {
      src: "/screenshots/dashboard.jpg",
      alt: `Tableau de bord de ${PRODUCT_NAME} : montants à encaisser, factures en retard, retenues de garantie et factures électroniques à traiter.`,
      width: 2880,
      height: 1800,
    },
    mobile: {
      src: "/screenshots/situation-mobile.jpg",
      alt: "Saisie d'une situation de travaux sur téléphone : avancement de 90 % par lot et montant de la période calculé ligne par ligne.",
      width: 1170,
      height: 2532,
    },
  },
} as const;

export const reform = {
  id: "facture-electronique",
  badge: READY_LABEL,
  title: "La facture électronique arrive sur vos chantiers",
  dates: [
    {
      date: "1er septembre 2026",
      text: "Réception obligatoire des factures électroniques pour toutes les entreprises.",
    },
    { date: "1er septembre 2027", text: "Émission obligatoire pour les TPE et PME." },
  ],
  body: [
    "Les factures transitent par une plateforme agréée par l'État, qui les transmet à vos clients et communique les données utiles à l'administration fiscale.",
    `${PRODUCT_NAME} prépare vos factures, les contrôle et les envoie à la plateforme agréée de votre choix, puis affiche chaque statut jusqu'à l'encaissement.`,
  ],
  link: "Consulter la liste officielle des plateformes agréées",
} as const;

export const problems = {
  title: "Ce qui fait perdre du temps (et de l'argent) dans le second œuvre",
  intro:
    "Les logiciels de facturation généralistes ne connaissent ni les situations, ni la retenue de garantie, ni l'autoliquidation.",
  items: [
    {
      icon: "sheet",
      title: "Situations tenues sur Excel",
      text: "Cumuls recopiés à la main, formules cassées, acomptes oubliés dans le calcul.",
    },
    {
      icon: "shield-off",
      title: "Retenues de garantie oubliées",
      text: "Un an après la réception, personne ne pense à réclamer les 5 % retenus.",
    },
    {
      icon: "percent",
      title: "Erreurs d'autoliquidation",
      text: "TVA facturée à tort en sous-traitance, mention absente, facture à refaire.",
    },
    {
      icon: "phone",
      title: "Relances faites à la main",
      text: "Impossible de savoir d'un coup d'œil qui doit quoi, et depuis quand.",
    },
    {
      icon: "inbox",
      title: "Factures fournisseurs éparpillées",
      text: "Entre e-mails, papier et portails : difficile de suivre ce qui est approuvé ou payé.",
    },
  ],
} as const;

export interface Feature {
  id: string;
  kicker: string;
  title: string;
  text: string;
  bullets: string[];
  image?: { src: string; alt: string; width: number; height: number; device: "desktop" | "mobile" };
  icon?: string;
}

export const features = {
  id: "fonctionnalites",
  title: "Tout le cycle, du devis à l'encaissement",
  intro:
    "Pensé pour la façon dont le second œuvre facture vraiment : par lots, à l'avancement, avec des retenues.",
  items: [
    {
      id: "devis",
      kicker: "Devis par lots",
      title: "Un devis complet en quelques minutes, même à 80 lignes",
      text: "Lots, sous-totaux, unités du bâtiment, taux de TVA réduits : la saisie se fait au clavier, ligne après ligne, et les totaux se mettent à jour pendant que vous tapez.",
      bullets: [
        "Touche Entrée pour passer à la ligne suivante",
        "Remise, acompte et autoliquidation en option",
        "Aperçu imprimable avec les mentions obligatoires",
      ],
      image: {
        src: "/screenshots/quote-editor.jpg",
        alt: "Éditeur de devis : lots, lignes avec quantité, unité, prix unitaire et TVA, et totaux HT, TVA et TTC calculés en direct.",
        width: 2880,
        height: 1800,
        device: "desktop",
      },
    },
    {
      id: "situations",
      kicker: "Situations de travaux",
      title: "Saisissez l'avancement, le reste se calcule",
      text: "Indiquez le pourcentage cumulé par ligne ou par lot. Le montant de la période, la déduction d'acompte, la TVA ou l'autoliquidation et la retenue de garantie sont calculés pour vous.",
      bullets: [
        "Cumul précédent repris automatiquement",
        "Acompte déduit au fil de l'avancement",
        "Retenue de garantie paramétrable, 5 % maximum",
      ],
      image: {
        src: "/screenshots/situation-mobile.jpg",
        alt: "Situation de travaux sur téléphone : avancement saisi par lot et montant de la période par ligne.",
        width: 1170,
        height: 2532,
        device: "mobile",
      },
    },
    {
      id: "facture-electronique",
      kicker: "Facture électronique",
      title: "Contrôlée avant l'envoi, suivie après",
      text: "Avant l'émission, les mentions obligatoires et les données manquantes sont vérifiées (SIREN du client, adresse, TVA…). Après l'envoi à la plateforme agréée, chaque statut s'affiche sur une frise.",
      bullets: [
        "Émission bloquée tant qu'une donnée obligatoire manque",
        "Statuts déposée, approuvée, refusée, encaissée…",
        "Correction par avoir, comme le prévoit la loi",
      ],
      image: {
        src: "/screenshots/invoice-lifecycle.jpg",
        alt: "Fiche d'une situation émise : statuts payée et encaissée, et frise du cycle de vie de la facture électronique.",
        width: 2880,
        height: 1800,
        device: "desktop",
      },
    },
    {
      id: "factures-recues",
      kicker: "Factures reçues",
      title: "Toutes vos factures fournisseurs au même endroit",
      text: "Grossistes, loueurs de matériel, sous-traitants : leurs factures arrivent par la plateforme agréée. Vous les approuvez, les refusez avec un motif ou signalez un litige, et vous les rattachez à un chantier.",
      bullets: [
        "Boîte de réception avec filtre « à traiter »",
        "Motif de refus transmis au fournisseur",
        "Achats suivis par chantier",
      ],
      image: {
        src: "/screenshots/received-inbox.jpg",
        alt: "Boîte de réception des factures fournisseurs avec statuts et montants.",
        width: 2880,
        height: 1800,
        device: "desktop",
      },
    },
    {
      id: "encaissements",
      kicker: "Encaissements et retenues",
      title: "Sachez qui vous doit quoi, et quand récupérer vos retenues",
      text: "Par chantier : montant du marché, avancement facturé, reste à encaisser et retenue de garantie, avec sa date de libération un an après la réception.",
      bullets: [
        "Factures en retard mises en évidence",
        "Retenues libérables signalées au tableau de bord",
        "Paiements enregistrés, encaissement déclaré",
      ],
      image: {
        src: "/screenshots/worksite.jpg",
        alt: "Fiche chantier : montant du marché, avancement facturé, reste à encaisser, retenue de garantie et situations.",
        width: 2880,
        height: 1800,
        device: "desktop",
      },
    },
    {
      id: "equipe",
      kicker: "Équipe et multi-entreprises",
      title: "Le patron, le conducteur de travaux et l'assistante, chacun son rôle",
      text: "Invitez votre équipe avec le bon niveau d'accès, et passez d'une entreprise à l'autre si vous en gérez plusieurs.",
      bullets: [
        "Rôles propriétaire, administrateur, membre",
        "Plusieurs entreprises sur un même compte",
        "Accès expert-comptable [À CONFIRMER]",
      ],
      icon: "users",
    },
  ] satisfies Feature[],
};

/** Bandeau d'appel intermédiaire (après les fonctionnalités). */
export const midCta = {
  title: "Votre prochaine situation, en quelques minutes",
  text: "Saisissez l'avancement depuis le chantier, le calcul est fait.",
} as const;

/** Garanties : uniquement ce que le produit fait réellement. */
export const guarantees = {
  title: "Des factures conformes, sans y penser",
  highlight: "Mentions obligatoires intégrées",
  items: [
    {
      icon: "shield",
      title: "Contrôle avant émission",
      text: "SIREN, adresse, TVA, échéance, mentions : l'émission est bloquée tant qu'il manque une donnée obligatoire.",
    },
    {
      icon: "hash",
      title: "Numérotation continue",
      text: "Numéro attribué à l'émission, séquence sans trou, série distincte pour les avoirs.",
    },
    {
      icon: "lock",
      title: "Facture figée après émission",
      text: "Une facture émise ne se modifie plus : les données du vendeur et du client sont figées.",
    },
    {
      icon: "undo",
      title: "Correction par avoir",
      text: "Erreur ou refus du client : un avoir annule la facture, comme le prévoit la réglementation.",
    },
    {
      icon: "percent",
      title: "TVA du bâtiment",
      text: "Taux réduits, autoliquidation en sous-traitance avec la mention de l'article 283-2 nonies du CGI.",
    },
    {
      icon: "hard-hat",
      title: "Assurance décennale",
      text: "Assureur, numéro de contrat et couverture repris sur chaque devis et chaque facture.",
    },
  ],
} as const;

export const steps = {
  title: "Comment ça marche",
  intro:
    "Trois étapes, du premier devis à l'encaissement. Chaque document repart du précédent : rien n'est ressaisi.",
  items: [
    {
      title: "Créez votre entreprise",
      text: "SIREN, SIRET et TVA vérifiés à la saisie, assurance décennale et mentions légales renseignées une fois pour toutes.",
      visual: {
        kind: "checklist",
        heading: "Fiche entreprise",
        rows: [
          "SIREN et SIRET vérifiés",
          "N° de TVA intracommunautaire",
          "Assurance décennale",
          "Mentions légales",
        ],
      },
    },
    {
      title: "Faites vos devis, puis vos situations",
      text: "Le devis accepté devient votre marché : chaque situation repart du cumul précédent.",
      visual: {
        kind: "progress",
        heading: "Avancement cumulé du marché",
        rows: [
          { label: "Situation 1", percent: 30 },
          { label: "Situation 2", percent: 65 },
          { label: "Situation 3", percent: 100 },
        ],
      },
    },
    {
      title: "Émettez, suivez, encaissez",
      text: "La facture part vers votre plateforme agréée ; vous suivez son statut jusqu'au paiement.",
      visual: {
        kind: "lifecycle",
        heading: "Suivi de la facture",
        rows: ["Déposée", "Approuvée", "Encaissée"],
      },
    },
  ],
} as const;

export const trades = {
  title: "Pour les entreprises du second œuvre",
  intro:
    "De 5 à 50 salariés, en direct ou en sous-traitance. Choisissez votre métier : voici un extrait de devis tel que vous le ferez.",
  exampleLabel: "Extrait de devis",
  items: [
    {
      icon: "zap",
      name: "Électricité",
      text: "Situations par lot sur un programme de logements, autoliquidation en sous-traitance d'une entreprise générale.",
      lines: [
        {
          label: "Tableau de répartition logement T3",
          quantity: "24",
          unit: "u",
          vat: "Autoliquidation",
        },
        {
          label: "Colonne montante en gaine palière",
          quantity: "48",
          unit: "ml",
          vat: "Autoliquidation",
        },
        {
          label: "Éclairage des parties communes",
          quantity: "1",
          unit: "forfait",
          vat: "Autoliquidation",
        },
      ],
      handles: [
        "Situations par lot",
        "Autoliquidation en sous-traitance",
        "Retenue de garantie de 5 %",
      ],
    },
    {
      icon: "droplets",
      name: "Plomberie-chauffage",
      text: "Devis avec fourniture et pose à des taux de TVA différents, acompte à la commande.",
      lines: [
        { label: "Pompe à chaleur air/eau 8 kW", quantity: "1", unit: "u", vat: "5,5 %" },
        { label: "Pose et mise en service", quantity: "1", unit: "forfait", vat: "5,5 %" },
        { label: "Remplacement du ballon d'eau chaude", quantity: "1", unit: "u", vat: "10 %" },
      ],
      handles: [
        "Plusieurs taux de TVA sur un même devis",
        "Fourniture et pose distinctes",
        "Acompte à la commande",
      ],
    },
    {
      icon: "hammer",
      name: "Menuiserie-agencement",
      text: "Agencement sur mesure facturé à l'avancement de l'atelier et de la pose.",
      lines: [
        {
          label: "Fabrication en atelier, cuisine sur mesure",
          quantity: "1",
          unit: "forfait",
          vat: "10 %",
        },
        { label: "Plan de travail stratifié", quantity: "4,2", unit: "ml", vat: "10 %" },
        { label: "Pose sur site", quantity: "3", unit: "jours", vat: "10 %" },
      ],
      handles: ["Facturation à l'avancement", "Atelier puis pose", "Acompte à la commande"],
    },
    {
      icon: "paintbrush",
      name: "Peinture",
      text: "Métrés au m² sur plusieurs logements, situations mensuelles et retenue de garantie.",
      lines: [
        { label: "Préparation des supports et enduit", quantity: "1 240", unit: "m²", vat: "10 %" },
        { label: "Peinture des murs, deux couches", quantity: "1 240", unit: "m²", vat: "10 %" },
        { label: "Peinture des plafonds", quantity: "410", unit: "m²", vat: "10 %" },
      ],
      handles: ["Métrés au m²", "Situations mensuelles", "Retenue de garantie"],
    },
    {
      icon: "layers",
      name: "Plâtrerie",
      text: "Lots cloisons, doublages et faux plafonds, suivis chantier par chantier.",
      lines: [
        { label: "Cloisons de distribution 72/48", quantity: "860", unit: "m²", vat: "20 %" },
        { label: "Doublage isolant des murs extérieurs", quantity: "640", unit: "m²", vat: "20 %" },
        { label: "Faux plafonds en plaques", quantity: "320", unit: "m²", vat: "20 %" },
      ],
      handles: [
        "Lots cloisons, doublages, plafonds",
        "Situations par lot",
        "Suivi chantier par chantier",
      ],
    },
  ],
} as const;

export const pricing = {
  id: "tarifs",
  title: "Tarifs",
  intro: "Offres en cours de définition. [À DÉFINIR]",
  plans: [
    {
      name: "Essentiel",
      price: "[À DÉFINIR]",
      audience: "Artisan seul ou petite équipe",
      features: ["Devis et factures", "Factures fournisseurs reçues", "[À DÉFINIR]"],
      highlighted: false,
    },
    {
      name: "Pro",
      price: "[À DÉFINIR]",
      audience: "PME du second œuvre",
      features: [
        "Situations et retenue de garantie",
        "Autoliquidation en sous-traitance",
        "Équipe",
        "[À DÉFINIR]",
      ],
      highlighted: true,
    },
    {
      name: "Entreprise",
      price: "[À DÉFINIR]",
      audience: "Jusqu'à 50 salariés, plusieurs entreprises",
      features: ["Plusieurs entreprises", "Accès expert-comptable", "[À DÉFINIR]"],
      highlighted: false,
    },
  ],
  note: "Prix hors taxes. Conditions d'essai et d'engagement [À CONFIRMER].",
} as const;

export const faq = {
  id: "faq",
  title: "Questions fréquentes",
  items: [
    {
      q: "Suis-je concerné par la facture électronique, et quand ?",
      a: "Toutes les entreprises assujetties à la TVA doivent pouvoir recevoir des factures électroniques depuis le 1er septembre 2026. Les TPE et PME devront en émettre à partir du 1er septembre 2027. Les ventes aux particuliers ne sont pas des factures électroniques : leurs données sont transmises par e-reporting.",
    },
    {
      q: `${PRODUCT_NAME} est-il une plateforme agréée ?`,
      a: `Non. ${PRODUCT_NAME} est un logiciel de devis et de facturation qui se connecte à une plateforme agréée par l'État. C'est la plateforme qui transmet vos factures à vos clients et les données à l'administration.`,
    },
    {
      q: "Quelle plateforme agréée vais-je utiliser ?",
      a: "La ou les plateformes partenaires ne sont pas encore choisies. [À CONFIRMER] La liste officielle des plateformes agréées est publiée sur impots.gouv.fr.",
    },
    {
      q: "Le logiciel gère-t-il l'autoliquidation en sous-traitance ?",
      a: "Oui. Sur un chantier en sous-traitance, les devis et factures sont établis sans TVA, avec la mention de l'article 283-2 nonies du CGI, et le numéro de TVA de votre client est contrôlé avant l'émission.",
    },
    {
      q: "Comment est calculée la retenue de garantie ?",
      a: "Le taux est paramétrable par chantier, dans la limite légale de 5 %. La retenue est déduite de chaque situation et le logiciel vous signale quand elle devient récupérable, un an après la réception des travaux. Elle peut être remplacée par une caution bancaire.",
    },
    {
      q: "Puis-je l'utiliser sur téléphone, sur chantier ?",
      a: "Oui. Toutes les pages s'adaptent au téléphone : consulter un chantier, saisir l'avancement d'une situation ou approuver une facture fournisseur.",
    },
    {
      q: "Où sont hébergées mes données ?",
      a: "Hébergement et sauvegardes [À CONFIRMER].",
    },
    {
      q: "Y a-t-il un engagement ? Puis-je récupérer mes données ?",
      a: "Durée d'engagement et modalités d'export [À CONFIRMER].",
    },
  ],
};

export const finalCta = {
  title: "Prêt à facturer vos chantiers sans tableur ?",
  text: "Créez votre compte et faites votre premier devis en quelques minutes.",
  note: "Sans carte bancaire [À CONFIRMER]",
} as const;

/** Témoignages réels uniquement. Liste vide : la section ne s'affiche pas. */
export const testimonials: { quote: string; name: string; role: string; company: string }[] = [];

export const footer = {
  tagline: `${PRODUCT_NAME} — devis et factures de situation pour le second œuvre.`,
  columns: [
    {
      title: "Produit",
      links: [
        { href: "/#fonctionnalites", label: "Fonctionnalités" },
        { href: "/#facture-electronique", label: "Facture électronique" },
        { href: "/#tarifs", label: "Tarifs" },
      ],
    },
    {
      title: "Ressources",
      links: [
        { href: "/#faq", label: "Questions fréquentes" },
        { href: "OFFICIAL_PLATFORMS", label: "Liste officielle des plateformes agréées" },
      ],
    },
    {
      title: "Légal",
      links: [
        { href: routes.legalNotice, label: "Mentions légales" },
        { href: routes.terms, label: "Conditions générales d'utilisation" },
        { href: routes.privacy, label: "Confidentialité" },
        { href: routes.contact, label: "Contact" },
      ],
    },
  ],
};

export const legalPages = {
  "mentions-legales": {
    title: "Mentions légales",
    description: "Éditeur, hébergeur et directeur de la publication du site.",
  },
  cgu: {
    title: "Conditions générales d'utilisation",
    description: "Conditions d'utilisation du service.",
  },
  confidentialite: {
    title: "Politique de confidentialité",
    description: "Données collectées, finalités, durées de conservation et droits des personnes.",
  },
  contact: { title: "Contact", description: "Nous écrire ou nous appeler." },
} as const;
