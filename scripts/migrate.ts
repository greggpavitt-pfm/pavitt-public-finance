/**
 * Schema-migration tracker CLI.
 *
 * Records which database/migration-*.sql files have been applied to the
 * Supabase project. Does NOT execute the SQL itself — operator still pastes
 * the file into the Supabase SQL editor and clicks Run. The CLI just records
 * the apply afterwards (or detects pending files before).
 *
 * Why not auto-execute: the Supabase pooler does not safely accept multi-
 * statement DDL with DO blocks via the JS client; the SQL editor handles
 * this cleanly and shows row-count results to the operator. Keeping execute
 * manual avoids a class of half-applied-migration bugs.
 *
 * Usage:
 *   npm run migrate:status            # list pending vs applied
 *   npm run migrate:apply <filename>  # record that <filename> has been applied
 *   npm run migrate:backfill          # one-shot: mark every existing file as applied
 *
 * Requires .env.local with NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
 */

import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// ---------------------------------------------------------------------------
// Config + env loading (same pattern as database/seed-content.ts)
// ---------------------------------------------------------------------------

const MIGRATIONS_DIR = path.resolve(__dirname, '../database')

const env: Record<string, string> = {}
const envPath = path.resolve(__dirname, '../.env.local')
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf-8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    env[trimmed.slice(0, eq)] = trimmed.slice(eq + 1)
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase: SupabaseClient = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

// ---------------------------------------------------------------------------
// File helpers
// ---------------------------------------------------------------------------

function listMigrationFiles(): string[] {
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.startsWith('migration-') && f.endsWith('.sql'))
    .sort()
}

function checksum(filename: string): string {
  const full = path.join(MIGRATIONS_DIR, filename)
  const content = fs.readFileSync(full)
  return crypto.createHash('sha256').update(content).digest('hex')
}

// ---------------------------------------------------------------------------
// DB helpers
// ---------------------------------------------------------------------------

interface AppliedRow {
  filename: string
  applied_at: string
  applied_by: string | null
  checksum: string | null
}

async function fetchApplied(): Promise<AppliedRow[]> {
  const { data, error } = await supabase
    .from('schema_migrations')
    .select('filename, applied_at, applied_by, checksum')
    .order('applied_at', { ascending: true })
  if (error) {
    // Most likely cause: schema_migrations table itself not applied yet.
    if (error.message.includes('schema_migrations')) {
      console.error('schema_migrations table missing.')
      console.error('Apply database/migration-schema-tracking.sql via Supabase SQL editor first.')
      process.exit(1)
    }
    throw error
  }
  return (data ?? []) as AppliedRow[]
}

async function recordApplied(filename: string, by: string | null): Promise<void> {
  const sum = checksum(filename)
  const { error } = await supabase
    .from('schema_migrations')
    .upsert({
      filename,
      applied_at: new Date().toISOString(),
      applied_by: by,
      checksum: sum,
    })
  if (error) throw error
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

async function cmdStatus(): Promise<void> {
  const files = listMigrationFiles()
  const applied = await fetchApplied()
  const appliedSet = new Set(applied.map((r) => r.filename))
  const appliedByName = new Map(applied.map((r) => [r.filename, r]))

  let pendingCount = 0
  let appliedCount = 0
  let driftCount = 0

  console.log('\nMigration status:\n')
  for (const f of files) {
    if (appliedSet.has(f)) {
      const row = appliedByName.get(f)!
      const localSum = checksum(f)
      const drift = row.checksum && row.checksum !== localSum
      const tag = drift ? 'DRIFT  ' : 'applied'
      const date = row.applied_at.slice(0, 10)
      console.log(`  [${tag}] ${date}  ${f}`)
      if (drift) {
        console.log(
          `             checksum mismatch: file changed since apply (db=${row.checksum?.slice(0, 8)}, local=${localSum.slice(0, 8)})`
        )
        driftCount++
      }
      appliedCount++
    } else {
      console.log(`  [PENDING] ${f}`)
      pendingCount++
    }
  }

  console.log(`\n${appliedCount} applied, ${pendingCount} pending, ${driftCount} drifted\n`)
  if (pendingCount > 0) {
    console.log('To record a manual apply: npm run migrate:apply <filename>\n')
  }
}

async function cmdApply(filename: string | undefined): Promise<void> {
  if (!filename) {
    console.error('Usage: npm run migrate:apply <filename>')
    process.exit(1)
  }
  const full = path.join(MIGRATIONS_DIR, filename)
  if (!fs.existsSync(full)) {
    console.error(`File not found: ${full}`)
    process.exit(1)
  }
  const applied = await fetchApplied()
  if (applied.some((r) => r.filename === filename)) {
    console.error(`Already recorded as applied: ${filename}`)
    console.error('Use npm run migrate:status to see history.')
    process.exit(1)
  }
  const by = process.env.USER || process.env.USERNAME || null
  await recordApplied(filename, by)
  console.log(`Recorded: ${filename} (applied_by=${by ?? 'unknown'})`)
}

async function cmdBackfill(): Promise<void> {
  const files = listMigrationFiles()
  const applied = await fetchApplied()
  const appliedSet = new Set(applied.map((r) => r.filename))
  const by = process.env.USER || process.env.USERNAME || 'backfill'

  let added = 0
  for (const f of files) {
    if (appliedSet.has(f)) continue
    await recordApplied(f, by)
    console.log(`Backfilled: ${f}`)
    added++
  }
  console.log(`\nBackfill complete: ${added} rows added.\n`)
  if (added > 0) {
    console.log('IMPORTANT: backfill assumes every migration in database/ has')
    console.log('already been applied to this Supabase project. If any are')
    console.log('NOT applied, delete those rows from schema_migrations and run')
    console.log('them via the Supabase SQL editor.\n')
  }
}

// ---------------------------------------------------------------------------
// Entry
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const cmd = process.argv[2]
  const arg = process.argv[3]
  switch (cmd) {
    case 'status':
      await cmdStatus()
      break
    case 'apply':
      await cmdApply(arg)
      break
    case 'backfill':
      await cmdBackfill()
      break
    default:
      console.error('Unknown command. Usage:')
      console.error('  npm run migrate:status')
      console.error('  npm run migrate:apply <filename>')
      console.error('  npm run migrate:backfill')
      process.exit(1)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
