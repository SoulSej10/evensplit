import type { Invite } from "@evensplit/shared";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export async function createInvite(
  groupId: string,
  createdBy: string,
  invitedEmail?: string | null
): Promise<Invite> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("invites")
    .insert({
      group_id: groupId,
      created_by: createdBy,
      invited_email: invitedEmail ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Invite;
}

export async function fetchGroupInvites(groupId: string): Promise<Invite[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("invites")
    .select("*")
    .eq("group_id", groupId)
    .order("expires_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Invite[];
}

export interface InvitePreview {
  invite_id: string;
  group_id: string;
  group_name: string;
  is_valid: boolean;
}

/**
 * Preview an invite by its code, before the viewer is a group member.
 * Goes through the preview_invite() RPC (SECURITY DEFINER) rather than
 * reading the invites table directly - members-only RLS on `invites`
 * would otherwise block this for a not-yet-member.
 */
export async function fetchInviteByCode(code: string): Promise<InvitePreview | null> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.rpc("preview_invite", { p_invite_code: code }).maybeSingle();
  if (error) throw error;
  return data as InvitePreview | null;
}

/**
 * Accept an invite via the accept_group_invite() RPC (SECURITY DEFINER),
 * which validates the invite server-side (unexpired, unaccepted, and
 * email-matched when the invite targeted a specific address) and performs
 * the group_members insert + invites update atomically. Returns the
 * joined group's id.
 */
export async function acceptInvite(inviteId: string): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.rpc("accept_group_invite", { p_invite_id: inviteId });
  if (error) throw error;
  return data as string;
}
