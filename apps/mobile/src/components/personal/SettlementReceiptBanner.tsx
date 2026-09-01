import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import type { Settlement } from "@evensplit/shared";
import { CheckCircle as CheckCircle2 } from "phosphor-react-native";
import { Card } from "@/components/ui/Card";
import { confirmSettlementReceipt } from "@/lib/api/settlements";
import { usePersonalAccounts } from "@/hooks/use-personal";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/cn";

/**
 * Settlement recording intentionally leaves the receiver's side manual
 * (see record_settlement/confirm_settlement_receipt in supabase/migrations/0015)
 * - only the receiver knows which of their own accounts the money actually
 * landed in. This banner surfaces every settlement still waiting on that
 * confirmation (to_user = current user, to_account_id still null) so it
 * doesn't just sit invisibly forever.
 */
export function SettlementReceiptBanner({
  unconfirmed,
  groupName,
  groupCurrency,
}: {
  unconfirmed: Settlement[];
  groupName: (groupId: string) => string;
  groupCurrency: (groupId: string) => string;
}) {
  const { data: accounts } = usePersonalAccounts();
  const queryClient = useQueryClient();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  if (unconfirmed.length === 0 || !accounts || accounts.length === 0) return null;

  async function onConfirm(settlementId: string, accountId: string) {
    setConfirmingId(settlementId);
    try {
      await confirmSettlementReceipt({ settlement_id: settlementId, to_account_id: accountId });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["personal-transactions"] }),
        queryClient.invalidateQueries({ queryKey: ["all-settlements"] }),
      ]);
    } catch (err) {
      Alert.alert("Could not confirm", err instanceof Error ? err.message : "Try again");
    } finally {
      setConfirmingId(null);
    }
  }

  return (
    <View className="mb-4 gap-2">
      {unconfirmed.map((s) => (
        <Card key={s.id} className="gap-2 border border-primary/20 py-3">
          <Text className="text-sm text-neutral-900 dark:text-neutral-100">
            Someone settled <Text className="font-semibold">{formatMoney(s.amount, groupCurrency(s.group_id))}</Text>{" "}
            with you in <Text className="font-semibold">{groupName(s.group_id)}</Text> — add it to an account?
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {accounts.map((a) => (
              <Pressable
                key={a.id}
                disabled={confirmingId === s.id}
                onPress={() => onConfirm(s.id, a.id)}
                className={cn(
                  "flex-row items-center gap-1.5 rounded-pill bg-primary px-3 py-1.5",
                  confirmingId === s.id && "opacity-50"
                )}
              >
                <CheckCircle2 color="white" size={14} />
                <Text className="text-xs font-semibold text-white">{a.name}</Text>
              </Pressable>
            ))}
          </View>
        </Card>
      ))}
    </View>
  );
}
