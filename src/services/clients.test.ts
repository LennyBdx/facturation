import { describe, expect, it } from "vitest";
import { DEMO_TODAY, DEMO_USER_ID } from "@/config/app";
import { createMemoryRepositories, createMemoryUnitOfWork } from "@/data/memory/repositories";
import { createMemoryDb } from "@/data/memory/store";
import { buildSeed } from "@/data/mock/seed";
import { compareMoney, sumMoney, ZERO } from "@/domain/money";
import type { EInvoicingProvider } from "@/integrations/e-invoicing";
import { invoiceRemaining } from "./builders";
import { archiveClient, restoreClient } from "./clients";
import { createContext } from "./context";
import { BusinessError } from "./errors";

async function setup() {
  const db = createMemoryDb(buildSeed());
  const repos = createMemoryRepositories(db);
  const user = (await repos.users.get(DEMO_USER_ID))!;
  const [org] = await repos.organizations.listForUser(user.id);
  const membership = (await repos.memberships.listByOrganization(org.id)).find(
    (m) => m.userId === user.id,
  )!;
  const ctx = createContext(
    {
      repos,
      uow: createMemoryUnitOfWork(db, repos),
      provider: {} as EInvoicingProvider,
      clock: { today: () => DEMO_TODAY, now: () => `${DEMO_TODAY}T10:00:00.000Z` },
    },
    { org, user, membership },
  );
  const clients = await repos.clients.list(org.id);
  const invoices = await repos.invoices.list(org.id);
  const dueOf = (id: string) =>
    sumMoney(invoices.filter((i) => i.clientId === id).map(invoiceRemaining));
  return {
    ctx,
    repos,
    debtor: clients.find((c) => compareMoney(dueOf(c.id), ZERO) > 0)!,
    settled: clients.find((c) => compareMoney(dueOf(c.id), ZERO) === 0)!,
  };
}

describe("archivage d'un client", () => {
  it("archive un client soldé, puis le restaure", async () => {
    const { ctx, repos, settled } = await setup();
    const archived = await archiveClient(ctx, settled.id);
    expect(archived.archivedAt).toBe(`${DEMO_TODAY}T10:00:00.000Z`);
    expect(
      (await repos.clients.list(ctx.orgId, { archived: false })).map((c) => c.id),
    ).not.toContain(settled.id);
    expect((await restoreClient(ctx, settled.id)).archivedAt).toBeNull();
  });

  it("refuse d'archiver un client qui doit encore de l'argent", async () => {
    const { ctx, debtor } = await setup();
    await expect(archiveClient(ctx, debtor.id)).rejects.toBeInstanceOf(BusinessError);
  });
});
