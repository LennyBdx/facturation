import { assignNextNumber } from "@/domain/numbering";
import "server-only";
import { NotFoundError, type Repositories, type UnitOfWork } from "../repositories";
import type { Invoice, Quote } from "../types";
import { clone, matches, type MemoryDb, newId, nowIso } from "./store";

const byNewest = <T extends { createdAt: string }>(a: T, b: T) =>
  b.createdAt.localeCompare(a.createdAt);
const byDateDesc = (
  a: { issueDate: string; createdAt: string },
  b: { issueDate: string; createdAt: string },
) => b.issueDate.localeCompare(a.issueDate) || byNewest(a, b);

function scoped<T extends { organizationId: string }>(
  map: Map<string, T>,
  organizationId: string,
): T[] {
  return [...map.values()].filter((row) => row.organizationId === organizationId);
}

function getScoped<T extends { organizationId: string }>(
  map: Map<string, T>,
  organizationId: string,
  id: string,
): T | null {
  const row = map.get(id);
  return row && row.organizationId === organizationId ? clone(row) : null;
}

function requireScoped<T extends { organizationId: string }>(
  map: Map<string, T>,
  entity: string,
  organizationId: string,
  id: string,
): T {
  const row = map.get(id);
  if (!row || row.organizationId !== organizationId) throw new NotFoundError(entity, id);
  return row;
}

/** Implémentation en mémoire de tous les repositories. */
export function createMemoryRepositories(db: MemoryDb): Repositories {
  return {
    organizations: {
      async listForUser(userId) {
        const orgIds = new Set(
          [...db.memberships.values()]
            .filter((m) => m.userId === userId)
            .map((m) => m.organizationId),
        );
        return [...db.organizations.values()].filter((o) => orgIds.has(o.id)).map(clone);
      },
      async get(id) {
        const org = db.organizations.get(id);
        return org ? clone(org) : null;
      },
      async create(input) {
        const org = { ...clone(input), id: newId(), createdAt: nowIso() };
        db.organizations.set(org.id, org);
        return clone(org);
      },
      async update(id, patch) {
        const org = db.organizations.get(id);
        if (!org) throw new NotFoundError("Entreprise", id);
        const updated = { ...org, ...clone(patch), id };
        db.organizations.set(id, updated);
        return clone(updated);
      },
      async takeNextNumber(id, kind, issueDate) {
        const org = db.organizations.get(id);
        if (!org) throw new NotFoundError("Entreprise", id);
        const { number, series } = assignNextNumber(org.settings.numbering[kind], issueDate);
        org.settings.numbering[kind] = series;
        return number;
      },
    },

    users: {
      async get(id) {
        const user = db.users.get(id);
        return user ? clone(user) : null;
      },
      async listByIds(ids) {
        return ids
          .map((id) => db.users.get(id))
          .filter((u) => u !== undefined)
          .map(clone);
      },
    },

    memberships: {
      async listByOrganization(organizationId) {
        return scoped(db.memberships, organizationId).map(clone);
      },
      async listByUser(userId) {
        return [...db.memberships.values()].filter((m) => m.userId === userId).map(clone);
      },
      async updateRole(organizationId, id, role) {
        const m = requireScoped(db.memberships, "Membre", organizationId, id);
        m.role = role;
        return clone(m);
      },
    },

    invitations: {
      async list(organizationId) {
        return scoped(db.invitations, organizationId).sort(byNewest).map(clone);
      },
      async create(organizationId, input) {
        const createdAt = nowIso();
        const invitation = {
          ...input,
          id: newId(),
          organizationId,
          createdAt,
          expiresAt: new Date(Date.parse(createdAt) + 7 * 86_400_000).toISOString(),
        };
        db.invitations.set(invitation.id, invitation);
        return clone(invitation);
      },
      async delete(organizationId, id) {
        requireScoped(db.invitations, "Invitation", organizationId, id);
        db.invitations.delete(id);
      },
    },

    clients: {
      async list(organizationId, filter = {}) {
        return scoped(db.clients, organizationId)
          .filter((c) => !filter.kind || c.kind === filter.kind)
          .filter((c) =>
            matches(
              [c.name, c.siren, c.billingAddress.city, c.contact.name, c.contact.email],
              filter.search,
            ),
          )
          .sort((a, b) => a.name.localeCompare(b.name, "fr"))
          .map(clone);
      },
      async get(organizationId, id) {
        return getScoped(db.clients, organizationId, id);
      },
      async create(organizationId, input) {
        const client = { ...clone(input), id: newId(), organizationId, createdAt: nowIso() };
        db.clients.set(client.id, client);
        return clone(client);
      },
      async update(organizationId, id, patch) {
        const current = requireScoped(db.clients, "Client", organizationId, id);
        const updated = { ...current, ...clone(patch) };
        db.clients.set(id, updated);
        return clone(updated);
      },
    },

    worksites: {
      async list(organizationId, filter = {}) {
        return scoped(db.worksites, organizationId)
          .filter((w) => !filter.status || w.status === filter.status)
          .filter((w) => !filter.clientId || w.clientId === filter.clientId)
          .filter((w) => matches([w.name, w.reference, w.address.city], filter.search))
          .sort((a, b) => b.startDate.localeCompare(a.startDate))
          .map(clone);
      },
      async get(organizationId, id) {
        return getScoped(db.worksites, organizationId, id);
      },
      async create(organizationId, input) {
        const worksite = { ...clone(input), id: newId(), organizationId, createdAt: nowIso() };
        db.worksites.set(worksite.id, worksite);
        return clone(worksite);
      },
      async update(organizationId, id, patch) {
        const current = requireScoped(db.worksites, "Chantier", organizationId, id);
        const updated = { ...current, ...clone(patch) };
        db.worksites.set(id, updated);
        return clone(updated);
      },
    },

    quotes: {
      async list(organizationId, filter = {}) {
        return scoped(db.quotes, organizationId)
          .filter((q) => !filter.status || q.status === filter.status)
          .filter((q) => !filter.clientId || q.clientId === filter.clientId)
          .filter((q) => !filter.worksiteId || q.worksiteId === filter.worksiteId)
          .filter((q) => matches([q.number, q.title], filter.search))
          .sort(byDateDesc)
          .map(clone);
      },
      async get(organizationId, id) {
        return getScoped(db.quotes, organizationId, id);
      },
      async create(organizationId, input) {
        const now = nowIso();
        const quote: Quote = {
          ...clone(input),
          id: newId(),
          organizationId,
          createdAt: now,
          updatedAt: now,
        };
        db.quotes.set(quote.id, quote);
        return clone(quote);
      },
      async update(organizationId, id, patch) {
        const current = requireScoped(db.quotes, "Devis", organizationId, id);
        const updated: Quote = { ...current, ...clone(patch), updatedAt: nowIso() };
        db.quotes.set(id, updated);
        return clone(updated);
      },
    },

    invoices: {
      async list(organizationId, filter = {}) {
        return scoped(db.invoices, organizationId)
          .filter((i) => !filter.clientId || i.clientId === filter.clientId)
          .filter((i) => !filter.worksiteId || i.worksiteId === filter.worksiteId)
          .filter((i) => !filter.quoteId || i.quoteId === filter.quoteId)
          .filter((i) => matches([i.number, i.title, i.buyer?.name], filter.search))
          .sort(byDateDesc)
          .map(clone);
      },
      async get(organizationId, id) {
        return getScoped(db.invoices, organizationId, id);
      },
      async create(organizationId, input) {
        const now = nowIso();
        const invoice: Invoice = {
          ...clone(input),
          id: newId(),
          organizationId,
          createdAt: now,
          updatedAt: now,
        };
        db.invoices.set(invoice.id, invoice);
        return clone(invoice);
      },
      async update(organizationId, id, patch) {
        const current = requireScoped(db.invoices, "Facture", organizationId, id);
        const updated: Invoice = { ...current, ...clone(patch), updatedAt: nowIso() };
        db.invoices.set(id, updated);
        return clone(updated);
      },
      async delete(organizationId, id) {
        requireScoped(db.invoices, "Facture", organizationId, id);
        db.invoices.delete(id);
      },
    },

    receivedInvoices: {
      async list(organizationId, filter = {}) {
        return scoped(db.receivedInvoices, organizationId)
          .filter((r) => !filter.worksiteId || r.worksiteId === filter.worksiteId)
          .filter((r) => matches([r.number, r.supplier.name], filter.search))
          .sort((a, b) => b.receivedAt.localeCompare(a.receivedAt))
          .map(clone);
      },
      async get(organizationId, id) {
        return getScoped(db.receivedInvoices, organizationId, id);
      },
      async upsert(organizationId, invoice) {
        const existing = [...db.receivedInvoices.values()].find(
          (r) =>
            r.organizationId === organizationId &&
            r.platformInvoiceId === invoice.platformInvoiceId,
        );
        const row = existing
          ? { ...existing, status: invoice.status, events: clone(invoice.events) }
          : { ...clone(invoice), organizationId };
        db.receivedInvoices.set(row.id, row);
        return clone(row);
      },
      async update(organizationId, id, patch) {
        const current = requireScoped(db.receivedInvoices, "Facture reçue", organizationId, id);
        const updated = { ...current, ...clone(patch) };
        db.receivedInvoices.set(id, updated);
        return clone(updated);
      },
    },
  };
}

/**
 * Unité de travail en mémoire : les travaux sont sérialisés (un à la fois) et
 * l'état de la base est restauré si le travail échoue.
 */
export function createMemoryUnitOfWork(db: MemoryDb, repos: Repositories): UnitOfWork {
  let queue: Promise<unknown> = Promise.resolve();
  return {
    run<T>(work: (repos: Repositories) => Promise<T>): Promise<T> {
      const next = queue.then(async () => {
        const snapshot = Object.fromEntries(
          Object.entries(db).map(([k, map]) => [k, clone(map)]),
        ) as unknown as MemoryDb;
        try {
          return await work(repos);
        } catch (error) {
          for (const key of Object.keys(db) as (keyof MemoryDb)[]) {
            const target = db[key] as Map<string, unknown>;
            target.clear();
            for (const [id, row] of snapshot[key] as Map<string, unknown>) target.set(id, row);
          }
          throw error;
        }
      });
      queue = next.catch(() => undefined);
      return next;
    },
  };
}
