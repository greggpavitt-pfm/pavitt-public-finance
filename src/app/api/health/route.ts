// GET /api/health — lightweight health check
// Hit by Vercel Cron to keep serverless functions warm.

import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  })
}
