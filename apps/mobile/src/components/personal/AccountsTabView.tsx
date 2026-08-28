import { Alert, Pressable, Text, View } from "react-native";
import { computeAllAccountBalances } from "@evensplit/shared";
import { Wallet } from "lucide-react-native";
import { Card } from "@/components/ui/Card";
import { MoneyText } from "@/components/ui/MoneyText";
import { SkeletonCardRows } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import {
  useArchivePersonalAccount,
  usePersonalAccounts,
  usePersonalTransactions,
} from "@/hooks/use-personal";

/** The "Add account" action lives in finances.tsx's floating action button, not inline here. */
export function AccountsTabView() {
  const { data: accounts, isLoading, isError, refetch } = usePersonalAccounts();
  const { data: transactions } = usePersonalTransactions();
  const archiveAccount = useArchivePersonalAccount();

  const balances = computeAllAccountBalances(accounts ?? [], transactions ?? []);

  function onArchive(accountId: string, name: string) {
    Alert.alert(`Archive ${name}?`, "It'll be hidden from your accounts list.", [
      { text: "Cancel", style: "cancel" },
      { text: "Archive", style: "destructive", onPress: () => archiveAccount.mutate(accountId) },
    ]);
  }

  if (isLoading) return <SkeletonCardRows count={3} />;
  if (isError) return <ErrorState message="Couldn't load accounts." onRetry={() => refetch()} />;

  return (
    <View className="gap-3">
      {accounts?.length === 0 && (
        <View className="items-center gap-2 py-14">
          <View className="h-14 w-14 items-center justify-center rounded-full bg-primary-light">
            <Wallet color="#16A88F" size={22} />
          </View>
          <Text className="text-sm text-neutral-500">No accounts yet. Add cash, a card, or savings.</Text>
        </View>
      )}

      {accounts?.map((account) => {
        const balance = balances.find((b) => b.account_id === account.id)?.balance ?? 0;
        return (
          <Pressable key={account.id} onLongPress={() => onArchive(account.id, account.name)}>
            <Card className="flex-row items-center gap-3 py-3">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-primary-light">
                <Text className="text-lg">{account.icon ?? "💵"}</Text>
              </View>
              <View className="flex-1">
                <Text className="font-medium text-neutral-900 dark:text-neutral-100">{account.name}</Text>
                <Text className="text-xs capitalize text-neutral-500">{account.type}</Text>
              </View>
              <MoneyText amount={balance} currency={account.currency} tone="neutral" />
            </Card>
          </Pressable>
        );
      })}
    </View>
  );
}
