// next.config.ts
// Deploying to Vercel — no output: 'export' flag.
// This keeps Server Actions available for the contact form in Phase 4.
import path from "node:path"
import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"

// next-intl plugin — points at the request-config file that loads messages
// for the active locale. Must wrap the exported config (see end of file).
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts")

const nextConfig: NextConfig = {
  // next/image works with Vercel's built-in optimizer — no unoptimized flag.
  //
  // Turbopack is the default bundler in Next.js 16.
  // pdf-parse is imported dynamically inside the upload route handler to avoid
  // build-time issues — no special bundler config is needed here.
  //
  // turbopack.root pins the workspace root to this app directory. Without it,
  // Next.js walks up until it finds a lockfile and may pick the wrong one
  // (a stray pnpm-lock.yaml or package-lock.json a few levels up under the
  // shared Dropbox folder), which surfaces as a noisy warning at dev start.
  turbopack: {
    root: path.resolve(__dirname),
  },

  // 301 redirects — the products were renamed and routes moved:
  //   /ipsas-training  → /drills  (IPSAS Drills)
  //   /ipsas-questions → /desk    (IPSAS Desk)
  // Permanent (308) so search engines update the index and inbound link
  // equity transfers to the new paths.
  //
  // Only the bare (English / default-locale) paths need redirecting — the
  // /fr, /es, /pt prefixes never existed publicly, so there are no legacy
  // inbound links to preserve there. With localePrefix: 'as-needed', the
  // bare `/drills` and `/desk` paths resolve to the default English locale.
  async redirects() {
    return [
      { source: "/ipsas-training", destination: "/drills", permanent: true },
      { source: "/ipsas-questions", destination: "/desk", permanent: true },
    ]
  },
}

export default withNextIntl(nextConfig)
