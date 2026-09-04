import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Button } from "@/components/ui/Button";
import { PrivacyPolicyContent } from "@/components/legal/PrivacyPolicyContent";
import { TermsOfServiceContent } from "@/components/legal/TermsOfServiceContent";
import { setPrivacyPolicyAccepted } from "@/lib/device-flags";

/**
 * First-run gate shown once before a new device ever reaches login/signup,
 * per direct feedback ("standard privacy policy things where users get to
 * read that thing before going in the app"). Acceptance is persisted
 * per-device (AsyncStorage) so it's shown exactly once, not on every launch.
 * Covers both the Privacy Policy and Terms of Service in one screen/one
 * acceptance, rather than adding a second gate step for the same moment.
 */
export default function PrivacyPolicyGateScreen() {
  async function onAgree() {
    await setPrivacyPolicyAccepted();
    router.replace("/(auth)/login");
  }

  return (
    <SafeAreaView className="flex-1 bg-neutral-100 dark:bg-neutral-900">
      <View className="px-5 pt-4">
        <Text className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          Privacy Policy &amp; Terms
        </Text>
        <Text className="mt-1 text-sm text-neutral-500">Please review before continuing.</Text>
      </View>
      <ScrollView contentContainerClassName="gap-8 px-5 py-5" showsVerticalScrollIndicator={false}>
        <View className="gap-5">
          <Text className="text-lg font-bold text-neutral-900 dark:text-neutral-100">Privacy Policy</Text>
          <PrivacyPolicyContent />
        </View>
        <View className="gap-5">
          <Text className="text-lg font-bold text-neutral-900 dark:text-neutral-100">Terms of Service</Text>
          <TermsOfServiceContent />
        </View>
      </ScrollView>
      <View className="border-t border-neutral-500/10 px-5 py-4">
        <Button size="lg" onPress={onAgree}>
          <Text className="font-semibold text-white">I agree, continue</Text>
        </Button>
      </View>
    </SafeAreaView>
  );
}
