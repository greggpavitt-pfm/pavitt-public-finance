// next.config.ts
// Deploying to Vercel — no output: 'export' flag.
// This keeps Server Actions available for the contact form in Phase 4.
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // next/image works with Vercel's built-in optimizer — no unoptimized flag.
  //
  // Turbopack is the default bundler in Next.js 16.
  // pdf-parse is imported dynamically inside the upload route handler to avoid
  // build-time issues — no special bundler config is needed here.
  turbopack: {},
}

export default nextConfig
