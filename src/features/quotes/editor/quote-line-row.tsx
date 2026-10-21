"use client";

import { ArrowDown, ArrowUp, Copy, Ellipsis, Trash2 } from "lucide-react";
import { Amount } from "@/components/app/amount";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { UNITS } from "@/data/types";
import { formatVatRateLabel, VAT_RATES } from "@/domain/vat";
import type { DraftLine } from "./quote-draft";
import { errorId, ErrorText, nativeSelect, UNIT_LABELS } from "./shared";
import type { QuoteEditorState } from "./use-quote-editor";

/**
 * Une ligne de devis. Mode tableau quand le lot fait au moins 48 rem (container query
 * @3xl), sinon carte avec libellés visibles.
 */
export function QuoteLineRow({
  editor,
  line,
  si,
  li,
  isLast,
  lineNet,
}: {
  editor: QuoteEditorState;
  line: DraftLine;
  si: number;
  li: number;
  isLast: boolean;
  lineNet: string | undefined;
}) {
  const { errors, values, actions } = editor;
  const p = `sections.${si}.lines.${li}`;
  const n = li + 1;
  const fid = (f: string) => `l-${line.id}-${f}`;
  const invalid = (path: string) => !!errors[path] || undefined;

  return (
    <li
      aria-label={`Ligne ${n}`}
      className="grid grid-cols-2 gap-x-2 gap-y-3 rounded-md border p-3 @3xl:grid-cols-[minmax(0,1fr)_4.5rem_5.5rem_6.5rem_5.5rem_6.5rem_2.75rem] @3xl:items-start @3xl:gap-y-2 @3xl:border-0 @3xl:p-1"
      onKeyDown={(e) => actions.onLineKeyDown(e, si, li)}
    >
      <div className="col-span-2 @3xl:col-span-1">
        <label htmlFor={fid("desc")} className="mb-1 block text-sm font-medium @3xl:sr-only">
          Désignation, ligne {n}
        </label>
        <Textarea
          id={fid("desc")}
          ref={actions.registerDescription(line.id)}
          rows={1}
          placeholder="Désignation de l'ouvrage"
          value={line.description}
          onChange={(e) => actions.setLine(si, li, { description: e.target.value })}
          className="min-h-11 resize-y md:min-h-10"
          aria-invalid={invalid(`${p}.description`)}
          aria-describedby={errorId(errors, `${p}.description`)}
        />
        <ErrorText errors={errors} path={`${p}.description`} />
      </div>
      <div>
        <label htmlFor={fid("qty")} className="mb-1 block text-sm font-medium @3xl:sr-only">
          Quantité<span className="sr-only">, ligne {n}</span>
        </label>
        <Input
          id={fid("qty")}
          inputMode="decimal"
          value={line.quantity}
          onChange={(e) => actions.setLine(si, li, { quantity: e.target.value })}
          aria-invalid={invalid(`${p}.quantity`)}
          aria-describedby={errorId(errors, `${p}.quantity`)}
        />
        <ErrorText errors={errors} path={`${p}.quantity`} />
      </div>
      <div>
        <label htmlFor={fid("unit")} className="mb-1 block text-sm font-medium @3xl:sr-only">
          Unité<span className="sr-only">, ligne {n}</span>
        </label>
        <select id={fid("unit")} className={nativeSelect} value={line.unit} onChange={(e) => actions.setLine(si, li, { unit: e.target.value as DraftLine["unit"] })}>
          {UNITS.map((u) => (
            <option key={u} value={u}>
              {UNIT_LABELS[u]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor={fid("price")} className="mb-1 block text-sm font-medium @3xl:sr-only">
          Prix unitaire HT<span className="sr-only">, ligne {n}</span>
        </label>
        <Input
          id={fid("price")}
          inputMode="decimal"
          placeholder="0,00"
          value={line.unitPrice}
          onChange={(e) => actions.setLine(si, li, { unitPrice: e.target.value })}
          aria-invalid={invalid(`${p}.unitPrice`)}
          aria-describedby={errorId(errors, `${p}.unitPrice`)}
        />
        <ErrorText errors={errors} path={`${p}.unitPrice`} />
      </div>
      <div>
        <label htmlFor={fid("vat")} className="mb-1 block text-sm font-medium @3xl:sr-only">
          TVA<span className="sr-only">, ligne {n}</span>
        </label>
        <select
          id={fid("vat")}
          className={nativeSelect}
          value={line.vatRate}
          onChange={(e) => actions.setLine(si, li, { vatRate: e.target.value as DraftLine["vatRate"] })}
          disabled={values.reverseCharge}
          title={values.reverseCharge ? "Autoliquidation : TVA non facturée" : undefined}
        >
          {VAT_RATES.map((r) => (
            <option key={r} value={r}>
              {formatVatRateLabel(r)}
            </option>
          ))}
        </select>
      </div>
      <p className="num flex h-11 items-center gap-2 font-medium @3xl:h-10 @3xl:justify-end">
        <span className="text-sm font-normal text-muted-foreground @3xl:hidden">Total HT</span>
        <Amount value={lineNet} />
      </p>
      <div className="flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" size="icon" aria-label={`Actions de la ligne ${n}`}>
              <Ellipsis aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="min-h-11 md:min-h-9" disabled={li === 0} onSelect={() => actions.moveLine(si, li, -1)}>
              <ArrowUp aria-hidden />
              Monter
            </DropdownMenuItem>
            <DropdownMenuItem className="min-h-11 md:min-h-9" disabled={isLast} onSelect={() => actions.moveLine(si, li, 1)}>
              <ArrowDown aria-hidden />
              Descendre
            </DropdownMenuItem>
            <DropdownMenuItem className="min-h-11 md:min-h-9" onSelect={() => actions.duplicateLine(si, li)}>
              <Copy aria-hidden />
              Dupliquer
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" className="min-h-11 md:min-h-9" onSelect={() => actions.removeLine(si, li)}>
              <Trash2 aria-hidden />
              Supprimer la ligne
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </li>
  );
}
