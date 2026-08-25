import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { ArrowLeft, Mail } from "lucide-react-native";
import * as Linking from "expo-linking";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { passwordResetRequestSchema, type PasswordResetRequestInput } from "@evensplit/shared";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { getSupabaseClient } from "@/lib/supabase/client";

export default function ForgotPasswordScreen() {
  const [sent, setSent] = useState(false);
  const { handleSubmit, formState, setValue, watch } = useForm<PasswordResetRequestInput>({
    resolver: zodResolver(passwordResetRequestSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: PasswordResetRequestInput) {
    try {
      const supabase = getSupabaseClient();
      const redirectTo = Linking.createURL("auth/reset-password");
      const { error } = await supabase.auth.resetPasswordForEmail(values.email, { redirectTo });
      if (error) throw error;
      setSent(true);
    } catch (err) {
      Alert.alert("Could not send reset email", err instanceof Error ? err.message : "Try again");
    }
  }

  return (
    <View className="flex-1 justify-center bg-neutral-100 px-6 dark:bg-neutral-900">
      <Pressable onPress={() => router.back()} className="absolute left-6 top-14 h-9 w-9 items-center justify-center rounded-full bg-white dark:bg-white/10">
        <ArrowLeft size={18} color="#1A1D1B" />
      </Pressable>

      <View className="mb-8 items-center gap-3">
        <View className="h-14 w-14 items-center justify-center rounded-3xl bg-primary-light">
          <Mail color="#2F6F5E" size={24} />
        </View>
        <Text className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
          Reset your password
        </Text>
        <Text className="text-center text-neutral-500">
          {sent ? "Check your inbox for a reset link." : "We'll email you a link to reset your password."}
        </Text>
      </View>

      {!sent ? (
        <View className="gap-4">
          <TextField
            label="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            onChangeText={(t) => setValue("email", t)}
            value={watch("email")}
            error={formState.errors.email?.message}
          />
          <Button onPress={handleSubmit(onSubmit)} size="lg">
            Send reset link
          </Button>
        </View>
      ) : (
        <Button onPress={() => router.replace("/(auth)/login")} size="lg">
          Back to log in
        </Button>
      )}
    </View>
  );
}
