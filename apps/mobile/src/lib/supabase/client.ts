import AsyncStorage from "@react-native-async-storage/async-storage";
import { createEvenSplitClient, type SupabaseClient } from "@evensplit/shared";

/**
 * Singleton Supabase client for the mobile app. Reads
 * EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY (see
 * apps/mobile/.env.example). Session persistence uses AsyncStorage.
 * Until real credentials are provided, calls will throw — expected until a
 * Supabase project is set up (see root README).
 */
let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (client) return client;

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

  client = createEvenSplitClient({
    supabaseUrl,
    supabaseAnonKey,
    storage: AsyncStorage,
    detectSessionInUrl: false,
  });

  return client;
}
