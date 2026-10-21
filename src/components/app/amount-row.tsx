import { Amount } from "./amount";

/** Ligne libellé / montant d'un récapitulatif (à placer dans un <dl>). */
export function AmountRow({ label, value, negative, strong }: { label: React.ReactNode; value: string; negative?: boolean; strong?: boolean }) {
  return (
    <div className={strong ? "flex justify-between font-medium" : "flex justify-between"}>
      <dt className={strong ? undefined : "text-muted-foreground"}>{label}</dt>
      <dd>
        {negative ? "− " : ""}
        <Amount value={value} />
      </dd>
    </div>
  );
}
