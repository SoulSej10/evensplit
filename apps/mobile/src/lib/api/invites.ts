import type { Invite } from "@evensplit/shared";
import { getSupabaseClient } from "@/lib/supabase/client";

export async function createInvite(
  groupId: string,
  createdBy: string,
  invitedEmail?: string | null
): Promise<Invite> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("invites")
    .insert({ group_id: groupId, created_by: createdBy, invited_email: invitedEmail ?? null })
    .select()
    .single();
  if (error) throw error;
  return data as Invite;
}

export async function fetchInviteByCode(code: string): Promise<Invite | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("invites")
    .select("*")
    .eq("invite_code", code)
    .maybeSingle();
  if (error) throw error;
  return data as Invite | null;
}

export async function acceptInvite(
  inviteId: string,
  groupId: string,
  userId: string
): Promise<void> {
  const supabase = getSupabaseClient();
  const { error: memberError } = await supabase
    .from("group_members")
    .insert({ group_id: groupId, user_id: userId, role: "member" });
  if (memberError) throw memberError;

  const { error: inviteError } = await supabase
    .from("invites")
    .update({ accepted_by: userId })
    .eq("id", inviteId);
  if (inviteError) throw inviteError;
}
