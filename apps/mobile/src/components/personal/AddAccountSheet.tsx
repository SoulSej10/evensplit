import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { createPersonalAccountSchema, type PersonalAccountType } from "@evensplit/shared";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { useAuth } from "@/hooks/use-auth";
import { useCreatePersonalAccount } from "@/hooks/use-personal";
import { CURRENCIES } from "@/lib/format";
import { cn } from "@/lib/cn";

const ACCOUNT_TYPES: { value: PersonalAccountType; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "wallet", label: "Wallet" },
  { value: "savings", label: "Savings" },
  { value: "investment", label: "Investment" },
];

export function AddAccountSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { profile } = useAuth();
  const createAccount = useCreatePersonalAccount();
  const [name, setName] = useState("");
  const [type, setType] = useState<PersonalAccountType>("cash");
  const [currency, setCurrency] = useState(profile?.default_currency ?? "PHP");
  const [startingBalance, setStartingBalance] = useState("0");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit() {
    const parsed = createPersonalAccountSchema.safeParse({
      name,
      type,
      currency,
      starting_balance: Number(startingBalance) || 0,
    });
    if (!parsed.success) {
      Alert.alert("Check the account details", parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setSubmitting(true);
    try {
      await createAccount.mutateAsync(parsed.data);
      onClose();
      setName("");
      setStartingBalance("0");
    } catch (err) {
      Alert.alert("Could not add account", err instanceof Error ? err.message : "Try again");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Add an account"
      footer={
        <Button onPress={onSubmit} loading={submitting} size="lg">
          Add account
        </Button>
      }
    >
      <TextField label="Name" placeholder="Everyday card" value={name} onChangeText={setName} />

      <View className="gap-1.5">
        <Text className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Type</Text>
        <View className="flex-row flex-wrap gap-2">
          {ACCOUNT_TYPES.map((t) => (
            <Pressable
              key={t.value}
              onPress={() => setType(t.value)}
              className={cn(
                "rounded-pill border px-3 py-1.5",
                type === t.value ? "border-primary bg-primary-light" : "border-neutral-500/20"
              )}
            >
              <Text className={cn("text-sm font-medium", type === t.value ? "text-primary" : "text-neutral-500")}>
                {t.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

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

      <TextField
        label="Starting balance"
        keyboardType="decimal-pad"
        value={startingBalance}
        onChangeText={setStartingBalance}
      />
    </BottomSheet>
  );
}
