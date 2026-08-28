import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { createPersonalBudgetSchema } from "@evensplit/shared";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { usePersonalCategories, useUpsertPersonalBudget } from "@/hooks/use-personal";
import { cn } from "@/lib/cn";

export function AddBudgetSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { data: categories } = usePersonalCategories();
  const upsertBudget = useUpsertPersonalBudget();
  const expenseCategories = categories?.filter((c) => c.kind === "expense") ?? [];

  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [monthlyLimit, setMonthlyLimit] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit() {
    const parsed = createPersonalBudgetSchema.safeParse({
      category_id: categoryId,
      monthly_limit: Number(monthlyLimit) || 0,
    });
    if (!parsed.success) {
      Alert.alert("Check the budget details", parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setSubmitting(true);
    try {
      await upsertBudget.mutateAsync(parsed.data);
      onClose();
      setMonthlyLimit("");
      setCategoryId(null);
    } catch (err) {
      Alert.alert("Could not save budget", err instanceof Error ? err.message : "Try again");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Set a monthly budget"
      footer={
        <Button onPress={onSubmit} loading={submitting} size="lg">
          Save budget
        </Button>
      }
    >
      <View className="gap-1.5">
        <Text className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Category</Text>
        {expenseCategories.length === 0 ? (
          <Text className="text-sm text-neutral-500">Add an expense category first.</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
            {expenseCategories.map((c) => (
              <Pressable
                key={c.id}
                onPress={() => setCategoryId(c.id)}
                className={cn(
                  "rounded-pill border px-3 py-1.5",
                  categoryId === c.id ? "border-primary bg-primary-light" : "border-neutral-500/20"
                )}
              >
                <Text
                  className={cn("text-sm font-medium", categoryId === c.id ? "text-primary" : "text-neutral-500")}
                >
                  {c.icon ? `${c.icon} ` : ""}
                  {c.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>

      <TextField label="Monthly limit" keyboardType="decimal-pad" value={monthlyLimit} onChangeText={setMonthlyLimit} />
    </BottomSheet>
  );
}
