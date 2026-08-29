import { Sidebar } from "@/components/app-shell/sidebar";
import { TopBar } from "@/components/app-shell/top-bar";

/**
 * The authenticated app's chrome: a persistent left sidebar (desktop) /
 * sheet (mobile) for primary + secondary navigation, and a top bar with a
 * breadcrumb, search, and theme toggle - the SaaS dashboard shell used by
 * every authenticated web page. Mobile (apps/mobile) has its own separate
 * navigation and is unaffected by this file.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="flex min-h-screen flex-col lg:pl-64">
        <TopBar />
        <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
