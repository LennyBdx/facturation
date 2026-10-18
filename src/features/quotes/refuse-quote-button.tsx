"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CircleX, Loader2 } from "lucide-react";
import { toast } from "sonner";
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
import { changeQuoteStatus } from "./actions";

/** Refus d'un devis avec motif (facultatif, utile pour les statistiques). */
export function RefuseQuoteButton({ quoteId }: { quoteId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <CircleX aria-hidden />
          Refusé
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Marquer le devis comme refusé</DialogTitle>
          <DialogDescription>Le devis ne pourra plus être facturé. Vous pourrez le dupliquer pour faire une nouvelle proposition.</DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="refusal-reason">Motif du refus (facultatif)</Label>
          <Textarea id="refusal-reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="Prix, délai, projet reporté…" />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            Annuler
          </Button>
          <Button
            variant="destructive"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const r = await changeQuoteStatus(quoteId, "refused", reason.trim() || undefined);
                setOpen(false);
                if (r.ok) {
                  toast.success(r.message);
                  router.refresh();
                } else toast.error(r.error);
              })
            }
          >
            {pending ? <Loader2 aria-hidden className="animate-spin" /> : null}
            Confirmer le refus
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
