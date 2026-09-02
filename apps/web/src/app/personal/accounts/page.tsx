"use client";

import { toast } from "sonner";
import { computeAllAccountBalances } from "@evensplit/shared";
import { Wallet, DotsThreeVertical as MoreVertical, Pencil, Archive } from "@phosphor-icons/react";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TablePagination } from "@/components/ui/table-pagination";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AddAccountDialog } from "@/components/personal/add-account-dialog";
import { usePersonalAccounts, usePersonalTransactions, useArchivePersonalAccount } from "@/hooks/use-personal";
import { usePagination } from "@/hooks/use-pagination";
import { formatMoney } from "@/lib/format";

export default function PersonalAccountsPage() {
  const { data: accounts, isLoading } = usePersonalAccounts();
  const { data: transactions } = usePersonalTransactions();
  const archiveAccount = useArchivePersonalAccount();

  const balances = computeAllAccountBalances(accounts ?? [], transactions ?? []);
  const total = balances.reduce((sum, b) => sum + b.balance, 0);
  const { page, setPage, pageCount, pageItems, totalCount, pageSize } = usePagination(accounts ?? [], 10);

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

      {!isLoading && (accounts?.length ?? 0) > 0 && (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((account) => {
                const balance = balances.find((b) => b.account_id === account.id)?.balance ?? 0;
                return (
                  <TableRow key={account.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-light text-base">
                          {account.icon ?? "💵"}
                        </span>
                        <p className="font-medium">{account.name}</p>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize text-muted-foreground">{account.type}</TableCell>
                    <TableCell className="text-right font-mono font-semibold tabular-nums">
                      {formatMoney(balance, account.currency)}
                    </TableCell>
                    <TableCell className="pl-0">
                      <div className="flex items-center justify-end gap-1">
                        <AddAccountDialog
                          account={account}
                          trigger={
                            <button
                              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-primary-light hover:text-primary"
                              aria-label={`Edit ${account.name}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                          }
                        />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <TablePagination
            page={page}
            pageCount={pageCount}
            pageSize={pageSize}
            totalCount={totalCount}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
