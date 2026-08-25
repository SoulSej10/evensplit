"use client";

import { createEvenSplitClient, type SupabaseClient } from "@evensplit/shared";

/**
 * Singleton browser Supabase client. Reads NEXT_PUBLIC_SUPABASE_URL /
 * NEXT_PUBLIC_SUPABASE_ANON_KEY (see apps/web/.env.example). Until those are
 * set to real project values, any Supabase call will throw — that's
 * expected until a real project is provisioned (see README).
 */
let client: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient {
  if (client) return client;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  client = createEvenSplitClient({
    supabaseUrl,
    supabaseAnonKey,
    detectSessionInUrl: true,
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
  });

  return client;
}
