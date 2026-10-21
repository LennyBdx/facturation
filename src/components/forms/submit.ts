"use client";

import type { FieldPath, FieldValues, UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import type { ActionResult } from "@/lib/action-result";

/**
 * Applique le résultat d'une Server Action à un formulaire : erreurs serveur
 * reportées sous chaque champ, toast de confirmation ou d'erreur.
 */
export function applyActionResult<T extends FieldValues, R>(
  form: UseFormReturn<T>,
  result: ActionResult<R>,
): result is { ok: true; data?: R; message?: string } {
  if (result.ok) {
    if (result.message) toast.success(result.message);
    return true;
  }
  for (const [name, message] of Object.entries(result.fieldErrors ?? {})) {
    form.setError(name as FieldPath<T>, { type: "server", message });
  }
  toast.error(result.error);
  return false;
}
