"use client";

import { useEffect, useState, type ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Pencil, Plus } from "@phosphor-icons/react";
import {
  createPersonalCategorySchema,
  type CreatePersonalCategoryInput,
  type PersonalCategory,
} from "@evensplit/shared";
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
import { useCreatePersonalCategory, useUpdatePersonalCategory } from "@/hooks/use-personal";

const ICONS = ["🛒", "🍔", "🚗", "🏠", "💡", "🎬", "💊", "📚", "✈️", "💰", "🎁", "📱"];

/**
 * Handles both creating a new category and editing an existing one - pass
 * `category` to edit it in place instead of creating a new one. Mirrors the
 * ExpenseFormDialog create/edit pattern.
 */
export function AddCategoryDialog({
  defaultKind,
  category,
  trigger,
}: {
  defaultKind: "income" | "expense";
  category?: PersonalCategory;
  trigger?: ReactNode;
}) {
  const isEdit = !!category;
  const [open, setOpen] = useState(false);
  const [icon, setIcon] = useState(category?.icon ?? ICONS[0]);
  const createCategory = useCreatePersonalCategory();
  const updateCategory = useUpdatePersonalCategory();
  const submitting = createCategory.isPending || updateCategory.isPending;

  const { register, handleSubmit, reset, watch, setValue, formState } = useForm<CreatePersonalCategoryInput>({
    resolver: zodResolver(createPersonalCategorySchema),
    defaultValues: {
      name: category?.name ?? "",
      kind: category?.kind ?? defaultKind,
      icon: category?.icon ?? ICONS[0],
    },
  });

  useEffect(() => {
    if (open) {
      reset({ name: category?.name ?? "", kind: category?.kind ?? defaultKind, icon: category?.icon ?? ICONS[0] });
      setIcon(category?.icon ?? ICONS[0]);
    }
  }, [open, category, defaultKind, reset]);

  async function onSubmit(values: CreatePersonalCategoryInput) {
    try {
      if (isEdit) {
        await updateCategory.mutateAsync({ categoryId: category.id, input: { ...values, icon } });
        toast.success(`${values.name} updated`);
      } else {
        await createCategory.mutateAsync({ ...values, icon });
        toast.success(`${values.name} added`);
      }
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Could not ${isEdit ? "update" : "add"} category`);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="rounded-lg font-semibold shadow-sm">
            <Plus className="mr-1 h-4 w-4" /> Add category
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit category" : "Add a category"}</DialogTitle>
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
            <Button type="submit" className="w-full" disabled={submitting}>
              {isEdit ? "Save changes" : "Add category"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Small icon-button trigger for editing an existing category from a list row. */
export function EditCategoryButton({ category }: { category: PersonalCategory }) {
  return (
    <AddCategoryDialog
      defaultKind={category.kind}
      category={category}
      trigger={
        <button
          className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-primary-light hover:text-primary"
          aria-label={`Edit ${category.name}`}
        >
          <Pencil className="h-4 w-4" />
        </button>
      }
    />
  );
}
