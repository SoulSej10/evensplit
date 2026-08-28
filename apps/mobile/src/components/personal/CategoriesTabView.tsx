import { Alert, Pressable, Text, View } from "react-native";
import { Tag, Trash2 } from "lucide-react-native";
import { Card } from "@/components/ui/Card";
import { SkeletonCardRows } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { useDeletePersonalCategory, usePersonalCategories } from "@/hooks/use-personal";

/** The "Add" action lives in finances.tsx's floating action button, not inline here. */
export function CategoriesTabView() {
  const { data: categories, isLoading, isError, refetch } = usePersonalCategories();
  const deleteCategory = useDeletePersonalCategory();

  function onDelete(id: string, name: string) {
    Alert.alert(`Delete ${name}?`, "This category will be removed.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteCategory.mutate(id) },
    ]);
  }

  if (isLoading) return <SkeletonCardRows count={3} />;
  if (isError) return <ErrorState message="Couldn't load categories." onRetry={() => refetch()} />;

  const expenseCategories = categories?.filter((c) => c.kind === "expense") ?? [];
  const incomeCategories = categories?.filter((c) => c.kind === "income") ?? [];

  function Group({ title, items }: { title: string; items: typeof expenseCategories }) {
    return (
      <View className="gap-2">
        <Text className="font-medium text-neutral-500">{title}</Text>
        {items.length === 0 ? (
          <Text className="text-sm text-neutral-500">No categories yet.</Text>
        ) : (
          items.map((c) => (
            <Card key={c.id} className="flex-row items-center justify-between py-3">
              <Text className="text-neutral-900 dark:text-neutral-100">
                {c.icon ? `${c.icon} ` : ""}
                {c.name}
              </Text>
              <Pressable onPress={() => onDelete(c.id, c.name)} hitSlop={10}>
                <Trash2 color="#D95F5F" size={16} />
              </Pressable>
            </Card>
          ))
        )}
      </View>
    );
  }

  return (
    <View className="gap-6">
      {categories?.length === 0 && (
        <View className="items-center gap-2 py-14">
          <View className="h-14 w-14 items-center justify-center rounded-full bg-primary-light">
            <Tag color="#16A88F" size={22} />
          </View>
          <Text className="text-sm text-neutral-500">No categories yet.</Text>
        </View>
      )}
      <Group title="Expense categories" items={expenseCategories} />
      <Group title="Income categories" items={incomeCategories} />
    </View>
  );
}
