import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { Check, Image as ImageIcon, Repeat } from "phosphor-react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { computeSplitShares, SplitError, type SplitType, type User } from "@evensplit/shared";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { AmountField } from "@/components/ui/AmountField";
import { Avatar } from "@/components/ui/Avatar";
import { createExpense, updateExpense, uploadReceipt, type ExpenseWithShares } from "@/lib/api/expenses";
import { fetchPersonalAccounts } from "@/lib/api/personal";
import { formatDate, formatMoney } from "@/lib/format";
import { cn } from "@/lib/cn";
import { notifyLocal } from "@/lib/notifications";

const SPLIT_LABELS: Record<SplitType, string> = {
  equal: "Equal",
  exact: "Exact",
  percentage: "Percent",
  shares: "Shares",
};

const CATEGORIES = ["food", "transport", "lodging", "utilities", "entertainment", "other"];

type RecurrenceFrequency = "DAILY" | "WEEKLY" | "MONTHLY";

const FREQUENCIES: { label: string; value: RecurrenceFrequency }[] = [
  { label: "Daily", value: "DAILY" },
  { label: "Weekly", value: "WEEKLY" },
  { label: "Monthly", value: "MONTHLY" },
];

function parseFrequency(rule: string | null | undefined): RecurrenceFrequency | null {
  const match = rule?.match(/FREQ=(DAILY|WEEKLY|MONTHLY)/);
  return (match?.[1] as RecurrenceFrequency | undefined) ?? null;
}

export function ExpenseFormSheet({
  visible,
  onClose,
  groupId,
  groupCurrency,
  members,
  currentUserId,
  existingExpense,
}: {
  visible: boolean;
  onClose: () => void;
  groupId: string;
  groupCurrency: string;
  members: { user_id: string; users: User | null }[];
  currentUserId: string;
  existingExpense?: ExpenseWithShares;
}) {
  const queryClient = useQueryClient();
  const isEdit = !!existingExpense;

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState(currentUserId);
  const [splitType, setSplitType] = useState<SplitType>("equal");
  const [category, setCategory] = useState("other");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set(members.map((m) => m.user_id)));
  const [values, setValues] = useState<Record<string, string>>({});
  const [receiptUri, setReceiptUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<RecurrenceFrequency>("WEEKLY");
  const [paidFromAccountId, setPaidFromAccountId] = useState<string | null>(null);

  // Only the payer can link one of their own accounts — create_group_expense/
  // update_group_expense reject a linked account for anyone else.
  const isPayerCurrentUser = paidBy === currentUserId;
  const { data: personalAccounts } = useQuery({
    queryKey: ["personal-accounts", currentUserId],
    queryFn: () => fetchPersonalAccounts(currentUserId),
    enabled: visible && isPayerCurrentUser,
  });

  useEffect(() => {
    if (!visible) return;
    setDescription(existingExpense?.description ?? "");
    setAmount(existingExpense ? String(existingExpense.amount) : "");
    setPaidBy(existingExpense?.paid_by ?? currentUserId);
    setSplitType(existingExpense?.split_type ?? "equal");
    setCategory(existingExpense?.category ?? "other");
    setDate(existingExpense ? new Date(existingExpense.expense_date) : new Date());
    setReceiptUri(null);
    setIsRecurring(existingExpense?.is_recurring ?? false);
    setFrequency(parseFrequency(existingExpense?.recurrence_rule) ?? "WEEKLY");
    setPaidFromAccountId(existingExpense?.paid_from_account_id ?? null);
    const initialParticipants =
      existingExpense?.expense_shares.map((s) => s.user_id) ?? members.map((m) => m.user_id);
    setSelected(new Set(initialParticipants));
    const initialValues: Record<string, string> = {};
    existingExpense?.expense_shares.forEach((s) => {
      initialValues[s.user_id] = String(s.share_amount);
    });
    setValues(initialValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, existingExpense?.id]);

  const numericAmount = Number(amount) || 0;
  const participantIds = useMemo(
    () => members.filter((m) => selected.has(m.user_id)),
    [members, selected]
  );

  const preview = useMemo(() => {
    if (participantIds.length === 0 || numericAmount <= 0) return null;
    try {
      return computeSplitShares(
        numericAmount,
        splitType,
        participantIds.map((p) => ({
          user_id: p.user_id,
          value: splitType === "equal" ? undefined : Number(values[p.user_id] ?? 0),
        }))
      );
    } catch {
      return null;
    }
  }, [participantIds, numericAmount, splitType, values]);

  useEffect(() => {
    if (!isPayerCurrentUser) setPaidFromAccountId(null);
  }, [isPayerCurrentUser]);

  function toggleMember(userId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  async function pickReceipt() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) setReceiptUri(result.assets[0].uri);
  }

  async function onSubmit() {
    if (!description.trim()) return Alert.alert("Add a description");
    if (numericAmount <= 0) return Alert.alert("Enter an amount greater than 0");
    if (participantIds.length === 0) return Alert.alert("Select at least one participant");

    setSubmitting(true);
    try {
      const participants = participantIds.map((p) => ({
        user_id: p.user_id,
        value: splitType === "equal" ? undefined : Number(values[p.user_id] ?? 0),
      }));

      const input = {
        group_id: groupId,
        description: description.trim(),
        amount: numericAmount,
        currency: groupCurrency,
        paid_by: paidBy,
        split_type: splitType,
        category,
        expense_date: date.toISOString().slice(0, 10),
        receipt_url: existingExpense?.receipt_url ?? null,
        participants,
        is_recurring: isRecurring,
        recurrence_rule: isRecurring ? `FREQ=${frequency}` : null,
      };

      const linkedAccountId = isPayerCurrentUser ? paidFromAccountId : null;
      const expense = isEdit
        ? await updateExpense(existingExpense!.id, input, linkedAccountId)
        : await createExpense(input, currentUserId, linkedAccountId);

      if (receiptUri) {
        const path = await uploadReceipt(groupId, expense.id, receiptUri, "receipt.jpg");
        await updateExpense(expense.id, { ...input, receipt_url: path }, linkedAccountId);
      }

      await queryClient.invalidateQueries({ queryKey: ["group-expenses", groupId] });
      await queryClient.invalidateQueries({ queryKey: ["group-activity", groupId] });

      if (!isEdit) {
        void notifyLocal("Expense added", `${description.trim()} · ${formatMoney(numericAmount, groupCurrency)}`);
      }

      onClose();
    } catch (err) {
      if (err instanceof SplitError) Alert.alert("Split error", err.message);
      else Alert.alert("Could not save expense", err instanceof Error ? err.message : "Try again");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={isEdit ? "Edit expense" : "Add expense"}
      footer={
        <Button onPress={onSubmit} loading={submitting} size="lg">
          {isEdit ? "Save changes" : "Add expense"}
        </Button>
      }
    >
      <TextField
        label="Description"
        placeholder="Grab to airport"
        value={description}
        onChangeText={setDescription}
      />

      <AmountField label={`Amount (${groupCurrency})`} value={amount} onChangeText={setAmount} />

      <View className="gap-1.5">
        <Text className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Date</Text>
        <Pressable
          onPress={() => setShowDatePicker(true)}
          className="h-12 justify-center rounded-card border border-neutral-500/20 bg-surface px-4 dark:bg-surface-dark"
        >
          <Text className="text-neutral-900 dark:text-neutral-100">{formatDate(date.toISOString())}</Text>
        </Pressable>
      </View>
      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onValueChange={(_, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) setDate(selectedDate);
          }}
          onDismiss={() => setShowDatePicker(false)}
        />
      )}

      <View className="gap-1.5">
        <Text className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Paid by</Text>
        <View className="flex-row flex-wrap gap-2">
          {members.map((m) => (
            <Pressable
              key={m.user_id}
              onPress={() => setPaidBy(m.user_id)}
              className={cn(
                "rounded-pill border px-3 py-1.5",
                paidBy === m.user_id ? "border-primary bg-primary-light" : "border-neutral-500/20"
              )}
            >
              <Text
                className={cn(
                  "text-sm font-medium",
                  paidBy === m.user_id ? "text-primary" : "text-neutral-500"
                )}
              >
                {m.users?.display_name ?? "Member"}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {isPayerCurrentUser && personalAccounts && personalAccounts.length > 0 && (
        <View className="gap-1.5">
          <Text className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
            Paid from (optional)
          </Text>
          <View className="flex-row flex-wrap gap-2">
            <Pressable
              onPress={() => setPaidFromAccountId(null)}
              className={cn(
                "rounded-pill border px-3 py-1.5",
                paidFromAccountId === null ? "border-primary bg-primary-light" : "border-neutral-500/20"
              )}
            >
              <Text
                className={cn(
                  "text-sm font-medium",
                  paidFromAccountId === null ? "text-primary" : "text-neutral-500"
                )}
              >
                Not linked
              </Text>
            </Pressable>
            {personalAccounts.map((a) => (
              <Pressable
                key={a.id}
                onPress={() => setPaidFromAccountId(a.id)}
                className={cn(
                  "rounded-pill border px-3 py-1.5",
                  paidFromAccountId === a.id ? "border-primary bg-primary-light" : "border-neutral-500/20"
                )}
              >
                <Text
                  className={cn(
                    "text-sm font-medium",
                    paidFromAccountId === a.id ? "text-primary" : "text-neutral-500"
                  )}
                >
                  {a.name}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text className="text-xs text-neutral-500">
            Links this expense to a Finances account — your own share counts as real spending
            there, and the rest is tracked as money owed back to you.
          </Text>
        </View>
      )}

      <View className="gap-1.5">
        <Text className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Category</Text>
        <View className="flex-row flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <Pressable
              key={c}
              onPress={() => setCategory(c)}
              className={cn(
                "rounded-pill border px-3 py-1.5",
                category === c ? "border-primary bg-primary-light" : "border-neutral-500/20"
              )}
            >
              <Text className={cn("text-sm font-medium", category === c ? "text-primary" : "text-neutral-500")}>
                {c}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View className="gap-1.5">
        <Text className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Split method</Text>
        <View className="flex-row gap-2">
          {(Object.keys(SPLIT_LABELS) as SplitType[]).map((t) => (
            <Pressable
              key={t}
              onPress={() => setSplitType(t)}
              className={cn(
                "flex-1 items-center rounded-card border py-2",
                splitType === t ? "border-primary bg-primary-light" : "border-neutral-500/20"
              )}
            >
              <Text className={cn("text-xs font-semibold", splitType === t ? "text-primary" : "text-neutral-500")}>
                {SPLIT_LABELS[t]}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View className="gap-1.5">
        <Text className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Split between</Text>
        <View className="gap-2 rounded-card border border-neutral-500/20 p-2">
          {members.map((m) => {
            const isSelected = selected.has(m.user_id);
            const share = preview?.find((p) => p.user_id === m.user_id);
            return (
              <View key={m.user_id} className="flex-row items-center gap-2 py-1">
                <Pressable
                  onPress={() => toggleMember(m.user_id)}
                  className={cn(
                    "h-5 w-5 items-center justify-center rounded-md border",
                    isSelected ? "border-primary bg-primary" : "border-neutral-500/40"
                  )}
                >
                  {isSelected && <Check size={12} color="white" />}
                </Pressable>
                <Avatar name={m.users?.display_name} uri={m.users?.avatar_url} size={26} />
                <Text className="flex-1 text-sm text-neutral-900 dark:text-neutral-100" numberOfLines={1}>
                  {m.users?.display_name ?? "Member"}
                </Text>
                {isSelected && splitType !== "equal" ? (
                  <TextField
                    keyboardType="decimal-pad"
                    className="h-8 w-20 px-2 text-right text-xs"
                    containerClassName="w-20"
                    value={values[m.user_id] ?? ""}
                    onChangeText={(t) => setValues((prev) => ({ ...prev, [m.user_id]: t }))}
                  />
                ) : isSelected ? (
                  <Text className="text-xs font-medium text-neutral-500">
                    {share ? formatMoney(share.share_amount, groupCurrency) : "—"}
                  </Text>
                ) : null}
              </View>
            );
          })}
        </View>
      </View>

      <View className="gap-2">
        <Pressable
          onPress={() => setIsRecurring((v) => !v)}
          className="flex-row items-center justify-between rounded-card border border-neutral-500/20 px-4 py-3"
        >
          <View className="flex-row items-center gap-2">
            <Repeat size={16} color={isRecurring ? "#16A88F" : "#6B7169"} />
            <Text className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
              Recurring expense
            </Text>
          </View>
          <View
            className={cn(
              "h-5 w-5 items-center justify-center rounded-md border",
              isRecurring ? "border-primary bg-primary" : "border-neutral-500/40"
            )}
          >
            {isRecurring && <Check size={12} color="white" />}
          </View>
        </Pressable>

        {isRecurring && (
          <View className="flex-row gap-2">
            {FREQUENCIES.map((f) => (
              <Pressable
                key={f.value}
                onPress={() => setFrequency(f.value)}
                className={cn(
                  "flex-1 items-center rounded-card border py-2",
                  frequency === f.value ? "border-primary bg-primary-light" : "border-neutral-500/20"
                )}
              >
                <Text
                  className={cn(
                    "text-xs font-semibold",
                    frequency === f.value ? "text-primary" : "text-neutral-500"
                  )}
                >
                  {f.label}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <Pressable
        onPress={pickReceipt}
        className="flex-row items-center gap-2 rounded-card border border-dashed border-neutral-500/30 px-4 py-3"
      >
        <ImageIcon size={18} color="#6B7169" />
        <Text className="text-sm text-neutral-500">
          {receiptUri ? "Receipt attached" : "Attach receipt (optional)"}
        </Text>
      </Pressable>
    </BottomSheet>
  );
}
