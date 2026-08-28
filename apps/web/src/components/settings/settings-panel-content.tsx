"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ChevronRight, Download, KeyRound, ListChecks, LogOut, PiggyBank, Tag, Trash2, Upload, Wallet } from "lucide-react";
import {
  passwordResetSchema,
  profileSetupSchema,
  type PasswordResetInput,
  type ProfileSetupInput,
} from "@evensplit/shared";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/use-auth";
import { usePersonalAccounts, usePersonalCategories, usePersonalTransactions } from "@/hooks/use-personal";
import { upsertProfile, uploadAvatar } from "@/lib/api/profile";
import { importPersonalLedgerRows } from "@/lib/api/personal";
import { downloadPersonalLedgerCsv, parsePersonalLedgerCsv, summarizePersonalImport } from "@/lib/csv";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { CURRENCIES, initials } from "@/lib/format";

/** Shared between the /settings page and the left-sliding Sheet opened from the avatar menu. */
export function SettingsPanelContent({ onClose }: { onClose?: () => void }) {
  const router = useRouter();
  const { authUser, profile, refreshProfile, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatar_url ?? null);
  const [notifPrefs, setNotifPrefs] = useState({ expenses: true, settlements: true });
  const [changingPassword, setChangingPassword] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [pendingImport, setPendingImport] = useState<ReturnType<typeof parsePersonalLedgerCsv> | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const { data: transactions } = usePersonalTransactions();
  const { data: accounts } = usePersonalAccounts();
  const { data: categories } = usePersonalCategories();

  const { register, handleSubmit, watch, setValue, formState } = useForm<ProfileSetupInput>({
    resolver: zodResolver(profileSetupSchema),
    values: {
      display_name: profile?.display_name ?? "",
      default_currency: profile?.default_currency ?? "PHP",
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: passwordFormState,
    reset: resetPasswordForm,
  } = useForm<PasswordResetInput>({ resolver: zodResolver(passwordResetSchema) });

  function goTo(path: string) {
    onClose?.();
    router.push(path);
  }

  function onAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function onSubmit(values: ProfileSetupInput) {
    if (!authUser) return;
    setSubmitting(true);
    try {
      let avatarUrl = profile?.avatar_url ?? null;
      if (avatarFile) avatarUrl = await uploadAvatar(authUser.id, avatarFile);
      await upsertProfile(authUser.id, { ...values, avatar_url: avatarUrl });
      await refreshProfile();
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update profile");
    } finally {
      setSubmitting(false);
    }
  }

  async function onSubmitPassword(values: PasswordResetInput) {
    setChangingPassword(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({ password: values.password });
      if (error) throw error;
      resetPasswordForm();
      toast.success("Password updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update password");
    } finally {
      setChangingPassword(false);
    }
  }

  function onExport() {
    if (!transactions || transactions.length === 0) {
      toast.error("Nothing to export yet");
      return;
    }
    setExporting(true);
    try {
      downloadPersonalLedgerCsv(transactions, accounts ?? [], categories ?? []);
    } finally {
      setExporting(false);
    }
  }

  function onPickImportFile() {
    importInputRef.current?.click();
  }

  async function onImportFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const text = await file.text();
    const result = parsePersonalLedgerCsv(text);
    if (result.rows.length === 0) {
      toast.error(result.errors[0] ?? "Couldn't read any valid rows from that file.");
      return;
    }
    setPendingImport(result);
  }

  async function onConfirmImport() {
    if (!authUser || !pendingImport) return;
    try {
      const { imported } = await importPersonalLedgerRows(
        authUser.id,
        pendingImport.rows,
        accounts ?? [],
        categories ?? [],
        profile?.default_currency ?? "PHP"
      );
      await queryClient.invalidateQueries({ queryKey: ["personal-transactions", authUser.id] });
      await queryClient.invalidateQueries({ queryKey: ["personal-accounts", authUser.id] });
      await queryClient.invalidateQueries({ queryKey: ["personal-categories", authUser.id] });
      toast.success(`${imported} transaction${imported === 1 ? "" : "s"} imported`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    } finally {
      setPendingImport(null);
    }
  }

  async function onDeleteAccount() {
    if (!authUser) return;
    try {
      const supabase = getSupabaseBrowserClient();
      await supabase.from("group_members").delete().eq("user_id", authUser.id);
      await supabase.from("users").delete().eq("id", authUser.id);
      await signOut();
      toast.success("Account data removed. You've been signed out.");
      onClose?.();
      router.push("/");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete account");
    }
  }

  const importSummary = pendingImport ? summarizePersonalImport(pendingImport.rows, accounts ?? [], categories ?? []) : null;

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your name, photo, and default currency.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={avatarPreview ?? undefined} />
                <AvatarFallback className="bg-primary-light text-lg text-primary">
                  {initials(watch("display_name") || "?")}
                </AvatarFallback>
              </Avatar>
              <label className="cursor-pointer text-sm text-primary hover:underline">
                Change photo
                <input type="file" accept="image/*" className="hidden" onChange={onAvatarChange} />
              </label>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="display_name">Display name</Label>
              <Input id="display_name" {...register("display_name")} />
              {formState.errors.display_name && (
                <p className="text-xs text-destructive">{formState.errors.display_name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Default currency</Label>
              <Select value={watch("default_currency")} onValueChange={(v) => setValue("default_currency", v, { shouldValidate: true })}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" disabled={submitting}>
              Save changes
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>Change the password you use to sign in.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit(onSubmitPassword)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="new_password">New password</Label>
              <Input id="new_password" type="password" {...registerPassword("password")} />
              {passwordFormState.errors.password && (
                <p className="text-xs text-destructive">{passwordFormState.errors.password.message}</p>
              )}
            </div>
            <Button type="submit" variant="outline" disabled={changingPassword}>
              <KeyRound className="mr-2 h-4 w-4" /> Update password
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle>Manage</CardTitle>
          <CardDescription>Jump straight to your accounts, categories, or budgets.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          <button
            type="button"
            onClick={() => goTo("/personal/accounts")}
            className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-sm hover:bg-muted"
          >
            <span className="flex items-center gap-2.5">
              <Wallet className="h-4 w-4 text-primary" /> Accounts
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
          <button
            type="button"
            onClick={() => goTo("/personal/categories")}
            className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-sm hover:bg-muted"
          >
            <span className="flex items-center gap-2.5">
              <Tag className="h-4 w-4 text-primary" /> Categories
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
          <button
            type="button"
            onClick={() => goTo("/personal/budgets")}
            className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-sm hover:bg-muted"
          >
            <span className="flex items-center gap-2.5">
              <PiggyBank className="h-4 w-4 text-primary" /> Budgets
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
          <button
            type="button"
            onClick={() => goTo("/personal/overview")}
            className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-sm hover:bg-muted"
          >
            <span className="flex items-center gap-2.5">
              <ListChecks className="h-4 w-4 text-primary" /> Transactions
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle>Data</CardTitle>
          <CardDescription>Back up or restore your personal ledger as a CSV file.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={onExport} disabled={exporting}>
            <Download className="mr-2 h-4 w-4" /> Export data
          </Button>
          <Button variant="outline" onClick={onPickImportFile}>
            <Upload className="mr-2 h-4 w-4" /> Import data
          </Button>
          <input ref={importInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={onImportFileSelected} />
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Choose how SplitEven looks on this device.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <Label htmlFor="dark-mode">Dark mode</Label>
          <Switch id="dark-mode" checked={theme === "dark"} onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")} />
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Local preference only for now — push notifications are a stretch goal.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="notif-expenses">New expenses</Label>
            <Switch
              id="notif-expenses"
              checked={notifPrefs.expenses}
              onCheckedChange={(checked) => setNotifPrefs((p) => ({ ...p, expenses: checked }))}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="notif-settlements">Settlements</Label>
            <Switch
              id="notif-settlements"
              checked={notifPrefs.settlements}
              onCheckedChange={(checked) => setNotifPrefs((p) => ({ ...p, settlements: checked }))}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border/60 shadow-sm">
        <CardContent className="flex flex-col items-center gap-1 py-6 text-center">
          <p className="text-sm font-semibold">SplitEven</p>
          <p className="text-xs text-muted-foreground">Version 1.0.0</p>
          <p className="mt-2 text-xs text-muted-foreground">Developed solo by Jess Anthony Tahil</p>
          <p className="text-xs text-muted-foreground">A Peniko product</p>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-destructive/30 shadow-sm">
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={async () => {
              await signOut();
              onClose?.();
              router.replace("/login");
            }}
          >
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Delete account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                <AlertDialogDescription>
                  This removes your profile and group memberships. This can&apos;t be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onDeleteAccount} className="bg-destructive text-white">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      <AlertDialog open={!!pendingImport} onOpenChange={(open) => !open && setPendingImport(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Import this file?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-1">
              <span className="block">
                {importSummary?.rowCount ?? 0} transaction{importSummary?.rowCount === 1 ? "" : "s"} found.
              </span>
              {importSummary && importSummary.newAccounts.length > 0 && (
                <span className="block">New accounts: {importSummary.newAccounts.join(", ")}</span>
              )}
              {importSummary && importSummary.newCategories.length > 0 && (
                <span className="block">New categories: {importSummary.newCategories.join(", ")}</span>
              )}
              {pendingImport && pendingImport.errors.length > 0 && (
                <span className="block">{pendingImport.errors.length} row(s) will be skipped.</span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmImport}>Import</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
