"use client";

import { ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { QuoteFormValues } from "../schemas";
import { errorId, ErrorText, nativeSelect } from "./shared";
import type { QuoteEditorState } from "./use-quote-editor";

export interface EditorClient {
  id: string;
  name: string;
}

export interface EditorWorksite {
  id: string;
  name: string;
  clientId: string;
  reverseCharge: boolean;
}

/** En-tête du devis : objet, client, chantier, dates, options repliables. */
export function QuoteInfoCard({
  editor,
  number,
  clients,
  worksites,
}: {
  editor: QuoteEditorState;
  number?: string;
  clients: EditorClient[];
  worksites: EditorWorksite[];
}) {
  const { values, errors, optionsOpen, actions } = editor;
  const invalid = (path: string) => !!errors[path] || undefined;
  const clientWorksites = worksites.filter((w) => w.clientId === values.clientId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          Informations {number ? <span className="font-mono text-sm text-muted-foreground">· {number}</span> : null}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="q-title">
            Objet du devis <span aria-hidden className="text-destructive">*</span>
          </Label>
          <Input
            id="q-title"
            className="mt-1.5"
            value={values.title}
            onChange={(e) => actions.setField("title", e.target.value)}
            aria-invalid={invalid("title")}
            aria-describedby={errorId(errors, "title")}
            placeholder="Rénovation électrique de…"
          />
          <ErrorText errors={errors} path="title" />
        </div>
        <div>
          <Label htmlFor="q-client">
            Client <span aria-hidden className="text-destructive">*</span>
          </Label>
          <select
            id="q-client"
            className={cn(nativeSelect, "mt-1.5")}
            value={values.clientId}
            onChange={(e) => actions.selectClient(e.target.value)}
            aria-invalid={invalid("clientId")}
            aria-describedby={errorId(errors, "clientId")}
          >
            <option value="">Choisir un client…</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <ErrorText errors={errors} path="clientId" />
        </div>
        <div>
          <Label htmlFor="q-worksite">Chantier</Label>
          <select
            id="q-worksite"
            className={cn(nativeSelect, "mt-1.5")}
            value={values.worksiteId}
            onChange={(e) => actions.selectWorksite(e.target.value, worksites.find((x) => x.id === e.target.value)?.reverseCharge)}
            disabled={!values.clientId}
          >
            <option value="">{clientWorksites.length ? "Aucun (à créer plus tard)" : "Aucun chantier pour ce client"}</option>
            {clientWorksites.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="q-date">Date du devis</Label>
          <Input id="q-date" type="date" className="mt-1.5" value={values.issueDate} onChange={(e) => actions.setField("issueDate", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="q-valid">Valable jusqu&apos;au</Label>
          <Input
            id="q-valid"
            type="date"
            className="mt-1.5"
            value={values.validUntil}
            onChange={(e) => actions.setField("validUntil", e.target.value)}
            aria-invalid={invalid("validUntil")}
            aria-describedby={errorId(errors, "validUntil")}
          />
          <ErrorText errors={errors} path="validUntil" />
        </div>

        <div className="sm:col-span-2">
          <button
            type="button"
            className="flex min-h-11 items-center gap-1 text-sm font-medium text-primary"
            aria-expanded={optionsOpen}
            aria-controls="q-options"
            onClick={actions.toggleOptions}
          >
            <ChevronDown aria-hidden className={cn("size-4 transition-transform", optionsOpen && "rotate-180")} />
            Remise, acompte, autoliquidation et notes
          </button>
          {optionsOpen ? (
            <div id="q-options" className="mt-3 grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="q-discount-kind">Remise globale</Label>
                <div className="mt-1.5 flex gap-2">
                  <select
                    id="q-discount-kind"
                    className={cn(nativeSelect, "w-36")}
                    value={values.discountKind}
                    onChange={(e) => actions.setField("discountKind", e.target.value as QuoteFormValues["discountKind"])}
                  >
                    <option value="none">Aucune</option>
                    <option value="percent">En %</option>
                    <option value="amount">En € HT</option>
                  </select>
                  {values.discountKind !== "none" ? (
                    <Input
                      aria-label={values.discountKind === "percent" ? "Remise en pourcentage" : "Remise en euros hors taxes"}
                      inputMode="decimal"
                      value={values.discountValue}
                      onChange={(e) => actions.setField("discountValue", e.target.value)}
                      aria-invalid={invalid("discountValue")}
                      aria-describedby={errorId(errors, "discountValue")}
                    />
                  ) : null}
                </div>
                <ErrorText errors={errors} path="discountValue" />
              </div>
              <div>
                <Label htmlFor="q-deposit">Acompte à la commande (% du TTC)</Label>
                <Input
                  id="q-deposit"
                  inputMode="decimal"
                  className="mt-1.5"
                  value={values.depositPercent}
                  onChange={(e) => actions.setField("depositPercent", e.target.value)}
                  aria-invalid={invalid("depositPercent")}
                  aria-describedby={errorId(errors, "depositPercent")}
                />
                <ErrorText errors={errors} path="depositPercent" />
              </div>
              <div className="flex items-start justify-between gap-4 rounded-lg border p-3 sm:col-span-2">
                <div>
                  <Label htmlFor="q-reverse">Autoliquidation de la TVA (sous-traitance)</Label>
                  <p className="text-sm text-muted-foreground">Aucune TVA facturée ; la mention légale est ajoutée au devis.</p>
                </div>
                <Switch id="q-reverse" checked={values.reverseCharge} onCheckedChange={(c) => actions.setField("reverseCharge", c)} />
              </div>
              <div>
                <Label htmlFor="q-duration">Durée estimée des travaux</Label>
                <Input
                  id="q-duration"
                  className="mt-1.5"
                  value={values.estimatedDuration ?? ""}
                  onChange={(e) => actions.setField("estimatedDuration", e.target.value)}
                  placeholder="3 semaines"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="q-notes">Notes et conditions particulières</Label>
                <Textarea id="q-notes" className="mt-1.5" rows={3} value={values.notes ?? ""} onChange={(e) => actions.setField("notes", e.target.value)} />
              </div>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
