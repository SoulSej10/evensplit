import { useMemo, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { ArrowDownLeft, ArrowsLeftRight as ArrowLeftRight, ArrowUpRight, CaretLeft as ChevronLeft, CaretRight as ChevronRight, Receipt } from "phosphor-react-native";
import { Card } from "@/components/ui/Card";
import { MoneyText } from "@/components/ui/MoneyText";
import { SkeletonCardRows } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import {
  useDeletePersonalTransaction,
  usePersonalAccounts,
  usePersonalCategories,
  usePersonalTransactions,
} from "@/hooks/use-personal";
import { formatDate } from "@/lib/format";
import type { PersonalTransaction } from "@evensplit/shared";

/** income/group_reimbursement both mean "cash came in" - positive tint. expense/group_advance both mean "cash left" - negative tint. transfer is neutral. */
function TransactionIcon({ kind }: { kind: PersonalTransaction["kind"] }) {
  const isCredit = kind === "income" || kind === "group_reimbursement";
  const isDebit = kind === "expense" || kind === "group_advance";
  const tint = isCredit ? "bg-positive/10" : isDebit ? "bg-negative/10" : "bg-neutral-500/10";
  return (
    <View className={`h-9 w-9 items-center justify-center rounded-lg ${tint}`}>
      {isCredit && <ArrowDownLeft color="#009B87" size={16} />}
      {isDebit && <ArrowUpRight color="#D95F5F" size={16} />}
      {kind === "transfer" && <ArrowLeftRight color="#6B7169" size={16} />}
    </View>
  );
}

function transactionLabel(tx: PersonalTransaction, category: string | null, accountName: (id: string) => string): string {
  if (tx.kind === "transfer") return `${accountName(tx.account_id)} → ${accountName(tx.transfer_account_id ?? "")}`;
  if (tx.kind === "group_advance") return "Advanced for others";
  if (tx.kind === "group_reimbursement") return "Reimbursement received";
  return category ?? (tx.kind === "income" ? "Income" : "Expense");
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/**
 * The "Add transaction" action lives in finances.tsx's floating action
 * button, not inline here. Defaults to the current month, with prev/next
 * navigation to browse history - showing every transaction ever logged in
 * one flat list doesn't scale and buries recent activity.
 */
export function RecordsTabView() {
  const { data: transactions, isLoading, isError, refetch } = usePersonalTransactions();
  const { data: accounts } = usePersonalAccounts();
  const { data: categories } = usePersonalCategories();
  const deleteTransaction = useDeletePersonalTransaction();
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const monthKey = `${month.year}-${String(month.month + 1).padStart(2, "0")}`;
  const monthTransactions = useMemo(
    () => (transactions ?? []).filter((t) => t.occurred_at.slice(0, 7) === monthKey),
    [transactions, monthKey]
  );

  const today = new Date();
  const isCurrentMonth = month.year === today.getFullYear() && month.month === today.getMonth();

  function accountName(id: string) {
    return accounts?.find((a) => a.id === id)?.name ?? "Account";
  }
  function categoryLabel(id: string | null) {
    if (!id) return null;
    const c = categories?.find((cat) => cat.id === id);
    return c ? `${c.icon ? `${c.icon} ` : ""}${c.name}` : null;
  }

  function onDelete(id: string) {
    Alert.alert("Delete this transaction?", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteTransaction.mutate(id) },
    ]);
  }

  if (isLoading) return <SkeletonCardRows count={4} />;
  if (isError) return <ErrorState message="Couldn't load transactions." onRetry={() => refetch()} />;

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between">
        <Pressable
          onPress={() => setMonth((m) => (m.month === 0 ? { year: m.year - 1, month: 11 } : { year: m.year, month: m.month - 1 }))}
          hitSlop={10}
          className="h-8 w-8 items-center justify-center rounded-lg bg-neutral-500/10"
        >
          <ChevronLeft color="#6B7169" size={16} />
        </Pressable>
        <Text className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          {MONTH_NAMES[month.month]} {month.year}
        </Text>
        <Pressable
          onPress={() => setMonth((m) => (m.month === 11 ? { year: m.year + 1, month: 0 } : { year: m.year, month: m.month + 1 }))}
          disabled={isCurrentMonth}
          hitSlop={10}
          className={`h-8 w-8 items-center justify-center rounded-lg bg-neutral-500/10 ${isCurrentMonth ? "opacity-30" : ""}`}
        >
          <ChevronRight color="#6B7169" size={16} />
        </Pressable>
      </View>

      {(accounts?.length ?? 0) === 0 && (
        <View className="items-center gap-2 py-14">
          <View className="h-14 w-14 items-center justify-center rounded-full bg-primary-light">
            <Receipt color="#16A88F" size={22} />
          </View>
          <Text className="text-sm text-neutral-500">Add an account before logging a transaction.</Text>
        </View>
      )}

      {(accounts?.length ?? 0) > 0 && monthTransactions.length === 0 && (
        <View className="items-center gap-2 py-14">
          <View className="h-14 w-14 items-center justify-center rounded-full bg-primary-light">
            <Receipt color="#16A88F" size={22} />
          </View>
          <Text className="text-sm text-neutral-500">
            {isCurrentMonth ? "No transactions yet. Log your first one." : "No transactions this month."}
          </Text>
        </View>
      )}

      {monthTransactions.map((tx) => {
        const account = accounts?.find((a) => a.id === tx.account_id);
        const category = categoryLabel(tx.category_id);
        const isDebit = tx.kind === "expense" || tx.kind === "group_advance";
        const isCredit = tx.kind === "income" || tx.kind === "group_reimbursement";
        const groupInfo = tx.groups;
        return (
          <Pressable key={tx.id} onLongPress={() => onDelete(tx.id)}>
            <Card className="flex-row items-center gap-3 py-3">
              <TransactionIcon kind={tx.kind} />
              <View className="min-w-0 flex-1">
                <Text className="font-medium text-neutral-900 dark:text-neutral-100" numberOfLines={1}>
                  {transactionLabel(tx, category, accountName)}
                </Text>
                <Text className="text-xs text-neutral-500" numberOfLines={1}>
                  {formatDate(tx.occurred_at)} · {accountName(tx.account_id)}
                  {tx.note ? ` · ${tx.note}` : ""}
                </Text>
                {groupInfo && tx.linked_group_id && (
                  <Pressable onPress={() => router.push(`/(app)/groups/${tx.linked_group_id}`)} hitSlop={4}>
                    <Text className="mt-0.5 text-xs font-medium text-primary" numberOfLines={1}>
                      From {groupInfo.name}
                    </Text>
                  </Pressable>
                )}
              </View>
              <MoneyText
                amount={isDebit ? -tx.amount : tx.amount}
                currency={account?.currency ?? "USD"}
                tone={isCredit || isDebit ? "auto" : "neutral"}
              />
            </Card>
          </Pressable>
        );
      })}
    </View>
  );
}
