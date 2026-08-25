import { Alert, Text } from "react-native";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { Button } from "@/components/ui/Button";
import { getSupabaseClient } from "@/lib/supabase/client";

/**
 * Google OAuth sign-in. Opens Supabase's OAuth URL in the system browser
 * and relies on the `evensplit://` deep link scheme (see app.json) to
 * bounce back into the app once the provider redirects.
 */
export function GoogleButton() {
  async function onPress() {
    try {
      const supabase = getSupabaseClient();
      const redirectTo = Linking.createURL("auth/callback");
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (error) throw error;
      if (data?.url) {
        await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      }
    } catch (err) {
      Alert.alert("Could not sign in with Google", err instanceof Error ? err.message : "Try again");
    }
  }

  return (
    <Button variant="outline" size="lg" onPress={onPress}>
      <Text className="font-semibold text-neutral-900 dark:text-neutral-100">Continue with Google</Text>
    </Button>
  );
}
