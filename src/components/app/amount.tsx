import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Money } from "@/domain/money";

/** Montant formaté en chiffres tabulaires. */
export function Amount({
  value,
  className,
}: {
  value: Money | null | undefined;
  className?: string;
}) {
  return <span className={cn("num whitespace-nowrap", className)}>{formatMoney(value)}</span>;
}
