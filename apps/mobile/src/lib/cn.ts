/** Tiny classnames joiner (no clsx dependency needed for this small a use). */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
