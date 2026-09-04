// Browser-side Sentry init. No-ops entirely if NEXT_PUBLIC_SENTRY_DSN isn't
// set - drop a DSN in .env.local (or the Vercel project's env vars) whenever
// a Sentry project exists to turn this on, no code change needed.
import * as Sentry from "@sentry/nextjs";

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.1,
  });
}

// Safe to export unconditionally - a no-op if Sentry was never initialized
// above (no DSN set).
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
