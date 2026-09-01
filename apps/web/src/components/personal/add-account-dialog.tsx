"use client";

import { useEffect, useState, type ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Plus } from "@phosphor-icons/react";
import { createPersonalAccountSchema, type CreatePersonalAccountInput, type PersonalAccount } from "@evensplit/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AmountInput } from "@/components/ui/amount-input";
import { Label } from "@/components/ui/label";
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
import { useAuth } from "@/hooks/use-auth";
import { useCreatePersonalAccount, useUpdatePersonalAccount } from "@/hooks/use-personal";
import { CURRENCIES } from "@/lib/format";

const ACCOUNT_TYPES = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "wallet", label: "Wallet" },
  { value: "savings", label: "Savings" },
  { value: "investment", label: "Investment" },
] as const;

const ACCOUNT_ICONS = ["💵", "💳", "👛", "🏦", "🐷", "📈", "💰", "🪙", "🏧", "💎", "🧾", "🎯"];

/** Handles both creating a new account and editing an existing one - pass `account` to edit it in place. */
export function AddAccountDialog({ account, trigger }: { account?: PersonalAccount; trigger?: ReactNode }) {
  const isEdit = !!account;
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [icon, setIcon] = useState(account?.icon ?? ACCOUNT_ICONS[0]);
  const createAccount = useCreatePersonalAccount();
  const updateAccount = useUpdatePersonalAccount();
  const submitting = createAccount.isPending || updateAccount.isPending;

  const { register, handleSubmit, reset, watch, setValue, formState } = useForm<CreatePersonalAccountInput>({
    resolver: zodResolver(createPersonalAccountSchema),
    defaultValues: {
      name: account?.name ?? "",
      type: account?.type ?? "cash",
      currency: account?.currency ?? profile?.default_currency ?? "PHP",
      starting_balance: account?.starting_balance ?? 0,
      icon: account?.icon ?? ACCOUNT_ICONS[0],
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: account?.name ?? "",
        type: account?.type ?? "cash",
        currency: account?.currency ?? profile?.default_currency ?? "PHP",
        starting_balance: account?.starting_balance ?? 0,
        icon: account?.icon ?? ACCOUNT_ICONS[0],
      });
      setIcon(account?.icon ?? ACCOUNT_ICONS[0]);
    }
  }, [open, account, profile, reset]);

  async function onSubmit(values: CreatePersonalAccountInput) {
    try {
      if (isEdit) {
        await updateAccount.mutateAsync({ accountId: account.id, input: { ...values, icon } });
        toast.success(`${values.name} updated`);
      } else {
        await createAccount.mutateAsync({ ...values, icon });
        toast.success(`${values.name} added`);
      }
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Could not ${isEdit ? "update" : "add"} account`);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="rounded-lg">
            <Plus className="mr-1 h-4 w-4" /> Add account
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit account" : "Add an account"}</DialogTitle>
          <DialogDescription>Cash, a card, savings — wherever your money lives.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {ACCOUNT_ICONS.map((i) => (
              <button
                type="button"
                key={i}
                onClick={() => setIcon(i)}
                className={`flex h-10 w-10 items-center justify-center rounded-xl text-xl transition-colors ${
                  icon === i ? "bg-primary-light ring-2 ring-primary" : "bg-muted"
                }`}
              >
                {i}
              </button>
            ))}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="account-name">Name</Label>
            <Input id="account-name" placeholder="Everyday card" {...register("name")} />
            {formState.errors.name && <p className="text-xs text-destructive">{formState.errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={watch("type")} onValueChange={(v) => setValue("type", v as never, { shouldValidate: true })}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                {ACCOUNT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Currency</Label>
              <Select
                value={watch("currency")}
                onValueChange={(v) => setValue("currency", v, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Currency" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="starting-balance">Starting balance</Label>
              <AmountInput
                id="starting-balance"
                value={watch("starting_balance")}
                onChange={(v) => setValue("starting_balance", v, { shouldValidate: true })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" className="w-full" disabled={submitting}>
              {isEdit ? "Save changes" : "Add account"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
