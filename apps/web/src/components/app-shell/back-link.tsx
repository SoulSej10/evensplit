import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react";

/** Back-to-parent affordance for pages that aren't a main nav destination (e.g. a single group's detail page). */
export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="h-3.5 w-3.5" />
      {label}
    </Link>
  );
}
