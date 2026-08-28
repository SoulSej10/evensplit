"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, Home, LogOut, Settings, Users, Wallet } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { SettingsPanelContent } from "@/components/settings/settings-panel-content";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/format";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/groups", label: "Groups", icon: Users },
  { href: "/personal/overview", label: "Finances", icon: Wallet },
  { href: "/insights", label: "Insights", icon: BarChart3 },
];

/**
 * The four primary destinations, matching the four jobs users do here: Home
 * ("how am I doing"), Groups ("shared money"), Finances ("my money"),
 * Insights ("what can I learn"). Settings stays out of this row - it's
 * reached only via the avatar menu, same as it already was on web.
 */
function PrimaryNav() {
  const pathname = usePathname();
  return (
    <nav className="flex items-center gap-1">
      {NAV_ITEMS.map((item) => {
        // Finances covers every /personal/* sub-route (overview, analysis, budgets, etc.)
        const active = pathname === item.href || (item.href.startsWith("/personal") && pathname.startsWith("/personal"));
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.label}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
            )}
          >
            <item.icon className="h-4 w-4" />
            <span className="hidden sm:inline">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function TopNav() {
  const { profile, signOut } = useAuth();
  const router = useRouter();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Link href="/dashboard" aria-label="SplitEven home" className="flex items-center gap-2 font-semibold">
          <Logo size={32} />
          <span className="hidden text-lg tracking-tight sm:inline">SplitEven</span>
        </Link>

        <PrimaryNav />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-ring">
              <Avatar className="h-9 w-9">
                <AvatarImage src={profile?.avatar_url ?? undefined} alt={profile?.display_name} />
                <AvatarFallback className="bg-primary-light text-primary">
                  {profile?.display_name ? initials(profile.display_name) : "?"}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5 text-sm font-medium">{profile?.display_name}</div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
              <Settings className="mr-2 h-4 w-4" /> Settings
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={async () => {
                await signOut();
                router.replace("/login");
              }}
            >
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
        <SheetContent side="left" className="overflow-y-auto p-0">
          <SheetHeader className="border-b border-border/60">
            <SheetTitle>Settings</SheetTitle>
          </SheetHeader>
          <div className="p-4">
            <SettingsPanelContent onClose={() => setSettingsOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <TopNav />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
