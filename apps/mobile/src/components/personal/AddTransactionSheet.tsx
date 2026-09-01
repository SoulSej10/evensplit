import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { createPersonalTransactionSchema } from "@evensplit/shared";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { AmountField } from "@/components/ui/AmountField";
import { usePersonalAccounts, usePersonalCategories, useCreatePersonalTransaction } from "@/hooks/use-personal";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";

/** Manual entry is never group_advance/group_reimbursement (system-only kinds). */
type ManualTransactionKind = "income" | "expense" | "transfer";

const KINDS: { value: ManualTransactionKind; label: string }[] = [
  { value: "expense", label: "Expense" },
  { value: "income", label: "Income" },
  { value: "transfer", label: "Transfer" },
];

export function AddTransactionSheet({
  visible,
  onClose,
  initialKind = "expense",
}: {
  visible: boolean;
  onClose: () => void;
  /** Pre-selects a kind (e.g. opening straight into "Add income" from a Home quick action). */
  initialKind?: ManualTransactionKind;
}) {
  const { data: accounts } = usePersonalAccounts();
  const { data: categories } = usePersonalCategories();
  const createTransaction = useCreatePersonalTransaction();

  const [kind, setKind] = useState<ManualTransactionKind>(initialKind);

  useEffect(() => {
    if (visible) setKind(initialKind);
  }, [visible, initialKind]);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [transferAccountId, setTransferAccountId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const visibleCategories = categories?.filter((c) => c.kind === (kind === "income" ? "income" : "expense")) ?? [];

  async function onSubmit() {
    const parsed = createPersonalTransactionSchema.safeParse({
      account_id: accountId,
      transfer_account_id: transferAccountId,
      category_id: kind === "transfer" ? null : categoryId,
      kind,
      amount: Number(amount) || 0,
      note: note || null,
      occurred_at: date.toISOString(),
    });
    if (!parsed.success) {
      Alert.alert("Check the transaction details", parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setSubmitting(true);
    try {
      await createTransaction.mutateAsync(parsed.data);
      onClose();
      setAmount("");
      setNote("");
      setCategoryId(null);
      setTransferAccountId(null);
    } catch (err) {
      Alert.alert("Could not add transaction", err instanceof Error ? err.message : "Try again");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Add a transaction"
      footer={
        <Button onPress={onSubmit} loading={submitting} size="lg">
          Save
        </Button>
      }
    >
      <View className="flex-row gap-2">
        {KINDS.map((k) => (
          <Pressable
            key={k.value}
            onPress={() => setKind(k.value)}
            className={cn(
              "flex-1 items-center rounded-pill border py-2",
              kind === k.value ? "border-primary bg-primary-light" : "border-neutral-500/20"
            )}
          >
            <Text className={cn("text-sm font-semibold", kind === k.value ? "text-primary" : "text-neutral-500")}>
              {k.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View className="gap-1.5">
        <Text className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
          {kind === "transfer" ? "From account" : "Account"}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
          {accounts?.map((a) => (
            <Pressable
              key={a.id}
              onPress={() => setAccountId(a.id)}
              className={cn(
                "rounded-pill border px-3 py-1.5",
                accountId === a.id ? "border-primary bg-primary-light" : "border-neutral-500/20"
              )}
            >
              <Text className={cn("text-sm font-medium", accountId === a.id ? "text-primary" : "text-neutral-500")}>
                {a.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {kind === "transfer" ? (
        <View className="gap-1.5">
          <Text className="text-sm font-medium text-neutral-900 dark:text-neutral-100">To account</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
            {accounts
              ?.filter((a) => a.id !== accountId)
              .map((a) => (
                <Pressable
                  key={a.id}
                  onPress={() => setTransferAccountId(a.id)}
                  className={cn(
                    "rounded-pill border px-3 py-1.5",
                    transferAccountId === a.id ? "border-primary bg-primary-light" : "border-neutral-500/20"
                  )}
                >
                  <Text
                    className={cn(
                      "text-sm font-medium",
                      transferAccountId === a.id ? "text-primary" : "text-neutral-500"
                    )}
                  >
                    {a.name}
                  </Text>
                </Pressable>
              ))}
          </ScrollView>
        </View>
      ) : (
        <View className="gap-1.5">
          <Text className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Category (optional)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
            {visibleCategories.map((c) => (
              <Pressable
                key={c.id}
                onPress={() => setCategoryId(categoryId === c.id ? null : c.id)}
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
        </View>
      )}

      <View className="flex-row gap-3">
        <AmountField value={amount} onChangeText={setAmount} containerClassName="flex-1" />
        <View className="flex-1 gap-1.5">
          <Text className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Date</Text>
          <Pressable
            onPress={() => setShowDatePicker(true)}
            className="h-12 justify-center rounded-card border border-neutral-500/20 bg-surface px-4 dark:bg-surface-dark"
          >
            <Text className="text-neutral-900 dark:text-neutral-100">{formatDate(date.toISOString())}</Text>
          </Pressable>
        </View>
      </View>
      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={(_, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) setDate(selectedDate);
          }}
        />
      )}

      <TextField label="Note (optional)" value={note} onChangeText={setNote} />
    </BottomSheet>
  );
}
