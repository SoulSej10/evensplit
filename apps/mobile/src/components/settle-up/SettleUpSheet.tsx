import { useEffect, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import type { User } from "@evensplit/shared";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { recordSettlement } from "@/lib/api/settlements";
import { cn } from "@/lib/cn";

const METHODS = ["Cash", "GCash", "PayPal", "Bank transfer", "Venmo", "Other"];

export function SettleUpSheet({
  visible,
  onClose,
  groupId,
  groupCurrency,
  fromUserId,
  toUserId,
  suggestedAmount,
  members,
}: {
  visible: boolean;
  onClose: () => void;
  groupId: string;
  groupCurrency: string;
  fromUserId: string;
  toUserId: string;
  suggestedAmount: number;
  members: { user_id: string; users: User | null }[];
}) {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState(suggestedAmount.toFixed(2));
  const [method, setMethod] = useState(METHODS[0]);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) setAmount(suggestedAmount.toFixed(2));
  }, [visible, suggestedAmount]);

  const fromName = members.find((m) => m.user_id === fromUserId)?.users?.display_name ?? "Someone";
  const toName = members.find((m) => m.user_id === toUserId)?.users?.display_name ?? "Someone";

  async function onSubmit() {
    const numeric = Number(amount);
    if (!numeric || numeric <= 0) {
      Alert.alert("Enter an amount greater than 0");
      return;
    }
    setSubmitting(true);
    try {
      await recordSettlement({
        group_id: groupId,
        from_user: fromUserId,
        to_user: toUserId,
        amount: numeric,
        method,
        note: note.trim() || null,
      });
      await queryClient.invalidateQueries({ queryKey: ["group-settlements", groupId] });
      await queryClient.invalidateQueries({ queryKey: ["group-activity", groupId] });
      await queryClient.invalidateQueries({ queryKey: ["group-expenses", groupId] });
      setNote("");
      onClose();
    } catch (err) {
      Alert.alert("Could not record settlement", err instanceof Error ? err.message : "Try again");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Settle up"
      footer={
        <Button onPress={onSubmit} loading={submitting} size="lg">
          Confirm payment
        </Button>
      }
    >
      <Text className="text-neutral-500">
        {fromName} pays {toName}
      </Text>

      <TextField
        label={`Amount (${groupCurrency})`}
        keyboardType="decimal-pad"
        value={amount}
        onChangeText={setAmount}
      />

      <View className="gap-1.5">
        <Text className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Method</Text>
        <View className="flex-row flex-wrap gap-2">
          {METHODS.map((m) => (
            <Pressable
              key={m}
              onPress={() => setMethod(m)}
              className={cn(
                "rounded-pill border px-3 py-1.5",
                method === m ? "border-primary bg-primary-light" : "border-neutral-500/20"
              )}
            >
              <Text className={cn("text-sm font-medium", method === m ? "text-primary" : "text-neutral-500")}>
                {m}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <TextField
        label="Note (optional)"
        placeholder="Thanks for covering dinner!"
        value={note}
        onChangeText={setNote}
      />
    </BottomSheet>
  );
}
