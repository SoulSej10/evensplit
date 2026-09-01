"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import type { Settlement } from "@evensplit/shared";
import { CheckCircle as CheckCircle2 } from "@phosphor-icons/react";
import { Card } from "@/components/ui/card";
import { confirmSettlementReceipt } from "@/lib/api/settlements";
import { usePersonalAccounts } from "@/hooks/use-personal";
import { formatMoney } from "@/lib/format";

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
      toast.success("Added to your account");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not confirm");
    } finally {
      setConfirmingId(null);
    }
  }

  return (
    <div className="mb-6 grid gap-2">
      {unconfirmed.map((s) => (
        <Card key={s.id} className="gap-2 border-primary/20 p-3">
          <p className="text-sm">
            Someone settled <span className="font-semibold">{formatMoney(s.amount, groupCurrency(s.group_id))}</span>{" "}
            with you in <span className="font-semibold">{groupName(s.group_id)}</span> — add it to an account?
          </p>
          <div className="flex flex-wrap gap-2">
            {accounts.map((a) => (
              <button
                key={a.id}
                disabled={confirmingId === s.id}
                onClick={() => onConfirm(s.id, a.id)}
                className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity disabled:opacity-50"
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> {a.name}
              </button>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
