/**
 * Translate the messages/en.json source-of-truth dictionary into French,
 * Spanish, and Portuguese using Claude Sonnet 4.5 via OpenRouter.
 *
 * Why a script rather than runtime translation:
 *   - Static page copy doesn't change often. Translating once at build time
 *     keeps every page fast and removes runtime LLM dependencies.
 *   - The committed messages/<locale>.json files are reviewable in a PR,
 *     so a French speaker can spot bad terminology before deploy.
 *
 * Incremental: the script hashes each English string and skips any target
 * key whose source hash hasn't changed. Re-running after a copy edit
 * re-translates only the touched strings.
 *
 * Usage:
 *   npm run translate          # ui dictionaries (messages/<locale>.json)
 *   npm run translate -- --force   # ignore hashes, re-translate everything
 *   npm run translate -- --locale fr  # only one target locale
 *
 * Requires .env.local with OPENROUTER_API_KEY.
 */

import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const MESSAGES_DIR = path.resolve(__dirname, '../messages')
const SOURCE_LOCALE = 'en'
const TARGET_LOCALES = ['fr', 'es', 'pt'] as const
type TargetLocale = (typeof TARGET_LOCALES)[number]

// Sidecar file storing per-key SHA-1 of the English source at last translation.
// Lets us detect which keys changed without re-translating everything.
const HASH_FILE = path.resolve(MESSAGES_DIR, '.translation-hashes.json')

// claude-sonnet-4-5 has the best technical-register quality among options
// the OpenRouter gateway exposes. gpt-4o is a reasonable fallback if rate-
// limited. Override at the CLI by passing --model <openrouter-model-id>.
// gpt-4o respects response_format=json_object reliably (Anthropic via
// OpenRouter does not — it emits Markdown code fences and sometimes
// returns invalid JSON when the source contains curly quotes). Quality is
// strong for marketing/professional-services copy. Override on the CLI
// with `--model anthropic/claude-sonnet-4-5` if a specific value needs
// the slightly higher Sonnet quality and you don't mind one-off retries.
const DEFAULT_MODEL = 'openai/gpt-4o-2024-11-20'

// Translate up to this many keys per OpenRouter call. Smaller batches keep
// each response well under the model's max output tokens — long marketing
// paragraphs (300+ chars source × 1.3× translation expansion) eat budget
// quickly, so 25 is a safer default than 50.
const BATCH_SIZE = 15
// Output token cap per request. Anthropic's default through OpenRouter is
// only 4096; bumping it avoids mid-response truncation when a batch carries
// several long paragraphs.
const MAX_OUTPUT_TOKENS = 16000

const LOCALE_NAMES: Record<TargetLocale, string> = {
  fr: 'French',
  es: 'Spanish',
  pt: 'Portuguese',
}

// ---------------------------------------------------------------------------
// .env.local loader (mirrors scripts/migrate.ts)
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

const OPENROUTER_API_KEY =
  process.env.OPENROUTER_API_KEY || env.OPENROUTER_API_KEY

if (!OPENROUTER_API_KEY) {
  console.error('Missing OPENROUTER_API_KEY (set in .env.local or env vars)')
  process.exit(1)
}

// ---------------------------------------------------------------------------
// CLI flag parsing
// ---------------------------------------------------------------------------

const args = process.argv.slice(2)
const force = args.includes('--force')
const localeArgIndex = args.indexOf('--locale')
const localeFilter =
  localeArgIndex !== -1 ? (args[localeArgIndex + 1] as TargetLocale) : null
const modelArgIndex = args.indexOf('--model')
const model = modelArgIndex !== -1 ? args[modelArgIndex + 1] : DEFAULT_MODEL

// ---------------------------------------------------------------------------
// Dictionary helpers — flatten nested JSON to dot-paths and back
// ---------------------------------------------------------------------------

type Dict = { [key: string]: string | Dict }
type Flat = Record<string, string>

function flatten(obj: Dict, prefix = ''): Flat {
  const out: Flat = {}
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (typeof value === 'string') {
      out[path] = value
    } else if (value && typeof value === 'object') {
      Object.assign(out, flatten(value, path))
    }
  }
  return out
}

function unflatten(flat: Flat): Dict {
  const out: Dict = {}
  for (const [path, value] of Object.entries(flat)) {
    const parts = path.split('.')
    let cursor: Dict = out
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i]
      if (!(part in cursor) || typeof cursor[part] !== 'object') {
        cursor[part] = {}
      }
      cursor = cursor[part] as Dict
    }
    cursor[parts[parts.length - 1]] = value
  }
  return out
}

function sha1(s: string): string {
  return crypto.createHash('sha1').update(s).digest('hex').slice(0, 12)
}

function readJson(file: string): Dict {
  if (!fs.existsSync(file)) return {}
  const raw = fs.readFileSync(file, 'utf-8')
  return JSON.parse(raw)
}

function writeJson(file: string, data: unknown) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf-8')
}

// ---------------------------------------------------------------------------
// OpenRouter call — strict JSON-in / JSON-out batched translation
// ---------------------------------------------------------------------------

async function translateBatch(
  entries: Array<[string, string]>,
  target: TargetLocale,
): Promise<Record<string, string>> {
  const langName = LOCALE_NAMES[target]

  // The model receives a JSON object { key: english } and must return the
  // same shape with translated values. Object-only response avoids fragile
  // string-parsing on a wrapped Markdown code block.
  const sourceObj: Record<string, string> = Object.fromEntries(entries)

  const systemPrompt = `You translate UI strings from English to ${langName} for a public-finance professional services website (Pavitt Public Finance — IPSAS, public financial management, public sector accounting).

Domain: technical accounting and public administration. Target audience: government finance officials, donors (World Bank, EU, USAID), accounting practitioners. Tone: professional, clear, concise — slightly formal in French and Portuguese (vous / você / voce form), neutral-formal in Spanish (usted form).

Constraints:
- Preserve technical acronyms exactly: IPSAS, PFM, PEFA, IFMIS, PIM, PEM, DRM, IMF, FCDO, USAID, EU.
- Keep proper names exactly: Pavitt Public Finance, Gregg Pavitt, World Bank, European Union, etc.
- Preserve any HTML/Markdown formatting tokens (e.g. <strong>, **bold**, [link text](url)) inside the value.
- Preserve Unicode characters and curly apostrophes when present.
- Translate idiomatically, not literally — e.g. "Get in touch" → "Contactez-nous" / "Contáctenos" / "Entre em contato".

You must respond with a JSON object where every key from the input appears with its ${langName} translation as the value. No explanation. No code fences. Pure JSON only.`

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      // OpenRouter requires these headers for free-tier rate-limit fairness;
      // they're cosmetic on a paid key but cheap to include.
      'HTTP-Referer': 'https://pfmexpert.net',
      'X-Title': 'Pavitt Public Finance UI translation',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: JSON.stringify(sourceObj, null, 2) },
      ],
      response_format: { type: 'json_object' },
      // Lower temperature: translation should be consistent, not creative.
      temperature: 0.2,
      max_tokens: MAX_OUTPUT_TOKENS,
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`OpenRouter ${response.status}: ${body}`)
  }

  const json = await response.json() as {
    choices?: Array<{ message?: { content?: string } }>
  }
  const content = json.choices?.[0]?.message?.content
  if (!content) {
    throw new Error('OpenRouter returned no content')
  }

  // Anthropic models on OpenRouter sometimes wrap JSON output in a Markdown
  // code fence even when response_format=json_object is set. Strip a leading
  // ```json (or ```) and trailing ``` defensively before parsing.
  const cleaned = content
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim()

  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    throw new Error(`OpenRouter response was not valid JSON:\n${content.slice(0, 500)}`)
  }

  // Verify every requested key came back. If a key is missing, the model
  // dropped it — better to fail loudly than ship a half-translated UI.
  for (const [key] of entries) {
    if (typeof parsed[key] !== 'string') {
      throw new Error(`Translation response missing key "${key}"`)
    }
  }

  return parsed as Record<string, string>
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const sourceFile = path.join(MESSAGES_DIR, `${SOURCE_LOCALE}.json`)
  if (!fs.existsSync(sourceFile)) {
    console.error(`Source dictionary missing: ${sourceFile}`)
    process.exit(1)
  }

  const source = flatten(readJson(sourceFile) as Dict)
  const sourceKeyCount = Object.keys(source).length

  // Persisted hashes from the previous run — used to detect changes per key.
  const hashes: Record<string, Record<string, string>> = fs.existsSync(HASH_FILE)
    ? JSON.parse(fs.readFileSync(HASH_FILE, 'utf-8'))
    : {}

  const targets: TargetLocale[] = localeFilter
    ? [localeFilter]
    : [...TARGET_LOCALES]

  console.log(`Translating ${sourceKeyCount} keys → ${targets.join(', ')} via ${model}`)
  if (force) console.log('  (--force: ignoring hash cache, retranslating everything)')

  for (const target of targets) {
    const targetFile = path.join(MESSAGES_DIR, `${target}.json`)
    const existing = flatten(readJson(targetFile) as Dict)
    const targetHashes = hashes[target] || {}

    // Determine which keys need translation:
    //   - --force: every source key
    //   - missing in target file
    //   - source hash changed since last translation
    const toTranslate: Array<[string, string]> = []
    for (const [key, value] of Object.entries(source)) {
      const currentHash = sha1(value)
      const previousHash = targetHashes[key]
      const targetMissing = !(key in existing)
      if (force || targetMissing || previousHash !== currentHash) {
        toTranslate.push([key, value])
      }
    }

    // Drop any keys that exist in target but no longer in source.
    const orphaned = Object.keys(existing).filter((k) => !(k in source))
    for (const k of orphaned) {
      delete existing[k]
      delete targetHashes[k]
    }
    if (orphaned.length > 0) {
      console.log(`  ${target}: dropped ${orphaned.length} orphaned key(s)`)
    }

    if (toTranslate.length === 0) {
      console.log(`  ${target}: up to date (${Object.keys(existing).length} keys)`)
      writeJson(targetFile, unflatten(existing))
      hashes[target] = targetHashes
      continue
    }

    console.log(`  ${target}: translating ${toTranslate.length} key(s)`)

    // Process in batches of BATCH_SIZE to keep responses snappy.
    for (let offset = 0; offset < toTranslate.length; offset += BATCH_SIZE) {
      const batch = toTranslate.slice(offset, offset + BATCH_SIZE)
      const batchNumber = Math.floor(offset / BATCH_SIZE) + 1
      const totalBatches = Math.ceil(toTranslate.length / BATCH_SIZE)
      process.stdout.write(`    batch ${batchNumber}/${totalBatches} (${batch.length} keys)... `)
      const translated = await translateBatch(batch, target)
      for (const [key, value] of batch) {
        existing[key] = translated[key]
        targetHashes[key] = sha1(value)
      }
      // Persist after each batch so a crash mid-run doesn't lose progress.
      writeJson(targetFile, unflatten(existing))
      hashes[target] = targetHashes
      writeJson(HASH_FILE, hashes)
      console.log('done')
    }
  }

  console.log('Translation complete.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
