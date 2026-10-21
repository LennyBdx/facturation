"use client";

import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div role="alert" className="mx-auto flex max-w-lg flex-col items-center gap-4 rounded-lg border bg-card p-8 text-center">
      <TriangleAlert aria-hidden className="size-8 text-danger" />
      <div className="space-y-1">
        <h1 className="text-lg font-semibold">Une erreur est survenue</h1>
        <p className="text-sm text-muted-foreground">{error.message || "La page n'a pas pu être affichée."}</p>
      </div>
      <Button onClick={reset}>Réessayer</Button>
    </div>
  );
}
