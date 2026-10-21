/**
 * Colonnes des exports CSV, par liste. Les lignes viennent de `services/list-views`
 * (mêmes recherche, filtre et tri que l'écran).
 */
import "server-only";
import {
  CLIENT_KIND_LABELS,
  INVOICE_KIND_LABELS,
  LIFECYCLE_STATUS,
  PAYMENT_STATUS,
  QUOTE_STATUS,
  RECEIVED_CATEGORY_LABELS,
  WORKSITE_STATUS,
} from "@/components/status/status-config";
import type { ExportList } from "@/config/routes";
import type { QuoteStatus } from "@/data/types";
import { type InvoiceKind, kindRules } from "@/domain/invoice-kinds";
import { type CsvColumn, csvDate, csvMoney, toCsv } from "@/lib/csv";
import type { Context } from "@/services/context";
import {
  clientRows,
  invoiceRows,
  type ListParams,
  quoteRows,
  receivedRows,
  worksiteRows,
} from "@/services/list-views";
import { CLIENT_KINDS } from "../clients/schemas";
import { WORKSITE_STATUSES } from "../worksites/schemas";

const QUOTE_STATUSES = Object.keys(QUOTE_STATUS) as QuoteStatus[];

/** Montant signé : un avoir apparaît en négatif dans le tableur. */
const signed = (kind: InvoiceKind, value: string) =>
  csvMoney(kindRules(kind).sign < 0 && value !== "0.00" ? `-${value}` : value);

export interface CsvExport {
  /** Nom de base du fichier (la date du jour est ajoutée par la route). */
  filename: string;
  content: string;
}

export async function buildCsvExport(
  ctx: Context,
  list: ExportList,
  params: ListParams,
): Promise<CsvExport> {
  switch (list) {
    case "clients": {
      const { rows } = await clientRows(ctx, params, CLIENT_KINDS);
      type R = (typeof rows)[number];
      const columns: CsvColumn<R>[] = [
        { header: "Nom", value: (r) => r.client.name },
        { header: "Type", value: (r) => CLIENT_KIND_LABELS[r.client.kind] },
        { header: "SIREN", value: (r) => r.client.siren },
        { header: "SIRET", value: (r) => r.client.siret },
        { header: "N° TVA", value: (r) => r.client.vatNumber },
        { header: "Adresse", value: (r) => r.client.billingAddress.line1 },
        { header: "Code postal", value: (r) => r.client.billingAddress.postalCode },
        { header: "Ville", value: (r) => r.client.billingAddress.city },
        { header: "E-mail", value: (r) => r.client.contact?.email },
        { header: "Téléphone", value: (r) => r.client.contact?.phone },
        { header: "Délai de paiement (jours)", value: (r) => r.client.paymentTermsDays },
        { header: "Solde dû", value: (r) => csvMoney(r.due) },
      ];
      return { filename: "clients", content: toCsv(rows, columns) };
    }
    case "chantiers": {
      const { rows } = await worksiteRows(ctx, params, WORKSITE_STATUSES);
      type R = (typeof rows)[number];
      const columns: CsvColumn<R>[] = [
        { header: "Chantier", value: (r) => r.worksite.name },
        { header: "Client", value: (r) => r.clientName },
        { header: "Ville", value: (r) => r.worksite.address.city },
        { header: "Statut", value: (r) => WORKSITE_STATUS[r.worksite.status].label },
        { header: "Autoliquidation", value: (r) => (r.worksite.reverseCharge ? "Oui" : "Non") },
        { header: "Marché HT", value: (r) => csvMoney(r.worksite.contractAmount) },
        { header: "Avancement facturé (%)", value: (r) => csvMoney(r.progress) },
      ];
      return { filename: "chantiers", content: toCsv(rows, columns) };
    }
    case "devis": {
      const { rows } = await quoteRows(ctx, params, QUOTE_STATUSES);
      type R = (typeof rows)[number];
      const columns: CsvColumn<R>[] = [
        { header: "Numéro", value: (r) => r.quote.number },
        { header: "Objet", value: (r) => r.quote.title },
        { header: "Client", value: (r) => r.clientName },
        { header: "Date", value: (r) => csvDate(r.quote.issueDate) },
        { header: "Validité", value: (r) => csvDate(r.quote.validUntil) },
        { header: "Statut", value: (r) => QUOTE_STATUS[r.status].label },
        { header: "Total HT", value: (r) => csvMoney(r.net) },
        { header: "Total TTC", value: (r) => csvMoney(r.gross) },
      ];
      return { filename: "devis", content: toCsv(rows, columns) };
    }
    case "factures": {
      const { rows } = await invoiceRows(ctx, params);
      type R = (typeof rows)[number];
      const columns: CsvColumn<R>[] = [
        { header: "Numéro", value: (r) => r.invoice.number ?? "Brouillon" },
        { header: "Type", value: (r) => INVOICE_KIND_LABELS[r.invoice.kind] },
        { header: "Client", value: (r) => r.clientName },
        { header: "Intitulé", value: (r) => r.invoice.title },
        { header: "Émission", value: (r) => csvDate(r.invoice.issueDate) },
        {
          header: "Échéance",
          value: (r) => (kindRules(r.invoice.kind).isReceivable ? csvDate(r.invoice.dueDate) : ""),
        },
        { header: "Statut de paiement", value: (r) => PAYMENT_STATUS[r.status].label },
        {
          header: "Statut facture électronique",
          value: (r) =>
            r.invoice.issuedAt && r.invoice.eInvoicing.status
              ? LIFECYCLE_STATUS[r.invoice.eInvoicing.status].label
              : "",
        },
        { header: "Total HT", value: (r) => signed(r.invoice.kind, r.invoice.totals.net) },
        { header: "Total TTC", value: (r) => signed(r.invoice.kind, r.invoice.totals.gross) },
        { header: "Net à payer", value: (r) => signed(r.invoice.kind, r.invoice.totals.netToPay) },
        { header: "Reste à payer", value: (r) => csvMoney(r.remaining) },
      ];
      return { filename: "factures", content: toCsv(rows, columns) };
    }
    case "factures-recues": {
      const { rows } = await receivedRows(ctx, params);
      type R = (typeof rows)[number];
      const columns: CsvColumn<R>[] = [
        { header: "Fournisseur", value: (r) => r.received.supplier.name },
        { header: "Numéro", value: (r) => r.received.number },
        { header: "Catégorie", value: (r) => RECEIVED_CATEGORY_LABELS[r.received.category] },
        { header: "Chantier", value: (r) => r.worksiteName },
        { header: "Échéance", value: (r) => csvDate(r.received.dueDate) },
        { header: "Statut", value: (r) => LIFECYCLE_STATUS[r.received.status].label },
        { header: "Total TTC", value: (r) => csvMoney(r.received.gross) },
      ];
      return { filename: "factures-recues", content: toCsv(rows, columns) };
    }
  }
}
