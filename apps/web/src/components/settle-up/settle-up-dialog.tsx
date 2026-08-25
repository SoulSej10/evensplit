"use client";

import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import type { User } from "@evensplit/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { recordSettlement } from "@/lib/api/settlements";

const METHODS = ["Cash", "GCash", "PayPal", "Bank transfer", "Venmo", "Other"];

interface Props {
  trigger: ReactNode;
  groupId: string;
  groupCurrency: string;
  fromUserId: string;
  toUserId: string;
  suggestedAmount: number;
  members: { user_id: string; users: User | null }[];
}

export function SettleUpDialog({
  trigger,
  groupId,
  groupCurrency,
  fromUserId,
  toUserId,
  suggestedAmount,
  members,
}: Props) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [amount, setAmount] = useState(String(suggestedAmount.toFixed(2)));
  const [method, setMethod] = useState(METHODS[0]);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (open) setAmount(String(suggestedAmount.toFixed(2)));
  }, [open, suggestedAmount]);

  const fromName = members.find((m) => m.user_id === fromUserId)?.users?.display_name ?? "Someone";
  const toName = members.find((m) => m.user_id === toUserId)?.users?.display_name ?? "Someone";

  async function onSubmit() {
    const numeric = Number(amount);
    if (!numeric || numeric <= 0) return toast.error("Enter an amount greater than 0");

    setSubmitting(true);
    try {
      await recordSettlement({
        group_id: groupId,
        from_user: fromUserId,
        to_user: toUserId,
        amount: numeric,
        method,
        note: note.trim() || null,
      });
      await queryClient.invalidateQueries({ queryKey: ["group-settlements", groupId] });
      await queryClient.invalidateQueries({ queryKey: ["group-activity", groupId] });
      await queryClient.invalidateQueries({ queryKey: ["group-expenses", groupId] });
      toast.success("Settlement recorded");
      setOpen(false);
      setNote("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not record settlement");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="rounded-2xl sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Settle up</DialogTitle>
          <DialogDescription>
            {fromName} pays {toName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="settle-amount">Amount ({groupCurrency})</Label>
            <Input
              id="settle-amount"
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Method</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {METHODS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="settle-note">Note (optional)</Label>
            <Textarea
              id="settle-note"
              placeholder="Thanks for covering dinner!"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button className="w-full" onClick={onSubmit} disabled={submitting}>
            Confirm payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
