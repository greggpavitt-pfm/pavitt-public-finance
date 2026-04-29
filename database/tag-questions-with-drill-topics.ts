/**
 * Tag existing questions with drill topic codes.
 *
 * Logic:
 *   1. Fetch all modules with their standards[] field.
 *   2. For each module, union the drill topic codes from its standards
 *      using the STANDARD_TO_DT mapping derived from IPSAS_Drill_Topics.md.
 *   3. UPDATE questions.drill_topic_codes for all questions in that module.
 *   4. Also update ipsas_chunks.drill_topic_codes from standard_id (if table exists).
 *
 * Usage:
 *   cd projects/GetShitDone/PFS_Web_Site/pavitt-public-finance
 *   npx tsx database/tag-questions-with-drill-topics.ts
 *
 * Requires .env.local with NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
 * Run migration-drill-topics.sql and seed-drill-topics.ts first.
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// ---------------------------------------------------------------------------
// Env loading
// ---------------------------------------------------------------------------

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
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

// ---------------------------------------------------------------------------
// Standard → drill topic mapping
// Derived from IPSAS Standards Mapping tables in IPSAS_Drill_Topics.md.
// Keys use hyphen format ('IPSAS-17') matching database storage.
// Also handles space format ('IPSAS 17') that may appear in older content files.
// ---------------------------------------------------------------------------

const STANDARD_TO_DT: Record<string, string[]> = {
  'IPSAS-1':  ['DT-02', 'DT-06', 'DT-12', 'DT-13', 'DT-14', 'DT-15'],
  'IPSAS-2':  ['DT-12', 'DT-15'],
  'IPSAS-3':  ['DT-12', 'DT-13', 'DT-15'],
  'IPSAS-5':  ['DT-01'],
  'IPSAS-12': ['DT-10'],
  'IPSAS-17': ['DT-01', 'DT-09', 'DT-11', 'DT-13'],
  'IPSAS-19': ['DT-03', 'DT-04', 'DT-14'],
  'IPSAS-21': ['DT-08'],
  'IPSAS-23': ['DT-02', 'DT-14'],
  'IPSAS-24': ['DT-06', 'DT-15'],
  'IPSAS-26': ['DT-08'],
  'IPSAS-28': ['DT-04', 'DT-07'],
  'IPSAS-29': ['DT-07'],
  'IPSAS-30': ['DT-07'],
  'IPSAS-32': ['DT-09'],
  'IPSAS-33': ['DT-01', 'DT-13'],
  'IPSAS-35': ['DT-05', 'DT-14', 'DT-15'],
  'IPSAS-36': ['DT-05'],
  'IPSAS-37': ['DT-05'],
  'IPSAS-38': ['DT-05', 'DT-15'],
  'IPSAS-39': ['DT-03'],
  'IPSAS-41': ['DT-07'],
  'IPSAS-43': ['DT-11'],
  'IPSAS-46': ['DT-01', 'DT-13'],
  'IPSAS-47': ['DT-02', 'DT-14'],
  'IPSAS-48': ['DT-15'],
  // Cash-basis standard — various formats found in content and ipsas_chunks
  'IPSAS-C4':       ['DT-06', 'DT-12', 'DT-14'],
  'C4':             ['DT-06', 'DT-12', 'DT-14'],
  'C4-Cash-Basis':  ['DT-06', 'DT-12', 'DT-14'],
  // Aliases: space format → same codes
  'IPSAS 1':  ['DT-02', 'DT-06', 'DT-12', 'DT-13', 'DT-14', 'DT-15'],
  'IPSAS 2':  ['DT-12', 'DT-15'],
  'IPSAS 3':  ['DT-12', 'DT-13', 'DT-15'],
  'IPSAS 5':  ['DT-01'],
  'IPSAS 12': ['DT-10'],
  'IPSAS 17': ['DT-01', 'DT-09', 'DT-11', 'DT-13'],
  'IPSAS 19': ['DT-03', 'DT-04', 'DT-14'],
  'IPSAS 21': ['DT-08'],
  'IPSAS 23': ['DT-02', 'DT-14'],
  'IPSAS 24': ['DT-06', 'DT-15'],
  'IPSAS 26': ['DT-08'],
  'IPSAS 28': ['DT-04', 'DT-07'],
  'IPSAS 29': ['DT-07'],
  'IPSAS 30': ['DT-07'],
  'IPSAS 32': ['DT-09'],
  'IPSAS 33': ['DT-01', 'DT-13'],
  'IPSAS 35': ['DT-05', 'DT-14', 'DT-15'],
  'IPSAS 36': ['DT-05'],
  'IPSAS 37': ['DT-05'],
  'IPSAS 38': ['DT-05', 'DT-15'],
  'IPSAS 39': ['DT-03'],
  'IPSAS 41': ['DT-07'],
  'IPSAS 43': ['DT-11'],
  'IPSAS 46': ['DT-01', 'DT-13'],
  'IPSAS 47': ['DT-02', 'DT-14'],
  'IPSAS 48': ['DT-15'],
}

/**
 * Given an array of standard strings from a module, return the union of all
 * drill topic codes that map to those standards. Deduped and sorted.
 */
function standardsToDrillTopics(standards: string[] | null): string[] {
  if (!standards || standards.length === 0) return []
  const codes = new Set<string>()
  for (const std of standards) {
    const mapped = STANDARD_TO_DT[std.trim()]
    if (mapped) {
      for (const code of mapped) codes.add(code)
    }
  }
  return [...codes].sort()
}

// ---------------------------------------------------------------------------
// Cash-basis module slug → drill topic fallback
// Used when a cash-basis module has no standards[] in the DB (common — C4
// modules are procedural and don't cite specific IPSAS standard numbers).
// Patterns match against the module id slug (lowercased).
// ---------------------------------------------------------------------------

const CASH_SLUG_PATTERNS: Array<{ pattern: RegExp; codes: string[] }> = [
  { pattern: /budget|appropriat|warrant/,         codes: ['DT-06'] },
  { pattern: /grant|donor|aid|receipt|revenue/,   codes: ['DT-14'] },
  { pattern: /transition|accrual.convert/,        codes: ['DT-13'] },
  { pattern: /consolidat/,                        codes: ['DT-15'] },
  { pattern: /statement|presentation|report/,     codes: ['DT-12'] },
  { pattern: /capital|asset|store/,               codes: ['DT-13'] },
  { pattern: /liabilit|contingenc/,               codes: ['DT-04'] },
  { pattern: /payroll|employee|salary/,           codes: ['DT-03'] },
  { pattern: /debt|borrow|loan/,                  codes: ['DT-07'] },
  { pattern: /transfer|payment|payment/,          codes: ['DT-14'] },
  { pattern: /foreign.?currency|forex/,           codes: ['DT-12'] },
  { pattern: /segment/,                           codes: ['DT-15'] },
  { pattern: /audit|readiness/,                   codes: ['DT-15'] },
]

function cashSlugToDrillTopics(moduleId: string): string[] {
  const slug = moduleId.toLowerCase()
  const codes = new Set<string>()
  for (const { pattern, codes: c } of CASH_SLUG_PATTERNS) {
    if (pattern.test(slug)) {
      for (const code of c) codes.add(code)
    }
  }
  // Every cash-basis module gets DT-12 (Presentation) as a baseline —
  // all C4 reporting covers presentation requirements.
  codes.add('DT-12')
  return [...codes].sort()
}

// ---------------------------------------------------------------------------
// Tag questions
// ---------------------------------------------------------------------------

async function tagQuestions() {
  console.log('Fetching all modules…')
  const { data: modules, error: modErr } = await supabase
    .from('modules')
    .select('id, pathway, standards')
    .order('id', { ascending: true })

  if (modErr || !modules) {
    console.error('Error fetching modules:', modErr?.message)
    process.exit(1)
  }

  console.log(`Found ${modules.length} modules.\n`)

  let totalQuestions = 0
  let unmappedModules = 0

  for (const mod of modules) {
    let drillCodes = standardsToDrillTopics(mod.standards as string[] | null)

    // Fallback for cash-basis modules that have no standards[] in the DB
    if (drillCodes.length === 0 && mod.pathway === 'cash-basis') {
      drillCodes = cashSlugToDrillTopics(mod.id)
    }

    if (drillCodes.length === 0) {
      console.warn(`  ⚠ ${mod.id} [${mod.pathway}] — no standards mapped to drill topics, skipping`)
      unmappedModules++
      continue
    }

    // Fetch question count for this module first
    const { count } = await supabase
      .from('questions')
      .select('id', { count: 'exact', head: true })
      .eq('module_id', mod.id)

    // Update all questions in this module
    const { error: updateErr } = await supabase
      .from('questions')
      .update({ drill_topic_codes: drillCodes })
      .eq('module_id', mod.id)

    if (updateErr) {
      console.error(`  ✗ ${mod.id} — update failed: ${updateErr.message}`)
      continue
    }

    const qCount = count ?? 0
    totalQuestions += qCount
    console.log(`  ✓ ${mod.id} [${mod.pathway}] — ${drillCodes.join(', ')} → ${qCount} questions tagged`)
  }

  console.log(`\nQuestions tagged: ${totalQuestions}`)
  if (unmappedModules > 0) {
    console.log(`Modules with no standard mapping: ${unmappedModules} (add their standards[] to trigger tagging)`)
  }
}

// ---------------------------------------------------------------------------
// Tag ipsas_chunks (if table exists)
// ---------------------------------------------------------------------------

async function tagChunks() {
  // Check if table exists by attempting a count
  const { error: checkErr } = await supabase
    .from('ipsas_chunks')
    .select('id', { count: 'exact', head: true })

  if (checkErr) {
    console.log('\nipsas_chunks table not found or not accessible — skipping chunk tagging.')
    return
  }

  console.log('\nTagging ipsas_chunks…')

  // Get all distinct standard_ids present in chunks
  const { data: chunkStds, error: stdErr } = await supabase
    .from('ipsas_chunks')
    .select('standard_id')

  if (stdErr || !chunkStds) {
    console.error('Error fetching chunk standards:', stdErr?.message)
    return
  }

  const distinctStds = [...new Set(chunkStds.map(c => c.standard_id).filter(Boolean))]
  console.log(`Found ${distinctStds.length} distinct standard_ids in chunks: ${distinctStds.join(', ')}`)

  let totalChunks = 0
  for (const stdId of distinctStds) {
    const drillCodes = standardsToDrillTopics([stdId])
    if (drillCodes.length === 0) {
      console.warn(`  ⚠ ${stdId} — no drill topic mapping, skipping`)
      continue
    }

    const { count } = await supabase
      .from('ipsas_chunks')
      .select('id', { count: 'exact', head: true })
      .eq('standard_id', stdId)

    const { error: updateErr } = await supabase
      .from('ipsas_chunks')
      .update({ drill_topic_codes: drillCodes })
      .eq('standard_id', stdId)

    if (updateErr) {
      console.error(`  ✗ ${stdId} — update failed: ${updateErr.message}`)
      continue
    }

    const cCount = count ?? 0
    totalChunks += cCount
    console.log(`  ✓ ${stdId} — ${drillCodes.join(', ')} → ${cCount} chunks tagged`)
  }

  console.log(`\nChunks tagged: ${totalChunks}`)
}

// ---------------------------------------------------------------------------
// Entry
// ---------------------------------------------------------------------------

async function main() {
  await tagQuestions()
  await tagChunks()
  console.log('\nDone.\n')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
