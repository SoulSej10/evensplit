import Image from "next/image";
import { cn } from "@/lib/utils";

/** SplitEven mark — /public/logo.png, also used as the site favicon (apps/web/src/app/icon.png). */
export function Logo({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <Image
      src="/logo.png"
      alt="SplitEven"
      width={size}
      height={size}
      className={cn("rounded-lg", className)}
      priority
    />
  );
}
