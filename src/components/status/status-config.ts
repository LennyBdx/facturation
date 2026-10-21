/**
 * Correspondance statut → ton, icône et libellé (docs/design-system.md).
 * Règle : jamais la couleur seule, toujours icône + libellé.
 */
import {
  AlarmClock,
  ArrowRightLeft,
  BadgeEuro,
  CalendarX,
  CircleCheck,
  CircleDashed,
  CirclePause,
  CircleX,
  Eye,
  FileCheck,
  FilePen,
  FilePlus2,
  Inbox,
  type LucideIcon,
  MailOpen,
  MessageSquareWarning,
  OctagonX,
  Send,
  SquareSplitHorizontal,
  ThumbsDown,
  ThumbsUp,
  Undo2,
  Upload,
} from "lucide-react";
import { INVOICE_KIND_RULES } from "@/domain/invoice-kinds";
import { LIFECYCLE_STATUSES, type LifecycleStatus, PAYMENT_STATUS_LABELS, type PaymentStatus } from "@/domain/lifecycle";
import type { ClientKind, InvoiceKind, QuoteStatus, ReceivedInvoiceCategory, WorksiteStatus } from "@/data/types";

export type Tone = "neutral" | "info" | "pending" | "success" | "warning" | "danger";

export interface StatusDisplay {
  label: string;
  tone: Tone;
  icon: LucideIcon;
}

export const QUOTE_STATUS: Record<QuoteStatus, StatusDisplay> = {
  draft: { label: "Brouillon", tone: "neutral", icon: FilePen },
  sent: { label: "Envoyé", tone: "info", icon: Send },
  accepted: { label: "Accepté", tone: "success", icon: CircleCheck },
  refused: { label: "Refusé", tone: "danger", icon: CircleX },
  expired: { label: "Expiré", tone: "neutral", icon: CalendarX },
};

export const PAYMENT_STATUS: Record<PaymentStatus, StatusDisplay> = {
  draft: { label: PAYMENT_STATUS_LABELS.draft, tone: "neutral", icon: FilePen },
  issued: { label: PAYMENT_STATUS_LABELS.issued, tone: "info", icon: FileCheck },
  partially_paid: { label: PAYMENT_STATUS_LABELS.partially_paid, tone: "warning", icon: CircleDashed },
  paid: { label: PAYMENT_STATUS_LABELS.paid, tone: "success", icon: BadgeEuro },
  overdue: { label: PAYMENT_STATUS_LABELS.overdue, tone: "danger", icon: AlarmClock },
  cancelled: { label: PAYMENT_STATUS_LABELS.cancelled, tone: "neutral", icon: Undo2 },
};

const LIFECYCLE_DISPLAY: Record<LifecycleStatus, Omit<StatusDisplay, "label">> = {
  deposited: { tone: "info", icon: Upload },
  issued: { tone: "info", icon: Send },
  received: { tone: "info", icon: Inbox },
  made_available: { tone: "pending", icon: MailOpen },
  in_hand: { tone: "pending", icon: Eye },
  approved: { tone: "success", icon: ThumbsUp },
  partially_approved: { tone: "warning", icon: SquareSplitHorizontal },
  disputed: { tone: "warning", icon: MessageSquareWarning },
  suspended: { tone: "warning", icon: CirclePause },
  completed: { tone: "info", icon: FilePlus2 },
  refused: { tone: "danger", icon: ThumbsDown },
  payment_sent: { tone: "success", icon: ArrowRightLeft },
  cashed: { tone: "success", icon: BadgeEuro },
  rejected: { tone: "danger", icon: OctagonX },
};

export const LIFECYCLE_STATUS: Record<LifecycleStatus, StatusDisplay & { code: number; mandatory: boolean }> =
  Object.fromEntries(
    (Object.keys(LIFECYCLE_STATUSES) as LifecycleStatus[]).map((k) => [
      k,
      { ...LIFECYCLE_DISPLAY[k], label: LIFECYCLE_STATUSES[k].label, code: LIFECYCLE_STATUSES[k].code, mandatory: LIFECYCLE_STATUSES[k].mandatory },
    ]),
  ) as Record<LifecycleStatus, StatusDisplay & { code: number; mandatory: boolean }>;

export const WORKSITE_STATUS: Record<WorksiteStatus, { label: string; tone: Tone }> = {
  planned: { label: "À venir", tone: "neutral" },
  in_progress: { label: "En cours", tone: "info" },
  completed: { label: "Réceptionné", tone: "success" },
  closed: { label: "Clôturé", tone: "neutral" },
};

export const CLIENT_KIND_LABELS: Record<ClientKind, string> = {
  general_contractor: "Entreprise générale",
  private_owner: "Maître d'ouvrage privé",
  individual: "Particulier",
  public_buyer: "Acheteur public",
};

export const INVOICE_KIND_LABELS = Object.fromEntries(
  Object.entries(INVOICE_KIND_RULES).map(([k, r]) => [k, r.label]),
) as Record<InvoiceKind, string>;

export const RECEIVED_CATEGORY_LABELS: Record<ReceivedInvoiceCategory, string> = {
  materials: "Matériaux et fournitures",
  equipment_rental: "Location de matériel",
  subcontracting: "Sous-traitance",
  services: "Prestations de services",
  other: "Autre",
};

/** Classes utilitaires par ton (jetons du design system, aucune couleur en dur). */
export const TONE_CLASSES: Record<Tone, string> = {
  neutral: "border-neutral/25 bg-neutral-soft text-neutral",
  info: "border-info/25 bg-info-soft text-info",
  pending: "border-pending/25 bg-pending-soft text-pending",
  success: "border-success/25 bg-success-soft text-success",
  warning: "border-warning/30 bg-warning-soft text-warning",
  danger: "border-danger/25 bg-danger-soft text-danger",
};
