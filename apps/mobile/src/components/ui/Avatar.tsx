import { Image, Text, View } from "react-native";
import { initials } from "@/lib/format";
import { cn } from "@/lib/cn";

const LOGO = require("../../../assets/icon.png");

export function Avatar({
  name,
  uri,
  size = 40,
  className,
  logoFallback = false,
}: {
  name?: string | null;
  uri?: string | null;
  size?: number;
  className?: string;
  /** Show the SplitEven logo instead of initials when there's no photo - for a user's own avatar, not other members' (initials tell them apart). */
  logoFallback?: boolean;
}) {
  return (
    <View
      className={cn("items-center justify-center overflow-hidden rounded-full bg-primary-light", className)}
      style={{ width: size, height: size }}
    >
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size }} />
      ) : logoFallback ? (
        <Image source={LOGO} style={{ width: size, height: size }} resizeMode="cover" />
      ) : (
        <Text className="font-semibold text-primary" style={{ fontSize: size * 0.38 }}>
          {name ? initials(name) : "?"}
        </Text>
      )}
    </View>
  );
}
