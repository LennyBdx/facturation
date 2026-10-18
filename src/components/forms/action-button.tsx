"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/services/context";

type ButtonProps = React.ComponentProps<typeof Button>;

/**
 * Bouton déclenchant une Server Action : état de chargement (pas de double clic),
 * confirmation optionnelle pour les actions irréversibles, retour par toast.
 */
export function ActionButton({
  action,
  confirm,
  redirectTo,
  children,
  ...button
}: Omit<ButtonProps, "onClick" | "action"> & {
  action: () => Promise<ActionResult<{ id?: string; redirectTo?: string } | undefined>>;
  confirm?: { title: string; description: React.ReactNode; confirmLabel: string; destructive?: boolean };
  redirectTo?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const run = () =>
    startTransition(async () => {
      const result = await action();
      setOpen(false);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      if (result.message) toast.success(result.message);
      const target = result.data?.redirectTo ?? redirectTo;
      if (target) router.push(target);
      else router.refresh();
    });

  const trigger = (
    <Button {...button} disabled={pending || button.disabled} onClick={confirm ? () => setOpen(true) : run}>
      {pending ? <Loader2 aria-hidden className="animate-spin" /> : null}
      {children}
    </Button>
  );

  if (!confirm) return trigger;
  return (
    <>
      {trigger}
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm.title}</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>{confirm.description}</div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              variant={confirm.destructive ? "destructive" : "default"}
              disabled={pending}
              onClick={(e) => {
                e.preventDefault();
                run();
              }}
            >
              {pending ? <Loader2 aria-hidden className="animate-spin" /> : null}
              {confirm.confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
