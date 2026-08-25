import { Stack } from "expo-router";
import { AuthGuard } from "@/components/AuthGuard";

export default function AppLayout() {
  return (
    <AuthGuard>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="groups/[groupId]/index" />
      </Stack>
    </AuthGuard>
  );
}
