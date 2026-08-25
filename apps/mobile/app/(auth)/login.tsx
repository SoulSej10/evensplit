import { useState } from "react";
import { Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { Link, router } from "expo-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { logInSchema, type LogInInput } from "@evensplit/shared";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { BottomActionBar } from "@/components/ui/BottomActionBar";
import { GoogleButton } from "@/components/GoogleButton";
import { getSupabaseClient } from "@/lib/supabase/client";

export default function LoginScreen() {
  const [submitting, setSubmitting] = useState(false);
  const { handleSubmit, formState, setValue, watch } = useForm<LogInInput>({
    resolver: zodResolver(logInSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LogInInput) {
    setSubmitting(true);
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.signInWithPassword(values);
      if (error) throw error;
      router.replace("/");
    } catch (err) {
      Alert.alert("Could not sign in", err instanceof Error ? err.message : "Try again");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-neutral-100 dark:bg-neutral-900"
    >
      <ScrollView
        contentContainerClassName="flex-1 justify-center px-6 py-10 pb-40"
        keyboardShouldPersistTaps="handled"
      >
        <View className="mb-10 items-center gap-3">
          <Image source={require("../../assets/icon.png")} className="h-16 w-16 rounded-2xl" />
          <Text className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">SplitEven</Text>
          <Text className="text-neutral-500">Split expenses. Stay even.</Text>
        </View>

        <View className="gap-4">
          <TextField
            label="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            onChangeText={(t) => setValue("email", t)}
            value={watch("email")}
            error={formState.errors.email?.message}
          />
          <TextField
            label="Password"
            secureTextEntry
            onChangeText={(t) => setValue("password", t)}
            value={watch("password")}
            error={formState.errors.password?.message}
          />
          <Pressable onPress={() => router.push("/(auth)/forgot-password")} className="self-end">
            <Text className="text-sm font-medium text-primary">Forgot password?</Text>
          </Pressable>

          <View className="mt-2 flex-row items-center justify-center gap-1">
            <Text className="text-neutral-500">Don't have an account?</Text>
            <Link href="/(auth)/signup" asChild>
              <Pressable>
                <Text className="font-semibold text-primary">Sign up</Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </ScrollView>

      <BottomActionBar className="flex-col gap-3">
        <Button onPress={handleSubmit(onSubmit)} loading={submitting} size="lg">
          Log in
        </Button>
        <View className="flex-row items-center gap-3">
          <View className="h-px flex-1 bg-neutral-500/20" />
          <Text className="text-xs text-neutral-500">or</Text>
          <View className="h-px flex-1 bg-neutral-500/20" />
        </View>
        <GoogleButton />
      </BottomActionBar>
    </KeyboardAvoidingView>
  );
}
