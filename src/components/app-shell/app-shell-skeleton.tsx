import { Skeleton } from "@/components/ui/skeleton";
import { APP_NAME } from "@/config/app";
import { PageSkeleton } from "./page-skeleton";

/**
 * Coquille statique prérendue de l'espace connecté (Cache Components) :
 * affichée instantanément pendant la lecture de la session et des données.
 */
export function AppShellSkeleton() {
  return (
    <div className="flex min-h-svh">
      <aside
        aria-hidden
        className="hidden w-64 shrink-0 space-y-3 border-r bg-sidebar p-3 md:block"
      >
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-14 w-full" />
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="h-9 w-full" />
        ))}
      </aside>
      <div className="min-w-0 flex-1">
        <header className="flex h-14 items-center border-b px-4 md:h-12">
          <span className="font-semibold md:hidden">{APP_NAME}</span>
        </header>
        <div className="mx-auto w-full max-w-7xl px-4 pt-4 md:px-6 md:pt-6">
          <PageSkeleton />
        </div>
      </div>
    </div>
  );
}
