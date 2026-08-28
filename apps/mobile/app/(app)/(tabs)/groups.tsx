import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Bell, Plus, Users } from "lucide-react-native";
import { Avatar } from "@/components/ui/Avatar";
import { GroupCard } from "@/components/groups/GroupCard";
import { CreateGroupSheet } from "@/components/groups/CreateGroupSheet";
import { JoinGroupSheet } from "@/components/groups/JoinGroupSheet";
import { QuickActions } from "@/components/groups/QuickActions";
import { SkeletonCardRows } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { EdgeFade } from "@/components/ui/EdgeFade";
import { useAuth } from "@/hooks/use-auth";
import { useSettingsDrawer } from "@/context/settings-drawer";
import { useMyGroups } from "@/hooks/use-groups";

/**
 * The "Groups" tab - every group the user belongs to, plus the entry
 * points to start or join one. This used to be the Home tab's whole
 * content; Home is now a separate lightweight command-center screen (see
 * (tabs)/index.tsx) and this tab owns the full groups list on its own.
 */
export default function GroupsListScreen() {
  const { profile } = useAuth();
  const { open: openSettings } = useSettingsDrawer();
  const { data: groups, isLoading, isError, refetch, isRefetching } = useMyGroups();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [joinSheetOpen, setJoinSheetOpen] = useState(false);

  return (
    <SafeAreaView className="flex-1 bg-neutral-100 dark:bg-neutral-900" edges={["top"]}>
      <View className="flex-row items-center justify-between px-5 pb-1 pt-3">
        <Pressable
          onPress={openSettings}
          className="flex-row items-center gap-2.5 active:opacity-70"
          accessibilityLabel="Settings"
        >
          <Avatar name={profile?.display_name} uri={profile?.avatar_url} size={38} />
        </Pressable>
        <Pressable
          onPress={() => router.navigate("/(app)/(tabs)/activity")}
          hitSlop={12}
          className="h-10 w-10 items-center justify-center rounded-full bg-surface active:opacity-70 dark:bg-surface-dark"
          accessibilityLabel="Activity"
        >
          <Bell color="#0A0A0A" size={18} />
        </Pressable>
      </View>

      <ScrollView contentContainerClassName="px-5 pb-32 pt-3" showsVerticalScrollIndicator={false}>
        <Text className="mb-1 text-2xl font-extrabold text-neutral-900 dark:text-neutral-100">
          {groups?.length ? "Your groups" : "Groups"}
        </Text>
        <Text className="mb-5 text-neutral-500">
          {isLoading
            ? "Loading…"
            : groups?.length
              ? `${groups.length} group${groups.length === 1 ? "" : "s"}`
              : "No groups yet"}
        </Text>

        <QuickActions onCreateGroup={() => setSheetOpen(true)} onJoinGroup={() => setJoinSheetOpen(true)} />

        {isLoading && <SkeletonCardRows count={3} />}

        {!isLoading && isError && (
          <ErrorState
            message="Couldn't load your groups. Check your connection and try again."
            onRetry={() => refetch()}
          />
        )}

        {!isLoading && !isError && groups?.length === 0 && (
          <View className="mt-10 items-center gap-3">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-primary-light">
              <Users color="#16A88F" size={28} />
            </View>
            <Text className="text-base font-medium text-neutral-900 dark:text-neutral-100">
              No groups yet
            </Text>
            <Text className="text-center text-neutral-500">
              Create a group for a trip, household, or anything you split costs on.
            </Text>
            <Pressable
              onPress={() => setSheetOpen(true)}
              className="mt-2 rounded-pill bg-primary px-5 py-3 active:opacity-90"
            >
              <Text className="font-semibold text-white">Create your first group</Text>
            </Pressable>
          </View>
        )}

        {!isLoading &&
          !isError &&
          groups?.map((g) => <GroupCard key={g.id} group={g} />)}

        {isRefetching && !isLoading && (
          <Text className="mt-2 text-center text-xs text-neutral-500">Refreshing…</Text>
        )}
      </ScrollView>
      <EdgeFade edge="bottom" />

      <Pressable
        onPress={() => setSheetOpen(true)}
        className="absolute bottom-28 right-5 h-16 w-16 items-center justify-center rounded-full bg-primary active:opacity-90"
        style={{
          shadowColor: "#16A88F",
          shadowOpacity: 0.35,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 6 },
          elevation: 8,
        }}
      >
        <Plus color="white" size={28} />
      </Pressable>

      <CreateGroupSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} />
      <JoinGroupSheet visible={joinSheetOpen} onClose={() => setJoinSheetOpen(false)} />
    </SafeAreaView>
  );
}
