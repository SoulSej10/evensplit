"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { ChevronRight, Menu, Moon, Search, Sun } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { NAV_SECTIONS, SidebarNav } from "@/components/app-shell/sidebar";

function currentPageLabel(pathname: string): string {
  for (const section of NAV_SECTIONS) {
    if (section.children) {
      const child = section.children.find((c) =>
        c.href === "/personal" ? pathname === "/personal" : pathname.startsWith(c.href)
      );
      if (child) return `${section.label} · ${child.label}`;
      if (pathname.startsWith("/personal")) return section.label;
    }
    if (pathname === section.href) return section.label;
    if (section.href === "/groups" && pathname.startsWith("/groups/")) return "Group details";
  }
  return "SplitEven";
}

function Breadcrumb() {
  const pathname = usePathname();
  const label = currentPageLabel(pathname);

  return (
    <div className="flex min-w-0 items-center gap-1.5 text-sm">
      <Link href="/dashboard" className="shrink-0 font-medium text-muted-foreground hover:text-foreground">
        SplitEven
      </Link>
      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
      <span className="truncate font-semibold text-foreground">{label}</span>
    </div>
  );
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {mounted && resolvedTheme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </button>
  );
}

export function TopBar() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="flex h-16 items-center gap-3 px-4 lg:px-6">
        <button
          type="button"
          aria-label="Open navigation"
          onClick={() => setMobileNavOpen(true)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted lg:hidden"
        >
          <Menu className="h-4 w-4" />
        </button>

        <Breadcrumb />

        <div className="ml-2 hidden max-w-sm flex-1 items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground md:flex">
          <Search className="h-4 w-4 shrink-0" />
          <span className="flex-1 truncate">Search groups, expenses…</span>
          <kbd className="hidden shrink-0 rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground lg:inline">
            Ctrl K
          </kbd>
        </div>

        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
        </div>
      </div>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-72 overflow-y-auto p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <SidebarNav onNavigate={() => setMobileNavOpen(false)} />
        </SheetContent>
      </Sheet>
    </header>
  );
}
