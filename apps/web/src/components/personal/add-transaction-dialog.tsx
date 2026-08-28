"use client";

import { useEffect, useState, type ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { createPersonalTransactionSchema, type CreatePersonalTransactionInput } from "@evensplit/shared";
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
import { usePersonalAccounts, usePersonalCategories, useCreatePersonalTransaction } from "@/hooks/use-personal";

const KINDS = [
  { value: "expense", label: "Expense" },
  { value: "income", label: "Income" },
  { value: "transfer", label: "Transfer" },
] as const;

export function AddTransactionDialog({
  trigger,
  initialKind = "expense",
}: {
  /** Custom trigger element (e.g. a Home quick-action tile). Defaults to the standalone "Add transaction" button. */
  trigger?: ReactNode;
  /** Pre-selects a kind when the dialog opens. Manual entry is never group_advance/group_reimbursement (system-only kinds). */
  initialKind?: "income" | "expense" | "transfer";
}) {
  const [open, setOpen] = useState(false);
  const { data: accounts } = usePersonalAccounts();
  const { data: categories } = usePersonalCategories();
  const createTransaction = useCreatePersonalTransaction();

  const { register, handleSubmit, reset, watch, setValue, formState } = useForm<CreatePersonalTransactionInput>({
    resolver: zodResolver(createPersonalTransactionSchema),
    defaultValues: {
      kind: initialKind,
      account_id: "",
      category_id: null,
      transfer_account_id: null,
      amount: 0,
      note: "",
      occurred_at: new Date().toISOString().slice(0, 10),
    },
  });

  const kind = watch("kind");

  useEffect(() => {
    if (open) setValue("kind", initialKind);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialKind]);
  const visibleCategories = categories?.filter((c) => c.kind === (kind === "income" ? "income" : "expense"));

  async function onSubmit(values: CreatePersonalTransactionInput) {
    try {
      await createTransaction.mutateAsync({
        ...values,
        category_id: kind === "transfer" ? null : values.category_id,
        occurred_at: new Date(values.occurred_at).toISOString(),
      });
      toast.success("Transaction added");
      setOpen(false);
      reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add transaction");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="rounded-lg">
            <Plus className="mr-1 h-4 w-4" /> Add transaction
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a transaction</DialogTitle>
          <DialogDescription>Log an expense, income, or transfer between accounts.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Kind</Label>
            <Select value={kind} onValueChange={(v) => setValue("kind", v as never, { shouldValidate: true })}>
              <SelectTrigger>
                <SelectValue placeholder="Kind" />
              </SelectTrigger>
              <SelectContent>
                {KINDS.map((k) => (
                  <SelectItem key={k.value} value={k.value}>
                    {k.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{kind === "transfer" ? "From account" : "Account"}</Label>
              <Select
                value={watch("account_id")}
                onValueChange={(v) => setValue("account_id", v, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts?.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {kind === "transfer" ? (
              <div className="space-y-1.5">
                <Label>To account</Label>
                <Select
                  value={watch("transfer_account_id") ?? undefined}
                  onValueChange={(v) => setValue("transfer_account_id", v, { shouldValidate: true })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts?.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formState.errors.transfer_account_id && (
                  <p className="text-xs text-destructive">{formState.errors.transfer_account_id.message}</p>
                )}
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select
                  value={watch("category_id") ?? undefined}
                  onValueChange={(v) => setValue("category_id", v, { shouldValidate: true })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent>
                    {visibleCategories?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.icon ? `${c.icon} ` : ""}
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="amount">Amount</Label>
              <Input id="amount" type="number" step="0.01" {...register("amount", { valueAsNumber: true })} />
              {formState.errors.amount && <p className="text-xs text-destructive">{formState.errors.amount.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="occurred_at">Date</Label>
              <Input id="occurred_at" type="date" {...register("occurred_at")} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="note">Note</Label>
            <Textarea id="note" placeholder="Optional" rows={2} {...register("note")} />
          </div>

          <DialogFooter>
            <Button type="submit" className="w-full" disabled={createTransaction.isPending}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
