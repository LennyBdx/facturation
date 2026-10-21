import "server-only";
import type {
  Client,
  Invitation,
  Invoice,
  Membership,
  Organization,
  Quote,
  ReceivedInvoice,
  User,
  Worksite,
} from "../types";

/** Base de données en mémoire : une Map par table. */
export interface MemoryDb {
  organizations: Map<string, Organization>;
  users: Map<string, User>;
  memberships: Map<string, Membership>;
  invitations: Map<string, Invitation>;
  clients: Map<string, Client>;
  worksites: Map<string, Worksite>;
  quotes: Map<string, Quote>;
  invoices: Map<string, Invoice>;
  receivedInvoices: Map<string, ReceivedInvoice>;
}

export interface SeedData {
  organizations: Organization[];
  users: User[];
  memberships: Membership[];
  invitations: Invitation[];
  clients: Client[];
  worksites: Worksite[];
  quotes: Quote[];
  invoices: Invoice[];
  receivedInvoices: ReceivedInvoice[];
}

const toMap = <T extends { id: string }>(rows: readonly T[]) => new Map(rows.map((r) => [r.id, structuredClone(r)]));

export function createMemoryDb(seed: SeedData): MemoryDb {
  return {
    organizations: toMap(seed.organizations),
    users: toMap(seed.users),
    memberships: toMap(seed.memberships),
    invitations: toMap(seed.invitations),
    clients: toMap(seed.clients),
    worksites: toMap(seed.worksites),
    quotes: toMap(seed.quotes),
    invoices: toMap(seed.invoices),
    receivedInvoices: toMap(seed.receivedInvoices),
  };
}

/** Copie défensive : un appelant ne peut jamais modifier la base par référence. */
export const clone = <T>(value: T): T => structuredClone(value);

export function newId(): string {
  return crypto.randomUUID();
}

export function nowIso(): string {
  return new Date().toISOString();
}

/** Recherche insensible à la casse et aux accents. */
export function matches(haystack: readonly (string | undefined | null)[], needle?: string): boolean {
  if (!needle?.trim()) return true;
  const norm = (s: string) =>
    s
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase();
  const n = norm(needle.trim());
  return haystack.some((h) => h && norm(h).includes(n));
}
