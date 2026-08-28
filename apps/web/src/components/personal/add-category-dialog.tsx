"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { createPersonalCategorySchema, type CreatePersonalCategoryInput } from "@evensplit/shared";
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
import { useCreatePersonalCategory } from "@/hooks/use-personal";

const ICONS = ["🛒", "🍔", "🚗", "🏠", "💡", "🎬", "💊", "📚", "✈️", "💰", "🎁", "📱"];

export function AddCategoryDialog({ defaultKind }: { defaultKind: "income" | "expense" }) {
  const [open, setOpen] = useState(false);
  const [icon, setIcon] = useState(ICONS[0]);
  const createCategory = useCreatePersonalCategory();

  const { register, handleSubmit, reset, watch, setValue, formState } = useForm<CreatePersonalCategoryInput>({
    resolver: zodResolver(createPersonalCategorySchema),
    defaultValues: { name: "", kind: defaultKind, icon: ICONS[0] },
  });

  async function onSubmit(values: CreatePersonalCategoryInput) {
    try {
      await createCategory.mutateAsync({ ...values, icon });
      toast.success(`${values.name} added`);
      setOpen(false);
      reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add category");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="rounded-lg">
          <Plus className="mr-1 h-4 w-4" /> Add category
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a category</DialogTitle>
          <DialogDescription>Used to group your transactions and set budgets.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {ICONS.map((i) => (
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
            <Label htmlFor="category-name">Name</Label>
            <Input id="category-name" placeholder="Groceries" {...register("name")} />
            {formState.errors.name && <p className="text-xs text-destructive">{formState.errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Kind</Label>
            <Select value={watch("kind")} onValueChange={(v) => setValue("kind", v as never, { shouldValidate: true })}>
              <SelectTrigger>
                <SelectValue placeholder="Kind" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">Expense</SelectItem>
                <SelectItem value="income">Income</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="submit" className="w-full" disabled={createCategory.isPending}>
              Add category
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
