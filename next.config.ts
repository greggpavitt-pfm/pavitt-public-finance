// next.config.ts
// Deploying to Vercel — no output: 'export' flag.
// This keeps Server Actions available for the contact form in Phase 4.
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // No special config needed for Phase 1.
  // next/image works with Vercel's built-in optimizer — no unoptimized flag.
}

export default nextConfig
