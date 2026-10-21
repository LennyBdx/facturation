import { cookies } from "next/headers";
import { AppSidebar } from "@/components/app-shell/app-sidebar";
import { MobileTabBar } from "@/components/app-shell/mobile-tab-bar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { APP_NAME } from "@/config/app";
import { initials } from "@/lib/format";
import { listCurrentUserOrganizations } from "@/lib/session";
import { getContext } from "@/services/context";
import { getNavBadges } from "@/services/dashboard";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getContext();
  const [organizations, badges, cookieStore] = await Promise.all([
    listCurrentUserOrganizations(),
    getNavBadges(ctx),
    cookies(),
  ]);
  const sidebarOpen = cookieStore.get("sidebar_state")?.value !== "false";

  return (
    <SidebarProvider defaultOpen={sidebarOpen}>
      <a
        href="#contenu"
        className="sr-only z-50 rounded-md bg-primary px-3 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Aller au contenu
      </a>
      <AppSidebar
        organizations={organizations.map((o) => ({ id: o.id, name: o.name, activity: o.activity }))}
        activeOrganizationId={ctx.orgId}
        user={{
          name: `${ctx.user.firstName} ${ctx.user.lastName}`,
          email: ctx.user.email,
          jobTitle: ctx.user.jobTitle,
          initials: initials(ctx.user.firstName, ctx.user.lastName),
        }}
        badges={badges}
      />
      <SidebarInset className="min-w-0">
        <header className="no-print sticky top-0 z-20 flex h-14 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur md:h-12">
          <SidebarTrigger className="-ml-1 hidden md:inline-flex" aria-label="Replier ou déplier le menu" />
          <span className="font-semibold md:hidden">{APP_NAME}</span>
          <span className="ml-auto truncate text-sm text-muted-foreground">{ctx.org.name}</span>
        </header>
        <main id="contenu" className="mx-auto w-full max-w-7xl flex-1 px-4 pt-4 pb-24 md:px-6 md:pt-6 md:pb-10">
          {children}
        </main>
      </SidebarInset>
      <MobileTabBar badges={badges} />
    </SidebarProvider>
  );
}
