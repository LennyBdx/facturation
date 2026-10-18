/**
 * Données fictives de référence : entreprises, équipe, clients, chantiers, devis.
 * Noms, adresses, SIREN, IBAN et e-mails sont inventés (domaines `.example`).
 */
import type { Client, Invitation, Membership, Organization, Quote, User, Worksite } from "../types";
import { address, at, company, line, mockId, section } from "./helpers";

export const ORG_VOLTA = "org-volta";
export const ORG_CHENE = "org-chene";
export const CURRENT_USER_ID = "usr-julien";

// --- Entreprises -------------------------------------------------------------

const volta = company("84213657");
const chene = company("90137425");

export const organizations: Organization[] = [
  {
    id: ORG_VOLTA,
    name: "Volta Énergies Rhône",
    legalForm: "SAS",
    shareCapital: "50000.00",
    ...volta,
    apeCode: "4321A",
    registration: "RCS Lyon",
    address: address("18 rue de Gerland", "69007", "Lyon"),
    contact: { email: "contact@volta-energies.example", phone: "04 78 00 12 34", website: "volta-energies.example" },
    activity: "Électricité générale — courants forts et faibles",
    decennialInsurance: {
      insurer: "Mutuelle Fictive du Bâtiment",
      policyNumber: "DEC-2026-48213",
      coverageArea: "France métropolitaine",
    },
    bank: { iban: "FR76 3000 4000 0500 0012 3456 789", bic: "FICTFRPPXXX" },
    settings: {
      numbering: {
        quote: { prefix: "DEV", nextValue: 1, padding: 4 },
        invoice: { prefix: "FA", nextValue: 1, padding: 4 },
        creditNote: { prefix: "AV", nextValue: 1, padding: 4 },
      },
      defaultPaymentTermsDays: 30,
      paymentTermsLabel: "Paiement à 30 jours date de facture, par virement.",
      latePenaltyRate: "12.00",
      defaultRetentionRate: "5.00",
      defaultDepositPercent: "30.00",
      defaultQuoteValidityDays: 60,
      customLegalMentions: "Pas d'escompte pour paiement anticipé.",
      branding: { logoUrl: null, accentColor: "#1e3a5f" },
      eInvoicing: {
        platformId: "pa-alpha",
        connectionStatus: "connected",
        receptionAddress: `${volta.siren}_FACTURES`,
        connectedAt: at("2026-06-02"),
      },
      plan: "pro",
    },
    createdAt: at("2026-03-01"),
  },
  {
    id: ORG_CHENE,
    name: "Chêne & Fil Agencement",
    legalForm: "SARL",
    shareCapital: "15000.00",
    ...chene,
    apeCode: "4332A",
    registration: "RCS Annecy",
    address: address("7 impasse des Charpentiers", "74000", "Annecy"),
    contact: { email: "bonjour@chene-fil.example", phone: "04 50 00 56 78" },
    activity: "Menuiserie et agencement intérieur",
    decennialInsurance: {
      insurer: "Assurances Fictives des Artisans",
      policyNumber: "RCD-74-55102",
      coverageArea: "Auvergne-Rhône-Alpes",
    },
    bank: { iban: "FR76 1000 7000 0200 0098 7654 321", bic: "FICTFRPPANN" },
    settings: {
      numbering: {
        quote: { prefix: "D", nextValue: 1, padding: 4 },
        invoice: { prefix: "F", nextValue: 1, padding: 4 },
        creditNote: { prefix: "AV", nextValue: 1, padding: 4 },
      },
      defaultPaymentTermsDays: 30,
      paymentTermsLabel: "Paiement à 30 jours date de facture, par virement ou chèque.",
      latePenaltyRate: "10.00",
      defaultRetentionRate: "5.00",
      defaultDepositPercent: "30.00",
      defaultQuoteValidityDays: 30,
      customLegalMentions: "",
      branding: { logoUrl: null, accentColor: "#7c4a1e" },
      eInvoicing: { platformId: "pa-beta", connectionStatus: "pending", receptionAddress: null, connectedAt: null },
      plan: "essentiel",
    },
    createdAt: at("2026-04-15"),
  },
];

// --- Équipe ------------------------------------------------------------------

export const users: User[] = [
  { id: CURRENT_USER_ID, firstName: "Julien", lastName: "Morel", email: "julien.morel@volta-energies.example", phone: "06 00 00 11 22", jobTitle: "Gérant" },
  { id: "usr-sophie", firstName: "Sophie", lastName: "Lambert", email: "sophie.lambert@volta-energies.example", jobTitle: "Assistante administrative" },
  { id: "usr-karim", firstName: "Karim", lastName: "Benali", email: "karim.benali@volta-energies.example", jobTitle: "Conducteur de travaux" },
  { id: "usr-nadia", firstName: "Nadia", lastName: "Roux", email: "nadia.roux@chene-fil.example", jobTitle: "Gérante" },
  { id: "usr-hugo", firstName: "Hugo", lastName: "Meyer", email: "hugo.meyer@chene-fil.example", jobTitle: "Chef d'atelier" },
];

export const memberships: Membership[] = [
  { id: "mbr-1", organizationId: ORG_VOLTA, userId: CURRENT_USER_ID, role: "owner", joinedAt: at("2026-03-01") },
  { id: "mbr-2", organizationId: ORG_VOLTA, userId: "usr-sophie", role: "admin", joinedAt: at("2026-03-02") },
  { id: "mbr-3", organizationId: ORG_VOLTA, userId: "usr-karim", role: "member", joinedAt: at("2026-03-10") },
  { id: "mbr-4", organizationId: ORG_CHENE, userId: "usr-nadia", role: "owner", joinedAt: at("2026-04-15") },
  { id: "mbr-5", organizationId: ORG_CHENE, userId: CURRENT_USER_ID, role: "admin", joinedAt: at("2026-04-16") },
  { id: "mbr-6", organizationId: ORG_CHENE, userId: "usr-hugo", role: "member", joinedAt: at("2026-05-01") },
];

export const invitations: Invitation[] = [
  {
    id: "inv-1",
    organizationId: ORG_VOLTA,
    email: "compta@cabinet-exemple.example",
    role: "member",
    invitedByUserId: CURRENT_USER_ID,
    createdAt: at("2026-10-14"),
    expiresAt: at("2026-10-21"),
  },
  {
    id: "inv-2",
    organizationId: ORG_VOLTA,
    email: "chef.equipe@volta-energies.example",
    role: "member",
    invitedByUserId: "usr-sophie",
    createdAt: at("2026-10-16"),
    expiresAt: at("2026-10-23"),
  },
  {
    id: "inv-3",
    organizationId: ORG_CHENE,
    email: "poseur@chene-fil.example",
    role: "member",
    invitedByUserId: "usr-nadia",
    createdAt: at("2026-10-10"),
    expiresAt: at("2026-10-17"),
  },
];

// --- Clients -----------------------------------------------------------------

function client(
  organizationId: string,
  id: string,
  kind: Client["kind"],
  name: string,
  sirenBase: string | null,
  addr: Client["billingAddress"],
  contact: Client["contact"],
  extra: Partial<Client> = {},
): Client {
  const ids = sirenBase ? company(sirenBase) : {};
  return {
    id,
    organizationId,
    kind,
    name,
    ...ids,
    billingAddress: addr,
    contact,
    paymentTermsDays: kind === "public_buyer" ? 30 : kind === "general_contractor" ? 45 : 30,
    createdAt: at("2026-03-15"),
    ...extra,
  };
}

export const clients: Client[] = [
  // Volta Énergies Rhône
  client(ORG_VOLTA, "cli-batir", "general_contractor", "Bâtir Rhône Construction", "79254183", address("45 quai Perrache", "69002", "Lyon"), { name: "Marc Delorme", email: "m.delorme@batir-rhone.example", phone: "04 72 00 45 67" }),
  client(ORG_VOLTA, "cli-terrasses", "private_owner", "SCCV Les Terrasses du Parc", "88361420", address("2 place Bellecour", "69002", "Lyon"), { name: "Élodie Vasseur", email: "e.vasseur@terrasses-parc.example" }),
  client(ORG_VOLTA, "cli-sci-exupery", "private_owner", "SCI Saint-Exupéry", "81730295", address("110 cours Lafayette", "69003", "Lyon"), { name: "Paul Garnier", email: "gestion@sci-exupery.example", phone: "04 78 00 98 76" }),
  client(ORG_VOLTA, "cli-belleroche", "public_buyer", "Commune de Belleroche-sur-Saône", "21690901", address("Place de la Mairie", "69650", "Belleroche-sur-Saône"), { name: "Services techniques", email: "st@belleroche.example", phone: "04 74 00 10 20" }, { vatNumber: undefined }),
  client(ORG_VOLTA, "cli-hopital", "public_buyer", "Centre hospitalier de Vaugneray-le-Haut", "26690417", address("5 route du Pilat", "69670", "Vaugneray-le-Haut"), { name: "Direction des travaux", email: "travaux@ch-vaugneray.example" }, { serviceCode: "SERV-TRAVAUX-02", vatNumber: undefined }),
  client(ORG_VOLTA, "cli-cedre", "private_owner", "Hôtel Le Cèdre Bleu", null, address("27 montée Saint-Barthélemy", "69005", "Lyon"), { name: "Inès Carrel", email: "direction@cedre-bleu.example", phone: "04 78 00 33 44" }, { notes: "SIREN à demander au client (nécessaire pour la facture électronique)." }),
  client(ORG_VOLTA, "cli-fournil", "private_owner", "Le Fournil des Pentes", "90512736", address("9 rue des Tables-Claudiennes", "69001", "Lyon"), { name: "Antoine Brun", phone: "04 78 00 76 54" }),
  client(ORG_VOLTA, "cli-construire", "general_contractor", "Construire Ensemble Alpes", "75938104", address("31 avenue de la République", "38000", "Grenoble"), { name: "Sandrine Mercier", email: "s.mercier@construire-ensemble.example" }),
  client(ORG_VOLTA, "cli-renov", "general_contractor", "Rénov'Habitat Lyonnais", "83049571", address("14 rue Garibaldi", "69006", "Lyon"), { name: "Yanis Chevalier", email: "y.chevalier@renov-habitat.example", phone: "06 00 00 45 12" }),
  client(ORG_VOLTA, "cli-durand", "individual", "Pierre et Anne Durand", null, address("6 chemin des Vignes", "69760", "Limonest"), { email: "durand.famille@mail.example", phone: "06 00 00 98 01" }, { paymentTermsDays: 15 }),
  client(ORG_VOLTA, "cli-fontaine", "individual", "Léa Fontaine", null, address("52 rue Duguesclin", "69006", "Lyon"), { email: "lea.fontaine@mail.example" }, { paymentTermsDays: 0 }),
  client(ORG_VOLTA, "cli-girard", "individual", "Thomas Girard", null, address("3 allée des Tilleuls", "69130", "Écully"), { phone: "06 00 00 22 33" }, { paymentTermsDays: 15 }),
  // Chêne & Fil Agencement
  client(ORG_CHENE, "cli-maisons-alpines", "general_contractor", "Maisons Alpines Construction", "80624197", address("120 avenue de Genève", "74000", "Annecy"), { name: "Luc Bernard", email: "l.bernard@maisons-alpines.example" }),
  client(ORG_CHENE, "cli-edelweiss", "private_owner", "Restaurant L'Edelweiss", "91846302", address("4 quai de l'Île", "74000", "Annecy"), { name: "Camille Favre", email: "camille@edelweiss.example", phone: "04 50 00 12 12" }),
  client(ORG_CHENE, "cli-perrin", "individual", "Julien Perrin", null, address("18 route du Semnoz", "74600", "Seynod"), { email: "j.perrin@mail.example" }, { paymentTermsDays: 15 }),
  client(ORG_CHENE, "cli-saint-ferreol", "public_buyer", "Commune de Saint-Ferréol-des-Lacs", "21740902", address("1 place de l'Église", "74210", "Saint-Ferréol-des-Lacs"), { name: "Secrétariat de mairie", email: "mairie@saint-ferreol.example" }, { vatNumber: undefined }),
];

// --- Chantiers ---------------------------------------------------------------

function worksite(w: Omit<Worksite, "createdAt" | "retentionReplacedByBond" | "retentionReleased"> & Partial<Worksite>): Worksite {
  return { retentionReplacedByBond: false, retentionReleased: false, createdAt: at(w.startDate), ...w };
}

export const worksites: Worksite[] = [
  worksite({ id: "ws-terrasses", organizationId: ORG_VOLTA, clientId: "cli-batir", reference: "CH-2026-001", name: "Résidence Les Terrasses du Parc — 24 logements", address: address("Rue Pierre-Delore", "69008", "Lyon"), startDate: "2026-05-18", endDate: "2027-02-26", status: "in_progress", contractAmount: "0.00", marketReference: "BRC-ST-2026-118", isSubcontracting: true, reverseCharge: true, retentionRate: "5.00" }),
  worksite({ id: "ws-ecole", organizationId: ORG_VOLTA, clientId: "cli-belleroche", reference: "CH-2026-002", name: "École Jules-Ferry — rénovation électrique", address: address("12 rue des Écoles", "69650", "Belleroche-sur-Saône"), startDate: "2026-06-22", endDate: "2026-11-27", status: "in_progress", contractAmount: "0.00", marketReference: "MAPA-2026-07", isSubcontracting: false, reverseCharge: false, retentionRate: "5.00" }),
  worksite({ id: "ws-cedre", organizationId: ORG_VOLTA, clientId: "cli-cedre", reference: "CH-2026-003", name: "Hôtel Le Cèdre Bleu — rénovation de 18 chambres", address: address("27 montée Saint-Barthélemy", "69005", "Lyon"), startDate: "2026-07-20", endDate: "2026-12-18", status: "in_progress", contractAmount: "0.00", isSubcontracting: false, reverseCharge: false, retentionRate: "5.00" }),
  worksite({ id: "ws-durand", organizationId: ORG_VOLTA, clientId: "cli-durand", reference: "CH-2026-004", name: "Maison Durand — rénovation électrique complète", address: address("6 chemin des Vignes", "69760", "Limonest"), startDate: "2026-05-11", endDate: "2026-07-17", status: "completed", contractAmount: "0.00", isSubcontracting: false, reverseCharge: false, retentionRate: "0.00", acceptanceDate: "2026-07-17" }),
  worksite({ id: "ws-fournil", organizationId: ORG_VOLTA, clientId: "cli-fournil", reference: "CH-2026-005", name: "Le Fournil des Pentes — mise aux normes", address: address("9 rue des Tables-Claudiennes", "69001", "Lyon"), startDate: "2026-08-10", endDate: "2026-08-19", status: "completed", contractAmount: "0.00", isSubcontracting: false, reverseCharge: false, retentionRate: "0.00", acceptanceDate: "2026-08-19" }),
  worksite({ id: "ws-exupery", organizationId: ORG_VOLTA, clientId: "cli-sci-exupery", reference: "CH-2026-006", name: "Bureaux Saint-Exupéry — plateau R+2", address: address("110 cours Lafayette", "69003", "Lyon"), startDate: "2026-10-05", endDate: "2027-01-29", status: "in_progress", contractAmount: "0.00", marketReference: "BC-EXU-2026-014", isSubcontracting: false, reverseCharge: false, retentionRate: "5.00" }),
  worksite({ id: "ws-hopital", organizationId: ORG_VOLTA, clientId: "cli-hopital", reference: "CH-2026-007", name: "Centre hospitalier — éclairage du parking", address: address("5 route du Pilat", "69670", "Vaugneray-le-Haut"), startDate: "2026-11-16", endDate: "2027-01-15", status: "planned", contractAmount: "0.00", marketReference: "MAPA-CH-2026-031", isSubcontracting: false, reverseCharge: false, retentionRate: "5.00" }),
  worksite({ id: "ws-vergers", organizationId: ORG_VOLTA, clientId: "cli-construire", reference: "CH-2025-009", name: "Lotissement Les Vergers — réseaux électriques", address: address("Chemin des Vergers", "38330", "Montbonnot"), startDate: "2025-04-07", endDate: "2025-09-26", status: "completed", contractAmount: "0.00", marketReference: "CEA-LV-2025-03", isSubcontracting: true, reverseCharge: true, retentionRate: "5.00", acceptanceDate: "2025-10-15" }),
  worksite({ id: "ws-edelweiss", organizationId: ORG_CHENE, clientId: "cli-edelweiss", reference: "CH-2026-01", name: "Restaurant L'Edelweiss — agencement de la salle", address: address("4 quai de l'Île", "74000", "Annecy"), startDate: "2026-08-24", endDate: "2026-11-13", status: "in_progress", contractAmount: "0.00", isSubcontracting: false, reverseCharge: false, retentionRate: "5.00" }),
  worksite({ id: "ws-perrin", organizationId: ORG_CHENE, clientId: "cli-perrin", reference: "CH-2026-02", name: "Maison Perrin — escalier et dressing", address: address("18 route du Semnoz", "74600", "Seynod"), startDate: "2026-06-08", endDate: "2026-07-03", status: "closed", contractAmount: "0.00", isSubcontracting: false, reverseCharge: false, retentionRate: "0.00", acceptanceDate: "2026-07-03" }),
  worksite({ id: "ws-clos-aravis", organizationId: ORG_CHENE, clientId: "cli-maisons-alpines", reference: "CH-2026-03", name: "Le Clos des Aravis — menuiseries intérieures lot 4", address: address("Route des Aravis", "74230", "Thônes"), startDate: "2026-11-02", status: "planned", contractAmount: "0.00", marketReference: "MAC-CA-L4", isSubcontracting: true, reverseCharge: true, retentionRate: "5.00" }),
];

// --- Devis -------------------------------------------------------------------

function quote(q: Omit<Quote, "id" | "number" | "createdAt" | "updatedAt" | "discount" | "reverseCharge" | "depositPercent"> & Partial<Quote>): Quote {
  return {
    id: mockId("quo"),
    number: "",
    discount: { kind: "none" },
    reverseCharge: false,
    depositPercent: "0.00",
    createdAt: at(q.issueDate),
    updatedAt: at(q.issueDate),
    ...q,
  };
}

export const quotes = {
  terrasses: quote({
    organizationId: ORG_VOLTA, clientId: "cli-batir", worksiteId: "ws-terrasses", status: "accepted",
    title: "Électricité — Résidence Les Terrasses du Parc (24 logements)", issueDate: "2026-04-20", validUntil: "2026-06-19",
    sentAt: at("2026-04-20"), decidedAt: at("2026-05-04"), reverseCharge: true, estimatedDuration: "9 mois",
    sections: [
      section("Lot 1 — Courants forts parties communes", [
        line("Tableau général basse tension (TGBT) 400 A", "1", "u", "8450.00"),
        line("Colonnes montantes électriques", "4", "u", "3200.00"),
        line("Éclairage des parties communes LED avec détecteurs", "96", "u", "85.00"),
      ]),
      section("Lot 2 — Logements (24 T2 à T4)", [
        line("Équipement électrique logement complet NF C 15-100", "24", "u", "4350.00"),
        line("Gaines techniques logement (GTL) et tableaux de communication", "24", "u", "390.00"),
      ]),
      section("Lot 3 — Courants faibles", [
        line("Visiophonie et contrôle d'accès", "1", "forfait", "6900.00"),
        line("Câblage fibre optique FTTH", "24", "u", "260.00"),
      ]),
    ],
  }),
  ecole: quote({
    organizationId: ORG_VOLTA, clientId: "cli-belleroche", worksiteId: "ws-ecole", status: "accepted",
    title: "Rénovation électrique de l'école Jules-Ferry", issueDate: "2026-05-12", validUntil: "2026-07-11",
    sentAt: at("2026-05-12"), decidedAt: at("2026-06-01"), estimatedDuration: "5 mois (hors temps scolaire)",
    sections: [
      section("Dépose et préparation", [line("Dépose de l'installation existante et évacuation", "1", "forfait", "3800.00")]),
      section("Distribution et éclairage", [
        line("Tableaux divisionnaires", "6", "u", "1250.00"),
        line("Luminaires LED pour salles de classe", "140", "u", "165.00"),
        line("Éclairage de sécurité (BAES)", "45", "u", "120.00"),
        line("Prises et circuits dédiés au numérique", "1", "forfait", "9800.00"),
      ]),
    ],
  }),
  cedre: quote({
    organizationId: ORG_VOLTA, clientId: "cli-cedre", worksiteId: "ws-cedre", status: "accepted",
    title: "Rénovation électrique de 18 chambres et des circulations", issueDate: "2026-06-15", validUntil: "2026-08-14",
    sentAt: at("2026-06-15"), decidedAt: at("2026-07-02"), discount: { kind: "percent", value: "5.00" }, depositPercent: "30.00",
    sections: [
      section("Chambres", [
        line("Rénovation électrique d'une chambre (prises, éclairage, commandes)", "18", "u", "2150.00"),
        line("Têtes de lit avec liseuses et prises USB", "18", "u", "340.00"),
      ]),
      section("Parties communes", [
        line("Éclairage LED des couloirs", "1", "forfait", "7450.00"),
        line("Adaptation du système de sécurité incendie (SSI)", "1", "forfait", "5900.00"),
      ]),
    ],
  }),
  durand: quote({
    organizationId: ORG_VOLTA, clientId: "cli-durand", worksiteId: "ws-durand", status: "accepted",
    title: "Rénovation électrique complète de la maison", issueDate: "2026-04-14", validUntil: "2026-06-13",
    sentAt: at("2026-04-14"), decidedAt: at("2026-04-28"), depositPercent: "30.00", estimatedDuration: "10 semaines",
    notes: "Logement achevé depuis plus de 2 ans : TVA à 10 % sur les travaux (attestation fournie par le client).",
    sections: [
      section("Installation", [
        line("Mise en sécurité et remplacement du tableau électrique", "1", "forfait", "2450.00", "10.00"),
        line("Réfection complète des circuits prises et éclairage", "1", "forfait", "6800.00", "10.00"),
        line("Radiateurs à inertie, pose et raccordement", "6", "u", "690.00", "10.00"),
        line("VMC hygroréglable, pose et raccordement", "1", "u", "1150.00", "10.00"),
      ]),
      section("Fournitures seules", [line("Sèche-serviettes (fourniture seule, posé par le client)", "1", "u", "520.00", "20.00")]),
    ],
  }),
  fournil: quote({
    organizationId: ORG_VOLTA, clientId: "cli-fournil", worksiteId: "ws-fournil", status: "accepted",
    title: "Mise aux normes de l'installation du fournil", issueDate: "2026-07-22", validUntil: "2026-08-21",
    sentAt: at("2026-07-22"), decidedAt: at("2026-07-30"),
    sections: [
      section("Travaux", [
        line("Mise aux normes du tableau électrique", "1", "forfait", "1890.00"),
        line("Alimentation du four en triphasé 32 A", "1", "u", "980.00"),
        line("Éclairage LED étanche IP65 du laboratoire", "8", "u", "145.00"),
      ]),
    ],
  }),
  exupery: quote({
    organizationId: ORG_VOLTA, clientId: "cli-sci-exupery", worksiteId: "ws-exupery", status: "accepted",
    title: "Aménagement électrique du plateau de bureaux R+2", issueDate: "2026-08-25", validUntil: "2026-10-24",
    sentAt: at("2026-08-25"), decidedAt: at("2026-09-08"), depositPercent: "20.00",
    sections: [
      section("Courants forts", [
        line("Distribution électrique du plateau", "450", "m²", "68.00"),
        line("Dalles LED 600×600 pilotées DALI", "120", "u", "175.00"),
      ]),
      section("Courants faibles", [line("Baies de brassage et câblage catégorie 6A", "1", "forfait", "12400.00")]),
    ],
  }),
  hopital: quote({
    organizationId: ORG_VOLTA, clientId: "cli-hopital", worksiteId: "ws-hopital", status: "accepted",
    title: "Éclairage du parking visiteurs", issueDate: "2026-09-14", validUntil: "2026-11-13",
    sentAt: at("2026-09-14"), decidedAt: at("2026-10-06"),
    sections: [
      section("Éclairage extérieur", [
        line("Mâts d'éclairage 6 m avec luminaires LED", "22", "u", "1380.00"),
        line("Tranchées, fourreaux et câbles", "380", "ml", "42.00"),
        line("Armoire de commande avec horloge astronomique", "1", "u", "3450.00"),
      ]),
    ],
  }),
  vergers: quote({
    organizationId: ORG_VOLTA, clientId: "cli-construire", worksiteId: "ws-vergers", status: "accepted",
    title: "Réseaux électriques du lotissement Les Vergers", issueDate: "2025-03-10", validUntil: "2025-05-09",
    sentAt: at("2025-03-10"), decidedAt: at("2025-03-24"), reverseCharge: true,
    sections: [
      section("Réseaux", [
        line("Branchements individuels des lots", "18", "u", "1150.00"),
        line("Éclairage public de la voirie", "1", "forfait", "14300.00"),
      ]),
    ],
  }),
  renovCroixRousse: quote({
    organizationId: ORG_VOLTA, clientId: "cli-renov", worksiteId: null, status: "sent",
    title: "Rénovation électrique d'un appartement — Croix-Rousse", issueDate: "2026-10-12", validUntil: "2026-12-11",
    sentAt: at("2026-10-12"), reverseCharge: true,
    sections: [
      section("Appartement T3", [
        line("Remplacement du tableau électrique", "1", "u", "1350.00"),
        line("Réfection des circuits", "68", "m²", "48.00"),
      ]),
    ],
  }),
  bornesTerrasses: quote({
    organizationId: ORG_VOLTA, clientId: "cli-terrasses", worksiteId: null, status: "sent",
    title: "Bornes de recharge du parking résidentiel", issueDate: "2026-09-15", validUntil: "2026-11-14",
    sentAt: at("2026-09-15"),
    sections: [
      section("Infrastructure de recharge", [
        line("Borne de recharge 7,4 kW avec gestion de charge", "12", "u", "1290.00"),
        line("Pré-équipement des places (fourreaux et câblage)", "24", "u", "310.00"),
      ]),
    ],
  }),
  girardPac: quote({
    organizationId: ORG_VOLTA, clientId: "cli-girard", worksiteId: null, status: "sent",
    title: "Alimentation électrique d'une pompe à chaleur", issueDate: "2026-09-01", validUntil: "2026-10-31",
    sentAt: at("2026-09-01"),
    sections: [section("Travaux", [line("Ligne dédiée et protection pour pompe à chaleur", "1", "forfait", "890.00", "10.00")])],
  }),
  cedreJardin: quote({
    organizationId: ORG_VOLTA, clientId: "cli-cedre", worksiteId: null, status: "draft",
    title: "Éclairage du jardin et de la terrasse", issueDate: "2026-10-16", validUntil: "2026-12-15",
    sections: [
      section("Extérieurs", [
        line("Bornes d'éclairage extérieur", "14", "u", "260.00"),
        line("Guirlandes guinguette sur câble porteur", "40", "ml", "32.00"),
      ]),
    ],
  }),
  belleroheVideo: quote({
    organizationId: ORG_VOLTA, clientId: "cli-belleroche", worksiteId: null, status: "draft",
    title: "Vidéoprotection de la place du marché", issueDate: "2026-10-17", validUntil: "2026-12-16",
    sections: [section("Vidéoprotection", [line("Caméras dôme et mâts", "6", "u", "1850.00"), line("Enregistreur et paramétrage", "1", "forfait", "2400.00")])],
  }),
  fontaineSdb: quote({
    organizationId: ORG_VOLTA, clientId: "cli-fontaine", worksiteId: null, status: "refused",
    title: "Électricité de la salle de bains", issueDate: "2026-08-03", validUntil: "2026-09-02",
    sentAt: at("2026-08-03"), decidedAt: at("2026-08-20"), refusalReason: "Projet reporté à l'année prochaine.",
    sections: [section("Salle de bains", [line("Mise en conformité des volumes et liaison équipotentielle", "1", "forfait", "1180.00", "10.00")])],
  }),
  construirePres: quote({
    organizationId: ORG_VOLTA, clientId: "cli-construire", worksiteId: null, status: "expired",
    title: "Lotissement Les Prés — tranche 2", issueDate: "2026-06-02", validUntil: "2026-08-01",
    sentAt: at("2026-06-02"), reverseCharge: true,
    sections: [section("Réseaux", [line("Branchements individuels des lots", "12", "u", "1180.00")])],
  }),
  exuperyExterieur: quote({
    organizationId: ORG_VOLTA, clientId: "cli-sci-exupery", worksiteId: null, status: "expired",
    title: "Éclairage de la cour intérieure", issueDate: "2026-05-20", validUntil: "2026-07-19",
    sentAt: at("2026-05-20"),
    sections: [section("Extérieur", [line("Appliques murales LED détecteur", "10", "u", "210.00")])],
  }),
  // Chêne & Fil Agencement
  edelweiss: quote({
    organizationId: ORG_CHENE, clientId: "cli-edelweiss", worksiteId: "ws-edelweiss", status: "accepted",
    title: "Agencement de la salle du restaurant", issueDate: "2026-07-06", validUntil: "2026-08-05",
    sentAt: at("2026-07-06"), decidedAt: at("2026-07-27"), depositPercent: "30.00",
    sections: [
      section("Agencement", [
        line("Bar en chêne massif sur mesure", "1", "u", "14800.00"),
        line("Banquettes et habillages muraux", "1", "ens.", "9600.00"),
        line("Étagères et vitrine à vins", "1", "ens.", "6200.00"),
      ]),
    ],
  }),
  perrin: quote({
    organizationId: ORG_CHENE, clientId: "cli-perrin", worksiteId: "ws-perrin", status: "accepted",
    title: "Escalier quart tournant et dressing", issueDate: "2026-05-11", validUntil: "2026-06-10",
    sentAt: at("2026-05-11"), decidedAt: at("2026-05-20"),
    sections: [
      section("Menuiserie", [
        line("Escalier quart tournant en chêne, fourniture et pose", "1", "u", "7900.00", "10.00"),
        line("Dressing sur mesure, fourniture et pose", "1", "u", "3450.00", "10.00"),
      ]),
    ],
  }),
  closAravis: quote({
    organizationId: ORG_CHENE, clientId: "cli-maisons-alpines", worksiteId: "ws-clos-aravis", status: "sent",
    title: "Menuiseries intérieures — Le Clos des Aravis, lot 4", issueDate: "2026-10-01", validUntil: "2026-10-31",
    sentAt: at("2026-10-01"), reverseCharge: true,
    sections: [
      section("Menuiseries", [
        line("Blocs-portes intérieurs", "42", "u", "245.00"),
        line("Placards coulissants", "14", "u", "690.00"),
      ]),
    ],
  }),
  perrinBiblio: quote({
    organizationId: ORG_CHENE, clientId: "cli-perrin", worksiteId: null, status: "draft",
    title: "Bibliothèque sur mesure du salon", issueDate: "2026-10-15", validUntil: "2026-11-14",
    sections: [section("Agencement", [line("Bibliothèque en chêne avec niches éclairées", "1", "u", "4200.00", "10.00")])],
  }),
  edelweissTerrasse: quote({
    organizationId: ORG_CHENE, clientId: "cli-edelweiss", worksiteId: null, status: "refused",
    title: "Cuisine d'été de la terrasse", issueDate: "2026-07-06", validUntil: "2026-08-05",
    sentAt: at("2026-07-06"), decidedAt: at("2026-07-27"), refusalReason: "Budget alloué à l'agencement de la salle.",
    sections: [section("Terrasse", [line("Meuble de cuisine d'été en mélèze", "1", "ens.", "8900.00")])],
  }),
} satisfies Record<string, Quote>;

