import { useState } from "react";
import { Alert, Text, View } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import type { User } from "@evensplit/shared";
import { Trash2, Pencil } from "lucide-react-native";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { MoneyText } from "@/components/ui/MoneyText";
import { deleteExpense, type ExpenseWithShares } from "@/lib/api/expenses";
import { formatDate } from "@/lib/format";

export function ExpenseDetailSheet({
  visible,
  onClose,
  expense,
  members,
  groupId,
  onEdit,
}: {
  visible: boolean;
  onClose: () => void;
  expense: ExpenseWithShares | null;
  members: { user_id: string; users: User | null }[];
  groupId: string;
  onEdit: () => void;
}) {
  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState(false);

  if (!expense) return null;
  const exp = expense;
  const payer = members.find((m) => m.user_id === exp.paid_by)?.users;

  function name(userId: string) {
    return members.find((m) => m.user_id === userId)?.users?.display_name ?? "Someone";
  }

  function onDelete() {
    Alert.alert("Delete this expense?", "This recalculates balances for everyone. This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setDeleting(true);
          try {
            await deleteExpense(exp.id);
            await queryClient.invalidateQueries({ queryKey: ["group-expenses", groupId] });
            await queryClient.invalidateQueries({ queryKey: ["group-activity", groupId] });
            onClose();
          } catch (err) {
            Alert.alert("Could not delete expense", err instanceof Error ? err.message : "Try again");
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  }

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Expense details"
      footer={
        <View className="flex-row gap-3">
          <Button variant="outline" className="flex-1" onPress={onEdit}>
            <View className="flex-row items-center gap-2">
              <Pencil size={16} color="#0A0A0A" />
              <Text className="font-semibold text-neutral-900 dark:text-neutral-100">Edit</Text>
            </View>
          </Button>
          <Button variant="destructive" className="flex-1" onPress={onDelete} loading={deleting}>
            <View className="flex-row items-center gap-2">
              <Trash2 size={16} color="white" />
              <Text className="font-semibold text-white">Delete</Text>
            </View>
          </Button>
        </View>
      }
    >
      <View className="items-center gap-2">
        <Avatar name={payer?.display_name} uri={payer?.avatar_url} size={56} />
        <Text className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          {expense.description}
        </Text>
        <MoneyText amount={expense.amount} currency={expense.currency} tone="neutral" className="text-2xl" />
        <Text className="text-sm text-neutral-500">
          {payer?.display_name ?? "Someone"} paid · {formatDate(expense.expense_date)}
          {expense.category ? ` · ${expense.category}` : ""}
        </Text>
      </View>

      <View className="gap-2">
        <Text className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Split</Text>
        {expense.expense_shares.map((s) => (
          <View key={s.id} className="flex-row items-center justify-between rounded-xl bg-neutral-100 px-3 py-2 dark:bg-white/5">
            <Text className="text-sm text-neutral-900 dark:text-neutral-100">{name(s.user_id)}</Text>
            <MoneyText amount={s.share_amount} currency={expense.currency} tone="neutral" className="text-sm" />
          </View>
        ))}
      </View>
    </BottomSheet>
  );
}
