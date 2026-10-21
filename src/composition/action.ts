/**
 * Fabrique commune des Server Actions. Chaque action passe par ici :
 *  1. contexte de la requête (entreprise, utilisateur, rôle) ;
 *  2. vérification de la permission exigée, côté serveur ;
 *  3. validation des entrées avec Zod (même schéma que le formulaire) ;
 *  4. conversion des erreurs métier en ActionResult lisible ; journalisation des autres ;
 *  5. après succès, invalidation des lectures en cache de l'entreprise (`updateTag`).
 */
import "server-only";
import { updateTag } from "next/cache";
import type { z } from "zod";
import { NotFoundError } from "@/data";
import { orgCacheTag } from "@/data/cached-repositories";
import { can, type Permission, PERMISSION_LABELS } from "@/domain/permissions";
import { ProgressBillingError } from "@/domain/progress-billing";
import type { ActionResult } from "@/lib/action-result";
import { logger } from "@/lib/logger";
import { fieldErrors } from "@/lib/validation";
import type { Context } from "@/services/context";
import { BusinessError } from "@/services/errors";
import { getActionContext } from "./request-context";

interface Options<S extends z.ZodType | undefined> {
  /** Permission exigée (omise : accessible à tout membre de l'entreprise). */
  permission?: Permission;
  schema?: S;
  /** Message affiché si la validation échoue. */
  invalidMessage?: string;
  /** Action de lecture seule (recherche…) : ne vide pas le cache de l'entreprise. */
  readOnly?: boolean;
}

type Input<S> = S extends z.ZodType ? z.output<S> : undefined;

export async function runAction<S extends z.ZodType | undefined, R>(
  options: Options<S>,
  input: unknown,
  handler: (ctx: Context, data: Input<S>) => Promise<ActionResult<R>>,
): Promise<ActionResult<R>> {
  let orgId: string | undefined;
  try {
    const ctx = await getActionContext();
    orgId = ctx.orgId;
    if (options.permission && !can(ctx.role, options.permission)) {
      return {
        ok: false,
        error: `Votre rôle ne permet pas de ${PERMISSION_LABELS[options.permission]}.`,
      };
    }
    let data = undefined as Input<S>;
    if (options.schema) {
      const parsed = options.schema.safeParse(input);
      if (!parsed.success) {
        return {
          ok: false,
          error: options.invalidMessage ?? "Certains champs sont à corriger.",
          fieldErrors: fieldErrors(parsed.error),
        };
      }
      data = parsed.data as Input<S>;
    }
    const result = await handler(ctx, data);
    if (result.ok && !options.readOnly) updateTag(orgCacheTag(orgId));
    return result;
  } catch (error) {
    if (error instanceof BusinessError || error instanceof ProgressBillingError)
      return { ok: false, error: error.message };
    if (error instanceof NotFoundError) return { ok: false, error: error.message };
    // Les redirections et « notFound » de Next.js doivent remonter telles quelles.
    if (isNextControlFlow(error)) {
      // Une action qui réussit puis redirige lève NEXT_REDIRECT : invalider avant de propager.
      if (orgId) updateTag(orgCacheTag(orgId));
      throw error;
    }
    logger.error("Échec d'une Server Action", error, { permission: options.permission });
    return { ok: false, error: "Une erreur inattendue est survenue. Réessayez dans un instant." };
  }
}

function isNextControlFlow(error: unknown): boolean {
  const digest =
    typeof error === "object" && error !== null && "digest" in error
      ? String((error as { digest: unknown }).digest)
      : "";
  return (
    digest.startsWith("NEXT_REDIRECT") ||
    digest.startsWith("NEXT_HTTP_ERROR_FALLBACK") ||
    digest === "NEXT_NOT_FOUND"
  );
}
