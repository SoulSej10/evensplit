"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Plus } from "@phosphor-icons/react";
import { createPersonalBudgetSchema, type CreatePersonalBudgetInput } from "@evensplit/shared";
import { Button } from "@/components/ui/button";
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
import { usePersonalCategories, useUpsertPersonalBudget } from "@/hooks/use-personal";

export function AddBudgetDialog() {
  const [open, setOpen] = useState(false);
  const { data: categories } = usePersonalCategories();
  const upsertBudget = useUpsertPersonalBudget();
  const expenseCategories = categories?.filter((c) => c.kind === "expense") ?? [];

  const { handleSubmit, reset, watch, setValue, formState } = useForm<CreatePersonalBudgetInput>({
    resolver: zodResolver(createPersonalBudgetSchema),
    defaultValues: { category_id: "", monthly_limit: 0 },
  });

  async function onSubmit(values: CreatePersonalBudgetInput) {
    try {
      await upsertBudget.mutateAsync(values);
      toast.success("Budget saved");
      setOpen(false);
      reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save budget");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-lg" disabled={expenseCategories.length === 0}>
          <Plus className="mr-1 h-4 w-4" /> Set budget
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Set a monthly budget</DialogTitle>
          <DialogDescription>A spending limit for one category, per month.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select
              value={watch("category_id")}
              onValueChange={(v) => setValue("category_id", v, { shouldValidate: true })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {expenseCategories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.icon ? `${c.icon} ` : ""}
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="monthly-limit">Monthly limit</Label>
            <AmountInput
              id="monthly-limit"
              value={watch("monthly_limit")}
              onChange={(v) => setValue("monthly_limit", v, { shouldValidate: true })}
              ariaInvalid={!!formState.errors.monthly_limit}
            />
            {formState.errors.monthly_limit && (
              <p className="text-xs text-destructive">{formState.errors.monthly_limit.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="submit" className="w-full" disabled={upsertBudget.isPending}>
              Save budget
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
