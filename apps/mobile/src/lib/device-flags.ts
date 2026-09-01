import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Simple one-time, per-device flags backed by AsyncStorage — for gates and
 * nudges that should fire exactly once ever, not once per app session.
 */

const PRIVACY_POLICY_KEY = "evensplit:privacy-policy-accepted";

/** Whether this device has already accepted the privacy policy (first-run gate). */
export async function hasAcceptedPrivacyPolicy(): Promise<boolean> {
  return (await AsyncStorage.getItem(PRIVACY_POLICY_KEY)) === "true";
}

export async function setPrivacyPolicyAccepted(): Promise<void> {
  await AsyncStorage.setItem(PRIVACY_POLICY_KEY, "true");
}

const ONBOARDING_TOUR_KEY = "evensplit:onboarding-tour-shown";

/** Whether the one-time first-launch welcome tour has already been shown on this device. */
export async function hasSeenOnboardingTour(): Promise<boolean> {
  return (await AsyncStorage.getItem(ONBOARDING_TOUR_KEY)) === "true";
}

export async function setOnboardingTourShown(): Promise<void> {
  await AsyncStorage.setItem(ONBOARDING_TOUR_KEY, "true");
}

const NOTIF_NUDGE_KEY = "evensplit:notification-nudge-shown";

/** Whether the one-time "enable notifications?" nudge has already been shown on this device. */
export async function hasShownNotificationNudge(): Promise<boolean> {
  return (await AsyncStorage.getItem(NOTIF_NUDGE_KEY)) === "true";
}

export async function setNotificationNudgeShown(): Promise<void> {
  await AsyncStorage.setItem(NOTIF_NUDGE_KEY, "true");
}
