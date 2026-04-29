/**
 * Seed the drill_topics reference table with all 15 topics.
 *
 * Source: projects/ipsas-advisor/content/Drill-Down/IPSAS_Drill_Topics.md
 * Pathway classification derived from which IPSAS standards cover each topic
 * (accrual-only standards → 'accrual'; C4 + accrual equivalents → 'both').
 *
 * Usage:
 *   cd projects/GetShitDone/PFS_Web_Site/pavitt-public-finance
 *   npx tsx database/seed-drill-topics.ts
 *
 * Requires .env.local with NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
 * Run migration-drill-topics.sql in Supabase SQL editor first.
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// ---------------------------------------------------------------------------
// Env loading (same pattern as seed-content.ts)
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
// Drill topics data
// Pathway logic:
//   'accrual'    — topic only applies to full-accrual IPSAS entities
//   'cash-basis' — topic only applies to cash-basis C4 entities (none here)
//   'both'       — applies to entities on either basis
// ---------------------------------------------------------------------------

const DRILL_TOPICS = [
  {
    code: 'DT-01',
    sequence_number: 1,
    name: 'Property, Plant & Equipment: Recognition, Measurement & Depreciation',
    description: 'The largest balance sheet item for most governments. Covers initial recognition, cost vs revaluation models, component depreciation, assets under construction, and disposals.',
    pathway: 'accrual',
    standards: ['IPSAS-17', 'IPSAS-33', 'IPSAS-46', 'IPSAS-5'],
  },
  {
    code: 'DT-02',
    sequence_number: 2,
    name: 'Non-Exchange Revenue: Taxes, Grants & Transfers',
    description: 'The most government-specific area of IPSAS. Revenue recognition for transactions without direct return flows — taxes, conditional grants, fines, and in-kind contributions.',
    pathway: 'both',
    standards: ['IPSAS-23', 'IPSAS-47', 'IPSAS-1'],
  },
  {
    code: 'DT-03',
    sequence_number: 3,
    name: 'Employee Benefits: Defined Benefit Obligations & Other Long-term Benefits',
    description: 'A technically demanding area requiring actuarial expertise. Defined contribution vs defined benefit, projected unit credit method, short-term benefits, and termination benefits.',
    pathway: 'accrual',
    standards: ['IPSAS-39', 'IPSAS-19'],
  },
  {
    code: 'DT-04',
    sequence_number: 4,
    name: 'Provisions, Contingent Liabilities & Contingent Assets',
    description: 'A high-stakes area at every audit. Legal disputes, government guarantees, restructuring provisions, onerous contracts, and PPP obligations.',
    pathway: 'accrual',
    standards: ['IPSAS-19', 'IPSAS-28'],
  },
  {
    code: 'DT-05',
    sequence_number: 5,
    name: 'Consolidated Financial Statements & Controlled Entities',
    description: 'Defining the reporting entity boundary, consolidation adjustments, associates and joint arrangements, and disclosure requirements for unconsolidated controlled entities.',
    pathway: 'accrual',
    standards: ['IPSAS-35', 'IPSAS-36', 'IPSAS-37', 'IPSAS-38'],
  },
  {
    code: 'DT-06',
    sequence_number: 6,
    name: 'Budget Reporting & Comparison with Actuals',
    description: 'The link between financial reporting and accountability. Scope of budget comparison requirements, basis differences, variance explanations, and reconciliation notes.',
    pathway: 'both',
    standards: ['IPSAS-24', 'IPSAS-1'],
  },
  {
    code: 'DT-07',
    sequence_number: 7,
    name: 'Financial Instruments: Classification, Measurement & Impairment',
    description: 'Critical for governments with loan portfolios, investment funds, or concessional financing. Classification, ECL model, government loan portfolios, and derecognition.',
    pathway: 'accrual',
    standards: ['IPSAS-41', 'IPSAS-28', 'IPSAS-29', 'IPSAS-30'],
  },
  {
    code: 'DT-08',
    sequence_number: 8,
    name: 'Impairment of Non-Cash-Generating Assets',
    description: 'The government-specific impairment framework for schools, hospitals, and roads that generate service delivery, not cash. Recoverable service amount and disclosure requirements.',
    pathway: 'accrual',
    standards: ['IPSAS-21', 'IPSAS-26'],
  },
  {
    code: 'DT-09',
    sequence_number: 9,
    name: 'Service Concession Arrangements (PPPs)',
    description: 'An area where the accounting is often completely wrong. Grantor vs operator accounting, the control test, financial liability vs grant of right model, and unitary charge decomposition.',
    pathway: 'accrual',
    standards: ['IPSAS-32', 'IPSAS-17'],
  },
  {
    code: 'DT-10',
    sequence_number: 10,
    name: 'Inventories: Recognition, Measurement & Disclosure',
    description: 'Vast quantities of government inventory go unrecorded. Distinguishing held-for-distribution vs held-for-sale, cost formulas, write-downs, strategic reserves, and consignment goods.',
    pathway: 'accrual',
    standards: ['IPSAS-12'],
  },
  {
    code: 'DT-11',
    sequence_number: 11,
    name: 'Leases: Right-of-Use Assets & Lease Liabilities',
    description: 'IPSAS 43 brings most leases onto the balance sheet. Identifying a lease, lessee recognition and measurement, short-term exemptions, modifications, and lessor accounting.',
    pathway: 'accrual',
    standards: ['IPSAS-43', 'IPSAS-17'],
  },
  {
    code: 'DT-12',
    sequence_number: 12,
    name: 'Presentation of Financial Statements & Disclosure Framework',
    description: 'The standards that underpin everything else. Required primary statements, comparative information, going concern, accounting policy changes vs estimate changes, and prior period errors.',
    pathway: 'both',
    standards: ['IPSAS-1', 'IPSAS-2', 'IPSAS-3'],
  },
  {
    code: 'DT-13',
    sequence_number: 13,
    name: 'Opening Balances & Transition to IPSAS',
    description: 'The unglamorous work that derails most IPSAS adoptions. First-time recognition of assets and liabilities, deemed cost elections, comparative restatement, and opening balance audits.',
    pathway: 'both',
    standards: ['IPSAS-33', 'IPSAS-3', 'IPSAS-17', 'IPSAS-1', 'IPSAS-46'],
  },
  {
    code: 'DT-14',
    sequence_number: 14,
    name: 'Revenue, Grants & Donor Funds',
    description: 'Where small governments live or die. Exchange vs non-exchange classification, multi-year grants, deferred income, in-kind and technical assistance grants, and donor fund consolidation.',
    pathway: 'both',
    standards: ['IPSAS-23', 'IPSAS-47', 'IPSAS-35', 'IPSAS-19', 'IPSAS-1'],
  },
  {
    code: 'DT-15',
    sequence_number: 15,
    name: 'Reporting, Consolidation & Audit Readiness',
    description: 'What auditors actually look at. Whole-of-government consolidation, GFS-to-IPSAS mapping, cash-flow statement construction, disclosure quality, and modified audit opinions.',
    pathway: 'accrual',
    standards: ['IPSAS-35', 'IPSAS-2', 'IPSAS-1', 'IPSAS-24', 'IPSAS-3', 'IPSAS-38'],
  },
]

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

async function main() {
  console.log(`Seeding ${DRILL_TOPICS.length} drill topics…\n`)

  const { error } = await supabase
    .from('drill_topics')
    .upsert(DRILL_TOPICS, { onConflict: 'code' })

  if (error) {
    console.error('Error seeding drill_topics:', error.message)
    process.exit(1)
  }

  // Verify
  const { data, error: readError } = await supabase
    .from('drill_topics')
    .select('code, name, pathway')
    .order('sequence_number', { ascending: true })

  if (readError) {
    console.error('Error reading back rows:', readError.message)
    process.exit(1)
  }

  for (const row of data ?? []) {
    console.log(`  ${row.code}  [${row.pathway}]  ${row.name}`)
  }

  console.log(`\n✓ ${(data ?? []).length} drill topics seeded successfully.\n`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
