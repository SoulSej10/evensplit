import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { profileSetupSchema, type ProfileSetupInput } from "@evensplit/shared";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { BottomActionBar } from "@/components/ui/BottomActionBar";
import { useAuth } from "@/hooks/use-auth";
import { upsertProfile, uploadAvatar } from "@/lib/api/profile";
import { CURRENCIES } from "@/lib/format";
import { cn } from "@/lib/cn";

export default function ProfileSetupScreen() {
  const { authUser, refreshProfile } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  const { handleSubmit, formState, setValue, watch } = useForm<ProfileSetupInput>({
    resolver: zodResolver(profileSetupSchema),
    defaultValues: { display_name: "", default_currency: "PHP" },
  });

  async function pickAvatar() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) setAvatarUri(result.assets[0].uri);
  }

  async function onSubmit(values: ProfileSetupInput) {
    if (!authUser) {
      // Shouldn't normally happen (this screen is only reachable right
      // after a session-bearing sign-up), but fail loudly rather than a
      // silent no-op if it ever does - e.g. a session that expired while
      // the form was open.
      Alert.alert("Session expired", "Please log in again to finish setting up your profile.");
      router.replace("/(auth)/login");
      return;
    }
    setSubmitting(true);
    try {
      let avatarUrl: string | null = null;
      if (avatarUri) {
        avatarUrl = await uploadAvatar(authUser.id, avatarUri, "avatar.jpg");
      }
      await upsertProfile(authUser.id, { ...values, avatar_url: avatarUrl });
      await refreshProfile();
      router.replace("/(app)/(tabs)");
    } catch (err) {
      Alert.alert("Could not save profile", err instanceof Error ? err.message : "Try again");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-neutral-100 dark:bg-neutral-900"
    >
      <ScrollView contentContainerClassName="flex-1 justify-center px-6 py-10 pb-32">
      <View className="mb-8 items-center gap-2">
        <Text className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          Set up your profile
        </Text>
        <Text className="text-neutral-500">Just a few details before you start.</Text>
      </View>

      <View className="items-center gap-3">
        <Pressable onPress={pickAvatar}>
          <Avatar name={watch("display_name") || "?"} uri={avatarUri} size={88} logoFallback />
        </Pressable>
        <Pressable onPress={pickAvatar}>
          <Text className="font-medium text-primary">Upload photo</Text>
        </Pressable>
      </View>

      <View className="mt-6 gap-4">
        <TextField
          label="Display name"
          onChangeText={(t) => setValue("display_name", t)}
          value={watch("display_name")}
          error={formState.errors.display_name?.message}
        />

        <View className="gap-1.5">
          <Text className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
            Default currency
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {CURRENCIES.map((c) => {
              const selected = watch("default_currency") === c;
              return (
                <Pressable
                  key={c}
                  onPress={() => setValue("default_currency", c)}
                  className={cn(
                    "rounded-pill border px-4 py-2",
                    selected ? "border-primary bg-primary-light" : "border-neutral-500/20"
                  )}
                >
                  <Text className={cn("font-medium", selected ? "text-primary" : "text-neutral-500")}>
                    {c}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
      </ScrollView>

      <BottomActionBar>
        <Button onPress={handleSubmit(onSubmit)} loading={submitting} size="lg" className="flex-1">
          Continue
        </Button>
      </BottomActionBar>
    </KeyboardAvoidingView>
  );
}
