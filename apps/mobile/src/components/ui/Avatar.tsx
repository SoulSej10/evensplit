import { Image, Text, View } from "react-native";
import { initials } from "@/lib/format";
import { cn } from "@/lib/cn";

export function Avatar({
  name,
  uri,
  size = 40,
  className,
}: {
  name?: string | null;
  uri?: string | null;
  size?: number;
  className?: string;
}) {
  return (
    <View
      className={cn("items-center justify-center overflow-hidden rounded-full bg-primary-light", className)}
      style={{ width: size, height: size }}
    >
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size }} />
      ) : (
        <Text className="font-semibold text-primary" style={{ fontSize: size * 0.38 }}>
          {name ? initials(name) : "?"}
        </Text>
      )}
    </View>
  );
}
