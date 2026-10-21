/**
 * Entités métier — pensées comme le futur schéma PostgreSQL.
 *
 * Conventions :
 * - chaque entité métier porte `id` (UUID) et `organizationId` ;
 * - dates : chaîne ISO `AAAA-MM-JJ` (`ISODate`) ou horodatage ISO complet (`ISODateTime`) ;
 * - montants : `Money` (chaîne décimale à 2 décimales), jamais `number` ;
 * - les champs EN 16931 utiles à Factur-X sont indiqués par leur identifiant (BT-xx).
 */
import type { InvoiceKind } from "@/domain/invoice-kinds";
import type { NumberingSeries } from "@/domain/numbering";
import type { LifecycleStatus } from "@/domain/lifecycle";
import type { Money, Percent, Quantity } from "@/domain/money";
import type { ProgressCumulative } from "@/domain/progress-billing";
import type { Discount } from "@/domain/quote";
import type { VatBreakdownLine, VatCategory } from "@/domain/vat";

export type {
  Discount,
  LifecycleStatus,
  Money,
  NumberingSeries,
  Percent,
  Quantity,
  VatBreakdownLine,
  VatCategory,
};

export type ID = string;
export type ISODate = string;
export type ISODateTime = string;

export interface Address {
  line1: string;
  line2?: string;
  postalCode: string;
  city: string;
  /** Code pays ISO 3166-1 alpha-2 (BT-40 / BT-55). */
  countryCode: string;
}

export interface Contact {
  name?: string;
  email?: string;
  phone?: string;
}

// --- Organisation, utilisateurs, équipe ---------------------------------------

export const LEGAL_FORMS = [
  "SAS",
  "SASU",
  "SARL",
  "EURL",
  "SA",
  "SNC",
  "EI",
  "Micro-entreprise",
] as const;
export type LegalForm = (typeof LEGAL_FORMS)[number];

export type EInvoicingConnectionStatus = "not_connected" | "pending" | "connected";
export type SubscriptionPlan = "essentiel" | "pro" | "entreprise";

export interface OrganizationSettings {
  numbering: {
    quote: NumberingSeries;
    invoice: NumberingSeries;
    creditNote: NumberingSeries;
  };
  /** Délai de paiement par défaut, en jours. */
  defaultPaymentTermsDays: number;
  /** Libellé des conditions de paiement (BT-20). */
  paymentTermsLabel: string;
  /** Taux annuel des pénalités de retard, en %. */
  latePenaltyRate: Percent;
  defaultRetentionRate: Percent;
  defaultDepositPercent: Percent;
  defaultQuoteValidityDays: number;
  /** Mentions légales libres ajoutées en pied de document. */
  customLegalMentions: string;
  branding: {
    /** URL du logo (aucun upload dans le prototype). */
    logoUrl: string | null;
    /** Couleur d'accent du document, hexadécimal. */
    accentColor: string;
  };
  eInvoicing: {
    platformId: string | null;
    connectionStatus: EInvoicingConnectionStatus;
    /** Adresse de réception déclarée à l'annuaire (identifiant de routage). */
    receptionAddress: string | null;
    connectedAt: ISODateTime | null;
  };
  plan: SubscriptionPlan;
}

export interface Organization {
  id: ID;
  /** Raison sociale (BT-27). */
  name: string;
  tradeName?: string;
  legalForm: LegalForm;
  shareCapital: Money;
  /** SIREN (BT-30, schéma 0002). */
  siren: string;
  siret: string;
  /** TVA intracommunautaire (BT-31). */
  vatNumber: string;
  apeCode: string;
  /** Immatriculation : « RCS Lyon », « RM 74 »… */
  registration: string;
  address: Address;
  contact: { email: string; phone: string; website?: string };
  /** Activité affichée (ex. « Électricité générale »). */
  activity: string;
  decennialInsurance: { insurer: string; policyNumber: string; coverageArea: string };
  bank: { iban: string; bic: string };
  settings: OrganizationSettings;
  createdAt: ISODateTime;
}

export interface User {
  id: ID;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  jobTitle?: string;
}

export type MemberRole = "owner" | "admin" | "member";

export interface Membership {
  id: ID;
  organizationId: ID;
  userId: ID;
  role: MemberRole;
  joinedAt: ISODateTime;
}

export interface Invitation {
  id: ID;
  organizationId: ID;
  email: string;
  role: Exclude<MemberRole, "owner">;
  invitedByUserId: ID;
  createdAt: ISODateTime;
  expiresAt: ISODateTime;
}

// --- Clients et chantiers ------------------------------------------------------

export type ClientKind = "general_contractor" | "private_owner" | "individual" | "public_buyer";

export interface Client {
  id: ID;
  organizationId: ID;
  kind: ClientKind;
  /** Raison sociale, ou « Prénom Nom » pour un particulier (BT-44). */
  name: string;
  /** SIREN de l'acheteur (BT-47), obligatoire pour un professionnel. */
  siren?: string;
  siret?: string;
  /** TVA de l'acheteur (BT-48). */
  vatNumber?: string;
  billingAddress: Address;
  contact: Contact;
  paymentTermsDays: number;
  /** Code service (acheteur public). */
  serviceCode?: string;
  notes?: string;
  /** Client archivé : masqué des listes et des choix, conservé sur ses documents. */
  archivedAt?: ISODateTime | null;
  createdAt: ISODateTime;
}

export type WorksiteStatus = "planned" | "in_progress" | "completed" | "closed";

export interface Worksite {
  id: ID;
  organizationId: ID;
  clientId: ID;
  reference: string;
  name: string;
  address: Address;
  startDate: ISODate;
  endDate?: ISODate;
  status: WorksiteStatus;
  /** Montant du marché HT (devis accepté et avenants). */
  contractAmount: Money;
  /** Référence du marché ou de la commande (BT-12 / BT-13). */
  marketReference?: string;
  /** Nous intervenons en sous-traitance. */
  isSubcontracting: boolean;
  /** Autoliquidation de la TVA (sous-traitance BTP). */
  reverseCharge: boolean;
  retentionRate: Percent;
  /** Retenue remplacée par une caution bancaire. */
  retentionReplacedByBond: boolean;
  /** Date de réception des travaux (point de départ du délai de garantie d'un an). */
  acceptanceDate?: ISODate;
  /** Retenue de garantie libérée (après le délai d'un an sans réserve). */
  retentionReleased: boolean;
  createdAt: ISODateTime;
}

// --- Devis --------------------------------------------------------------------

export const UNITS = ["u", "m", "m²", "m³", "ml", "h", "j", "forfait", "ens.", "kg", "l"] as const;
export type Unit = (typeof UNITS)[number];

export interface QuoteLine {
  id: ID;
  description: string;
  quantity: Quantity;
  unit: Unit;
  /** Prix unitaire HT (BT-146). */
  unitPrice: Money;
  vatRate: Percent;
  vatCategory: VatCategory;
}

export interface QuoteSection {
  id: ID;
  title: string;
  lines: QuoteLine[];
}

export type QuoteStatus = "draft" | "sent" | "accepted" | "refused" | "expired";

export interface Quote {
  id: ID;
  organizationId: ID;
  number: string;
  clientId: ID;
  worksiteId: ID | null;
  status: QuoteStatus;
  title: string;
  issueDate: ISODate;
  validUntil: ISODate;
  sentAt?: ISODateTime;
  decidedAt?: ISODateTime;
  refusalReason?: string;
  sections: QuoteSection[];
  discount: Discount;
  reverseCharge: boolean;
  depositPercent: Percent;
  /** Durée estimée des travaux, texte libre. */
  estimatedDuration?: string;
  notes?: string;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

// --- Factures émises ----------------------------------------------------------

/**
 * - `standard` : facture unique (petits travaux, dépannage) ;
 * - `deposit`  : facture d'acompte (code type 386) ;
 * - `progress` : facture de situation ;
 * - `final`    : facture de solde (dernière situation / décompte) ;
 * - `credit_note` : avoir (code type 381).
 */
export type { InvoiceKind };

export type OperationCategory = "services" | "goods" | "mixed";

export interface InvoiceLineProgress {
  contractNet: Money;
  previousPercent: Percent;
  currentPercent: Percent;
  previousAmount: Money;
  cumulativeAmount: Money;
}

export interface InvoiceLine {
  id: ID;
  /** Ligne de devis d'origine (situations). */
  quoteLineId?: ID;
  sectionTitle?: string;
  description: string;
  quantity: Quantity;
  unit: Unit;
  unitPrice: Money;
  vatRate: Percent;
  vatCategory: VatCategory;
  /** Montant net HT de la ligne (BT-131). */
  net: Money;
  progress?: InvoiceLineProgress;
}

export interface InvoiceTotals {
  /** Ventilation de TVA (BG-23). */
  vatBreakdown: VatBreakdownLine[];
  /** Total HT (BT-109). */
  net: Money;
  /** Total TVA (BT-110). */
  vat: Money;
  /** Total TTC (BT-112). */
  gross: Money;
  /** Remise de la période (situations) ou remise globale. */
  discount: Money;
  /** Déduction d'acompte HT de la période. */
  depositDeduction: Money;
  /** Retenue de garantie de la période. */
  retention: Money;
  /** Net à payer (BT-115). */
  netToPay: Money;
}

export interface SellerSnapshot {
  name: string;
  legalForm: string;
  shareCapital: Money;
  siren: string;
  siret: string;
  vatNumber: string;
  registration: string;
  address: Address;
  contact: { email: string; phone: string };
  decennialInsurance: Organization["decennialInsurance"];
  bank: Organization["bank"];
}

export interface BuyerSnapshot {
  name: string;
  kind: ClientKind;
  siren?: string;
  siret?: string;
  vatNumber?: string;
  address: Address;
  serviceCode?: string;
}

export type PaymentMethod = "transfer" | "check" | "card" | "cash" | "other";

export interface Payment {
  id: ID;
  date: ISODate;
  amount: Money;
  method: PaymentMethod;
  reference?: string;
}

export type LifecycleActor = "platform" | "buyer" | "seller" | "administration";

export interface LifecycleEvent {
  id: ID;
  status: LifecycleStatus;
  at: ISODateTime;
  actor: LifecycleActor;
  comment?: string;
}

export interface EInvoicingState {
  /** Identifiant attribué par la plateforme agréée. */
  platformInvoiceId: string | null;
  status: LifecycleStatus | null;
  events: LifecycleEvent[];
}

export interface Invoice {
  id: ID;
  organizationId: ID;
  /** Attribué à l'émission (BT-1) ; `null` pour un brouillon. */
  number: string | null;
  kind: InvoiceKind;
  clientId: ID;
  worksiteId: ID | null;
  quoteId: ID | null;
  /** Avoir : facture corrigée (BT-25). */
  correctedInvoiceId: ID | null;
  /** Facture annulée par cet avoir. */
  cancelledByCreditNoteId: ID | null;
  title: string;
  /** Date d'émission (BT-2), prévisionnelle tant que la facture est en brouillon. */
  issueDate: ISODate;
  /** Date de fin de période / des travaux (BT-72 ou BG-14). */
  deliveryDate?: ISODate;
  /** Date d'échéance (BT-9). */
  dueDate: ISODate;
  paymentTermsLabel: string;
  latePenaltyRate: Percent;
  operationCategory: OperationCategory;
  /** Référence de commande ou de marché (BT-13 / BT-12). */
  orderReference?: string;
  reverseCharge: boolean;
  /** Facture d'acompte : pourcentage du marché. */
  depositPercent?: Percent;
  /** Situation : numéro, taux de retenue et cumul servant de base à la suivante. */
  progress: {
    index: number;
    retentionRate: Percent;
    overallPercent: Percent;
    cumulative: ProgressCumulative;
  } | null;
  lines: InvoiceLine[];
  totals: InvoiceTotals;
  /** Données figées à l'émission. */
  seller: SellerSnapshot | null;
  buyer: BuyerSnapshot | null;
  issuedAt: ISODateTime | null;
  payments: Payment[];
  eInvoicing: EInvoicingState;
  notes?: string;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

// --- Factures reçues ----------------------------------------------------------

export type ReceivedInvoiceCategory =
  "materials" | "equipment_rental" | "subcontracting" | "services" | "other";

export interface ReceivedInvoiceLine {
  id: ID;
  description: string;
  quantity: Quantity;
  unit: Unit;
  unitPrice: Money;
  vatRate: Percent;
  net: Money;
}

export interface ReceivedInvoice {
  id: ID;
  organizationId: ID;
  supplier: {
    name: string;
    siren: string;
    vatNumber?: string;
    address: Address;
  };
  number: string;
  issueDate: ISODate;
  dueDate: ISODate;
  category: ReceivedInvoiceCategory;
  reverseCharge: boolean;
  lines: ReceivedInvoiceLine[];
  vatBreakdown: VatBreakdownLine[];
  net: Money;
  vat: Money;
  gross: Money;
  worksiteId: ID | null;
  orderReference?: string;
  receivedAt: ISODateTime;
  platformInvoiceId: string;
  status: LifecycleStatus;
  events: LifecycleEvent[];
  /** Motif de refus ou de litige saisi par l'utilisateur. */
  statusReason?: string;
  paidAt?: ISODate;
}

// --- Entrées de création (formulaires) ---------------------------------------

export type ClientInput = Omit<Client, "id" | "organizationId" | "createdAt">;
export type WorksiteInput = Omit<Worksite, "id" | "organizationId" | "createdAt">;
export type QuoteInput = Omit<
  Quote,
  "id" | "organizationId" | "number" | "createdAt" | "updatedAt"
>;
export type InvoiceInput = Omit<Invoice, "id" | "organizationId" | "createdAt" | "updatedAt">;
export type InvitationInput = Pick<Invitation, "email" | "role" | "invitedByUserId">;
