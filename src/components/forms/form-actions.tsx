"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Barre d'actions de formulaire, collante en bas d'écran sur mobile. */
export function FormActions({
  pending,
  submitLabel,
  cancelHref,
}: {
  pending: boolean;
  submitLabel: string;
  cancelHref: string;
}) {
  return (
    <div className="sticky bottom-16 z-10 -mx-4 flex gap-2 border-t bg-background/95 px-4 py-3 backdrop-blur md:static md:mx-0 md:justify-end md:border-0 md:bg-transparent md:px-0 md:py-0">
      <Button asChild variant="outline" className="flex-1 md:flex-none">
        <Link href={cancelHref}>Annuler</Link>
      </Button>
      <Button type="submit" disabled={pending} className="flex-1 md:flex-none">
        {pending ? <Loader2 aria-hidden className="animate-spin" /> : null}
        {submitLabel}
      </Button>
    </div>
  );
}
