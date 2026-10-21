import { describe, expect, it } from "vitest";
import { DEMO_TODAY, DEMO_USER_ID } from "@/config/app";
import { createMemoryRepositories, createMemoryUnitOfWork } from "@/data/memory/repositories";
import { createMemoryDb } from "@/data/memory/store";
import { buildSeed } from "@/data/mock/seed";
import type { EInvoicingProvider } from "@/integrations/e-invoicing";
import { createContext } from "./context";
import { globalSearch } from "./search";

async function setup() {
  const db = createMemoryDb(buildSeed());
  const repos = createMemoryRepositories(db);
  const user = (await repos.users.get(DEMO_USER_ID))!;
  const orgs = await repos.organizations.listForUser(user.id);
  const ctxFor = async (orgIndex: number) => {
    const org = orgs[orgIndex];
    const membership = (await repos.memberships.listByOrganization(org.id)).find(
      (m) => m.userId === user.id,
    )!;
    return createContext(
      {
        repos,
        uow: createMemoryUnitOfWork(db, repos),
        provider: {} as EInvoicingProvider,
        clock: { today: () => DEMO_TODAY, now: () => `${DEMO_TODAY}T10:00:00.000Z` },
      },
      { org, user, membership },
    );
  };
  return { ctxFor, orgCount: orgs.length };
}

describe("recherche globale", () => {
  it("ignore les recherches de moins de 2 caractères", async () => {
    const { ctxFor } = await setup();
    expect(await globalSearch(await ctxFor(0), " a ")).toEqual([]);
  });

  it("trouve clients, chantiers, devis et factures, 5 au plus par type", async () => {
    const { ctxFor } = await setup();
    const results = await globalSearch(await ctxFor(0), "terrasses");
    const types = new Set(results.map((r) => r.type));
    expect(types).toEqual(new Set(["client", "worksite", "quote", "invoice"]));
    for (const t of types)
      expect(results.filter((r) => r.type === t).length).toBeLessThanOrEqual(5);
  });

  it("ne renvoie que les données de l'entreprise active", async () => {
    const { ctxFor, orgCount } = await setup();
    expect(orgCount).toBeGreaterThan(1);
    const a = await globalSearch(await ctxFor(0), "terrasses");
    const b = await globalSearch(await ctxFor(1), "terrasses");
    const idsA = new Set(a.map((r) => r.id));
    expect(b.some((r) => idsA.has(r.id))).toBe(false);
  });
});
