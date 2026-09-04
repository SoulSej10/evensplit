import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { getSupabaseClient } from "@/lib/supabase/client";

/**
 * Push notifications.
 *
 * What this module does:
 * - Sets a foreground notification handler so local notifications actually
 *   show up while the app is open.
 * - Requests permission once (guarded so repeat app loads don't re-prompt)
 *   and, on a physical device, registers for an Expo push token.
 * - Persists that token to `public.push_tokens` (`savePushToken`) so the
 *   `notify-group-members` Edge Function + DB triggers (migration 0009) can
 *   actually reach this device — those already exist server-side but had
 *   nothing to read until this was wired up.
 * - Fires LOCAL notifications (immediate, `trigger: null`) on the CURRENT
 *   user's own actions (adding an expense, recording a settlement).
 */

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

let permissionRequested = false;

/**
 * Requests notification permission once per app session (idempotent — safe
 * to call from multiple mount points, e.g. Settings screen + app root).
 * Silently no-ops on failure so it never blocks the calling UI flow.
 */
export async function ensureNotificationPermission(): Promise<boolean> {
  if (permissionRequested) {
    const { status } = await Notifications.getPermissionsAsync();
    return status === "granted";
  }
  permissionRequested = true;

  try {
    const existing = await Notifications.getPermissionsAsync();
    if (existing.status === "granted") return true;
    const requested = await Notifications.requestPermissionsAsync();
    return requested.status === "granted";
  } catch (err) {
    console.warn("EvenSplit: notification permission request failed", err);
    return false;
  }
}

/**
 * Registers for an Expo push token. Guarded by `Device.isDevice` — skipped
 * on simulators/emulators, which can't receive real push tokens. Returns
 * null if unavailable (no physical device, permission denied, or the
 * request failed e.g. offline).
 *
 * NOTE: the returned token is not persisted anywhere by this stub — see
 * module doc comment above.
 */
export async function registerForPushTokenAsync(): Promise<string | null> {
  if (!Device.isDevice) return null;

  const granted = await ensureNotificationPermission();
  if (!granted) return null;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  try {
    const { data } = await Notifications.getExpoPushTokenAsync();
    return data;
  } catch (err) {
    console.warn("EvenSplit: failed to get Expo push token", err);
    return null;
  }
}

/**
 * Persists an Expo push token for the current device against the given
 * user, so the `notify-group-members` Edge Function can deliver real
 * cross-device push when another group member adds an expense or settles
 * up. Safe to call repeatedly (unique on `user_id, expo_push_token`) —
 * upserts rather than duplicating a row per app launch.
 */
export async function savePushToken(userId: string, token: string): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from("push_tokens")
      .upsert({ user_id: userId, expo_push_token: token }, { onConflict: "user_id,expo_push_token" });
    if (error) throw error;
  } catch (err) {
    console.warn("EvenSplit: failed to save push token", err);
  }
}

/**
 * Fires an immediate LOCAL notification — the stand-in for "notify the
 * group" until real cross-device push exists. Never throws; a failed local
 * notification shouldn't block the expense/settlement flow that triggered
 * it.
 */
export async function notifyLocal(title: string, body?: string): Promise<void> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") return;
    await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: null,
    });
  } catch (err) {
    console.warn("EvenSplit: failed to schedule local notification", err);
  }
}
