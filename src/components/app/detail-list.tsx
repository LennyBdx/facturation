import { cn } from "@/lib/utils";

/** Liste de couples libellé / valeur (fiches). */
export function DetailList({
  items,
  className,
  columns = 2,
}: {
  items: { label: string; value: React.ReactNode; hidden?: boolean }[];
  className?: string;
  columns?: 1 | 2 | 3;
}) {
  return (
    <dl
      className={cn(
        "grid gap-x-6 gap-y-4",
        columns === 2 && "sm:grid-cols-2",
        columns === 3 && "sm:grid-cols-2 lg:grid-cols-3",
        className,
      )}
    >
      {items
        .filter((i) => !i.hidden)
        .map((item) => (
          <div key={item.label} className="min-w-0">
            <dt className="text-sm text-muted-foreground">{item.label}</dt>
            <dd className="mt-0.5 break-words">{item.value || "—"}</dd>
          </div>
        ))}
    </dl>
  );
}
