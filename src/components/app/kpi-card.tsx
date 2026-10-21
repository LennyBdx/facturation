import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Indicateur du tableau de bord, cliquable vers la liste filtrée. */
export function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  href,
  emphasis,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon: LucideIcon;
  href?: string;
  emphasis?: "danger" | "warning" | "brand";
}) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-muted-foreground">{label}</span>
        <Icon
          aria-hidden
          className={cn(
            "size-5 text-muted-foreground",
            emphasis === "danger" && "text-danger",
            emphasis === "warning" && "text-warning",
            emphasis === "brand" && "text-brand",
          )}
        />
      </div>
      <div className="num text-2xl font-semibold tracking-tight">{value}</div>
      {hint ? <div className="text-sm text-muted-foreground">{hint}</div> : null}
    </>
  );
  const className = "flex flex-col gap-2 rounded-lg border bg-card p-4";
  return href ? (
    <Link
      href={href}
      className={cn(className, "transition-colors hover:border-primary/40 hover:bg-accent/40")}
    >
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}
