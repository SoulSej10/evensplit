import { Text } from "react-native";
import { Button } from "@/components/ui/Button";

/**
 * Google OAuth sign-in - disabled for now. The flow itself (Supabase
 * signInWithOAuth + deep-link callback) is implemented in git history,
 * but it isn't reliably working end-to-end yet, so the button is greyed
 * out rather than left live and misleading users with a broken sign-in.
 * Re-enable by restoring the onPress handler once OAuth is verified.
 */
export function GoogleButton() {
  return (
    <Button variant="outline" size="lg" disabled>
      <Text className="font-semibold text-neutral-500">Continue with Google (coming soon)</Text>
    </Button>
  );
}
