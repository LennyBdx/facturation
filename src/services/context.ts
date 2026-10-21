/**
 * Dépendances des services (injection explicite).
 *
 * - `AppDeps` : implémentations techniques (données, transactions, plateforme, horloge),
 *   fournies par la racine de composition (`src/composition/request-context.ts`) ou par un test.
 * - `RequestScope` : qui agit, pour quelle entreprise.
 * - `ServiceContext<R, P>` : chaque service ne déclare que les repositories (`R`) et les
 *   méthodes de plateforme (`P`) dont il a besoin (ségrégation des interfaces).
 */
import "server-only";
import type { Membership, Organization, Repositories, UnitOfWork, User } from "@/data";
import type { Role } from "@/domain/permissions";
import type { EInvoicingProvider } from "@/integrations/e-invoicing";

export interface Clock {
  /** Date du jour, AAAA-MM-JJ. */
  today(): string;
  /** Horodatage ISO. */
  now(): string;
}

export interface AppDeps {
  repos: Repositories;
  uow: UnitOfWork;
  provider: EInvoicingProvider;
  clock: Clock;
}

export interface RequestScope {
  org: Organization;
  user: User;
  membership: Membership;
}

export interface Context extends AppDeps {
  org: Organization;
  orgId: string;
  user: User;
  role: Role;
  today: string;
}

export function createContext(deps: AppDeps, scope: RequestScope): Context {
  return {
    ...deps,
    org: scope.org,
    orgId: scope.org.id,
    user: scope.user,
    role: scope.membership.role,
    today: deps.clock.today(),
  };
}

type Scope = Pick<Context, "org" | "orgId" | "user" | "role" | "today" | "clock">;

/** Contexte réduit à ce qu'un service utilise réellement. */
export type ServiceContext<R extends keyof Repositories = never, P extends keyof EInvoicingProvider = never> = Scope & {
  repos: Pick<Repositories, R>;
} & ([P] extends [never] ? unknown : { provider: Pick<EInvoicingProvider, P> });
