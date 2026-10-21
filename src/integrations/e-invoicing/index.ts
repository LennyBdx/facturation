/**
 * Point d'entrée de la couche d'intégration facture électronique.
 * Remplacer `MockEInvoicingProvider` par l'adaptateur de la plateforme agréée
 * choisie (même interface) pour passer en conditions réelles.
 */
import "server-only";
import { MockEInvoicingProvider } from "./mock-provider";
import type { EInvoicingProvider } from "./provider";

export type {
  EInvoicingProvider,
  IncomingInvoice,
  PlatformInfo,
  StatusResult,
  SubmitResult,
} from "./provider";
export { EInvoicingError } from "./provider";

let provider: EInvoicingProvider | undefined;

export function getEInvoicingProvider(): EInvoicingProvider {
  provider ??= new MockEInvoicingProvider();
  return provider;
}
