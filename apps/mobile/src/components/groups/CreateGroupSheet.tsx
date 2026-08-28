import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { createGroupSchema } from "@evensplit/shared";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { useAuth } from "@/hooks/use-auth";
import { createGroup } from "@/lib/api/groups";
import { CURRENCIES } from "@/lib/format";
import { cn } from "@/lib/cn";

const ICONS = ["👥", "🏠", "✈️", "🍕", "🎉", "💰", "🚗", "🏖️"];

export function CreateGroupSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { authUser, profile } = useAuth();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [icon, setIcon] = useState(ICONS[0]);
  const [currency, setCurrency] = useState(profile?.default_currency ?? "PHP");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit() {
    if (!authUser) return;
    const parsed = createGroupSchema.safeParse({ name, icon, currency });
    if (!parsed.success) {
      Alert.alert("Check the group details", parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setSubmitting(true);
    try {
      const group = await createGroup(parsed.data, authUser.id);
      await queryClient.invalidateQueries({ queryKey: ["groups"] });
      onClose();
      setName("");
      router.push(`/(app)/groups/${group.id}`);
    } catch (err) {
      Alert.alert("Could not create group", err instanceof Error ? err.message : "Try again");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Create a group"
      footer={
        <Button onPress={onSubmit} loading={submitting} size="lg">
          Create group
        </Button>
      }
    >
      <View className="flex-row flex-wrap gap-2">
        {ICONS.map((i) => (
          <Pressable
            key={i}
            onPress={() => setIcon(i)}
            className={cn(
              "h-11 w-11 items-center justify-center rounded-card",
              icon === i ? "bg-primary-light" : "bg-neutral-100 dark:bg-white/5"
            )}
          >
            <Text className="text-xl">{i}</Text>
          </Pressable>
        ))}
      </View>

      <TextField label="Group name" placeholder="Baguio Trip 2026" value={name} onChangeText={setName} />

      <View className="gap-1.5">
        <Text className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Currency</Text>
        <View className="flex-row flex-wrap gap-2">
          {CURRENCIES.map((c) => (
            <Pressable
              key={c}
              onPress={() => setCurrency(c)}
              className={cn(
                "rounded-pill border px-3 py-1.5",
                currency === c ? "border-primary bg-primary-light" : "border-neutral-500/20"
              )}
            >
              <Text className={cn("text-sm font-medium", currency === c ? "text-primary" : "text-neutral-500")}>
                {c}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </BottomSheet>
  );
}
