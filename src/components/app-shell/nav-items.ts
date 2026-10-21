import { routes } from "@/config/routes";
import {
  FileText,
  HardHat,
  Inbox,
  LayoutDashboard,
  type LucideIcon,
  Receipt,
  Settings,
  Users,
  UsersRound,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  shortLabel?: string;
  icon: LucideIcon;
  badgeKey?: "received" | "rejected";
}

export const NAV_ITEMS: NavItem[] = [
  { href: routes.dashboard, label: "Tableau de bord", shortLabel: "Accueil", icon: LayoutDashboard },
  { href: routes.clients.list(), label: "Clients", icon: Users },
  { href: routes.worksites.list(), label: "Chantiers", icon: HardHat },
  { href: routes.quotes.list(), label: "Devis", icon: FileText },
  { href: routes.invoices.list(), label: "Factures émises", shortLabel: "Factures", icon: Receipt, badgeKey: "rejected" },
  { href: routes.received.list(), label: "Factures reçues", shortLabel: "Reçues", icon: Inbox, badgeKey: "received" },
  { href: routes.team, label: "Équipe", icon: UsersRound },
  { href: routes.settings.index, label: "Paramètres", icon: Settings },
];

/** Barre d'onglets mobile : 4 destinations + « Menu » (règle : 5 entrées maximum). */
export const MOBILE_TABS = [routes.dashboard, routes.quotes.list(), routes.invoices.list(), routes.received.list()];

export function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
