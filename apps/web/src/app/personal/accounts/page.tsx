"use client";

import { toast } from "sonner";
import { computeAllAccountBalances } from "@evensplit/shared";
import { Wallet, MoreVertical, Pencil, Archive } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AddAccountDialog } from "@/components/personal/add-account-dialog";
import { usePersonalAccounts, usePersonalTransactions, useArchivePersonalAccount } from "@/hooks/use-personal";
import { formatMoney } from "@/lib/format";

export default function PersonalAccountsPage() {
  const { data: accounts, isLoading } = usePersonalAccounts();
  const { data: transactions } = usePersonalTransactions();
  const archiveAccount = useArchivePersonalAccount();

  const balances = computeAllAccountBalances(accounts ?? [], transactions ?? []);
  const total = balances.reduce((sum, b) => sum + b.balance, 0);

  async function onArchive(accountId: string, name: string) {
    try {
      await archiveAccount.mutateAsync(accountId);
      toast.success(`${name} archived`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not archive account");
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Accounts</h1>
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Loading…" : `Total across accounts: ${formatMoney(total, accounts?.[0]?.currency ?? "USD")}`}
          </p>
        </div>
        <AddAccountDialog />
      </div>

      {isLoading && (
        <div className="grid gap-3">
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
        </div>
      )}

      {!isLoading && accounts?.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-light text-primary">
            <Wallet className="h-6 w-6" />
          </span>
          <p className="font-medium">No accounts yet</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            Add cash, a card, or a savings account to start logging transactions.
          </p>
        </div>
      )}

      <div className="grid gap-3">
        {accounts?.map((account) => {
          const balance = balances.find((b) => b.account_id === account.id)?.balance ?? 0;
          return (
            <Card key={account.id} className="flex items-center gap-3 p-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-light text-base">
                {account.icon ?? "💵"}
              </span>
              <div className="flex-1">
                <p className="font-medium">{account.name}</p>
                <p className="text-xs capitalize text-muted-foreground">{account.type}</p>
              </div>
              <div className="flex items-center gap-1">
                <p className="mr-2 font-semibold tabular-nums">{formatMoney(balance, account.currency)}</p>
                <AddAccountDialog
                  account={account}
                  trigger={
                    <button
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-primary-light hover:text-primary"
                      aria-label={`Edit ${account.name}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  }
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
                      aria-label={`More actions for ${account.name}`}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onArchive(account.id, account.name)}>
                      <Archive className="mr-2 h-4 w-4" /> Archive
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
