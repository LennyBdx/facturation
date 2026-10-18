/**
 * Contrat attendu d'une plateforme agréée (PA) de facturation électronique.
 *
 * Notre produit est une « solution compatible » : il crée les factures, les transmet
 * à la plateforme agréée choisie par l'entreprise, reçoit les factures fournisseurs
 * et affiche les statuts du cycle de vie. La plateforme agréée émet, transmet,
 * reçoit les factures et alimente l'administration fiscale.
 *
 * Pour brancher une vraie plateforme : implémenter cette interface avec son API
 * (génération Factur-X / UBL / CII à partir de `Invoice`, authentification, webhooks
 * de statuts) et la renvoyer depuis `./index.ts`.
 */
import type { LifecycleStatus, ReceivedInvoiceAction } from "@/domain/lifecycle";
import type { Invoice, LifecycleEvent, ReceivedInvoice } from "@/data/types";

export interface PlatformInfo {
  id: string;
  name: string;
  description: string;
}

export interface SubmitResult {
  platformInvoiceId: string;
  status: LifecycleStatus;
  events: LifecycleEvent[];
}

export interface StatusResult {
  status: LifecycleStatus;
  /** Historique complet connu de la plateforme. */
  events: LifecycleEvent[];
}

/** Facture fournisseur telle que transmise par la plateforme. */
export type IncomingInvoice = Omit<ReceivedInvoice, "id" | "organizationId" | "worksiteId" | "statusReason" | "paidAt">;

export interface EInvoicingProvider {
  /** Plateformes disponibles (annuaire). */
  listPlatforms(): Promise<PlatformInfo[]>;

  /** Dépose une facture émise (numérotée, parties figées) sur la plateforme. */
  submitInvoice(invoice: Invoice): Promise<SubmitResult>;

  /** Statuts d'une facture émise. `null` si la plateforme ne la connaît pas. */
  getInvoiceStatus(platformInvoiceId: string): Promise<StatusResult | null>;

  /** Déclare l'encaissement (statut 212, obligatoire si TVA exigible à l'encaissement). */
  reportPayment(platformInvoiceId: string, payment: { date: string; amount: string }): Promise<LifecycleEvent>;

  /** Factures fournisseurs reçues à l'adresse de réception de l'entreprise. */
  listReceivedInvoices(receptionAddress: string): Promise<IncomingInvoice[]>;

  /** Met à jour le statut d'une facture reçue (approuver, refuser, litige, payée). */
  updateReceivedInvoiceStatus(
    platformInvoiceId: string,
    action: ReceivedInvoiceAction,
    reason?: string,
  ): Promise<LifecycleEvent>;
}

export class EInvoicingError extends Error {}
