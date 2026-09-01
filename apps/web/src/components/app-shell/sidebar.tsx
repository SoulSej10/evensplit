"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChartBar as BarChart3, CaretDown as ChevronDown, SquaresFour as LayoutDashboard, GridFour as LayoutGrid, ListChecks, SignOut as LogOut, ChartPie as PieChart, PiggyBank, Gear as Settings, Tag, Users, Wallet } from "@phosphor-icons/react";
import { useState, type ComponentType } from "react";
import { Logo } from "@/components/brand/logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export interface NavLeaf {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

export interface NavSection extends NavLeaf {
  /** Sub-destinations shown when this section is expanded/active. */
  children?: NavLeaf[];
}

/**
 * Primary navigation, main items + sub-items where a section has more than
 * one real destination underneath it (Finances). Kept as one source of
 * truth so the top bar's breadcrumb can look up the current page's label
 * from the same structure instead of duplicating it.
 */
export const NAV_SECTIONS: NavSection[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/groups", label: "Groups", icon: Users },
  {
    href: "/personal/overview",
    label: "Finances",
    icon: Wallet,
    children: [
      { href: "/personal/overview", label: "Overview", icon: LayoutGrid },
      { href: "/personal", label: "Transactions", icon: ListChecks },
      { href: "/personal/analysis", label: "Analysis", icon: PieChart },
      { href: "/personal/budgets", label: "Budgets", icon: PiggyBank },
      { href: "/personal/accounts", label: "Accounts", icon: Wallet },
      { href: "/personal/categories", label: "Categories", icon: Tag },
    ],
  },
  { href: "/insights", label: "Insights", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

function isSectionActive(section: NavSection, pathname: string) {
  if (section.children) {
    return section.children.some((c) => (c.href === "/personal" ? pathname === "/personal" : pathname.startsWith(c.href)));
  }
  return pathname === section.href || pathname.startsWith(`${section.href}/`);
}

function isLeafActive(href: string, pathname: string) {
  return href === "/personal" ? pathname === "/personal" : pathname === href;
}

/** Shared nav content, rendered inside both the fixed desktop sidebar and the mobile sheet. */
export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, authUser, signOut } = useAuth();
  const [expanded, setExpanded] = useState<string | null>(
    NAV_SECTIONS.find((s) => s.children && isSectionActive(s, pathname))?.href ?? null
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-sidebar-border px-4 py-4">
        <Logo size={30} />
        <div className="leading-tight">
          <p className="text-sm font-semibold tracking-tight">SplitEven</p>
          <p className="text-[11px] text-muted-foreground">Shared &amp; personal money</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="flex flex-col gap-1">
          {NAV_SECTIONS.map((section) => {
            const active = isSectionActive(section, pathname);
            const hasChildren = !!section.children;
            const isOpen = hasChildren && (expanded === section.href || active);

            return (
              <li key={section.href}>
                {hasChildren ? (
                  <button
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : section.href)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active ? "bg-primary text-primary-foreground" : "text-foreground/80 hover:bg-muted"
                    )}
                  >
                    <section.icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1 text-left">{section.label}</span>
                    <ChevronDown
                      className={cn("h-3.5 w-3.5 shrink-0 transition-transform", isOpen && "rotate-180")}
                    />
                  </button>
                ) : (
                  <Link
                    href={section.href}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active ? "bg-primary text-primary-foreground" : "text-foreground/80 hover:bg-muted"
                    )}
                  >
                    <section.icon className="h-4 w-4 shrink-0" />
                    <span>{section.label}</span>
                  </Link>
                )}

                {hasChildren && isOpen && (
                  <ul className="mt-1 flex flex-col gap-0.5 border-l border-sidebar-border pl-4">
                    {section.children!.map((child) => {
                      const childActive = isLeafActive(child.href, pathname);
                      return (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            onClick={onNavigate}
                            className={cn(
                              "flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors",
                              childActive
                                ? "bg-primary-light text-primary"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                          >
                            <child.icon className="h-3.5 w-3.5 shrink-0" />
                            <span>{child.label}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-2 rounded-lg p-2">
          <Avatar className="h-9 w-9">
            <AvatarImage src={profile?.avatar_url ?? undefined} alt={profile?.display_name} />
            <AvatarFallback className="bg-primary-light text-primary">
              {/* eslint-disable-next-line @next/next/no-img-element -- small local asset, not worth next/image's overhead here */}
              <img src="/logo-mark.png" alt="" className="h-full w-full object-cover" />
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{profile?.display_name ?? "Account"}</p>
            <p className="truncate text-[11px] text-muted-foreground">{authUser?.email ?? profile?.default_currency}</p>
          </div>
          <button
            type="button"
            aria-label="Sign out"
            onClick={async () => {
              await signOut();
              router.replace("/login");
            }}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/** Fixed, persistent sidebar shown at lg+ widths. Mobile gets a sheet trigger instead, see top-bar.tsx. */
export function Sidebar() {
  return (
    <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-sidebar-border lg:bg-sidebar">
      <SidebarNav />
    </aside>
  );
}
