"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { profileSetupSchema, type ProfileSetupInput } from "@evensplit/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AuthGuard } from "@/components/auth/auth-guard";
import { useAuth } from "@/hooks/use-auth";
import { upsertProfile, uploadAvatar } from "@/lib/api/profile";
import { CURRENCIES, initials } from "@/lib/format";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function OnboardingForm() {
  const router = useRouter();
  const { authUser, profile, refreshProfile } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatar_url ?? null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const { register, handleSubmit, watch, setValue, formState } = useForm<ProfileSetupInput>({
    resolver: zodResolver(profileSetupSchema),
    defaultValues: {
      display_name: profile?.display_name ?? "",
      default_currency: profile?.default_currency ?? "PHP",
    },
  });

  const currency = watch("default_currency");

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
      if (avatarFile) {
        avatarUrl = await uploadAvatar(authUser.id, avatarFile);
      }
      await upsertProfile(authUser.id, { ...values, avatar_url: avatarUrl });
      await refreshProfile();
      toast.success("Profile saved");
      router.push("/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save profile");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm rounded-2xl border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle>Set up your profile</CardTitle>
          <CardDescription>Just a few details before you get started.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="flex flex-col items-center gap-3">
              <Avatar className="h-20 w-20">
                <AvatarImage src={avatarPreview ?? undefined} alt="Avatar" />
                <AvatarFallback className="bg-primary-light text-lg text-primary">
                  {initials(watch("display_name") || "?")}
                </AvatarFallback>
              </Avatar>
              <label className="cursor-pointer text-sm text-primary hover:underline">
                Upload photo
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
                value={currency}
                onValueChange={(v) => setValue("default_currency", v, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Currency" />
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

            <Button type="submit" className="w-full" disabled={submitting}>
              Continue
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <AuthGuard>
      <OnboardingForm />
    </AuthGuard>
  );
}
