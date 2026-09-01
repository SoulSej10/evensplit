import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Users } from "phosphor-react-native";
import { Button } from "@/components/ui/Button";
import { AuthGuard } from "@/components/AuthGuard";
import { useAuth } from "@/hooks/use-auth";
import { acceptInvite, fetchInviteByCode, type InvitePreview } from "@/lib/api/invites";

function JoinGroupContent({ code }: { code: string }) {
  const { authUser } = useAuth();
  const [invite, setInvite] = useState<InvitePreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const found = await fetchInviteByCode(code);
        if (!found || !found.is_valid) {
          setError("This invite link is invalid or has expired.");
          return;
        }
        setInvite(found);
      } catch {
        setError("This invite link is invalid or has expired.");
      } finally {
        setLoading(false);
      }
    })();
  }, [code]);

  async function onJoin() {
    if (!invite || !authUser) return;
    setJoining(true);
    try {
      const groupId = await acceptInvite(invite.invite_id);
      router.replace(`/(app)/groups/${groupId}`);
    } catch {
      setError("Could not join this group. It may no longer exist.");
    } finally {
      setJoining(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-neutral-100 px-6 dark:bg-neutral-900">
      <View className="h-16 w-16 items-center justify-center rounded-card bg-primary-light">
        <Users color="#16A88F" size={28} />
      </View>
      <Text className="mt-4 text-xl font-bold text-neutral-900 dark:text-neutral-100">Join group</Text>

      {loading && <ActivityIndicator className="mt-6" color="#16A88F" />}
      {!loading && error && <Text className="mt-4 text-center text-negative">{error}</Text>}
      {!loading && !error && (
        <>
          <Text className="mt-2 text-center text-neutral-500">
            You&apos;ve been invited to join {invite?.group_name}
          </Text>
          <Button onPress={onJoin} loading={joining} size="lg" className="mt-6 w-full">
            Join {invite?.group_name}
          </Button>
        </>
      )}
    </SafeAreaView>
  );
}

export default function InviteScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  return (
    <AuthGuard>
      <JoinGroupContent code={code} />
    </AuthGuard>
  );
}
