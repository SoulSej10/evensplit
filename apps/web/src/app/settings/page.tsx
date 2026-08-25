"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { profileSetupSchema, type ProfileSetupInput } from "@evensplit/shared";
import { AuthGuard } from "@/components/auth/auth-guard";
import { AppShell } from "@/components/app-shell/top-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
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
import { upsertProfile, uploadAvatar } from "@/lib/api/profile";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { CURRENCIES, initials } from "@/lib/format";

function SettingsContent() {
  const router = useRouter();
  const { authUser, profile, refreshProfile, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [submitting, setSubmitting] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatar_url ?? null);
  const [notifPrefs, setNotifPrefs] = useState({ expenses: true, settlements: true });

  const { register, handleSubmit, watch, setValue, formState } = useForm<ProfileSetupInput>({
    resolver: zodResolver(profileSetupSchema),
    values: {
      display_name: profile?.display_name ?? "",
      default_currency: profile?.default_currency ?? "USD",
    },
  });

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

  async function onDeleteAccount() {
    if (!authUser) return;
    try {
      const supabase = getSupabaseBrowserClient();
      // Best-effort client-side cleanup: remove the public profile row and
      // group memberships. Fully deleting the underlying auth.users record
      // requires the Supabase service-role key from a trusted server
      // context (e.g. an Edge Function) — out of scope for this client-only
      // app, so we sign the user out after clearing what we can reach.
      await supabase.from("group_members").delete().eq("user_id", authUser.id);
      await supabase.from("users").delete().eq("id", authUser.id);
      await signOut();
      toast.success("Account data removed. You've been signed out.");
      router.push("/");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete account");
    }
  }

  return (
    <AppShell>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Settings</h1>

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
                  <p className="text-xs text-destructive">
                    {formState.errors.display_name.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Default currency</Label>
                <Select
                  value={watch("default_currency")}
                  onValueChange={(v) => setValue("default_currency", v, { shouldValidate: true })}
                >
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
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Choose how EvenSplit looks on this device.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <Label htmlFor="dark-mode">Dark mode</Label>
            <Switch
              id="dark-mode"
              checked={theme === "dark"}
              onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
            />
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>
              Local preference only for now — push notifications are a stretch goal (Phase 6).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="notif-expenses">New expenses</Label>
              <Switch
                id="notif-expenses"
                checked={notifPrefs.expenses}
                onCheckedChange={(checked) =>
                  setNotifPrefs((p) => ({ ...p, expenses: checked }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="notif-settlements">Settlements</Label>
              <Switch
                id="notif-settlements"
                checked={notifPrefs.settlements}
                onCheckedChange={(checked) =>
                  setNotifPrefs((p) => ({ ...p, settlements: checked }))
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-destructive/30 shadow-sm">
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => signOut()}>
              Sign out
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Delete account</Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This removes your profile and group memberships. This can't be undone.
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
      </div>
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
