/**
 * Assemblage du jeu de données fictives.
 * Les factures sont construites avec les mêmes fonctions que l'application
 * (`@/services/builders` → `@/domain`), donc leurs montants sont cohérents.
 * Les numéros sont attribués à la fin, par ordre chronologique, en séquence
 * continue par entreprise et par série.
 */
import { assignNextNumber } from "@/domain/numbering";
import type { Money } from "@/domain/money";
import { groupByVat, totalsOfBreakdown } from "@/domain/vat";
import { lineNet } from "@/domain/quote";
import {
  buildCreditNote,
  buildDepositInvoice,
  buildProgressInvoice,
  buildStandardInvoice,
  buyerSnapshot,
  depositNetForQuote,
  type InvoiceContent,
  quoteTotals,
  sellerSnapshot,
} from "@/services/builders";
import type { SeedData } from "../memory/store";
import type {
  Invoice,
  InvoiceInput,
  LifecycleEvent,
  Organization,
  PaymentMethod,
  Quote,
  ReceivedInvoice,
  ReceivedInvoiceLine,
  Unit,
} from "../types";
import {
  clients,
  invitations,
  memberships,
  ORG_CHENE,
  ORG_VOLTA,
  organizations as baseOrganizations,
  quotes,
  users,
  worksites as baseWorksites,
} from "./catalog";
import { address, at, company, lifecycle, mockId, nominalPath, section, line } from "./helpers";

type Step = Parameters<typeof lifecycle>[1][number];

export function buildSeed(): SeedData {
  const organizations = structuredClone(baseOrganizations);
  const worksites = structuredClone(baseWorksites);
  const allQuotes: Quote[] = structuredClone(Object.values(quotes));
  const invoices: Invoice[] = [];

  const orgById = new Map(organizations.map((o) => [o.id, o]));
  const clientById = new Map(clients.map((c) => [c.id, c]));
  const worksiteById = new Map(worksites.map((w) => [w.id, w]));
  const quoteByKey = Object.fromEntries(
    Object.keys(quotes).map((k, i) => [k, allQuotes[i]!]),
  ) as Record<keyof typeof quotes, Quote>;

  const ctx = (q: Quote) => ({
    org: orgById.get(q.organizationId)!,
    client: clientById.get(q.clientId)!,
    quote: q,
    worksite: q.worksiteId ? worksiteById.get(q.worksiteId)! : null,
    newId: () => mockId("il"),
  });

  // Numéros de devis : chronologiques, attribués avant les factures qui les citent.
  assignQuoteNumbers(organizations, allQuotes);

  // Montant du marché des chantiers = total HT du devis accepté.
  for (const q of allQuotes) {
    if (q.status === "accepted" && q.worksiteId)
      worksiteById.get(q.worksiteId)!.contractAmount = quoteTotals(q).net;
  }

  function materialize(input: InvoiceInput, organizationId: string): Invoice {
    const invoice: Invoice = {
      ...input,
      id: mockId("fac"),
      organizationId,
      createdAt: at(input.issueDate, "08:00"),
      updatedAt: at(input.issueDate, "08:00"),
    };
    invoices.push(invoice);
    return invoice;
  }

  /** Émet une facture fictive : figement des parties, paiements, cycle de vie. */
  function issue(
    invoice: Invoice,
    opts: {
      events?: Step[];
      payments?: [date: string, amount: Money | "full", method?: PaymentMethod][];
    } = {},
  ): Invoice {
    const org = orgById.get(invoice.organizationId)!;
    const client = clientById.get(invoice.clientId)!;
    invoice.issuedAt = at(invoice.issueDate, "09:30");
    invoice.seller = sellerSnapshot(org);
    invoice.buyer = buyerSnapshot(client);
    invoice.payments = (opts.payments ?? []).map(([date, amount, method = "transfer"]) => ({
      id: mockId("pay"),
      date,
      amount: amount === "full" ? invoice.totals.netToPay : amount,
      method,
    }));
    if (opts.events) {
      const events = lifecycle(invoice.issueDate, opts.events);
      invoice.eInvoicing = {
        platformInvoiceId: `PA-${invoice.id.toUpperCase()}`,
        status: events.at(-1)!.status,
        events,
      };
    }
    return invoice;
  }

  /** Parcours nominal jusqu'à « approuvée » puis « encaissée » à la date de paiement. */
  const paidPath = (issueDate: string, paidDate: string): Step[] => [
    ...nominalPath("approved"),
    ["payment_sent", hoursBetween(issueDate, paidDate) - 24, "buyer"],
    ["cashed", hoursBetween(issueDate, paidDate) + 2, "seller"],
  ];

  // ======================= Volta Énergies Rhône ===============================

  // Chantier 1 — Terrasses du Parc : sous-traitance, autoliquidation, 3 situations.
  {
    const q = quoteByKey.terrasses;
    const ids = q.sections.flatMap((s) => s.lines.map((l) => l.id));
    const pct = (values: number[]) =>
      Object.fromEntries(ids.map((id, i) => [id, String(values[i] ?? 0)]));
    const s1 = issue(
      materialize(
        buildProgressInvoice({
          ...ctx(q),
          issueDate: "2026-06-30",
          progress: pct([50, 25, 0, 10, 10, 0, 0]),
          previous: null,
          depositNet: "0.00",
          retentionRate: "5.00",
        }),
        ORG_VOLTA,
      ),
      { events: paidPath("2026-06-30", "2026-08-12"), payments: [["2026-08-12", "full"]] },
    );
    const s2 = issue(
      materialize(
        buildProgressInvoice({
          ...ctx(q),
          issueDate: "2026-07-31",
          progress: pct([100, 75, 20, 40, 40, 10, 0]),
          previous: s1,
          depositNet: "0.00",
          retentionRate: "5.00",
        }),
        ORG_VOLTA,
      ),
      { events: nominalPath("approved"), payments: [["2026-09-14", "30000.00"]] },
    );
    issue(
      materialize(
        buildProgressInvoice({
          ...ctx(q),
          issueDate: "2026-09-30",
          progress: pct([100, 100, 60, 75, 75, 40, 30]),
          previous: s2,
          depositNet: "0.00",
          retentionRate: "5.00",
        }),
        ORG_VOLTA,
      ),
      { events: nominalPath("approved") },
    );
  }

  // Chantier 2 — École : acheteur public, 2 situations dont une rejetée par la plateforme.
  {
    const q = quoteByKey.ecole;
    const ids = q.sections.flatMap((s) => s.lines.map((l) => l.id));
    const pct = (values: number[]) =>
      Object.fromEntries(ids.map((id, i) => [id, String(values[i] ?? 0)]));
    const s1 = issue(
      materialize(
        buildProgressInvoice({
          ...ctx(q),
          issueDate: "2026-07-31",
          progress: pct([100, 50, 30, 20, 25]),
          previous: null,
          depositNet: "0.00",
          retentionRate: "5.00",
        }),
        ORG_VOLTA,
      ),
      { events: paidPath("2026-07-31", "2026-09-02"), payments: [["2026-09-02", "full"]] },
    );
    issue(
      materialize(
        buildProgressInvoice({
          ...ctx(q),
          issueDate: "2026-09-30",
          progress: pct([100, 100, 70, 60, 50]),
          previous: s1,
          depositNet: "0.00",
          retentionRate: "5.00",
        }),
        ORG_VOLTA,
      ),
      {
        events: [
          ["deposited", 0, "seller"],
          [
            "rejected",
            0.2,
            "platform",
            "Code service de l'acheteur public absent : la facture ne peut pas être routée.",
          ],
        ],
      },
    );
  }

  // Chantier 3 — Hôtel : acompte payé, situation 1 en litige, situation 2 en brouillon
  // (bloquée : SIREN du client manquant).
  {
    const q = quoteByKey.cedre;
    const ids = q.sections.flatMap((s) => s.lines.map((l) => l.id));
    const pct = (values: number[]) =>
      Object.fromEntries(ids.map((id, i) => [id, String(values[i] ?? 0)]));
    const deposit = issue(
      materialize(
        buildDepositInvoice({ ...ctx(q), issueDate: "2026-07-06", percent: "30.00" }),
        ORG_VOLTA,
      ),
      { events: paidPath("2026-07-06", "2026-07-20"), payments: [["2026-07-20", "full"]] },
    );
    const depositNet = deposit.totals.net;
    const s1 = issue(
      materialize(
        buildProgressInvoice({
          ...ctx(q),
          issueDate: "2026-08-31",
          progress: pct([40, 20, 50, 0]),
          previous: null,
          depositNet,
          retentionRate: "5.00",
        }),
        ORG_VOLTA,
      ),
      {
        events: [
          ...nominalPath("in_hand"),
          [
            "disputed",
            120,
            "buyer",
            "Nombre de têtes de lit posées contesté (3 au lieu de 4 déclarées).",
          ],
        ],
      },
    );
    materialize(
      buildProgressInvoice({
        ...ctx(q),
        issueDate: "2026-10-15",
        progress: pct([70, 60, 100, 50]),
        previous: s1,
        depositNet,
        retentionRate: "5.00",
      }),
      ORG_VOLTA,
    );
  }

  // Chantier 4 — Maison Durand (particulier) : acompte et solde payés, hors facture électronique.
  {
    const q = quoteByKey.durand;
    const deposit = issue(
      materialize(
        buildDepositInvoice({ ...ctx(q), issueDate: "2026-05-04", percent: "30.00" }),
        ORG_VOLTA,
      ),
      {
        payments: [["2026-05-06", "full", "transfer"]],
      },
    );
    const all = Object.fromEntries(q.sections.flatMap((s) => s.lines.map((l) => [l.id, "100"])));
    issue(
      materialize(
        buildProgressInvoice({
          ...ctx(q),
          issueDate: "2026-07-20",
          progress: all,
          previous: null,
          depositNet: deposit.totals.net,
          retentionRate: "0.00",
        }),
        ORG_VOLTA,
      ),
      { payments: [["2026-07-29", "full", "check"]] },
    );
  }

  // Chantier 5 — Fournil : facture unique en retard de paiement.
  issue(
    materialize(
      buildStandardInvoice({ ...ctx(quoteByKey.fournil), issueDate: "2026-08-20" }),
      ORG_VOLTA,
    ),
    {
      events: nominalPath("made_available"),
    },
  );

  // Chantier 6 — Bureaux : acompte refusé, avoir d'annulation, nouvel acompte.
  {
    const q = quoteByKey.exupery;
    const refused = materialize(
      buildDepositInvoice({ ...ctx(q), issueDate: "2026-09-10", percent: "20.00" }),
      ORG_VOLTA,
    );
    refused.orderReference = undefined;
    issue(refused, {
      events: [
        ...nominalPath("in_hand"),
        ["refused", 30, "buyer", "Référence du bon de commande absente : facture refusée."],
      ],
    });
    const creditNote = issue(
      materialize(
        buildCreditNote({
          invoice: refused,
          issueDate: "2026-09-15",
          reason: "Annulation de l'acompte refusé",
          newId: () => mockId("il"),
        }),
        ORG_VOLTA,
      ),
      { events: nominalPath("made_available") },
    );
    refused.cancelledByCreditNoteId = creditNote.id;
    issue(
      materialize(
        buildDepositInvoice({ ...ctx(q), issueDate: "2026-09-16", percent: "20.00" }),
        ORG_VOLTA,
      ),
      {
        events: nominalPath("made_available"),
      },
    );
  }

  // Chantier 8 — Lotissement Les Vergers (2025) : sous-traitance, retenue de garantie à récupérer.
  {
    const q = quoteByKey.vergers;
    const [a, b] = q.sections[0]!.lines.map((l) => l.id);
    const s1 = issue(
      materialize(
        buildProgressInvoice({
          ...ctx(q),
          issueDate: "2025-06-30",
          progress: { [a!]: "50", [b!]: "60" },
          previous: null,
          depositNet: "0.00",
          retentionRate: "5.00",
        }),
        ORG_VOLTA,
      ),
      { payments: [["2025-08-14", "full"]] },
    );
    issue(
      materialize(
        buildProgressInvoice({
          ...ctx(q),
          issueDate: "2025-09-30",
          progress: { [a!]: "100", [b!]: "100" },
          previous: s1,
          depositNet: "0.00",
          retentionRate: "5.00",
        }),
        ORG_VOLTA,
      ),
      { payments: [["2025-11-14", "full"]] },
    );
  }

  // Factures directes (dépannages, petits travaux).
  const direct = (
    organizationId: string,
    clientId: string,
    issueDate: string,
    content: InvoiceContent,
    worksiteId: string | null = null,
  ) => {
    const org = orgById.get(organizationId)!;
    const client = clientById.get(clientId)!;
    return materialize(
      buildStandardInvoice({
        org,
        client,
        quote: null,
        content,
        worksite: worksiteId ? worksiteById.get(worksiteId)! : null,
        issueDate,
        newId: () => mockId("il"),
      }),
      organizationId,
    );
  };
  const content = (
    title: string,
    lines: ReturnType<typeof line>[],
    reverseCharge = false,
  ): InvoiceContent => ({
    title,
    sections: [section("Intervention", lines)],
    discount: { kind: "none" },
    reverseCharge,
  });

  issue(
    direct(
      ORG_VOLTA,
      "cli-fontaine",
      "2026-09-02",
      content("Dépannage : remplacement d'un interrupteur différentiel", [
        line(
          "Interrupteur différentiel 40 A type A, fourniture et pose",
          "1",
          "u",
          "185.00",
          "10.00",
        ),
        line("Déplacement", "1", "forfait", "45.00", "10.00"),
      ]),
    ),
    {
      payments: [["2026-09-02", "full", "card"]],
    },
  );
  issue(
    direct(
      ORG_VOLTA,
      "cli-renov",
      "2026-09-25",
      content("Intervention urgente : recherche de défaut", [
        line("Recherche de défaut d'isolement", "3", "h", "65.00"),
        line("Fournitures", "1", "forfait", "120.00"),
      ]),
    ),
    {
      events: nominalPath("in_hand"),
      payments: [["2026-10-09", "150.00"]],
    },
  );
  issue(
    direct(
      ORG_VOLTA,
      "cli-construire",
      "2026-08-28",
      content(
        "Tableau provisoire de chantier",
        [
          line("Mise en service d'un tableau provisoire de chantier", "1", "u", "640.00"),
          line("Location de coffret de chantier", "2", "u", "95.00"),
        ],
        true,
      ),
    ),
    {
      events: nominalPath("approved"),
    },
  );
  issue(
    direct(
      ORG_VOLTA,
      "cli-sci-exupery",
      "2026-07-01",
      content("Contrat de maintenance annuel 2026-2027", [
        line(
          "Maintenance préventive des installations électriques (1 an)",
          "1",
          "forfait",
          "1200.00",
        ),
      ]),
    ),
    {
      events: paidPath("2026-07-01", "2026-07-28"),
      payments: [["2026-07-28", "full"]],
    },
  );
  issue(
    direct(
      ORG_VOLTA,
      "cli-cedre",
      "2026-06-12",
      content("Dépannage de l'éclairage de façade", [
        line("Remplacement de projecteurs LED de façade", "3", "u", "140.00"),
      ]),
    ),
    {
      events: paidPath("2026-06-12", "2026-07-03"),
      payments: [["2026-07-03", "full"]],
    },
  );
  issue(
    direct(
      ORG_VOLTA,
      "cli-fournil",
      "2026-10-10",
      content("Alimentation de la chambre froide", [
        line(
          "Remplacement de la ligne d'alimentation de la chambre froide",
          "1",
          "forfait",
          "760.00",
        ),
      ]),
    ),
    {
      events: [
        ...nominalPath("in_hand"),
        ["suspended", 50, "buyer", "Bon d'intervention signé manquant."],
      ],
    },
  );
  direct(
    ORG_VOLTA,
    "cli-batir",
    "2026-10-16",
    content(
      "Travaux supplémentaires — prises de cuisine logement B12",
      [line("Ajout de 4 prises de plan de travail", "1", "forfait", "480.00")],
      true,
    ),
    "ws-terrasses",
  );
  issue(
    direct(
      ORG_VOLTA,
      "cli-belleroche",
      "2026-10-14",
      content("Illuminations de fin d'année — pose", [
        line("Pose et raccordement des illuminations", "1", "forfait", "4800.00"),
      ]),
    ),
    {
      events: [["deposited", 0, "seller"]],
    },
  );

  // ======================= Chêne & Fil Agencement =============================
  {
    const q = quoteByKey.edelweiss;
    const deposit = issue(
      materialize(
        buildDepositInvoice({ ...ctx(q), issueDate: "2026-08-03", percent: "30.00" }),
        ORG_CHENE,
      ),
      {
        events: paidPath("2026-08-03", "2026-08-17"),
        payments: [["2026-08-17", "full"]],
      },
    );
    const [bar, banquettes, vitrine] = q.sections[0]!.lines.map((l) => l.id);
    issue(
      materialize(
        buildProgressInvoice({
          ...ctx(q),
          issueDate: "2026-09-30",
          progress: { [bar!]: "60", [banquettes!]: "40", [vitrine!]: "0" },
          previous: null,
          depositNet: depositNetForQuote(invoices, q.id) || deposit.totals.net,
          retentionRate: "5.00",
        }),
        ORG_CHENE,
      ),
      { events: nominalPath("in_hand") },
    );
  }
  issue(
    materialize(
      buildStandardInvoice({ ...ctx(quoteByKey.perrin), issueDate: "2026-07-06" }),
      ORG_CHENE,
    ),
    {
      payments: [["2026-07-15", "full", "check"]],
    },
  );
  issue(
    direct(
      ORG_CHENE,
      "cli-maisons-alpines",
      "2026-09-12",
      content(
        "Pose de portes intérieures — Le Clos des Aravis",
        [line("Pose de blocs-portes intérieurs", "12", "u", "210.00")],
        true,
      ),
    ),
    {
      events: nominalPath("approved"),
    },
  );
  issue(
    direct(
      ORG_CHENE,
      "cli-saint-ferreol",
      "2026-08-03",
      content("Réparation des volets de la mairie", [
        line("Réparation et remise en jeu de volets bois", "1", "forfait", "1380.00"),
      ]),
    ),
    {
      events: nominalPath("made_available"),
    },
  );
  direct(
    ORG_CHENE,
    "cli-edelweiss",
    "2026-10-17",
    content("Tablettes complémentaires", [
      line("Tablettes en chêne pour la vitrine", "4", "u", "160.00"),
    ]),
    "ws-edelweiss",
  );
  issue(
    direct(
      ORG_CHENE,
      "cli-edelweiss",
      "2026-06-22",
      content("Réglage et quincaillerie", [
        line("Réglage des portes et remplacement de quincaillerie", "1", "forfait", "290.00"),
      ]),
    ),
    {
      events: paidPath("2026-06-22", "2026-07-06"),
      payments: [["2026-07-06", "full"]],
    },
  );

  // Numérotation chronologique continue par entreprise et par série.
  assignInvoiceNumbers(organizations, invoices);

  return {
    organizations,
    users,
    memberships,
    invitations,
    clients,
    worksites,
    quotes: allQuotes,
    invoices,
    receivedInvoices: buildReceivedInvoices(),
  };
}

function hoursBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T10:00:00Z`) - Date.parse(`${a}T10:00:00Z`)) / 3_600_000);
}

const byDate = <T extends { issueDate: string; createdAt: string }>(a: T, b: T) =>
  a.issueDate.localeCompare(b.issueDate) || a.createdAt.localeCompare(b.createdAt);

function assignQuoteNumbers(organizations: Organization[], quotes: Quote[]) {
  for (const org of organizations) {
    for (const q of quotes.filter((x) => x.organizationId === org.id).sort(byDate)) {
      const r = assignNextNumber(org.settings.numbering.quote, q.issueDate);
      q.number = r.number;
      org.settings.numbering.quote = r.series;
    }
  }
}

function assignInvoiceNumbers(organizations: Organization[], invoices: Invoice[]) {
  for (const org of organizations) {
    const issued = invoices.filter((i) => i.organizationId === org.id && i.issuedAt).sort(byDate);
    for (const inv of issued) {
      const key = inv.kind === "credit_note" ? "creditNote" : "invoice";
      const r = assignNextNumber(org.settings.numbering[key], inv.issueDate);
      inv.number = r.number;
      org.settings.numbering[key] = r.series;
    }
  }
  // Libellé d'avoir qui cite un numéro attribué après coup.
  for (const inv of invoices) {
    if (inv.kind === "credit_note" && inv.correctedInvoiceId) {
      const original = invoices.find((x) => x.id === inv.correctedInvoiceId)!;
      inv.title = `Avoir sur facture ${original.number} — annulation de l'acompte refusé`;
    }
  }
}

// --- Factures reçues ----------------------------------------------------------

interface ReceivedSpec {
  org: string;
  supplier: {
    name: string;
    sirenBase: string;
    city: readonly [postalCode: string, city: string];
    street: string;
  };
  number: string;
  issueDate: string;
  dueInDays: number;
  category: ReceivedInvoice["category"];
  reverseCharge?: boolean;
  lines: [description: string, quantity: string, unit: Unit, unitPrice: string, vatRate?: string][];
  worksiteId?: string;
  orderReference?: string;
  steps: Step[];
  reason?: string;
  paidAt?: string;
}

const SUPPLIERS = {
  distrib: {
    name: "Distrib'Élec Rhône",
    sirenBase: "73519482",
    city: ["69100", "Villeurbanne"],
    street: "220 avenue Roger-Salengro",
  },
  cable: {
    name: "Comptoir Lyonnais du Câble",
    sirenBase: "82047316",
    city: ["69200", "Vénissieux"],
    street: "8 rue de l'Industrie",
  },
  locapro: {
    name: "LocaPro Engins",
    sirenBase: "78136925",
    city: ["69800", "Saint-Priest"],
    street: "ZI des Pivolles",
  },
  echafaudage: {
    name: "Échafaudages Saône Location",
    sirenBase: "85290147",
    city: ["69400", "Villefranche-sur-Saône"],
    street: "15 rue du Port",
  },
  tranchees: {
    name: "Tranchées & Réseaux Sud-Est",
    sirenBase: "89371054",
    city: ["38300", "Bourgoin-Jallieu"],
    street: "4 chemin des Carrières",
  },
  controle: {
    name: "Bureau de Contrôle Électrique Alpha",
    sirenBase: "80915263",
    city: ["69003", "Lyon"],
    street: "60 rue Servient",
  },
  scierie: {
    name: "Scierie du Semnoz",
    sirenBase: "77482901",
    city: ["74320", "Sévrier"],
    street: "Route d'Albertville",
  },
  quincaillerie: {
    name: "Quincaillerie Pro Savoie",
    sirenBase: "84603719",
    city: ["74960", "Cran-Gevrier"],
    street: "32 avenue des Vieux-Chênes",
  },
  vitrages: {
    name: "Vitrages des Alpes",
    sirenBase: "88152036",
    city: ["74300", "Cluses"],
    street: "9 rue des Verriers",
  },
} as const;

function buildReceivedInvoices(): ReceivedInvoice[] {
  const specs: ReceivedSpec[] = [
    {
      org: ORG_VOLTA,
      supplier: SUPPLIERS.distrib,
      number: "DER-26-10482",
      issueDate: "2026-10-15",
      dueInDays: 45,
      category: "materials",
      worksiteId: "ws-terrasses",
      lines: [
        ["Câble U-1000 R2V 3G2,5 (couronne 100 m)", "40", "u", "96.50"],
        ["Disjoncteurs divisionnaires 16 A", "240", "u", "11.20"],
        ["Tableaux 3 rangées", "24", "u", "68.00"],
      ],
      steps: [
        ["received", 0],
        ["made_available", 0.2],
      ],
    },
    {
      org: ORG_VOLTA,
      supplier: SUPPLIERS.cable,
      number: "CLC-2026-3317",
      issueDate: "2026-10-16",
      dueInDays: 30,
      category: "materials",
      worksiteId: "ws-ecole",
      lines: [
        ["Luminaires LED 600×600 (lot)", "70", "u", "52.00"],
        ["Câble H07V-U (bobine)", "6", "u", "48.00"],
      ],
      steps: [
        ["received", 0],
        ["made_available", 0.1],
      ],
    },
    {
      org: ORG_VOLTA,
      supplier: SUPPLIERS.locapro,
      number: "LP-26-0918",
      issueDate: "2026-10-12",
      dueInDays: 30,
      category: "equipment_rental",
      worksiteId: "ws-terrasses",
      lines: [
        ["Location nacelle ciseaux 10 m (semaine)", "2", "u", "520.00"],
        ["Transport aller-retour", "1", "forfait", "180.00"],
      ],
      steps: [
        ["received", 0],
        ["made_available", 0.1],
        ["in_hand", 20, "buyer"],
      ],
    },
    {
      org: ORG_VOLTA,
      supplier: SUPPLIERS.tranchees,
      number: "TRS-2026-071",
      issueDate: "2026-09-30",
      dueInDays: 45,
      category: "subcontracting",
      reverseCharge: true,
      worksiteId: "ws-hopital",
      orderReference: "CMD-VER-2026-22",
      lines: [["Tranchées et pose de fourreaux (sous-traitance)", "180", "ml", "38.00"]],
      steps: [
        ["received", 0],
        ["made_available", 0.1],
        ["in_hand", 24, "buyer"],
        ["approved", 72, "buyer"],
      ],
    },
    {
      org: ORG_VOLTA,
      supplier: SUPPLIERS.distrib,
      number: "DER-26-09877",
      issueDate: "2026-09-18",
      dueInDays: 45,
      category: "materials",
      worksiteId: "ws-cedre",
      lines: [
        ["Liseuses LED avec port USB", "36", "u", "42.00"],
        ["Prises de courant encastrées", "180", "u", "6.40"],
      ],
      steps: [
        ["received", 0],
        ["made_available", 0.1],
        ["approved", 30, "buyer"],
        ["payment_sent", 600, "buyer"],
      ],
      paidAt: "2026-10-13",
    },
    {
      org: ORG_VOLTA,
      supplier: SUPPLIERS.echafaudage,
      number: "ESL-4471",
      issueDate: "2026-09-25",
      dueInDays: 30,
      category: "equipment_rental",
      worksiteId: "ws-ecole",
      lines: [
        ["Location échafaudage roulant (mois)", "1", "u", "640.00"],
        ["Montage et démontage", "1", "forfait", "290.00"],
      ],
      steps: [
        ["received", 0],
        ["made_available", 0.1],
        ["refused", 48, "buyer"],
      ],
      reason: "Matériel non commandé pour ce chantier : erreur de destinataire.",
    },
    {
      org: ORG_VOLTA,
      supplier: SUPPLIERS.controle,
      number: "BCA-26-1205",
      issueDate: "2026-10-02",
      dueInDays: 30,
      category: "services",
      worksiteId: "ws-ecole",
      lines: [["Vérification initiale de l'installation (Consuel)", "1", "forfait", "850.00"]],
      steps: [
        ["received", 0],
        ["made_available", 0.1],
        ["disputed", 70, "buyer"],
      ],
      reason: "Montant différent du devis accepté (690,00 € HT).",
    },
    {
      org: ORG_VOLTA,
      supplier: SUPPLIERS.cable,
      number: "CLC-2026-3011",
      issueDate: "2026-08-28",
      dueInDays: 30,
      category: "materials",
      worksiteId: "ws-fournil",
      lines: [["Câble 5G6 (couronne 50 m)", "2", "u", "210.00"]],
      steps: [
        ["received", 0],
        ["made_available", 0.1],
        ["approved", 24, "buyer"],
        ["payment_sent", 500, "buyer"],
      ],
      paidAt: "2026-09-18",
    },
    {
      org: ORG_VOLTA,
      supplier: SUPPLIERS.locapro,
      number: "LP-26-0802",
      issueDate: "2026-08-14",
      dueInDays: 30,
      category: "equipment_rental",
      lines: [["Location mini-pelle 1,5 t (jour)", "3", "j", "185.00"]],
      steps: [
        ["received", 0],
        ["made_available", 0.1],
        ["approved", 24, "buyer"],
        ["payment_sent", 400, "buyer"],
      ],
      paidAt: "2026-09-10",
    },
    {
      org: ORG_VOLTA,
      supplier: SUPPLIERS.distrib,
      number: "DER-26-10611",
      issueDate: "2026-10-17",
      dueInDays: 45,
      category: "materials",
      worksiteId: "ws-exupery",
      lines: [
        ["Dalles LED DALI 600×600", "60", "u", "78.00"],
        ["Passerelle DALI", "2", "u", "245.00"],
      ],
      steps: [
        ["received", 0],
        ["made_available", 0.1],
      ],
    },
    {
      org: ORG_VOLTA,
      supplier: SUPPLIERS.tranchees,
      number: "TRS-2026-064",
      issueDate: "2026-09-05",
      dueInDays: 45,
      category: "subcontracting",
      reverseCharge: true,
      worksiteId: "ws-terrasses",
      lines: [["Percements et carottages (sous-traitance)", "1", "forfait", "2400.00"]],
      steps: [
        ["received", 0],
        ["made_available", 0.1],
        ["partially_approved", 50, "buyer"],
      ],
      reason: "Approuvée à hauteur de 1 900,00 € HT : 5 carottages non réalisés.",
    },
    {
      org: ORG_VOLTA,
      supplier: SUPPLIERS.echafaudage,
      number: "ESL-4502",
      issueDate: "2026-10-08",
      dueInDays: 30,
      category: "equipment_rental",
      worksiteId: "ws-terrasses",
      lines: [["Location échafaudage de façade (mois)", "1", "u", "1450.00"]],
      steps: [
        ["received", 0],
        ["made_available", 0.1],
        ["suspended", 30, "buyer"],
      ],
      reason: "Bon de livraison manquant.",
    },
    // Chêne & Fil Agencement
    {
      org: ORG_CHENE,
      supplier: SUPPLIERS.scierie,
      number: "SDS-2026-188",
      issueDate: "2026-10-09",
      dueInDays: 30,
      category: "materials",
      worksiteId: "ws-edelweiss",
      lines: [["Plateaux de chêne massif 45 mm", "3.2", "m³", "1850.00"]],
      steps: [
        ["received", 0],
        ["made_available", 0.1],
      ],
    },
    {
      org: ORG_CHENE,
      supplier: SUPPLIERS.quincaillerie,
      number: "QPS-77120",
      issueDate: "2026-10-14",
      dueInDays: 30,
      category: "materials",
      worksiteId: "ws-edelweiss",
      lines: [
        ["Coulisses à sortie totale", "24", "u", "18.50"],
        ["Charnières invisibles", "40", "u", "9.80"],
      ],
      steps: [
        ["received", 0],
        ["made_available", 0.1],
      ],
    },
    {
      org: ORG_CHENE,
      supplier: SUPPLIERS.vitrages,
      number: "VDA-26-0457",
      issueDate: "2026-09-22",
      dueInDays: 45,
      category: "subcontracting",
      reverseCharge: true,
      worksiteId: "ws-edelweiss",
      lines: [
        ["Vitrine à vins : vitrage feuilleté posé (sous-traitance)", "1", "forfait", "2350.00"],
      ],
      steps: [
        ["received", 0],
        ["made_available", 0.1],
        ["approved", 26, "buyer"],
      ],
    },
    {
      org: ORG_CHENE,
      supplier: SUPPLIERS.scierie,
      number: "SDS-2026-142",
      issueDate: "2026-07-28",
      dueInDays: 30,
      category: "materials",
      worksiteId: "ws-perrin",
      lines: [["Chêne raboté pour escalier", "0.9", "m³", "1920.00"]],
      steps: [
        ["received", 0],
        ["made_available", 0.1],
        ["approved", 20, "buyer"],
        ["payment_sent", 480, "buyer"],
      ],
      paidAt: "2026-08-20",
    },
  ];

  return specs.map((s) => {
    const lines: ReceivedInvoiceLine[] = s.lines.map(
      ([description, quantity, unit, unitPrice, vatRate = "20.00"]) => ({
        id: mockId("rl"),
        description,
        quantity,
        unit,
        unitPrice,
        vatRate: s.reverseCharge ? "0.00" : vatRate,
        net: lineNet({ quantity, unitPrice }),
      }),
    );
    const vatBreakdown = groupByVat(
      lines.map((l) => ({
        net: l.net,
        vatRate: l.vatRate,
        vatCategory: s.reverseCharge ? ("AE" as const) : ("S" as const),
      })),
    );
    const totals = totalsOfBreakdown(vatBreakdown);
    const events: LifecycleEvent[] = lifecycle(s.issueDate, s.steps).map((e, i, arr) =>
      i === arr.length - 1 && s.reason ? { ...e, comment: s.reason } : e,
    );
    const ids = company(s.supplier.sirenBase);
    return {
      id: mockId("rec"),
      organizationId: s.org,
      supplier: {
        name: s.supplier.name,
        siren: ids.siren,
        vatNumber: ids.vatNumber,
        address: address(s.supplier.street, s.supplier.city[0], s.supplier.city[1]),
      },
      number: s.number,
      issueDate: s.issueDate,
      dueDate: addDaysIso(s.issueDate, s.dueInDays),
      category: s.category,
      reverseCharge: s.reverseCharge ?? false,
      lines,
      vatBreakdown,
      net: totals.net,
      vat: totals.vat,
      gross: totals.gross,
      worksiteId: s.worksiteId ?? null,
      orderReference: s.orderReference,
      receivedAt: events[0]!.at,
      platformInvoiceId: `PA-IN-${s.number}`,
      status: events.at(-1)!.status,
      events,
      statusReason: s.reason,
      paidAt: s.paidAt,
    };
  });
}

function addDaysIso(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
