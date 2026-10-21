"use client";

import { routes } from "@/config/routes";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition } from "react";
import { useTheme } from "next-themes";
import {
  Building2,
  Check,
  ChevronsUpDown,
  LogOut,
  Moon,
  ShieldCheck,
  Sun,
  UserRound,
} from "lucide-react";
import { APP_NAME, E_INVOICING_READY_LABEL } from "@/config/app";
import { signOut, switchOrganization } from "@/features/session/actions";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { isActive, NAV_ITEMS } from "./nav-items";

export interface ShellOrganization {
  id: string;
  name: string;
  activity: string;
}

export interface ShellUser {
  name: string;
  email: string;
  jobTitle?: string;
  initials: string;
}

export function AppSidebar({
  organizations,
  activeOrganizationId,
  user,
  badges,
}: {
  organizations: ShellOrganization[];
  activeOrganizationId: string;
  user: ShellUser;
  badges: { received: number; rejected: number };
}) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const active = organizations.find((o) => o.id === activeOrganizationId) ?? organizations[0]!;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link
          href={routes.dashboard}
          className="flex items-center gap-2 px-2 py-1.5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
        >
          <span
            aria-hidden
            className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary font-semibold text-primary-foreground"
          >
            <span className="size-3 rotate-45 rounded-[2px] bg-brand" />
          </span>
          <span className="text-lg font-semibold tracking-tight group-data-[collapsible=icon]:hidden">
            {APP_NAME}
          </span>
        </Link>
        <OrganizationSwitcher organizations={organizations} active={active} />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => {
                const count = item.badgeKey ? badges[item.badgeKey] : 0;
                const urgent = item.badgeKey === "rejected";
                const countLabel =
                  count > 0 ? `${count} ${urgent ? "à corriger" : "à traiter"}` : null;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(pathname, item.href)}
                      tooltip={countLabel ? `${item.label} · ${countLabel}` : item.label}
                      className="h-11 md:h-9"
                    >
                      <Link href={item.href} onClick={() => setOpenMobile(false)}>
                        <item.icon aria-hidden />
                        <span>{item.label}</span>
                        {countLabel ? <span className="sr-only">, {countLabel}</span> : null}
                      </Link>
                    </SidebarMenuButton>
                    {count > 0 ? (
                      <>
                        <SidebarMenuBadge
                          aria-hidden
                          className={
                            urgent ? "bg-danger-soft text-danger" : "bg-info-soft text-info"
                          }
                        >
                          {count}
                        </SidebarMenuBadge>
                        {/* Menu replié : le compteur devient une pastille sur l'icône. */}
                        <span
                          aria-hidden
                          className={cn(
                            "pointer-events-none absolute top-1 right-1 hidden size-2.5 rounded-full ring-2 ring-sidebar group-data-[collapsible=icon]:block",
                            urgent ? "bg-danger" : "bg-info",
                          )}
                        />
                      </>
                    ) : null}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <p className="flex items-center gap-1.5 px-2 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
          <ShieldCheck aria-hidden className="size-3.5 text-success" />
          {E_INVOICING_READY_LABEL}
        </p>
        <UserMenu user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

function OrganizationSwitcher({
  organizations,
  active,
}: {
  organizations: ShellOrganization[];
  active: ShellOrganization;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="border bg-card group-data-[collapsible=icon]:justify-center"
              aria-label="Changer d'entreprise"
              disabled={pending}
            >
              <Building2 aria-hidden />
              <span className="flex min-w-0 flex-col text-left leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-medium">{active.name}</span>
                <span className="truncate text-xs text-muted-foreground">{active.activity}</span>
              </span>
              <ChevronsUpDown
                aria-hidden
                className="ml-auto group-data-[collapsible=icon]:hidden"
              />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-(--radix-dropdown-menu-trigger-width) min-w-64"
          >
            <DropdownMenuLabel>Entreprises</DropdownMenuLabel>
            {organizations.map((o) => (
              <DropdownMenuItem
                key={o.id}
                className="min-h-11 md:min-h-9"
                onSelect={() => startTransition(() => switchOrganization(o.id))}
              >
                <Building2 aria-hidden />
                <span className="flex-1 truncate">{o.name}</span>
                {o.id === active.id ? <Check aria-label="Entreprise active" /> : null}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

function UserMenu({ user }: { user: ShellUser }) {
  const { resolvedTheme, setTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" aria-label="Menu utilisateur">
              <span
                aria-hidden
                className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground"
              >
                {user.initials}
              </span>
              <span className="flex min-w-0 flex-col text-left leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {user.jobTitle ?? user.email}
                </span>
              </span>
              <ChevronsUpDown aria-hidden className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            align="start"
            className="w-(--radix-dropdown-menu-trigger-width) min-w-60"
          >
            <DropdownMenuLabel className="font-normal">
              <span className="block font-medium">{user.name}</span>
              <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild className="min-h-11 md:min-h-9">
                <Link href={routes.settings.account}>
                  <UserRound aria-hidden />
                  Mon compte
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="min-h-11 md:min-h-9"
                onSelect={() => setTheme(dark ? "light" : "dark")}
              >
                {dark ? <Sun aria-hidden /> : <Moon aria-hidden />}
                {dark ? "Thème clair" : "Thème sombre"}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              className="min-h-11 md:min-h-9"
              onSelect={() => signOut()}
            >
              <LogOut aria-hidden />
              Se déconnecter
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
