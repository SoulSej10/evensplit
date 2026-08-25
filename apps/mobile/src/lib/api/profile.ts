import type { ProfileSetupInput, User } from "@evensplit/shared";
import { getSupabaseClient } from "@/lib/supabase/client";

export async function upsertProfile(userId: string, input: ProfileSetupInput): Promise<User> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("users")
    .upsert({
      id: userId,
      display_name: input.display_name,
      avatar_url: input.avatar_url ?? null,
      default_currency: input.default_currency,
    })
    .select()
    .single();
  if (error) throw error;
  return data as User;
}

export async function uploadAvatar(userId: string, uri: string, fileName: string): Promise<string> {
  const supabase = getSupabaseClient();
  const path = `${userId}/${Date.now()}-${fileName}`;
  const response = await fetch(uri);
  const arrayBuffer = await response.arrayBuffer();
  const { error } = await supabase.storage.from("avatars").upload(path, arrayBuffer, {
    upsert: true,
    contentType: "image/jpeg",
  });
  if (error) throw error;
  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return data.publicUrl;
}
