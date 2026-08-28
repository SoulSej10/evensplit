import { useState } from "react";
import { Alert, Share, Text, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import * as Linking from "expo-linking";
import { Copy, Send, UserPlus } from "lucide-react-native";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/use-auth";
import { createInvite } from "@/lib/api/invites";

export function InviteSheet({
  visible,
  onClose,
  groupId,
}: {
  visible: boolean;
  onClose: () => void;
  groupId: string;
}) {
  const { authUser } = useAuth();
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  async function ensureInvite() {
    if (inviteUrl || !authUser) return;
    setCreating(true);
    try {
      const invite = await createInvite(groupId, authUser.id);
      setInviteUrl(Linking.createURL(`invite/${invite.invite_code}`));
    } catch (err) {
      Alert.alert("Could not create invite", err instanceof Error ? err.message : "Try again");
    } finally {
      setCreating(false);
    }
  }

  if (visible && !inviteUrl && !creating) void ensureInvite();

  async function copyLink() {
    if (!inviteUrl) return;
    await Clipboard.setStringAsync(inviteUrl);
    Alert.alert("Copied", "Invite link copied to clipboard");
  }

  async function shareLink() {
    if (!inviteUrl) return;
    await Share.share({ message: `Join my SplitEven group: ${inviteUrl}` });
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Invite to group">
      <View className="items-center gap-2">
        <View className="h-14 w-14 items-center justify-center rounded-card bg-primary-light">
          <UserPlus color="#16A88F" size={24} />
        </View>
        <Text className="text-center text-neutral-500">
          Share this link — anyone with it can join the group. Expires in 7 days.
        </Text>
      </View>

      <View className="rounded-card bg-neutral-100 p-3 dark:bg-white/5">
        <Text className="text-sm text-neutral-900 dark:text-neutral-100" numberOfLines={1}>
          {creating ? "Generating…" : inviteUrl ?? ""}
        </Text>
      </View>

      <View className="flex-row gap-3">
        <Button variant="outline" className="flex-1" onPress={copyLink} disabled={!inviteUrl}>
          <View className="flex-row items-center gap-2">
            <Copy size={16} color="#0A0A0A" />
            <Text className="font-semibold text-neutral-900 dark:text-neutral-100">Copy</Text>
          </View>
        </Button>
        <Button className="flex-1" onPress={shareLink} disabled={!inviteUrl}>
          <View className="flex-row items-center gap-2">
            <Send size={16} color="white" />
            <Text className="font-semibold text-white">Share</Text>
          </View>
        </Button>
      </View>
    </BottomSheet>
  );
}
