import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

const nextConfig: NextConfig = {
  /* config options here */
};

// Source-map upload (for readable stack traces on sentry.io) needs
// SENTRY_ORG/SENTRY_PROJECT/SENTRY_AUTH_TOKEN - harmlessly skipped when
// they're unset, same as the DSN-gated init in instrumentation.ts.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
});
