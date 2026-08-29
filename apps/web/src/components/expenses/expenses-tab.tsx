"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import type { User } from "@evensplit/shared";
import { AlertCircle, Plus, Receipt, Trash2, Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExpenseFormDialog } from "@/components/expenses/expense-form-dialog";
import { deleteExpense, type ExpenseWithShares } from "@/lib/api/expenses";
import { useGroupExpenses } from "@/hooks/use-group-detail";
import { formatDate, formatMoney, initials } from "@/lib/format";

const CATEGORY_ALL = "__all__";

export function ExpensesTab({
  groupId,
  groupCurrency,
  members,
  currentUserId,
}: {
  groupId: string;
  groupCurrency: string;
  members: { user_id: string; users: User | null }[];
  currentUserId: string;
}) {
  const { data: expenses, isLoading, isError, refetch, isRefetching } = useGroupExpenses(groupId);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(CATEGORY_ALL);

  const categories = useMemo(
    () => Array.from(new Set((expenses ?? []).map((e) => e.category).filter(Boolean))) as string[],
    [expenses]
  );

  const filtered = useMemo(() => {
    return (expenses ?? []).filter((e) => {
      const matchesSearch = e.description.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === CATEGORY_ALL || e.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [expenses, search, category]);

  function memberName(userId: string) {
    return members.find((m) => m.user_id === userId)?.users?.display_name ?? "Someone";
  }

  async function onDelete(expenseId: string) {
    try {
      await deleteExpense(expenseId);
      await queryClient.invalidateQueries({ queryKey: ["group-expenses", groupId] });
      await queryClient.invalidateQueries({ queryKey: ["group-activity", groupId] });
      toast.success("Expense deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete expense");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-2">
          <Input
            placeholder="Search expenses…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={CATEGORY_ALL}>All categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <ExpenseFormDialog
          trigger={
            <Button className="rounded-full">
              <Plus className="mr-1 h-4 w-4" /> Add expense
            </Button>
          }
          groupId={groupId}
          groupCurrency={groupCurrency}
          members={members}
          currentUserId={currentUserId}
        />
      </div>

      {isLoading && (
        <div className="space-y-2">
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
        </div>
      )}

      {isError && (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-destructive/40 py-14 text-center">
          <AlertCircle className="h-6 w-6 text-destructive" />
          <p className="text-sm font-medium">Couldn&apos;t load expenses</p>
          <p className="max-w-xs text-xs text-muted-foreground">
            Something went wrong. Try again.
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching}>
            {isRefetching ? "Retrying…" : "Try again"}
          </Button>
        </div>
      )}

      {!isLoading && !isError && filtered.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border py-14 text-center">
          <Receipt className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {expenses && expenses.length > 0
              ? "No expenses match your search/filter."
              : "No expenses yet. Add the first one."}
          </p>
        </div>
      )}

      {!isError && filtered.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Paid by</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Your share</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((expense) => (
                <ExpenseRow
                  key={expense.id}
                  expense={expense}
                  groupId={groupId}
                  groupCurrency={groupCurrency}
                  members={members}
                  currentUserId={currentUserId}
                  payerName={memberName(expense.paid_by)}
                  onDelete={() => onDelete(expense.id)}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function ExpenseRow({
  expense,
  groupId,
  groupCurrency,
  members,
  currentUserId,
  payerName,
  onDelete,
}: {
  expense: ExpenseWithShares;
  groupId: string;
  groupCurrency: string;
  members: { user_id: string; users: User | null }[];
  currentUserId: string;
  payerName: string;
  onDelete: () => void;
}) {
  const payer = members.find((m) => m.user_id === expense.paid_by)?.users;
  const myShare = expense.expense_shares.find((s) => s.user_id === currentUserId)?.share_amount ?? 0;

  return (
    <TableRow>
      <TableCell>
        <ExpenseFormDialog
          trigger={
            <button className="flex min-w-0 items-center gap-1.5 text-left font-medium hover:text-primary">
              <span className="max-w-[220px] truncate">{expense.description}</span>
              {expense.is_recurring && (
                <Badge variant="secondary" className="shrink-0 gap-1">
                  <Repeat className="h-3 w-3" /> Recurring
                </Badge>
              )}
            </button>
          }
          groupId={groupId}
          groupCurrency={groupCurrency}
          members={members}
          currentUserId={currentUserId}
          existingExpense={expense}
        />
      </TableCell>

      <TableCell>
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={payer?.avatar_url ?? undefined} />
            <AvatarFallback className="bg-primary-light text-[10px] text-primary">
              {payer?.display_name ? initials(payer.display_name) : "?"}
            </AvatarFallback>
          </Avatar>
          <span className="text-muted-foreground">{payerName}</span>
        </div>
      </TableCell>

      <TableCell className="text-muted-foreground">
        {expense.category ? <Badge variant="outline">{expense.category}</Badge> : "—"}
      </TableCell>

      <TableCell className="text-muted-foreground">{formatDate(expense.expense_date)}</TableCell>

      <TableCell className="text-right font-mono font-semibold tabular-nums">
        {formatMoney(expense.amount, expense.currency)}
      </TableCell>

      <TableCell className="text-right font-mono text-muted-foreground tabular-nums">
        {formatMoney(myShare, expense.currency)}
      </TableCell>

      <TableCell>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              aria-label={`Delete ${expense.description}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this expense?</AlertDialogTitle>
              <AlertDialogDescription>
                This recalculates balances for everyone in the group. This can&apos;t be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete} className="bg-destructive text-white">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </TableCell>
    </TableRow>
  );
}
