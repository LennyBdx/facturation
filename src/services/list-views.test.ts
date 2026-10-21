import { describe, expect, it } from "vitest";
import { DEMO_TODAY, DEMO_USER_ID } from "@/config/app";
import { createMemoryRepositories, createMemoryUnitOfWork } from "@/data/memory/repositories";
import { createMemoryDb } from "@/data/memory/store";
import { buildSeed } from "@/data/mock/seed";
import type { EInvoicingProvider } from "@/integrations/e-invoicing";
import { compareMoney, ZERO } from "@/domain/money";
import { createContext } from "./context";
import { clientRows, invoiceRows, receivedRows } from "./list-views";

async function setup() {
  const db = createMemoryDb(buildSeed());
  const repos = createMemoryRepositories(db);
  const user = (await repos.users.get(DEMO_USER_ID))!;
  const [org] = await repos.organizations.listForUser(user.id);
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
}

describe("listes : filtre et tri", () => {
  it("factures : tri par défaut sur l'émission, la plus récente d'abord", async () => {
    const { rows, sort } = await invoiceRows(await setup(), {});
    expect(sort).toEqual({ key: "emission", dir: "desc" });
    const dates = rows.map((r) => r.invoice.issueDate);
    expect(dates).toEqual([...dates].sort().reverse());
  });

  it("factures : filtre « reste à encaisser » et tri par montant décroissant", async () => {
    const { rows, narrowed } = await invoiceRows(await setup(), {
      filtre: "a-encaisser",
      tri: "-montant",
    });
    expect(narrowed).toBe(true);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => compareMoney(r.remaining, ZERO) > 0)).toBe(true);
    const amounts = rows.map((r) => Number(r.invoice.totals.netToPay));
    expect(amounts).toEqual([...amounts].sort((a, b) => b - a));
  });

  it("clients : tri alphabétique et clé de tri inconnue ignorée", async () => {
    const { rows, sort } = await clientRows(await setup(), { tri: "inconnu" }, []);
    expect(sort).toEqual({ key: "nom", dir: "asc" });
    const names = rows.map((r) => r.client.name);
    expect(names).toEqual(
      [...names].sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" })),
    );
  });

  it("factures reçues : filtre inconnu = pas de filtre", async () => {
    const ctx = await setup();
    const all = await receivedRows(ctx, {});
    const unknown = await receivedRows(ctx, { filtre: "nimporte" });
    expect(unknown.rows).toHaveLength(all.rows.length);
  });
});
