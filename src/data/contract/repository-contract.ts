/**
 * Contrat commun des repositories : toute implémentation (mémoire, PostgreSQL…)
 * doit passer cette suite. Usage : `describeRepositoryContract("postgres", () => …)`.
 */
import { describe, expect, it } from "vitest";
import type { Repositories, UnitOfWork } from "../repositories";

export interface ContractSubject {
  repos: Repositories;
  uow: UnitOfWork;
  /** Deux entreprises distinctes présentes dans le jeu de données. */
  orgA: string;
  orgB: string;
}

export function describeRepositoryContract(name: string, factory: () => Promise<ContractSubject>) {
  describe(`contrat des repositories — ${name}`, () => {
    it("isole les données par entreprise", async () => {
      const { repos, orgA, orgB } = await factory();
      const [client] = await repos.clients.list(orgA);
      expect(client).toBeDefined();
      expect(await repos.clients.get(orgB, client.id)).toBeNull();
      expect((await repos.clients.list(orgB)).some((c) => c.id === client.id)).toBe(false);
    });

    it("renvoie des copies : modifier un objet lu ne modifie pas la source", async () => {
      const { repos, orgA } = await factory();
      const [client] = await repos.clients.list(orgA);
      client.name = "Altéré hors repository";
      expect((await repos.clients.get(orgA, client.id))?.name).not.toBe("Altéré hors repository");
    });

    it("crée, relit et met à jour", async () => {
      const { repos, orgA } = await factory();
      const [model] = await repos.clients.list(orgA);
      const { id: _id, organizationId: _org, createdAt: _at, ...input } = model;
      const created = await repos.clients.create(orgA, { ...input, name: "Client du contrat" });
      expect(created.organizationId).toBe(orgA);
      expect((await repos.clients.get(orgA, created.id))?.name).toBe("Client du contrat");
      const updated = await repos.clients.update(orgA, created.id, { name: "Renommé" });
      expect(updated.name).toBe("Renommé");
    });

    it("filtre par recherche textuelle", async () => {
      const { repos, orgA } = await factory();
      const [client] = await repos.clients.list(orgA);
      const found = await repos.clients.list(orgA, { search: client.name.slice(0, 5) });
      expect(found.map((c) => c.id)).toContain(client.id);
    });

    it("filtre les clients archivés ou actifs", async () => {
      const { repos, orgA } = await factory();
      const [client] = await repos.clients.list(orgA);
      await repos.clients.update(orgA, client.id, { archivedAt: "2026-10-18T10:00:00.000Z" });
      const ids = async (archived?: boolean) =>
        (await repos.clients.list(orgA, { archived })).map((c) => c.id);
      expect(await ids(true)).toEqual([client.id]);
      expect(await ids(false)).not.toContain(client.id);
      expect(await ids()).toContain(client.id);
      await repos.clients.update(orgA, client.id, { archivedAt: null });
      expect(await ids(false)).toContain(client.id);
    });

    it("réserve des numéros strictement croissants", async () => {
      const { repos, orgA } = await factory();
      const a = await repos.organizations.takeNextNumber(orgA, "invoice", "2026-10-18");
      const b = await repos.organizations.takeNextNumber(orgA, "invoice", "2026-10-18");
      expect(a).not.toBe(b);
      expect(Number(b.match(/(\d+)$/)![1])).toBe(Number(a.match(/(\d+)$/)![1]) + 1);
    });

    it("l'unité de travail est atomique", async () => {
      const { repos, uow, orgA } = await factory();
      const before = await repos.organizations.takeNextNumber(orgA, "quote", "2026-10-18");
      await expect(
        uow.run(async (r) => {
          await r.organizations.takeNextNumber(orgA, "quote", "2026-10-18");
          throw new Error("rollback");
        }),
      ).rejects.toThrow("rollback");
      const after = await repos.organizations.takeNextNumber(orgA, "quote", "2026-10-18");
      expect(Number(after.match(/(\d+)$/)![1])).toBe(Number(before.match(/(\d+)$/)![1]) + 1);
    });
  });
}
