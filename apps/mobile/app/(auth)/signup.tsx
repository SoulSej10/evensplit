import { useState } from "react";
import { Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { Link, router } from "expo-router";
import * as Linking from "expo-linking";
import { useColorScheme } from "nativewind";
import { ArrowLeft } from "lucide-react-native";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { signUpSchema, type SignUpInput } from "@evensplit/shared";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { BottomActionBar } from "@/components/ui/BottomActionBar";
import { GoogleButton } from "@/components/GoogleButton";
import { getSupabaseClient } from "@/lib/supabase/client";

export default function SignUpScreen() {
  const [submitting, setSubmitting] = useState(false);
  const { colorScheme } = useColorScheme();
  const iconColor = colorScheme === "dark" ? "#F4F5F3" : "#0A0A0A";
  const { handleSubmit, formState, setValue, watch } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: SignUpInput) {
    setSubmitting(true);
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.auth.signUp({
        ...values,
        options: { emailRedirectTo: Linking.createURL("auth/callback") },
      });
      if (error) throw error;
      if (!data.session) {
        // Email confirmation is required: signUp() succeeds but returns no
        // session, so there's no authenticated user yet to run profile
        // setup for. The confirmation link now points back at
        // evensplit://auth/callback (app/auth/callback.tsx), which signs
        // them straight in - but they may confirm from another device, so
        // send them to log in as a fallback in the meantime.
        Alert.alert(
          "Check your email",
          "We've sent a confirmation link to your email. Tap it to finish creating your account."
        );
        router.replace("/(auth)/login");
        return;
      }
      router.replace("/(auth)/profile-setup");
    } catch (err) {
      Alert.alert("Could not sign up", err instanceof Error ? err.message : "Try again");
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
        <Pressable onPress={() => router.back()} className="absolute left-6 top-14 h-9 w-9 items-center justify-center rounded-full bg-white dark:bg-surface-dark">
          <ArrowLeft size={18} color={iconColor} />
        </Pressable>

        <View className="mb-10 items-center gap-3">
          <Image source={require("../../assets/icon.png")} className="h-16 w-16 rounded-card" />
          <Text className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Create account</Text>
          <Text className="text-neutral-500">Start splitting expenses in seconds</Text>
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

          <View className="mt-2 flex-row items-center justify-center gap-1">
            <Text className="text-neutral-500">Already have an account?</Text>
            <Link href="/(auth)/login" asChild>
              <Pressable>
                <Text className="font-semibold text-primary">Log in</Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </ScrollView>

      <BottomActionBar className="flex-col gap-3">
        <Button onPress={handleSubmit(onSubmit)} loading={submitting} size="lg">
          Create account
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
