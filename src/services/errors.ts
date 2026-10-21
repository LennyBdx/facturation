/** Erreur métier attendue : son message est affiché tel quel à l'utilisateur. */
export class BusinessError extends Error {
  override name = "BusinessError";
}

/** Action refusée pour le rôle de l'utilisateur. */
export class ForbiddenError extends BusinessError {
  override name = "ForbiddenError";
}
