"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, ListChecks, PieChart, PiggyBank, Tag, Wallet } from "lucide-react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { AppShell } from "@/components/app-shell/top-nav";
import { FinancesSummaryCard } from "@/components/personal/finances-summary-card";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/personal/overview", label: "Overview", icon: LayoutGrid },
  { href: "/personal", label: "Transactions", icon: ListChecks },
  { href: "/personal/analysis", label: "Analysis", icon: PieChart },
  { href: "/personal/budgets", label: "Budgets", icon: PiggyBank },
  { href: "/personal/accounts", label: "Accounts", icon: Wallet },
  { href: "/personal/categories", label: "Categories", icon: Tag },
];

/**
 * Sub-nav for Finances' own tabs (Records/Analysis/Budgets/Accounts/
 * Categories). The top-level "Finances" destination is now the persistent
 * TopNav (via AppShell), not a page-local header - so this only needs to
 * own the second-level tab row, not a title or back button.
 */
function PersonalSubNav() {
  const pathname = usePathname();

  return (
    <nav className="mb-6 flex gap-1 overflow-x-auto">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
            )}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function PersonalLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <AppShell>
        <h1 className="mb-4 text-2xl font-semibold tracking-tight">Finances</h1>
        <FinancesSummaryCard />
        <PersonalSubNav />
        {children}
      </AppShell>
    </AuthGuard>
  );
}
