"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import type { User } from "@evensplit/shared";
import { Plus, Receipt, Trash2 } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
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
  const { data: expenses, isLoading } = useGroupExpenses(groupId);
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

      {!isLoading && filtered.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border py-14 text-center">
          <Receipt className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No expenses yet. Add the first one.</p>
        </div>
      )}

      <div className="space-y-2">
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
      </div>
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
    <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3 shadow-sm">
      <Avatar className="h-10 w-10">
        <AvatarImage src={payer?.avatar_url ?? undefined} />
        <AvatarFallback className="bg-primary-light text-primary">
          {payer?.display_name ? initials(payer.display_name) : "?"}
        </AvatarFallback>
      </Avatar>

      <ExpenseFormDialog
        trigger={
          <button className="min-w-0 flex-1 text-left">
            <p className="truncate font-medium">{expense.description}</p>
            <p className="text-xs text-muted-foreground">
              {payerName} paid · {formatDate(expense.expense_date)}
              {expense.category ? ` · ${expense.category}` : ""}
            </p>
          </button>
        }
        groupId={groupId}
        groupCurrency={groupCurrency}
        members={members}
        currentUserId={currentUserId}
        existingExpense={expense}
      />

      <div className="text-right">
        <p className="font-mono text-sm font-semibold tabular-nums">
          {formatMoney(expense.amount, expense.currency)}
        </p>
        <p className="text-xs text-muted-foreground">
          your share {formatMoney(myShare, expense.currency)}
        </p>
      </div>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this expense?</AlertDialogTitle>
            <AlertDialogDescription>
              This recalculates balances for everyone in the group. This can't be undone.
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
    </div>
  );
}
