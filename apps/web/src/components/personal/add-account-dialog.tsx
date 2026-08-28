"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { createPersonalAccountSchema, type CreatePersonalAccountInput } from "@evensplit/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useCreatePersonalAccount } from "@/hooks/use-personal";
import { CURRENCIES } from "@/lib/format";

const ACCOUNT_TYPES = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "wallet", label: "Wallet" },
  { value: "savings", label: "Savings" },
  { value: "investment", label: "Investment" },
] as const;

export function AddAccountDialog() {
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const createAccount = useCreatePersonalAccount();

  const { register, handleSubmit, reset, watch, setValue, formState } = useForm<CreatePersonalAccountInput>({
    resolver: zodResolver(createPersonalAccountSchema),
    defaultValues: { name: "", type: "cash", currency: profile?.default_currency ?? "PHP", starting_balance: 0 },
  });

  async function onSubmit(values: CreatePersonalAccountInput) {
    try {
      await createAccount.mutateAsync(values);
      toast.success(`${values.name} added`);
      setOpen(false);
      reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add account");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-lg">
          <Plus className="mr-1 h-4 w-4" /> Add account
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add an account</DialogTitle>
          <DialogDescription>Cash, a card, savings — wherever your money lives.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
              <Input
                id="starting-balance"
                type="number"
                step="0.01"
                {...register("starting_balance", { valueAsNumber: true })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" className="w-full" disabled={createAccount.isPending}>
              Add account
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
