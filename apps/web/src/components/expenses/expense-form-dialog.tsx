"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { computeSplitShares, SplitError, type SplitType, type User } from "@evensplit/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createExpense, updateExpense, uploadReceipt, type ExpenseWithShares } from "@/lib/api/expenses";
import { formatMoney, initials } from "@/lib/format";
import { useQueryClient } from "@tanstack/react-query";

const SPLIT_LABELS: Record<SplitType, string> = {
  equal: "Equal",
  exact: "Exact amounts",
  percentage: "Percentage",
  shares: "Shares",
};

const CATEGORIES = ["food", "transport", "lodging", "utilities", "entertainment", "other"];

interface Props {
  trigger: ReactNode;
  groupId: string;
  groupCurrency: string;
  members: { user_id: string; users: User | null }[];
  currentUserId: string;
  existingExpense?: ExpenseWithShares;
}

export function ExpenseFormDialog({
  trigger,
  groupId,
  groupCurrency,
  members,
  currentUserId,
  existingExpense,
}: Props) {
  const queryClient = useQueryClient();
  const isEdit = !!existingExpense;
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [description, setDescription] = useState(existingExpense?.description ?? "");
  const [amount, setAmount] = useState(existingExpense ? String(existingExpense.amount) : "");
  const [paidBy, setPaidBy] = useState(existingExpense?.paid_by ?? currentUserId);
  const [splitType, setSplitType] = useState<SplitType>(existingExpense?.split_type ?? "equal");
  const [category, setCategory] = useState(existingExpense?.category ?? "other");
  const [expenseDate, setExpenseDate] = useState(
    existingExpense?.expense_date ?? new Date().toISOString().slice(0, 10)
  );
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const initialParticipants = existingExpense?.expense_shares.map((s) => s.user_id) ??
    members.map((m) => m.user_id);
  const [selected, setSelected] = useState<Set<string>>(new Set(initialParticipants));
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    if (existingExpense) {
      for (const s of existingExpense.expense_shares) {
        initial[s.user_id] = String(s.share_amount);
      }
    }
    return initial;
  });

  useEffect(() => {
    if (!open) return;
    setDescription(existingExpense?.description ?? "");
    setAmount(existingExpense ? String(existingExpense.amount) : "");
    setPaidBy(existingExpense?.paid_by ?? currentUserId);
    setSplitType(existingExpense?.split_type ?? "equal");
    setCategory(existingExpense?.category ?? "other");
    setExpenseDate(existingExpense?.expense_date ?? new Date().toISOString().slice(0, 10));
    setReceiptFile(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const numericAmount = Number(amount) || 0;
  const participantIds = useMemo(() => members.filter((m) => selected.has(m.user_id)), [members, selected]);

  const preview = useMemo(() => {
    if (participantIds.length === 0 || numericAmount <= 0) return null;
    try {
      return computeSplitShares(
        numericAmount,
        splitType,
        participantIds.map((p) => ({
          user_id: p.user_id,
          value: splitType === "equal" ? undefined : Number(values[p.user_id] ?? 0),
        }))
      );
    } catch {
      return null;
    }
  }, [participantIds, numericAmount, splitType, values]);

  function toggleMember(userId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  async function onSubmit() {
    if (!description.trim()) return toast.error("Add a description");
    if (numericAmount <= 0) return toast.error("Enter an amount greater than 0");
    if (participantIds.length === 0) return toast.error("Select at least one participant");

    setSubmitting(true);
    try {
      const participants = participantIds.map((p) => ({
        user_id: p.user_id,
        value: splitType === "equal" ? undefined : Number(values[p.user_id] ?? 0),
      }));

      const input = {
        group_id: groupId,
        description: description.trim(),
        amount: numericAmount,
        currency: groupCurrency,
        paid_by: paidBy,
        split_type: splitType,
        category,
        expense_date: expenseDate,
        receipt_url: existingExpense?.receipt_url ?? null,
        participants,
      };

      const expense = isEdit
        ? await updateExpense(existingExpense!.id, input)
        : await createExpense(input, currentUserId);

      if (receiptFile) {
        const path = await uploadReceipt(groupId, expense.id, receiptFile);
        await updateExpense(expense.id, { ...input, receipt_url: path });
      }

      await queryClient.invalidateQueries({ queryKey: ["group-expenses", groupId] });
      await queryClient.invalidateQueries({ queryKey: ["group-activity", groupId] });
      toast.success(isEdit ? "Expense updated" : "Expense added");
      setOpen(false);
    } catch (err) {
      if (err instanceof SplitError) toast.error(err.message);
      else toast.error(err instanceof Error ? err.message : "Could not save expense");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit expense" : "Add expense"}</DialogTitle>
          <DialogDescription>Split it however's fair for the group.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="Grab to airport"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="amount">Amount ({groupCurrency})</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Paid by</Label>
              <Select value={paidBy} onValueChange={setPaidBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {members.map((m) => (
                    <SelectItem key={m.user_id} value={m.user_id}>
                      {m.users?.display_name ?? "Member"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c[0].toUpperCase() + c.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Split method</Label>
            <div className="grid grid-cols-4 gap-1.5">
              {(Object.keys(SPLIT_LABELS) as SplitType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSplitType(t)}
                  className={`rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors ${
                    splitType === t
                      ? "border-primary bg-primary-light text-primary"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  {SPLIT_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Split between</Label>
            <div className="space-y-1.5 rounded-xl border border-border p-2">
              {members.map((m) => {
                const isSelected = selected.has(m.user_id);
                const share = preview?.find((p) => p.user_id === m.user_id);
                return (
                  <div key={m.user_id} className="flex items-center gap-2 rounded-lg p-1.5">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleMember(m.user_id)}
                    />
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={m.users?.avatar_url ?? undefined} />
                      <AvatarFallback className="text-[10px]">
                        {m.users?.display_name ? initials(m.users.display_name) : "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="flex-1 truncate text-sm">{m.users?.display_name ?? "Member"}</span>
                    {isSelected && splitType !== "equal" ? (
                      <Input
                        className="h-7 w-20 text-right text-xs"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder={splitType === "percentage" ? "%" : splitType === "shares" ? "shares" : "amt"}
                        value={values[m.user_id] ?? ""}
                        onChange={(e) =>
                          setValues((prev) => ({ ...prev, [m.user_id]: e.target.value }))
                        }
                      />
                    ) : isSelected ? (
                      <span className="font-mono text-xs tabular-nums text-muted-foreground">
                        {share ? formatMoney(share.share_amount, groupCurrency) : "—"}
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="receipt">Receipt (optional)</Label>
            <Input
              id="receipt"
              type="file"
              accept="image/*"
              onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button className="w-full" onClick={onSubmit} disabled={submitting}>
            {isEdit ? "Save changes" : "Add expense"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
