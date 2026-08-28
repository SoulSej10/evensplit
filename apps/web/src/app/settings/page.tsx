"use client";

import { AuthGuard } from "@/components/auth/auth-guard";
import { AppShell } from "@/components/app-shell/top-nav";
import { SettingsPanelContent } from "@/components/settings/settings-panel-content";

function SettingsContent() {
  return (
    <AppShell>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Settings</h1>
      <SettingsPanelContent />
    </AppShell>
  );
}

export default function SettingsPage() {
  return (
    <AuthGuard>
      <SettingsContent />
    </AuthGuard>
  );
}
