/**
 * Plateforme agréée SIMULÉE : aucun appel réseau.
 * - les factures déposées progressent seules dans le cycle de vie, avec un délai
 *   de quelques secondes entre chaque statut, pour rendre le prototype vivant ;
 * - une facture destinée à un acheteur public sans code service est rejetée (213) ;
 * - une nouvelle facture fournisseur « arrive » une minute après le démarrage.
 */
import { addDays, LIFECYCLE_STATUSES, RECEIVED_INVOICE_ACTIONS, type LifecycleStatus } from "@/domain/lifecycle";
import { groupByVat, totalsOfBreakdown } from "@/domain/vat";
import { company } from "@/data/mock/helpers";
import type { Invoice, LifecycleActor, LifecycleEvent } from "@/data/types";
import { today } from "@/lib/clock";
import { EInvoicingError, type EInvoicingProvider, type IncomingInvoice, type PlatformInfo } from "./provider";

const PLATFORMS: PlatformInfo[] = [
  { id: "pa-alpha", name: "Plateforme Alpha (fictive)", description: "Plateforme généraliste, connecteurs comptables, tarification au volume." },
  { id: "pa-beta", name: "Plateforme Bêta (fictive)", description: "Spécialisée TPE/PME, interface simple, abonnement mensuel." },
  { id: "pa-gamma", name: "Plateforme Gamma (fictive)", description: "Orientée grands comptes et acheteurs publics." },
];

/** Délais simulés (secondes après le dépôt). */
const NOMINAL_SCHEDULE: [LifecycleStatus, number, LifecycleActor][] = [
  ["deposited", 0, "seller"],
  ["issued", 3, "platform"],
  ["received", 6, "platform"],
  ["made_available", 9, "platform"],
  ["in_hand", 20, "buyer"],
  ["approved", 35, "buyer"],
];

interface Tracked {
  submittedAt: number;
  schedule: { status: LifecycleStatus; offset: number; actor: LifecycleActor; comment?: string }[];
  extra: LifecycleEvent[];
}

interface MockState {
  startedAt: number;
  submitted: Map<string, Tracked>;
}

const g = globalThis as unknown as { __situaMockPlatform?: MockState };
const state = (g.__situaMockPlatform ??= { startedAt: Date.now(), submitted: new Map() });

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function event(status: LifecycleStatus, atMs: number, actor: LifecycleActor, comment?: string): LifecycleEvent {
  return { id: crypto.randomUUID(), status, at: new Date(atMs).toISOString(), actor, comment };
}

function eventsOf(t: Tracked, now: number): LifecycleEvent[] {
  const scheduled = t.schedule
    .filter((s) => t.submittedAt + s.offset * 1000 <= now)
    .map((s) => event(s.status, t.submittedAt + s.offset * 1000, s.actor, s.comment));
  return [...scheduled, ...t.extra].sort((a, b) => a.at.localeCompare(b.at));
}

export class MockEInvoicingProvider implements EInvoicingProvider {
  async listPlatforms() {
    return PLATFORMS;
  }

  async submitInvoice(invoice: Invoice) {
    await sleep(600);
    if (!invoice.number || !invoice.seller || !invoice.buyer) {
      throw new EInvoicingError("Facture incomplète : numéro et parties requis avant dépôt.");
    }
    const platformInvoiceId = `PA-${invoice.number}-${Date.now().toString(36).toUpperCase()}`;
    const publicWithoutService = invoice.buyer.kind === "public_buyer" && !invoice.buyer.serviceCode;
    const schedule = publicWithoutService
      ? [
          { status: "deposited" as const, offset: 0, actor: "seller" as const },
          {
            status: "rejected" as const,
            offset: 4,
            actor: "platform" as const,
            comment: "Code service de l'acheteur public absent : la facture ne peut pas être routée.",
          },
        ]
      : NOMINAL_SCHEDULE.map(([status, offset, actor]) => ({ status, offset, actor }));
    const tracked: Tracked = { submittedAt: Date.now(), schedule, extra: [] };
    state.submitted.set(platformInvoiceId, tracked);
    const events = eventsOf(tracked, Date.now());
    return { platformInvoiceId, status: events.at(-1)!.status, events };
  }

  async getInvoiceStatus(platformInvoiceId: string) {
    const tracked = state.submitted.get(platformInvoiceId);
    if (!tracked) return null;
    const events = eventsOf(tracked, Date.now());
    return { status: events.at(-1)!.status, events };
  }

  async reportPayment(platformInvoiceId: string, payment: { date: string; amount: string }) {
    await sleep(300);
    const e = event("cashed", Date.now(), "seller", `Encaissement déclaré le ${payment.date.split("-").reverse().join("/")}.`);
    state.submitted.get(platformInvoiceId)?.extra.push(e);
    return e;
  }

  async listReceivedInvoices(receptionAddress: string): Promise<IncomingInvoice[]> {
    await sleep(250);
    // Une nouvelle facture arrive 60 s après le démarrage du serveur.
    if (Date.now() - state.startedAt < 60_000) return [];
    return [newArrival(receptionAddress, state.startedAt + 60_000)];
  }

  async updateReceivedInvoiceStatus(platformInvoiceId: string, action: keyof typeof RECEIVED_INVOICE_ACTIONS, reason?: string) {
    await sleep(500);
    const status = RECEIVED_INVOICE_ACTIONS[action];
    if (!(status in LIFECYCLE_STATUSES)) throw new EInvoicingError("Action inconnue.");
    void platformInvoiceId;
    return event(status, Date.now(), "buyer", reason);
  }
}

function newArrival(receptionAddress: string, atMs: number): IncomingInvoice {
  const lines = [
    { id: "arr-1", description: "Gaines ICTA 20 mm (couronne 100 m)", quantity: "15", unit: "u" as const, unitPrice: "21.40", vatRate: "20.00", net: "321.00" },
    { id: "arr-2", description: "Boîtes d'encastrement", quantity: "200", unit: "u" as const, unitPrice: "0.85", vatRate: "20.00", net: "170.00" },
  ];
  const vatBreakdown = groupByVat(lines.map((l) => ({ net: l.net, vatRate: l.vatRate, vatCategory: "S" as const })));
  const totals = totalsOfBreakdown(vatBreakdown);
  const at = new Date(atMs).toISOString();
  const supplierIds = company("82047316");
  const issueDate = today();
  return {
    supplier: {
      name: "Comptoir Lyonnais du Câble",
      ...supplierIds,
      address: { line1: "8 rue de l'Industrie", postalCode: "69200", city: "Vénissieux", countryCode: "FR" },
    },
    number: "CLC-2026-3401",
    issueDate,
    dueDate: addDays(issueDate, 30),
    category: "materials",
    reverseCharge: false,
    lines,
    vatBreakdown,
    ...totals,
    receivedAt: at,
    platformInvoiceId: `PA-IN-ARRIVAL-${receptionAddress}`,
    status: "made_available",
    events: [
      { id: "arr-ev-1", status: "received", at, actor: "platform" },
      { id: "arr-ev-2", status: "made_available", at, actor: "platform" },
    ],
  };
}
