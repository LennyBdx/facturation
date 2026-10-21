/**
 * Interfaces des repositories : seul contrat connu des pages et des services.
 * L'implémentation en mémoire (`./memory`) sera remplacée par une implémentation
 * PostgreSQL sans toucher aux appelants.
 *
 * Toutes les méthodes sont asynchrones et filtrent par `organizationId`
 * (isolation multi-entreprise).
 */
import type {
  Client,
  ClientInput,
  ClientKind,
  ID,
  Invitation,
  InvitationInput,
  Invoice,
  InvoiceInput,
  Membership,
  Organization,
  Quote,
  QuoteInput,
  QuoteStatus,
  ReceivedInvoice,
  User,
  Worksite,
  WorksiteInput,
  WorksiteStatus,
} from "./types";

export type NumberingKind = "quote" | "invoice" | "creditNote";

export interface OrganizationRepository {
  listForUser(userId: ID): Promise<Organization[]>;
  get(id: ID): Promise<Organization | null>;
  create(input: Omit<Organization, "id" | "createdAt">): Promise<Organization>;
  update(id: ID, patch: Partial<Omit<Organization, "id">>): Promise<Organization>;
  /**
   * Réserve atomiquement le prochain numéro d'une série et incrémente le compteur.
   * En base : `UPDATE … RETURNING` dans la transaction d'émission.
   */
  takeNextNumber(id: ID, kind: NumberingKind, issueDate: string): Promise<string>;
}

export interface UserRepository {
  get(id: ID): Promise<User | null>;
  listByIds(ids: readonly ID[]): Promise<User[]>;
}

export interface MembershipRepository {
  listByOrganization(organizationId: ID): Promise<Membership[]>;
  listByUser(userId: ID): Promise<Membership[]>;
  updateRole(organizationId: ID, id: ID, role: Membership["role"]): Promise<Membership>;
}

export interface InvitationRepository {
  list(organizationId: ID): Promise<Invitation[]>;
  create(organizationId: ID, input: InvitationInput): Promise<Invitation>;
  delete(organizationId: ID, id: ID): Promise<void>;
}

export interface ClientFilter {
  search?: string;
  kind?: ClientKind;
}

export interface ClientRepository {
  list(organizationId: ID, filter?: ClientFilter): Promise<Client[]>;
  get(organizationId: ID, id: ID): Promise<Client | null>;
  create(organizationId: ID, input: ClientInput): Promise<Client>;
  update(organizationId: ID, id: ID, patch: Partial<ClientInput>): Promise<Client>;
}

export interface WorksiteFilter {
  search?: string;
  status?: WorksiteStatus;
  clientId?: ID;
}

export interface WorksiteRepository {
  list(organizationId: ID, filter?: WorksiteFilter): Promise<Worksite[]>;
  get(organizationId: ID, id: ID): Promise<Worksite | null>;
  create(organizationId: ID, input: WorksiteInput): Promise<Worksite>;
  update(organizationId: ID, id: ID, patch: Partial<WorksiteInput>): Promise<Worksite>;
}

export interface QuoteFilter {
  search?: string;
  status?: QuoteStatus;
  clientId?: ID;
  worksiteId?: ID;
}

export interface QuoteRepository {
  list(organizationId: ID, filter?: QuoteFilter): Promise<Quote[]>;
  get(organizationId: ID, id: ID): Promise<Quote | null>;
  create(organizationId: ID, input: QuoteInput & { number: string }): Promise<Quote>;
  update(organizationId: ID, id: ID, patch: Partial<QuoteInput>): Promise<Quote>;
}

export interface InvoiceFilter {
  search?: string;
  clientId?: ID;
  worksiteId?: ID;
  quoteId?: ID;
}

export interface InvoiceRepository {
  list(organizationId: ID, filter?: InvoiceFilter): Promise<Invoice[]>;
  get(organizationId: ID, id: ID): Promise<Invoice | null>;
  create(organizationId: ID, input: InvoiceInput): Promise<Invoice>;
  update(organizationId: ID, id: ID, patch: Partial<InvoiceInput>): Promise<Invoice>;
  /** Suppression autorisée uniquement pour un brouillon (contrôlé par le service). */
  delete(organizationId: ID, id: ID): Promise<void>;
}

export interface ReceivedInvoiceFilter {
  search?: string;
  worksiteId?: ID;
}

export interface ReceivedInvoiceRepository {
  list(organizationId: ID, filter?: ReceivedInvoiceFilter): Promise<ReceivedInvoice[]>;
  get(organizationId: ID, id: ID): Promise<ReceivedInvoice | null>;
  /** Insère ou met à jour à partir des données de la plateforme agréée. */
  upsert(organizationId: ID, invoice: ReceivedInvoice): Promise<ReceivedInvoice>;
  update(organizationId: ID, id: ID, patch: Partial<Omit<ReceivedInvoice, "id" | "organizationId">>): Promise<ReceivedInvoice>;
}

export interface Repositories {
  organizations: OrganizationRepository;
  users: UserRepository;
  memberships: MembershipRepository;
  invitations: InvitationRepository;
  clients: ClientRepository;
  worksites: WorksiteRepository;
  quotes: QuoteRepository;
  invoices: InvoiceRepository;
  receivedInvoices: ReceivedInvoiceRepository;
}

/**
 * Unité de travail : exécute plusieurs écritures de façon atomique (tout ou rien).
 * En base : une transaction SQL. En mémoire : instantané puis restauration en cas d'erreur.
 */
export interface UnitOfWork {
  run<T>(work: (repos: Repositories) => Promise<T>): Promise<T>;
}

export class NotFoundError extends Error {
  constructor(entity: string, id: string) {
    super(`${entity} introuvable (${id}).`);
  }
}
