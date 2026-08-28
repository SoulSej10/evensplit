import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { PrivacyPolicyContent } from "@/components/legal/PrivacyPolicyContent";

/** Read-only view of the same policy shown at the first-run gate, reachable anytime from Settings. */
export default function PrivacyPolicyScreen() {
  return (
    <SafeAreaView className="flex-1 bg-neutral-100 dark:bg-neutral-900">
      <View className="flex-row items-center gap-3 px-5 pt-2">
        <Pressable
          onPress={() => router.back()}
          className="h-9 w-9 items-center justify-center rounded-full bg-white dark:bg-white/10"
        >
          <ArrowLeft size={18} color="#0A0A0A" />
        </Pressable>
        <Text className="text-xl font-bold text-neutral-900 dark:text-neutral-100">Privacy Policy</Text>
      </View>
      <ScrollView contentContainerClassName="gap-5 px-5 py-5" showsVerticalScrollIndicator={false}>
        <PrivacyPolicyContent />
      </ScrollView>
    </SafeAreaView>
  );
}
