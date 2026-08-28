import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { createPersonalCategorySchema, type PersonalCategoryKind } from "@evensplit/shared";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { useCreatePersonalCategory } from "@/hooks/use-personal";
import { cn } from "@/lib/cn";

const ICONS = ["🛒", "🍔", "🚗", "🏠", "💡", "🎬", "💊", "📚", "✈️", "💰", "🎁", "📱"];

export function AddCategorySheet({
  visible,
  onClose,
  defaultKind,
}: {
  visible: boolean;
  onClose: () => void;
  defaultKind: PersonalCategoryKind;
}) {
  const createCategory = useCreatePersonalCategory();
  const [name, setName] = useState("");
  const [kind, setKind] = useState<PersonalCategoryKind>(defaultKind);
  const [icon, setIcon] = useState(ICONS[0]);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit() {
    const parsed = createPersonalCategorySchema.safeParse({ name, kind, icon });
    if (!parsed.success) {
      Alert.alert("Check the category details", parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setSubmitting(true);
    try {
      await createCategory.mutateAsync(parsed.data);
      onClose();
      setName("");
    } catch (err) {
      Alert.alert("Could not add category", err instanceof Error ? err.message : "Try again");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Add a category"
      footer={
        <Button onPress={onSubmit} loading={submitting} size="lg">
          Add category
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

      <TextField label="Name" placeholder="Groceries" value={name} onChangeText={setName} />

      <View className="gap-1.5">
        <Text className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Kind</Text>
        <View className="flex-row gap-2">
          {(["expense", "income"] as const).map((k) => (
            <Pressable
              key={k}
              onPress={() => setKind(k)}
              className={cn(
                "rounded-pill border px-4 py-1.5",
                kind === k ? "border-primary bg-primary-light" : "border-neutral-500/20"
              )}
            >
              <Text className={cn("text-sm font-medium capitalize", kind === k ? "text-primary" : "text-neutral-500")}>
                {k}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </BottomSheet>
  );
}
