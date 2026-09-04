"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { logInSchema, signUpSchema, type LogInInput, type SignUpInput } from "@evensplit/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Logo } from "@/components/brand/logo";

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [submitting, setSubmitting] = useState(false);

  const loginForm = useForm<LogInInput>({ resolver: zodResolver(logInSchema) });
  const signupForm = useForm<SignUpInput>({ resolver: zodResolver(signUpSchema) });

  async function onLogin(values: LogInInput) {
    setSubmitting(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword(values);
      if (error) throw error;
      router.push("/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not sign in");
    } finally {
      setSubmitting(false);
    }
  }

  async function onSignUp(values: SignUpInput) {
    setSubmitting(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: { emailRedirectTo: `${window.location.origin}/onboarding` },
      });
      if (error) throw error;
      toast.success("Account created. Check your email to confirm, then finish your profile.");
      router.push("/onboarding");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not sign up");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <Logo size={48} />
          <h1 className="text-2xl font-semibold tracking-tight">SplitEven</h1>
          <p className="text-sm text-muted-foreground">Split expenses. Stay even.</p>
        </div>

        <Card className="rounded-2xl border-border/60 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Welcome</CardTitle>
            <CardDescription>Sign in or create an account to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={tab} onValueChange={(v) => setTab(v as "login" | "signup")}>
              <TabsList className="w-full">
                <TabsTrigger value="login" className="flex-1">
                  Log in
                </TabsTrigger>
                <TabsTrigger value="signup" className="flex-1">
                  Sign up
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="mt-4">
                <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="login-email">Email</Label>
                    <Input id="login-email" type="email" {...loginForm.register("email")} />
                    {loginForm.formState.errors.email && (
                      <p className="text-xs text-destructive">
                        {loginForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="login-password">Password</Label>
                      <Link
                        href="/forgot-password"
                        className="text-xs text-primary hover:underline"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <Input
                      id="login-password"
                      type="password"
                      {...loginForm.register("password")}
                    />
                    {loginForm.formState.errors.password && (
                      <p className="text-xs text-destructive">
                        {loginForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>
                  <Button type="submit" className="w-full" disabled={submitting}>
                    Log in
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="mt-4">
                <form onSubmit={signupForm.handleSubmit(onSignUp)} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input id="signup-email" type="email" {...signupForm.register("email")} />
                    {signupForm.formState.errors.email && (
                      <p className="text-xs text-destructive">
                        {signupForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      {...signupForm.register("password")}
                    />
                    {signupForm.formState.errors.password && (
                      <p className="text-xs text-destructive">
                        {signupForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>
                  <Button type="submit" className="w-full" disabled={submitting}>
                    Create account
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">
                    By creating an account, you agree to our{" "}
                    <Link href="/terms-of-service" className="underline hover:text-foreground">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy-policy" className="underline hover:text-foreground">
                      Privacy Policy
                    </Link>
                    .
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          <Link href="/" className="hover:underline">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
