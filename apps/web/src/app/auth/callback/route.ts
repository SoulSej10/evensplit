import { NextResponse, type NextRequest } from "next/server";

/**
 * OAuth / magic-link / password-recovery redirect target. Supabase's
 * client-side JS SDK completes the session exchange from the URL hash on
 * the client, so this route's job is just to land the user on a sensible
 * page (client-side redirect happens from there based on auth state).
 */
export async function GET(request: NextRequest) {
  const redirectTo = request.nextUrl.searchParams.get("type") === "recovery"
    ? "/reset-password"
    : "/onboarding";
  return NextResponse.redirect(new URL(redirectTo, request.url));
}
