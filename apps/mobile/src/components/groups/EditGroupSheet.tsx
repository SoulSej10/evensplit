import { useEffect, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { updateGroupSchema, type Group } from "@evensplit/shared";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { useUpdateGroup } from "@/hooks/use-group-detail";
import { CURRENCIES } from "@/lib/format";
import { cn } from "@/lib/cn";

const ICONS = ["👥", "🏠", "✈️", "🍕", "🎉", "💰", "🚗", "🏖️"];

/** Rename a group / change its icon or currency - owner-only, mirrors CreateGroupSheet's form. */
export function EditGroupSheet({
  visible,
  onClose,
  group,
}: {
  visible: boolean;
  onClose: () => void;
  group: Group;
}) {
  const updateGroup = useUpdateGroup(group.id);
  const [name, setName] = useState(group.name);
  const [icon, setIcon] = useState(group.icon ?? ICONS[0]);
  const [currency, setCurrency] = useState(group.currency);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setName(group.name);
      setIcon(group.icon ?? ICONS[0]);
      setCurrency(group.currency);
    }
  }, [visible, group]);

  async function onSubmit() {
    const parsed = updateGroupSchema.safeParse({ name, icon, currency });
    if (!parsed.success) {
      Alert.alert("Check the group details", parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setSubmitting(true);
    try {
      await updateGroup.mutateAsync(parsed.data);
      onClose();
    } catch (err) {
      Alert.alert("Could not update group", err instanceof Error ? err.message : "Try again");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Edit group"
      footer={
        <Button onPress={onSubmit} loading={submitting} size="lg">
          Save changes
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
