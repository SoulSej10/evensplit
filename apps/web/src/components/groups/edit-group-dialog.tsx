"use client";

import { useEffect, useState, type ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { updateGroupSchema, type Group, type UpdateGroupInput } from "@evensplit/shared";
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
import { useUpdateGroup } from "@/hooks/use-group-detail";
import { CURRENCIES } from "@/lib/format";

const ICONS = ["👥", "🏠", "✈️", "🍕", "🎉", "💰", "🚗", "🏖️"];

/** Rename a group / change its icon or currency - owner-only, mirrors CreateGroupDialog's form. */
export function EditGroupDialog({ group, trigger }: { group: Group; trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [icon, setIcon] = useState(group.icon ?? ICONS[0]);
  const updateGroup = useUpdateGroup(group.id);

  const { register, handleSubmit, reset, watch, setValue, formState } = useForm<UpdateGroupInput>({
    resolver: zodResolver(updateGroupSchema),
    defaultValues: { name: group.name, currency: group.currency, icon: group.icon ?? ICONS[0] },
  });

  useEffect(() => {
    if (open) {
      reset({ name: group.name, currency: group.currency, icon: group.icon ?? ICONS[0] });
      setIcon(group.icon ?? ICONS[0]);
    }
  }, [open, group, reset]);

  async function onSubmit(values: UpdateGroupInput) {
    try {
      await updateGroup.mutateAsync({ ...values, icon });
      toast.success("Group updated");
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update group");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit group</DialogTitle>
          <DialogDescription>Rename it, swap the icon, or change its currency.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {ICONS.map((i) => (
              <button
                type="button"
                key={i}
                onClick={() => {
                  setIcon(i);
                  setValue("icon", i);
                }}
                className={`flex h-10 w-10 items-center justify-center rounded-xl text-xl transition-colors ${
                  icon === i ? "bg-primary-light ring-2 ring-primary" : "bg-muted"
                }`}
              >
                {i}
              </button>
            ))}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-group-name">Group name</Label>
            <Input id="edit-group-name" placeholder="Baguio Trip 2026" {...register("name")} />
            {formState.errors.name && (
              <p className="text-xs text-destructive">{formState.errors.name.message}</p>
            )}
          </div>

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

          <DialogFooter>
            <Button type="submit" className="w-full" disabled={updateGroup.isPending}>
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
