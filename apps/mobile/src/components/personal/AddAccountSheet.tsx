import { useEffect, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { createPersonalAccountSchema, type PersonalAccount, type PersonalAccountType } from "@evensplit/shared";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { AmountField } from "@/components/ui/AmountField";
import { useAuth } from "@/hooks/use-auth";
import { useCreatePersonalAccount, useUpdatePersonalAccount } from "@/hooks/use-personal";
import { CURRENCIES } from "@/lib/format";
import { cn } from "@/lib/cn";

const ACCOUNT_TYPES: { value: PersonalAccountType; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "wallet", label: "Wallet" },
  { value: "savings", label: "Savings" },
  { value: "investment", label: "Investment" },
];

const ACCOUNT_ICONS = ["💵", "💳", "👛", "🏦", "🐷", "📈", "💰", "🪙", "🏧", "💎", "🧾", "🎯"];

/** Pass `account` to edit an existing account in place instead of creating a new one. */
export function AddAccountSheet({
  visible,
  onClose,
  account,
}: {
  visible: boolean;
  onClose: () => void;
  account?: PersonalAccount;
}) {
  const isEdit = !!account;
  const { profile } = useAuth();
  const createAccount = useCreatePersonalAccount();
  const updateAccount = useUpdatePersonalAccount();
  const [name, setName] = useState(account?.name ?? "");
  const [type, setType] = useState<PersonalAccountType>(account?.type ?? "cash");
  const [currency, setCurrency] = useState(account?.currency ?? profile?.default_currency ?? "PHP");
  const [startingBalance, setStartingBalance] = useState(String(account?.starting_balance ?? 0));
  const [icon, setIcon] = useState(account?.icon ?? ACCOUNT_ICONS[0]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setName(account?.name ?? "");
      setType(account?.type ?? "cash");
      setCurrency(account?.currency ?? profile?.default_currency ?? "PHP");
      setStartingBalance(String(account?.starting_balance ?? 0));
      setIcon(account?.icon ?? ACCOUNT_ICONS[0]);
    }
  }, [visible, account, profile]);

  async function onSubmit() {
    const parsed = createPersonalAccountSchema.safeParse({
      name,
      type,
      currency,
      starting_balance: Number(startingBalance) || 0,
      icon,
    });
    if (!parsed.success) {
      Alert.alert("Check the account details", parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setSubmitting(true);
    try {
      if (isEdit) {
        await updateAccount.mutateAsync({ accountId: account.id, input: parsed.data });
      } else {
        await createAccount.mutateAsync(parsed.data);
      }
      onClose();
      setName("");
      setStartingBalance("0");
    } catch (err) {
      Alert.alert(`Could not ${isEdit ? "update" : "add"} account`, err instanceof Error ? err.message : "Try again");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={isEdit ? "Edit account" : "Add an account"}
      footer={
        <Button onPress={onSubmit} loading={submitting} size="lg">
          {isEdit ? "Save changes" : "Add account"}
        </Button>
      }
    >
      <View className="flex-row flex-wrap gap-2">
        {ACCOUNT_ICONS.map((i) => (
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

      <AmountField label="Starting balance" value={startingBalance} onChangeText={setStartingBalance} />
    </BottomSheet>
  );
}
