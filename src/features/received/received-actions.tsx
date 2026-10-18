"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowRightLeft, Loader2, MessageSquareWarning, ThumbsDown, ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ReceivedInvoiceAction } from "@/domain/lifecycle";
import { attachWorksiteAction, receivedInvoiceAction } from "./actions";

const LABELS: Record<ReceivedInvoiceAction, string> = {
  approve: "Approuver",
  refuse: "Refuser",
  dispute: "Signaler un litige",
  mark_paid: "Marquer comme payée",
};

/** Actions de traitement d'une facture fournisseur, selon le statut courant. */
export function ReceivedActions({ id, allowed }: { id: string; allowed: readonly ReceivedInvoiceAction[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [dialog, setDialog] = useState<"refuse" | "dispute" | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const run = (action: ReceivedInvoiceAction, why?: string) =>
    startTransition(async () => {
      const r = await receivedInvoiceAction(id, action, why);
      if (!r.ok) {
        if (dialog) setError(r.error);
        else toast.error(r.error);
        return;
      }
      setDialog(null);
      setReason("");
      toast.success(r.message);
      router.refresh();
    });

  if (allowed.length === 0) return <p className="text-sm text-muted-foreground">Aucune action possible à ce statut.</p>;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {allowed.includes("approve") ? (
          <Button onClick={() => run("approve")} disabled={pending}>
            {pending ? <Loader2 aria-hidden className="animate-spin" /> : <ThumbsUp aria-hidden />}
            {LABELS.approve}
          </Button>
        ) : null}
        {allowed.includes("mark_paid") ? (
          <Button onClick={() => run("mark_paid")} disabled={pending}>
            {pending ? <Loader2 aria-hidden className="animate-spin" /> : <ArrowRightLeft aria-hidden />}
            {LABELS.mark_paid}
          </Button>
        ) : null}
        {allowed.includes("dispute") ? (
          <Button variant="outline" onClick={() => setDialog("dispute")} disabled={pending}>
            <MessageSquareWarning aria-hidden />
            {LABELS.dispute}
          </Button>
        ) : null}
        {allowed.includes("refuse") ? (
          <Button variant="destructive" onClick={() => setDialog("refuse")} disabled={pending}>
            <ThumbsDown aria-hidden />
            {LABELS.refuse}
          </Button>
        ) : null}
      </div>
      <Dialog open={dialog !== null} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialog === "refuse" ? "Refuser la facture" : "Signaler un litige"}</DialogTitle>
            <DialogDescription>
              {dialog === "refuse"
                ? "Le refus est définitif et transmis au fournisseur, qui devra émettre un avoir."
                : "La facture reste en attente le temps de trouver un accord avec le fournisseur."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="rec-reason">
              Motif <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="rec-reason"
              rows={3}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError(null);
              }}
              aria-invalid={!!error || undefined}
              aria-describedby={error ? "rec-reason-err" : undefined}
            />
            {error ? (
              <p id="rec-reason-err" role="alert" className="text-sm text-destructive">
                {error}
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)} disabled={pending}>
              Annuler
            </Button>
            <Button variant={dialog === "refuse" ? "destructive" : "default"} disabled={pending} onClick={() => dialog && run(dialog, reason)}>
              {pending ? <Loader2 aria-hidden className="animate-spin" /> : null}
              {dialog === "refuse" ? "Confirmer le refus" : "Signaler le litige"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function WorksiteAttach({ id, current, worksites }: { id: string; current: string | null; worksites: { id: string; name: string }[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <div className="space-y-1.5">
      <Label htmlFor="rec-worksite">Chantier</Label>
      <div className="flex items-center gap-2">
        <select
          id="rec-worksite"
          className="h-11 w-full rounded-md border border-input bg-card px-2 text-base md:h-10 md:text-sm"
          defaultValue={current ?? ""}
          disabled={pending}
          onChange={(e) =>
            startTransition(async () => {
              const r = await attachWorksiteAction(id, e.target.value);
              if (r.ok) {
                toast.success(r.message);
                router.refresh();
              } else toast.error(r.error);
            })
          }
        >
          <option value="">Non rattachée</option>
          {worksites.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
        {pending ? <Loader2 aria-label="Enregistrement" className="size-4 animate-spin" /> : null}
      </div>
      <p className="text-sm text-muted-foreground">Permet de suivre les achats et la marge par chantier.</p>
    </div>
  );
}
