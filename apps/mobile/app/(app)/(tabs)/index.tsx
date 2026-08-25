import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Plus, Users } from "lucide-react-native";
import { GroupCard } from "@/components/groups/GroupCard";
import { CreateGroupSheet } from "@/components/groups/CreateGroupSheet";
import { SkeletonCardRows } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { useAuth } from "@/hooks/use-auth";
import { useMyGroups } from "@/hooks/use-groups";

export default function GroupsListScreen() {
  const { profile } = useAuth();
  const { data: groups, isLoading, isError, refetch, isRefetching } = useMyGroups();
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <SafeAreaView className="flex-1 bg-neutral-100 dark:bg-neutral-900" edges={["top"]}>
      <ScrollView contentContainerClassName="px-5 pb-32 pt-4" showsVerticalScrollIndicator={false}>
        <Text className="mb-1 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          {profile?.display_name ? `Hey, ${profile.display_name.split(" ")[0]}` : "Your groups"}
        </Text>
        <Text className="mb-6 text-neutral-500">
          {isLoading
            ? "Loading…"
            : groups?.length
              ? `${groups.length} group${groups.length === 1 ? "" : "s"}`
              : "No groups yet"}
        </Text>

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
              <Users color="#2F6F5E" size={28} />
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

      <Pressable
        onPress={() => setSheetOpen(true)}
        className="absolute bottom-28 right-5 h-16 w-16 items-center justify-center rounded-full bg-primary shadow-lg active:opacity-90"
        style={{
          shadowColor: "#2F6F5E",
          shadowOpacity: 0.35,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 6 },
          elevation: 8,
        }}
      >
        <Plus color="white" size={28} />
      </Pressable>

      <CreateGroupSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} />
    </SafeAreaView>
  );
}
