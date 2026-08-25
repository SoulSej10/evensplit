"use client";

import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Copy, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createInvite } from "@/lib/api/invites";
import { useAuth } from "@/hooks/use-auth";

export function InviteDialog({ groupId, trigger }: { groupId: string; trigger: ReactNode }) {
  const { authUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);

  async function onOpenChange(next: boolean) {
    setOpen(next);
    if (next && !inviteUrl && authUser) {
      setCreating(true);
      try {
        const invite = await createInvite(groupId, authUser.id);
        setInviteUrl(`${window.location.origin}/invite/${invite.invite_code}`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not create invite");
      } finally {
        setCreating(false);
      }
    }
  }

  async function copyLink() {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    toast.success("Invite link copied");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="rounded-2xl sm:max-w-sm">
        <DialogHeader>
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-light text-primary">
            <UserPlus className="h-6 w-6" />
          </span>
          <DialogTitle className="text-center">Invite to group</DialogTitle>
          <DialogDescription className="text-center">
            Share this link — anyone with it can join the group.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <Label htmlFor="invite-link">Invite link</Label>
          <div className="flex gap-2">
            <Input id="invite-link" readOnly value={creating ? "Generating…" : inviteUrl ?? ""} />
            <Button size="icon" variant="outline" onClick={copyLink} disabled={!inviteUrl}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Expires 7 days from now.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
