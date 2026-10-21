import { cn } from "@/lib/utils";
import type { LifecycleStatus, PaymentStatus } from "@/domain/lifecycle";
import type { QuoteStatus, WorksiteStatus } from "@/data/types";
import {
  LIFECYCLE_STATUS,
  PAYMENT_STATUS,
  QUOTE_STATUS,
  type StatusDisplay,
  type Tone,
  TONE_CLASSES,
  WORKSITE_STATUS,
} from "./status-config";

export function ToneBadge({
  tone,
  icon: Icon,
  children,
  className,
  title,
}: {
  tone: Tone;
  icon?: StatusDisplay["icon"];
  children: React.ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex h-6 shrink-0 items-center gap-1 rounded-sm border px-1.5 text-xs font-medium whitespace-nowrap",
        TONE_CLASSES[tone],
        className,
      )}
    >
      {Icon ? <Icon aria-hidden className="size-3.5" /> : null}
      {children}
    </span>
  );
}

export function QuoteStatusBadge({ status }: { status: QuoteStatus }) {
  const s = QUOTE_STATUS[status];
  return (
    <ToneBadge tone={s.tone} icon={s.icon}>
      {s.label}
    </ToneBadge>
  );
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const s = PAYMENT_STATUS[status];
  return (
    <ToneBadge tone={s.tone} icon={s.icon}>
      {s.label}
    </ToneBadge>
  );
}

/** Statut du cycle de vie facture électronique. `null` = non transmise. */
export function LifecycleStatusBadge({
  status,
  outOfScope,
}: {
  status: LifecycleStatus | null;
  /** Facture à un particulier : e-reporting, pas de facture électronique. */
  outOfScope?: boolean;
}) {
  if (!status) {
    return (
      <ToneBadge
        tone="neutral"
        className="border-dashed"
        title={
          outOfScope ? "Vente à un particulier : données transmises par e-reporting" : undefined
        }
      >
        {outOfScope ? "E-reporting" : "Non transmise"}
      </ToneBadge>
    );
  }
  const s = LIFECYCLE_STATUS[status];
  return (
    <ToneBadge
      tone={s.tone}
      icon={s.icon}
      title={`Statut ${s.code}${s.mandatory ? " (obligatoire)" : ""}`}
    >
      {s.label}
    </ToneBadge>
  );
}

export function WorksiteStatusBadge({ status }: { status: WorksiteStatus }) {
  const s = WORKSITE_STATUS[status];
  return <ToneBadge tone={s.tone}>{s.label}</ToneBadge>;
}
