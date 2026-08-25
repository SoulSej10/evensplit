import { useQuery } from "@tanstack/react-query";
import { fetchMyGroups } from "@/lib/api/groups";
import { useAuth } from "@/hooks/use-auth";

export function useMyGroups() {
  const { authUser } = useAuth();
  return useQuery({
    queryKey: ["groups", authUser?.id],
    queryFn: () => fetchMyGroups(authUser!.id),
    enabled: !!authUser?.id,
  });
}
