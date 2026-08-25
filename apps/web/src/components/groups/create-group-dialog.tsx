"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { createGroupSchema, type CreateGroupInput } from "@evensplit/shared";
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
import { createGroup } from "@/lib/api/groups";
import { CURRENCIES } from "@/lib/format";
import { useQueryClient } from "@tanstack/react-query";

const ICONS = ["👥", "🏠", "✈️", "🍕", "🎉", "💰", "🚗", "🏖️"];

export function CreateGroupDialog() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { authUser, profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [icon, setIcon] = useState(ICONS[0]);

  const { register, handleSubmit, reset, watch, setValue, formState } =
    useForm<CreateGroupInput>({
      resolver: zodResolver(createGroupSchema),
      defaultValues: { name: "", currency: profile?.default_currency ?? "USD", icon: ICONS[0] },
    });

  async function onSubmit(values: CreateGroupInput) {
    if (!authUser) return;
    setSubmitting(true);
    try {
      const group = await createGroup({ ...values, icon }, authUser.id);
      await queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast.success(`${group.name} created`);
      setOpen(false);
      reset();
      router.push(`/groups/${group.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create group");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-full">
          <Plus className="mr-1 h-4 w-4" /> New group
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create a group</DialogTitle>
          <DialogDescription>
            Name it after the trip, house, or crew you're splitting costs with.
          </DialogDescription>
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
            <Label htmlFor="name">Group name</Label>
            <Input id="name" placeholder="Baguio Trip 2026" {...register("name")} />
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
            <Button type="submit" className="w-full" disabled={submitting}>
              Create group
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
