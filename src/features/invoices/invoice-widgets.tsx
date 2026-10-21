"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Banknote, Loader2, RefreshCw, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { SelectField, TextField } from "@/components/forms/form-fields";
import { applyActionResult } from "@/components/forms/submit";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { createCreditNoteAction, recordPaymentAction, refreshInvoiceStatusAction } from "./actions";
import { paymentSchema, type PaymentInput } from "./schemas";

const PAYMENT_METHODS = [
  { value: "transfer", label: "Virement" },
  { value: "check", label: "Chèque" },
  { value: "card", label: "Carte bancaire" },
  { value: "cash", label: "Espèces" },
  { value: "other", label: "Autre" },
];

/** Enregistrement d'un paiement (simulation : aucun flux bancaire réel). */
export function PaymentDialog({ invoiceId, remaining, today }: { invoiceId: string; remaining: string; today: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const form = useForm<PaymentInput>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { date: today, amount: remaining.replace(".", ","), method: "transfer", reference: "" },
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Banknote aria-hidden />
          Enregistrer un paiement
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enregistrer un paiement</DialogTitle>
          <DialogDescription>Le statut « Encaissée » est déclaré à la plateforme dès que la facture est soldée.</DialogDescription>
        </DialogHeader>
        <form
          noValidate
          className="space-y-4"
          onSubmit={form.handleSubmit(async (values) => {
            const r = await recordPaymentAction(invoiceId, values);
            if (applyActionResult(form, r)) {
              setOpen(false);
              router.refresh();
            }
          })}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField control={form.control} name="amount" label="Montant (€)" inputMode="decimal" required />
            <TextField control={form.control} name="date" label="Date de réception" type="date" required />
            <SelectField control={form.control} name="method" label="Moyen de paiement" required options={PAYMENT_METHODS} />
            <TextField control={form.control} name="reference" label="Référence" placeholder="N° de virement ou de chèque" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? <Loader2 aria-hidden className="animate-spin" /> : null}
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Correction d'une facture émise : avoir d'annulation totale. */
export function CreditNoteDialog({ invoiceId, number }: { invoiceId: string; number: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Undo2 aria-hidden />
          Corriger par un avoir
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Créer un avoir sur la facture {number}</DialogTitle>
          <DialogDescription>
            Une facture émise ne se modifie pas. L&apos;avoir annule la totalité de la facture ; vous pourrez ensuite émettre une facture corrigée.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="cn-reason">
            Motif <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="cn-reason"
            rows={3}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setError(null);
            }}
            aria-invalid={!!error || undefined}
            aria-describedby={error ? "cn-reason-err" : undefined}
            placeholder="Erreur de quantité, facture refusée par le client…"
          />
          {error ? (
            <p id="cn-reason-err" role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            Annuler
          </Button>
          <Button
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const r = await createCreditNoteAction(invoiceId, reason);
                if (!r.ok) {
                  setError(r.error);
                  return;
                }
                toast.success(r.message);
                router.push(r.data!.redirectTo);
              })
            }
          >
            {pending ? <Loader2 aria-hidden className="animate-spin" /> : null}
            Créer l&apos;avoir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const LIVE_STATUSES = ["deposited", "issued", "received", "made_available", "in_hand"];

/**
 * Interroge la plateforme (simulée) toutes les 3 s tant que la facture progresse,
 * et rafraîchit la page à chaque nouvel événement du cycle de vie.
 */
export function LifecyclePoller({ invoiceId, status, eventCount }: { invoiceId: string; status: string | null; eventCount: number }) {
  const router = useRouter();
  const count = useRef(eventCount);
  const [live, setLive] = useState(status !== null && LIVE_STATUSES.includes(status));
  useEffect(() => {
    count.current = eventCount;
  }, [eventCount]);
  useEffect(() => {
    if (!live) return;
    let polls = 0;
    const timer = setInterval(async () => {
      polls += 1;
      const r = await refreshInvoiceStatusAction(invoiceId);
      if (!r.ok || !r.data) {
        setLive(false);
        return;
      }
      if (r.data.count !== count.current) {
        count.current = r.data.count;
        router.refresh();
      }
      if (!r.data.status || !LIVE_STATUSES.includes(r.data.status) || polls > 40) setLive(false);
    }, 3000);
    return () => clearInterval(timer);
  }, [live, invoiceId, router]);

  if (!live) return null;
  return (
    <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
      <RefreshCw aria-hidden className="size-4 animate-spin" />
      Suivi en direct des statuts de la plateforme…
    </p>
  );
}
