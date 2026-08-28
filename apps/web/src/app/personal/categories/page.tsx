"use client";

import { toast } from "sonner";
import { Tag, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { AddCategoryDialog } from "@/components/personal/add-category-dialog";
import { useDeletePersonalCategory, usePersonalCategories } from "@/hooks/use-personal";

function CategoryGroup({
  title,
  kind,
  categories,
  onDelete,
}: {
  title: string;
  kind: "income" | "expense";
  categories: { id: string; name: string; icon: string | null }[];
  onDelete: (id: string, name: string) => void;
}) {
  return (
    <div className="mb-6">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-medium text-muted-foreground">{title}</h2>
        <AddCategoryDialog defaultKind={kind} />
      </div>
      {categories.length === 0 ? (
        <p className="text-sm text-muted-foreground">No categories yet.</p>
      ) : (
        <div className="grid gap-2">
          {categories.map((c) => (
            <Card key={c.id} className="flex items-center justify-between p-3">
              <span className="flex items-center gap-2">
                <span className="text-lg">{c.icon ?? "🏷️"}</span>
                {c.name}
              </span>
              <button
                onClick={() => onDelete(c.id, c.name)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-destructive"
                aria-label={`Delete ${c.name}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PersonalCategoriesPage() {
  const { data: categories, isLoading } = usePersonalCategories();
  const deleteCategory = useDeletePersonalCategory();

  async function onDelete(id: string, name: string) {
    try {
      await deleteCategory.mutateAsync(id);
      toast.success(`${name} deleted`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete category");
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>
        <p className="text-sm text-muted-foreground">Group your transactions and set budgets by category.</p>
      </div>

      {isLoading ? (
        <div className="grid gap-3">
          <Skeleton className="h-10 rounded-xl" />
          <Skeleton className="h-10 rounded-xl" />
        </div>
      ) : (
        <>
          {categories?.length === 0 && (
            <div className="mb-6 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-16 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-light text-primary">
                <Tag className="h-6 w-6" />
              </span>
              <p className="font-medium">No categories yet</p>
              <p className="max-w-xs text-sm text-muted-foreground">
                Add expense and income categories to organize your records.
              </p>
            </div>
          )}
          <CategoryGroup
            title="Expense categories"
            kind="expense"
            categories={categories?.filter((c) => c.kind === "expense") ?? []}
            onDelete={onDelete}
          />
          <CategoryGroup
            title="Income categories"
            kind="income"
            categories={categories?.filter((c) => c.kind === "income") ?? []}
            onDelete={onDelete}
          />
        </>
      )}
    </div>
  );
}
