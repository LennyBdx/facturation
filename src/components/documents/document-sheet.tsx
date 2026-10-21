import { formatSiren, formatSiret } from "@/domain/identifiers";
import { formatVatRateLabel, type VatBreakdownLine } from "@/domain/vat";
import type { Address, InvoiceLineProgress, Unit } from "@/data/types";
import { formatDate, formatMoney, formatPercent, formatQuantity } from "@/lib/format";
import { safeAccent } from "@/lib/color";
import { cn } from "@/lib/utils";

export interface SheetParty {
  name: string;
  address: Address;
  siren?: string;
  siret?: string;
  vatNumber?: string;
  extra?: string[];
}

export interface SheetLine {
  description: string;
  quantity: string;
  unit: Unit;
  unitPrice: string;
  vatRate: string;
  net: string;
  progress?: InvoiceLineProgress;
}

export interface SheetSection {
  title?: string;
  lines: SheetLine[];
  subtotal?: string;
}

export interface SheetTotalRow {
  label: string;
  value: string;
  negative?: boolean;
  strong?: boolean;
}

/**
 * Document imprimable (devis, facture, avoir) au format A4.
 * Rendu HTML : l'impression passe par le navigateur (Ctrl+P / « Imprimer »).
 * La génération PDF / Factur-X viendra dans une version ultérieure.
 */
export function DocumentSheet({
  docLabel,
  number,
  meta,
  seller,
  sellerIdentity,
  buyer,
  worksite,
  subject,
  sections,
  vatBreakdown,
  totals,
  mentions,
  accentColor,
  signature,
  reverseCharge,
  progressMode,
}: {
  docLabel: string;
  number: string;
  meta: { label: string; value: string }[];
  seller: SheetParty & { email?: string; phone?: string };
  sellerIdentity: string;
  buyer: SheetParty;
  worksite?: { name: string; address: Address; reference?: string } | null;
  subject: string;
  sections: SheetSection[];
  vatBreakdown: VatBreakdownLine[];
  totals: SheetTotalRow[];
  mentions: string[];
  accentColor?: string;
  signature?: boolean;
  reverseCharge?: boolean;
  progressMode?: boolean;
}) {
  const accent = safeAccent(accentColor);
  const addr = (a: Address) => (
    <>
      {a.line1}
      <br />
      {a.line2 ? (
        <>
          {a.line2}
          <br />
        </>
      ) : null}
      {a.postalCode} {a.city}
    </>
  );

  return (
    <article
      className="print-sheet mx-auto w-full max-w-[210mm] rounded-lg border border-paper-border bg-paper p-6 text-[13px] leading-relaxed text-paper-foreground shadow-sm sm:p-10"
      style={{ ["--accent-doc" as string]: accent }}
    >
      <header className="flex flex-col gap-6 sm:flex-row sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              aria-hidden
              className="flex size-10 items-center justify-center rounded-md text-lg font-bold text-paper-on-accent"
              style={{ background: "var(--accent-doc)" }}
            >
              {seller.name.slice(0, 1)}
            </span>
            <span className="text-base font-semibold">{seller.name}</span>
          </div>
          <p className="text-paper-muted">
            {addr(seller.address)}
            {seller.phone ? (
              <>
                <br />
                {seller.phone}
              </>
            ) : null}
            {seller.email ? (
              <>
                <br />
                {seller.email}
              </>
            ) : null}
          </p>
        </div>
        <div className="sm:text-right">
          <p
            className="text-2xl font-semibold tracking-tight"
            style={{ color: "var(--accent-doc)" }}
          >
            {docLabel}
          </p>
          <p className="font-mono text-sm">{number}</p>
          <dl className="mt-2 space-y-0.5">
            {meta.map((m) => (
              <div key={m.label} className="flex gap-2 sm:justify-end">
                <dt className="text-paper-muted">{m.label} :</dt>
                <dd className="num">{m.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </header>

      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        {worksite ? (
          <div className="rounded-md border border-paper-border p-3">
            <p className="text-xs font-semibold tracking-wide text-paper-muted uppercase">
              Chantier
            </p>
            <p className="font-medium">{worksite.name}</p>
            <p className="text-paper-muted">{addr(worksite.address)}</p>
            {worksite.reference ? (
              <p className="text-paper-muted">Réf. marché : {worksite.reference}</p>
            ) : null}
          </div>
        ) : (
          <div />
        )}
        <div className="rounded-md border border-paper-border p-3">
          <p className="text-xs font-semibold tracking-wide text-paper-muted uppercase">Client</p>
          <p className="font-medium">{buyer.name}</p>
          <p>{addr(buyer.address)}</p>
          {buyer.siren ? (
            <p className="text-paper-muted">SIREN {formatSiren(buyer.siren)}</p>
          ) : null}
          {buyer.siret ? (
            <p className="text-paper-muted">SIRET {formatSiret(buyer.siret)}</p>
          ) : null}
          {buyer.vatNumber ? <p className="text-paper-muted">TVA {buyer.vatNumber}</p> : null}
          {buyer.extra?.map((e) => (
            <p key={e} className="text-paper-muted">
              {e}
            </p>
          ))}
        </div>
      </section>

      <p className="mt-6">
        <span className="font-semibold">Objet : </span>
        {subject}
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[34rem] border-collapse">
          <thead>
            <tr
              className="text-left text-xs text-paper-on-accent"
              style={{ background: "var(--accent-doc)" }}
            >
              <th scope="col" className="px-2 py-2 font-medium">
                Désignation
              </th>
              {progressMode ? (
                <>
                  <th scope="col" className="px-2 py-2 text-right font-medium">
                    Marché HT
                  </th>
                  <th scope="col" className="px-2 py-2 text-right font-medium">
                    % préc.
                  </th>
                  <th scope="col" className="px-2 py-2 text-right font-medium">
                    % cumul
                  </th>
                </>
              ) : (
                <>
                  <th scope="col" className="px-2 py-2 text-right font-medium">
                    Qté
                  </th>
                  <th scope="col" className="px-2 py-2 font-medium">
                    Unité
                  </th>
                  <th scope="col" className="px-2 py-2 text-right font-medium">
                    PU HT
                  </th>
                </>
              )}
              <th scope="col" className="px-2 py-2 text-right font-medium">
                TVA
              </th>
              <th scope="col" className="px-2 py-2 text-right font-medium">
                {progressMode ? "HT période" : "Total HT"}
              </th>
            </tr>
          </thead>
          {sections.map((s, si) => (
            <tbody key={si}>
              {s.title ? (
                <tr>
                  <th
                    colSpan={6}
                    scope="colgroup"
                    className="border-b border-paper-border bg-paper-border/30 px-2 pt-3 pb-1 text-left font-semibold"
                  >
                    {s.title}
                  </th>
                </tr>
              ) : null}
              {s.lines.map((l, li) => (
                <tr key={li} className="border-b border-paper-border align-top">
                  <td className="px-2 py-1.5">{l.description}</td>
                  {progressMode && l.progress ? (
                    <>
                      <td className="num px-2 py-1.5 text-right">
                        {formatMoney(l.progress.contractNet)}
                      </td>
                      <td className="num px-2 py-1.5 text-right">
                        {formatPercent(l.progress.previousPercent)}
                      </td>
                      <td className="num px-2 py-1.5 text-right">
                        {formatPercent(l.progress.currentPercent)}
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="num px-2 py-1.5 text-right">{formatQuantity(l.quantity)}</td>
                      <td className="px-2 py-1.5">{l.unit}</td>
                      <td className="num px-2 py-1.5 text-right">{formatMoney(l.unitPrice)}</td>
                    </>
                  )}
                  <td className="num px-2 py-1.5 text-right">
                    {reverseCharge ? "AE" : formatVatRateLabel(l.vatRate)}
                  </td>
                  <td className="num px-2 py-1.5 text-right">{formatMoney(l.net)}</td>
                </tr>
              ))}
              {s.subtotal && sections.length > 1 ? (
                <tr>
                  <td colSpan={5} className="px-2 py-1.5 text-right text-paper-muted">
                    Sous-total {s.title}
                  </td>
                  <td className="num px-2 py-1.5 text-right font-medium">
                    {formatMoney(s.subtotal)}
                  </td>
                </tr>
              ) : null}
            </tbody>
          ))}
        </table>
      </div>

      <section className="mt-6 grid gap-6 sm:grid-cols-2">
        <div>
          <table className="w-full text-xs">
            <caption className="mb-1 text-left font-semibold">Récapitulatif de TVA</caption>
            <thead className="text-paper-muted">
              <tr>
                <th scope="col" className="py-1 text-left font-medium">
                  Taux
                </th>
                <th scope="col" className="py-1 text-right font-medium">
                  Base HT
                </th>
                <th scope="col" className="py-1 text-right font-medium">
                  TVA
                </th>
              </tr>
            </thead>
            <tbody>
              {vatBreakdown.map((b) => (
                <tr key={`${b.vatCategory}${b.vatRate}`} className="border-t border-paper-border">
                  <td className="py-1">
                    {b.vatCategory === "AE" ? "Autoliquidation" : formatVatRateLabel(b.vatRate)}
                  </td>
                  <td className="num py-1 text-right">{formatMoney(b.base)}</td>
                  <td className="num py-1 text-right">{formatMoney(b.vat)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <dl className="space-y-1">
          {totals.map((t) => (
            <div
              key={t.label}
              className={cn(
                "flex justify-between gap-4",
                t.strong &&
                  "mt-1 rounded-md px-2 py-1.5 text-base font-semibold text-paper-on-accent",
              )}
              style={t.strong ? { background: "var(--accent-doc)" } : undefined}
            >
              <dt className={t.strong ? undefined : "text-paper-muted"}>{t.label}</dt>
              <dd className="num">
                {t.negative ? "− " : ""}
                {formatMoney(t.value)}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {signature ? (
        <section className="mt-8 grid gap-4 sm:grid-cols-2">
          <div />
          <div className="h-28 rounded-md border border-dashed border-paper-border p-3 text-paper-muted">
            Bon pour accord — date, nom et signature du client :
          </div>
        </section>
      ) : null}

      <footer className="mt-8 space-y-1 border-t border-paper-border pt-4 text-[11px] leading-snug text-paper-muted">
        {mentions.map((m) => (
          <p key={m}>{m}</p>
        ))}
        <p className="pt-2">{sellerIdentity}</p>
      </footer>
    </article>
  );
}

export function sheetDate(iso: string) {
  return formatDate(iso);
}
