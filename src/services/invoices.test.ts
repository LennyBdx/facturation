import { describe, expect, it, vi } from "vitest";
import { createMemoryRepositories, createMemoryUnitOfWork } from "@/data/memory/repositories";
import { createMemoryDb } from "@/data/memory/store";
import { buildSeed } from "@/data/mock/seed";
import { DEMO_TODAY, DEMO_USER_ID } from "@/config/app";
import type { EInvoicingProvider } from "@/integrations/e-invoicing";
import type { Role } from "@/domain/permissions";
import { createContext } from "./context";
import { BusinessError } from "./errors";
import { createCreditNote, deleteDraft, issueInvoice, recordPayment } from "./invoices";
import { quoteToInvoice } from "./quotes";

/** Plateforme factice : enregistre les appels, répond « Déposée ». */
function fakeProvider() {
  return {
    submitInvoice: vi.fn(async () => ({
      platformInvoiceId: "PA-TEST",
      status: "deposited" as const,
      events: [{ id: "e1", status: "deposited" as const, at: "2026-10-18T10:00:00.000Z", actor: "seller" as const }],
    })),
    reportPayment: vi.fn(async () => ({ id: "e2", status: "cashed" as const, at: "2026-10-18T11:00:00.000Z", actor: "seller" as const })),
  };
}

/** Contexte complet sur des données en mémoire neuves (aucun état partagé entre tests). */
async function setup(role: Role = "owner") {
  const db = createMemoryDb(buildSeed());
  const repos = createMemoryRepositories(db);
  const uow = createMemoryUnitOfWork(db, repos);
  const provider = fakeProvider();
  const user = (await repos.users.get(DEMO_USER_ID))!;
  const [org] = await repos.organizations.listForUser(user.id);
  const membership = (await repos.memberships.listByOrganization(org.id)).find((m) => m.userId === user.id)!;
  const ctx = createContext(
    { repos, uow, provider: provider as unknown as EInvoicingProvider, clock: { today: () => DEMO_TODAY, now: () => `${DEMO_TODAY}T10:00:00.000Z` } },
    { org, user, membership: { ...membership, role } },
  );
  return { ctx, provider, repos };
}

/** Brouillon de facture tiré d'un devis accepté d'un client professionnel. */
async function draftFromAcceptedQuote(ctx: Awaited<ReturnType<typeof setup>>["ctx"]) {
  const quotes = await ctx.repos.quotes.list(ctx.orgId, { status: "accepted" });
  for (const q of quotes) {
    const client = await ctx.repos.clients.get(ctx.orgId, q.clientId);
    if (client && client.kind !== "individual") return quoteToInvoice(ctx, q.id, "standard");
  }
  throw new Error("Aucun devis accepté d'un client professionnel dans le jeu de démonstration.");
}

const seq = (n: string | null) => Number(n?.match(/(\d+)$/)?.[1]);

describe("émission d'une facture", () => {
  it("attribue le numéro suivant, fige vendeur et acheteur, puis dépose sur la plateforme", async () => {
    const { ctx, provider } = await setup();
    const draft = await draftFromAcceptedQuote(ctx);
    expect(draft.number).toBeNull();

    const issued = await issueInvoice(ctx, draft.id);
    expect(issued.number).toMatch(/\d+$/);
    expect(issued.issuedAt).not.toBeNull();
    expect(issued.seller?.siren).toBe(ctx.org.siren);
    expect(issued.buyer).not.toBeNull();
    expect(provider.submitInvoice).toHaveBeenCalledOnce();
    expect(issued.eInvoicing.platformInvoiceId).toBe("PA-TEST");
  });

  it("numérote sans trou : deux émissions successives se suivent", async () => {
    const { ctx } = await setup();
    const a = await issueInvoice(ctx, (await draftFromAcceptedQuote(ctx)).id);
    const b = await issueInvoice(ctx, (await draftFromAcceptedQuote(ctx)).id);
    expect(seq(b.number)).toBe(seq(a.number) + 1);
  });

  it("refuse une deuxième émission et la suppression d'une facture émise", async () => {
    const { ctx } = await setup();
    const issued = await issueInvoice(ctx, (await draftFromAcceptedQuote(ctx)).id);
    await expect(issueInvoice(ctx, issued.id)).rejects.toBeInstanceOf(BusinessError);
    await expect(deleteDraft(ctx, issued.id)).rejects.toBeInstanceOf(BusinessError);
  });

  it("bloque l'émission si une mention obligatoire manque, sans consommer de numéro", async () => {
    const { ctx, repos, provider } = await setup();
    const draft = await draftFromAcceptedQuote(ctx);
    await repos.clients.update(ctx.orgId, draft.clientId, { siren: "" });
    await expect(issueInvoice(ctx, draft.id)).rejects.toBeInstanceOf(BusinessError);
    expect(provider.submitInvoice).not.toHaveBeenCalled();
    expect((await repos.invoices.get(ctx.orgId, draft.id))?.number).toBeNull();
  });
});

describe("paiements et avoirs", () => {
  it("un paiement du solde déclare l'encaissement (212)", async () => {
    const { ctx, provider } = await setup();
    const issued = await issueInvoice(ctx, (await draftFromAcceptedQuote(ctx)).id);
    const paid = await recordPayment(ctx, issued.id, { date: DEMO_TODAY, amount: issued.totals.netToPay, method: "transfer" });
    expect(paid.payments).toHaveLength(1);
    expect(paid.eInvoicing.status).toBe("cashed");
    expect(provider.reportPayment).toHaveBeenCalledOnce();
  });

  it("refuse un paiement supérieur au reste à payer", async () => {
    const { ctx } = await setup();
    const issued = await issueInvoice(ctx, (await draftFromAcceptedQuote(ctx)).id);
    await expect(recordPayment(ctx, issued.id, { date: DEMO_TODAY, amount: "99999999.00", method: "transfer" })).rejects.toBeInstanceOf(BusinessError);
  });

  it("l'avoir émis annule la facture d'origine", async () => {
    const { ctx, repos } = await setup();
    const issued = await issueInvoice(ctx, (await draftFromAcceptedQuote(ctx)).id);
    const credit = await createCreditNote(ctx, issued.id, "Erreur de quantité");
    await issueInvoice(ctx, credit.id);
    expect((await repos.invoices.get(ctx.orgId, issued.id))?.cancelledByCreditNoteId).toBe(credit.id);
  });
});

describe("unité de travail en mémoire", () => {
  it("annule toutes les écritures si le travail échoue", async () => {
    const { ctx, repos } = await setup();
    const before = (await repos.clients.list(ctx.orgId)).length;
    await expect(
      ctx.uow.run(async (r) => {
        await r.clients.update(ctx.orgId, (await r.clients.list(ctx.orgId))[0].id, { name: "Modifié" });
        await r.organizations.takeNextNumber(ctx.orgId, "invoice", DEMO_TODAY);
        throw new Error("échec simulé");
      }),
    ).rejects.toThrow("échec simulé");
    const after = await repos.clients.list(ctx.orgId);
    expect(after).toHaveLength(before);
    expect(after.some((c) => c.name === "Modifié")).toBe(false);
  });
});
