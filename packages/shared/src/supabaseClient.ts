import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Minimal, platform-agnostic Supabase client factory shared by web and
 * mobile. Each app supplies its own URL/anon key (from Next.js public env
 * vars on web, Expo public env vars on mobile) and its own storage adapter
 * (localStorage-backed on web, AsyncStorage-backed on mobile) so auth
 * sessions persist correctly per platform.
 */

export interface SupabaseAuthStorage {
  getItem(key: string): Promise<string | null> | string | null;
  setItem(key: string, value: string): Promise<void> | void;
  removeItem(key: string): Promise<void> | void;
}

export interface CreateEvenSplitClientOptions {
  supabaseUrl: string;
  supabaseAnonKey: string;
  /** Custom auth storage adapter (e.g. AsyncStorage on React Native). */
  storage?: SupabaseAuthStorage;
  /** Whether to auto-refresh the session in the background. Defaults to true. */
  autoRefreshToken?: boolean;
  /** Whether the client should detect an OAuth session in the URL. Web only. */
  detectSessionInUrl?: boolean;
}

export function createEvenSplitClient(options: CreateEvenSplitClientOptions): SupabaseClient {
  const { supabaseUrl, supabaseAnonKey, storage, autoRefreshToken = true, detectSessionInUrl } =
    options;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "EvenSplit: missing Supabase credentials. Set SUPABASE_URL / SUPABASE_ANON_KEY " +
        "(see .env.example) before initializing the client."
    );
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken,
      detectSessionInUrl,
      storage: storage as never,
    },
  });
}

export type { SupabaseClient };
