import { getSupabaseClient } from "./client";

/**
 * Supabase's email-confirmation and OAuth redirect links carry the session
 * as a URL hash fragment (#access_token=...&refresh_token=...&type=signup),
 * not a query string - the client is created with `detectSessionInUrl:
 * false`, so nothing establishes that session automatically. This pulls
 * the tokens out of the fragment and sets the session directly, letting
 * `useAuth`'s onAuthStateChange listener take it from there.
 */
export async function applyAuthCallbackUrl(url: string): Promise<boolean> {
  const hashIndex = url.indexOf("#");
  if (hashIndex === -1) return false;

  const params = new URLSearchParams(url.slice(hashIndex + 1));
  const access_token = params.get("access_token");
  const refresh_token = params.get("refresh_token");
  if (!access_token || !refresh_token) return false;

  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.setSession({ access_token, refresh_token });
  return !error;
}
