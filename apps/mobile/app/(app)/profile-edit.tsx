import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { router, Stack } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { ArrowLeft } from "lucide-react-native";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { profileSetupSchema, type ProfileSetupInput } from "@evensplit/shared";
import { SafeAreaView } from "react-native-safe-area-context";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { useAuth } from "@/hooks/use-auth";
import { upsertProfile, uploadAvatar } from "@/lib/api/profile";
import { CURRENCIES } from "@/lib/format";
import { cn } from "@/lib/cn";

export default function ProfileEditScreen() {
  const { authUser, profile, refreshProfile } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(profile?.avatar_url ?? null);

  const { handleSubmit, formState, setValue, watch } = useForm<ProfileSetupInput>({
    resolver: zodResolver(profileSetupSchema),
    defaultValues: {
      display_name: profile?.display_name ?? "",
      default_currency: profile?.default_currency ?? "USD",
    },
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
    if (!authUser) return;
    setSubmitting(true);
    try {
      let avatarUrl = profile?.avatar_url ?? null;
      if (avatarUri && avatarUri !== profile?.avatar_url) {
        avatarUrl = await uploadAvatar(authUser.id, avatarUri, "avatar.jpg");
      }
      await upsertProfile(authUser.id, { ...values, avatar_url: avatarUrl });
      await refreshProfile();
      router.back();
    } catch (err) {
      Alert.alert("Could not update profile", err instanceof Error ? err.message : "Try again");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-neutral-100 dark:bg-neutral-900">
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-row items-center gap-3 px-5 pt-3">
        <Pressable
          onPress={() => router.back()}
          className="h-9 w-9 items-center justify-center rounded-full bg-white dark:bg-white/10"
        >
          <ArrowLeft size={18} color="#0A0A0A" />
        </Pressable>
        <Text className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          Edit profile
        </Text>
      </View>

      <ScrollView contentContainerClassName="gap-4 px-5 py-6">
        <View className="items-center gap-3">
          <Pressable onPress={pickAvatar}>
            <Avatar name={watch("display_name")} uri={avatarUri} size={88} />
          </Pressable>
          <Pressable onPress={pickAvatar}>
            <Text className="font-medium text-primary">Change photo</Text>
          </Pressable>
        </View>

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

        <Button onPress={handleSubmit(onSubmit)} loading={submitting} size="lg" className="mt-2">
          Save changes
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}
