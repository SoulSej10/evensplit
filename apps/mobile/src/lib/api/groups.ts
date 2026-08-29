import type { CreateGroupInput, Group, GroupMember, UpdateGroupInput, User } from "@evensplit/shared";
import { getSupabaseClient } from "@/lib/supabase/client";

export interface GroupWithMembers extends Group {
  group_members: (GroupMember & { users: User | null })[];
}

export async function fetchMyGroups(userId: string): Promise<GroupWithMembers[]> {
  const supabase = getSupabaseClient();
  const { data: memberships, error: membershipError } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", userId);
  if (membershipError) throw membershipError;

  const groupIds = (memberships ?? []).map((m) => m.group_id);
  if (groupIds.length === 0) return [];

  const { data, error } = await supabase
    .from("groups")
    .select("*, group_members(*, users(*))")
    .in("id", groupIds)
    .is("archived_at", null)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as GroupWithMembers[];
}

export async function fetchGroup(groupId: string): Promise<GroupWithMembers> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("groups")
    .select("*, group_members(*, users(*))")
    .eq("id", groupId)
    .single();
  if (error) throw error;
  return data as GroupWithMembers;
}

export async function createGroup(input: CreateGroupInput, createdBy: string): Promise<Group> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("groups")
    .insert({
      name: input.name,
      icon: input.icon ?? null,
      currency: input.currency,
      created_by: createdBy,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Group;
}

export async function updateGroup(groupId: string, input: UpdateGroupInput): Promise<Group> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("groups")
    .update(input)
    .eq("id", groupId)
    .select()
    .single();
  if (error) throw error;
  return data as Group;
}

export async function archiveGroup(groupId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("groups")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", groupId);
  if (error) throw error;
}

export async function leaveGroup(groupId: string, userId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function removeMember(groupId: string, userId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", userId);
  if (error) throw error;
}
