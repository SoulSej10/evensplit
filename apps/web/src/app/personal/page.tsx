"use client";

import Link from "next/link";
import { toast } from "sonner";
import { ArrowDownLeft, ArrowUpRight, ArrowsLeftRight as ArrowLeftRight, Receipt, Trash as Trash2 } from "@phosphor-icons/react";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AddTransactionDialog } from "@/components/personal/add-transaction-dialog";
import {
  useDeletePersonalTransaction,
  usePersonalAccounts,
  usePersonalCategories,
  usePersonalTransactions,
} from "@/hooks/use-personal";
import { formatDate, formatMoney } from "@/lib/format";
import type { PersonalTransaction } from "@evensplit/shared";

function TransactionIcon({ kind }: { kind: PersonalTransaction["kind"] }) {
  if (kind === "income" || kind === "group_reimbursement") return <ArrowDownLeft className="h-4 w-4 text-positive" />;
  if (kind === "transfer") return <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />;
  return <ArrowUpRight className="h-4 w-4 text-negative" />;
}

function transactionLabel(tx: PersonalTransaction, category: string | null, accountName: (id: string) => string): string {
  if (tx.kind === "transfer") return `${accountName(tx.account_id)} → ${accountName(tx.transfer_account_id ?? "")}`;
  if (tx.kind === "group_advance") return "Advanced for others";
  if (tx.kind === "group_reimbursement") return "Reimbursement received";
  return category ?? (tx.kind === "income" ? "Income" : "Expense");
}

export default function PersonalRecordsPage() {
  const { data: transactions, isLoading } = usePersonalTransactions();
  const { data: accounts } = usePersonalAccounts();
  const { data: categories } = usePersonalCategories();
  const deleteTransaction = useDeletePersonalTransaction();

  function accountName(id: string) {
    return accounts?.find((a) => a.id === id)?.name ?? "Account";
  }
  function categoryLabel(id: string | null) {
    if (!id) return null;
    const c = categories?.find((cat) => cat.id === id);
    return c ? `${c.icon ? `${c.icon} ` : ""}${c.name}` : null;
  }

  async function onDelete(id: string) {
    try {
      await deleteTransaction.mutateAsync(id);
      toast.success("Transaction deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete transaction");
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Transactions</h1>
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Loading…" : `${transactions?.length ?? 0} transaction${transactions?.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <AddTransactionDialog />
      </div>

      {isLoading && (
        <div className="grid gap-3">
          <Skeleton className="h-16 rounded-2xl" />
          <Skeleton className="h-16 rounded-2xl" />
        </div>
      )}

      {!isLoading && (accounts?.length ?? 0) === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-light text-primary">
            <Receipt className="h-6 w-6" />
          </span>
          <p className="font-medium">Add an account first</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            You need at least one account before you can log a transaction.
          </p>
        </div>
      )}

      {!isLoading && (accounts?.length ?? 0) > 0 && transactions?.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-light text-primary">
            <Receipt className="h-6 w-6" />
          </span>
          <p className="font-medium">No transactions yet</p>
          <p className="max-w-xs text-sm text-muted-foreground">Log your first income or expense.</p>
        </div>
      )}

      {!isLoading && (accounts?.length ?? 0) > 0 && (transactions?.length ?? 0) > 0 && (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Account</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions?.map((tx) => {
                const account = accounts?.find((a) => a.id === tx.account_id);
                const category = categoryLabel(tx.category_id);
                const isCredit = tx.kind === "income" || tx.kind === "group_reimbursement";
                const isDebit = tx.kind === "expense" || tx.kind === "group_advance";
                return (
                  <TableRow key={tx.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
                          <TransactionIcon kind={tx.kind} />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{transactionLabel(tx, category, accountName)}</p>
                          {tx.note && <p className="truncate text-xs text-muted-foreground">{tx.note}</p>}
                          {tx.groups && tx.linked_group_id && (
                            <Link
                              href={`/groups/${tx.linked_group_id}`}
                              className="block truncate text-xs font-medium text-primary hover:underline"
                            >
                              From {tx.groups.name}
                            </Link>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(tx.occurred_at)}</TableCell>
                    <TableCell className="text-muted-foreground">{accountName(tx.account_id)}</TableCell>
                    <TableCell
                      className={`text-right font-mono font-semibold tabular-nums ${
                        isCredit ? "text-positive" : isDebit ? "text-negative" : ""
                      }`}
                    >
                      {isCredit ? "+" : isDebit ? "-" : ""}
                      {formatMoney(tx.amount, account?.currency ?? "USD")}
                    </TableCell>
                    <TableCell className="pl-0">
                      <button
                        onClick={() => onDelete(tx.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-destructive"
                        aria-label="Delete transaction"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
