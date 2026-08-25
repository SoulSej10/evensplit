import { ActivityIndicator, Pressable, Text, type PressableProps } from "react-native";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "destructive";
type Size = "default" | "sm" | "lg" | "icon";

const VARIANT_STYLES: Record<Variant, string> = {
  primary: "bg-primary active:opacity-90",
  secondary: "bg-primary-light active:opacity-80",
  outline: "border border-neutral-500/30 bg-transparent active:bg-neutral-100 dark:active:bg-white/5",
  ghost: "bg-transparent active:bg-neutral-100 dark:active:bg-white/5",
  destructive: "bg-negative active:opacity-90",
};

const VARIANT_TEXT: Record<Variant, string> = {
  primary: "text-white",
  secondary: "text-primary",
  outline: "text-neutral-900 dark:text-neutral-100",
  ghost: "text-neutral-900 dark:text-neutral-100",
  destructive: "text-white",
};

const SIZE_STYLES: Record<Size, string> = {
  default: "h-12 px-5",
  sm: "h-9 px-4",
  lg: "h-14 px-6",
  icon: "h-10 w-10",
};

interface ButtonProps extends PressableProps {
  variant?: Variant;
  size?: Size;
  children?: React.ReactNode;
  className?: string;
  textClassName?: string;
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "default",
  children,
  className,
  textClassName,
  loading,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <Pressable
      disabled={disabled || loading}
      className={cn(
        "flex-row items-center justify-center rounded-pill",
        VARIANT_STYLES[variant],
        SIZE_STYLES[size],
        (disabled || loading) && "opacity-50",
        className
      )}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" || variant === "destructive" ? "#fff" : "#16A88F"} />
      ) : typeof children === "string" ? (
        <Text className={cn("font-semibold text-base", VARIANT_TEXT[variant], textClassName)}>
          {children}
        </Text>
      ) : (
        children
      )}
    </Pressable>
  );
}
