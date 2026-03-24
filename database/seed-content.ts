/**
 * Content migration script — loads IPSAS markdown content into Supabase.
 *
 * Reads all markdown files from the ipsas-advisor content directory,
 * parses frontmatter + flash cards + MCQs, and upserts into the
 * modules and questions tables using the service_role key.
 *
 * Usage:
 *   npx tsx database/seed-content.ts
 *
 * Requires .env.local with:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { createClient } from '@supabase/supabase-js'

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

// Path to the ipsas-advisor content directory (relative to this script)
const CONTENT_DIR = path.resolve(__dirname, '../../../../ipsas-advisor/content')

// Load env vars from .env.local (Next.js convention)
const envPath = path.resolve(__dirname, '../.env.local')
const envContent = fs.readFileSync(envPath, 'utf-8')
const env: Record<string, string> = {}
for (const line of envContent.split('\n')) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const eqIndex = trimmed.indexOf('=')
  if (eqIndex === -1) continue
  env[trimmed.slice(0, eqIndex)] = trimmed.slice(eqIndex + 1)
}

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL']
const serviceRoleKey = env['SUPABASE_SERVICE_ROLE_KEY']

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

// Create a Supabase client with the service_role key (bypasses RLS)
const supabase = createClient(supabaseUrl, serviceRoleKey)

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ParsedModule {
  id: string                // slug used as primary key
  pathway: string
  difficulty: string | null
  sequence_number: number
  title: string
  content_md: string
  jurisdiction: string | null
  standards: string[]
  work_areas: string[]
  description: string
}

interface ParsedQuestion {
  module_id: string
  question_text: string
  question_type: 'mcq' | 'flashcard'
  options: { id: string; text: string }[] | null
  correct_answer: string
  explanation: string | null
  sequence_number: number
}

// ---------------------------------------------------------------------------
// File discovery — find all .md files in the content directory
// ---------------------------------------------------------------------------

function findMarkdownFiles(dir: string): string[] {
  const results: string[] = []

  function walk(current: string) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name)
      if (entry.isDirectory()) {
        walk(fullPath)
      } else if (entry.name.endsWith('.md')) {
        results.push(fullPath)
      }
    }
  }

  walk(dir)
  return results
}

// ---------------------------------------------------------------------------
// Slug generation — creates the modules.id primary key
// ---------------------------------------------------------------------------

function generateSlug(
  filePath: string,
  frontmatter: Record<string, unknown>
): string {
  const pathway = frontmatter.pathway as string
  const moduleNum = String(frontmatter.module).padStart(2, '0')
  const topic = (frontmatter.topic as string) || 'untitled'

  // Solomon Islands overlay
  if (filePath.includes('Solomon-Island-Government')) {
    return `sig-${topic}`
  }

  // Determine difficulty tier from file path (for accrual)
  const difficulty = getDifficultyFromPath(filePath, frontmatter)

  if (pathway === 'accrual' && difficulty) {
    return `accrual-${difficulty}-${moduleNum}-${topic}`
  }

  if (pathway === 'cash-basis') {
    return `cash-${moduleNum}-${topic}`
  }

  // Fallback for shared or other content
  return `${pathway}-${moduleNum}-${topic}`
}

// ---------------------------------------------------------------------------
// Determine difficulty from file path and frontmatter
// ---------------------------------------------------------------------------

function getDifficultyFromPath(
  filePath: string,
  frontmatter: Record<string, unknown>
): string | null {
  // Normalise path separators
  const normalised = filePath.replace(/\\/g, '/')

  if (normalised.includes('/beginner/')) return 'beginner'
  if (normalised.includes('/intermediate/')) return 'intermediate'
  if (normalised.includes('/advanced/')) return 'advanced'

  // Cash-basis has no difficulty levels
  if ((frontmatter.pathway as string) === 'cash-basis') return null

  // Accrual overview files (00, 01) at the root of student/ — no difficulty
  return null
}

// ---------------------------------------------------------------------------
// Determine jurisdiction from file path
// ---------------------------------------------------------------------------

function getJurisdiction(filePath: string): string | null {
  const normalised = filePath.replace(/\\/g, '/')
  if (normalised.includes('Solomon-Island-Government')) return 'SIG'
  return null
}

// ---------------------------------------------------------------------------
// Parse flash cards from markdown content
// ---------------------------------------------------------------------------

function parseFlashCards(content: string, moduleId: string): ParsedQuestion[] {
  const questions: ParsedQuestion[] = []

  // Find the Flash Cards section
  const fcSectionMatch = content.match(/## Flash Cards\s*\n([\s\S]*?)(?=\n## (?!Flash Cards)|$)/)
  if (!fcSectionMatch) return questions

  const fcSection = fcSectionMatch[1]

  // Split by card headers (### FC-01, ### FC-02, etc.)
  const cardBlocks = fcSection.split(/### FC-\d+/).slice(1) // skip text before first card

  for (let i = 0; i < cardBlocks.length; i++) {
    const block = cardBlocks[i].trim()
    if (!block) continue

    // Extract front and back
    // Front is after "Front:" and before "Back:"
    const frontMatch = block.match(/Front:\s*([\s\S]*?)(?=\nBack:)/i)
    const backMatch = block.match(/Back:\s*([\s\S]*?)(?=\n---|\n### |$)/i)

    if (!frontMatch || !backMatch) {
      console.warn(`  Warning: Could not parse FC-${String(i + 1).padStart(2, '0')} in ${moduleId}`)
      continue
    }

    const front = frontMatch[1].trim()
    const back = backMatch[1].trim()

    questions.push({
      module_id: moduleId,
      question_text: front,
      question_type: 'flashcard',
      options: null,
      correct_answer: back,
      explanation: null,
      sequence_number: i + 1,
    })
  }

  return questions
}

// ---------------------------------------------------------------------------
// Parse MCQs from markdown content
// ---------------------------------------------------------------------------

function parseMCQs(content: string, moduleId: string): ParsedQuestion[] {
  const questions: ParsedQuestion[] = []

  // Find the Multiple Choice Questions section
  const mcqSectionMatch = content.match(
    /## Multiple Choice Questions?\s*\n([\s\S]*?)$/
  )
  if (!mcqSectionMatch) return questions

  const mcqSection = mcqSectionMatch[1]

  // Split by question headers (### MCQ-01, ### MCQ-02, etc.)
  const questionBlocks = mcqSection.split(/### MCQ-\d+/).slice(1)

  for (let i = 0; i < questionBlocks.length; i++) {
    const block = questionBlocks[i].trim()
    if (!block) continue

    // Find the **Correct...** line — everything before the first option is
    // the question, everything between options and correct line is options,
    // everything after is explanation.
    const correctMatch = block.match(
      /\*\*Correct(?:\s+answer)?:\s*([A-Da-d])(?:\)?\s*[^*]*)?\*\*/i
    )

    if (!correctMatch) {
      console.warn(`  Warning: No correct answer in MCQ-${String(i + 1).padStart(2, '0')} in ${moduleId}`)
      continue
    }

    const correctAnswer = correctMatch[1].toUpperCase()
    const correctLineIndex = block.indexOf(correctMatch[0])

    // Only look for options BEFORE the **Correct...** line
    const beforeCorrect = block.slice(0, correctLineIndex)

    // Match options in three formats: "A. text", "A) text", "a) text", "- A) text"
    const optionPattern = /^[-\s]*([A-Da-d])[\.\)]\s/m
    const firstOptionIndex = beforeCorrect.search(optionPattern)

    if (firstOptionIndex === -1) {
      console.warn(`  Warning: No options found in MCQ-${String(i + 1).padStart(2, '0')} in ${moduleId}`)
      continue
    }

    const questionText = beforeCorrect.slice(0, firstOptionIndex).trim()
    const optionsBlock = beforeCorrect.slice(firstOptionIndex)

    // Extract options line by line from the options block
    const options: { id: string; text: string }[] = []
    const lines = optionsBlock.split('\n')

    for (const line of lines) {
      // Match: "A. text", "A) text", "a) text", "- A) text"
      const lineMatch = line.match(/^[-\s]*([A-Da-d])[\.\)]\s*(.+)/)
      if (lineMatch) {
        options.push({
          id: lineMatch[1].toUpperCase(),
          text: lineMatch[2].trim(),
        })
      }
    }

    // Extract explanation — text after the **Correct...** line
    const afterCorrect = block.slice(correctLineIndex + correctMatch[0].length)
    const explanationText = afterCorrect
      .replace(/^\s*\n/, '') // strip leading blank line
      .replace(/\n---\s*$/, '') // strip trailing separator
      .replace(/^Explanation:?\s*/i, '') // strip "Explanation:" prefix
      .trim()

    questions.push({
      module_id: moduleId,
      question_text: questionText,
      question_type: 'mcq',
      options,
      correct_answer: correctAnswer,
      explanation: explanationText || null,
      sequence_number: i + 1,
    })
  }

  return questions
}

// ---------------------------------------------------------------------------
// Parse a single markdown file into a module + questions
// ---------------------------------------------------------------------------

function parseFile(
  filePath: string
): { module: ParsedModule; questions: ParsedQuestion[] } | null {
  const raw = fs.readFileSync(filePath, 'utf-8')
  const { data: fm, content } = matter(raw)

  // Validate required frontmatter
  if (!fm.pathway || !fm.title) {
    console.warn(`Skipping ${filePath} — missing pathway or title in frontmatter`)
    return null
  }

  const slug = generateSlug(filePath, fm)
  const difficulty = getDifficultyFromPath(filePath, fm)
  const jurisdiction = getJurisdiction(filePath)

  // Difficulty comes from the folder path, not the frontmatter number.
  // Overview files (00, 01) at the root of student/ have no difficulty.
  const difficultyText = difficulty

  // Parse standards array — frontmatter stores as YAML array
  const standards = Array.isArray(fm.standards)
    ? fm.standards.map(String)
    : typeof fm.standards === 'string'
      ? [fm.standards]
      : []

  // Parse work_areas array
  const workAreas = Array.isArray(fm.work_areas)
    ? fm.work_areas.map(String)
    : typeof fm.work_areas === 'string'
      ? [fm.work_areas]
      : []

  const moduleData: ParsedModule = {
    id: slug,
    pathway: fm.pathway as string,
    difficulty: difficultyText || null,
    sequence_number: Number(fm.module) || 0,
    title: fm.title as string,
    content_md: content, // everything after frontmatter
    jurisdiction,
    standards,
    work_areas: workAreas,
    description: (fm.description as string) || '',
  }

  // Parse questions (flash cards + MCQs)
  const flashCards = parseFlashCards(content, slug)
  const mcqs = parseMCQs(content, slug)

  return {
    module: moduleData,
    questions: [...flashCards, ...mcqs],
  }
}

// ---------------------------------------------------------------------------
// Main — discover files, parse, and upsert into Supabase
// ---------------------------------------------------------------------------

async function main() {
  console.log('=== IPSAS Content Migration ===\n')
  console.log(`Content directory: ${CONTENT_DIR}`)
  console.log(`Supabase URL: ${supabaseUrl}\n`)

  // Check content directory exists
  if (!fs.existsSync(CONTENT_DIR)) {
    console.error(`Content directory not found: ${CONTENT_DIR}`)
    console.error('Make sure the ipsas-advisor project is at the expected location.')
    process.exit(1)
  }

  // Discover all markdown files
  const files = findMarkdownFiles(CONTENT_DIR)
  console.log(`Found ${files.length} markdown files\n`)

  // Parse all files
  const allModules: ParsedModule[] = []
  const allQuestions: ParsedQuestion[] = []
  let skipped = 0

  for (const filePath of files) {
    const relativePath = path.relative(CONTENT_DIR, filePath)
    const result = parseFile(filePath)

    if (!result) {
      skipped++
      continue
    }

    console.log(
      `  ✓ ${relativePath} → ${result.module.id} ` +
      `(${result.questions.filter(q => q.question_type === 'flashcard').length} FC, ` +
      `${result.questions.filter(q => q.question_type === 'mcq').length} MCQ)`
    )

    allModules.push(result.module)
    allQuestions.push(...result.questions)
  }

  console.log(`\nParsed: ${allModules.length} modules, ${allQuestions.length} questions`)
  if (skipped > 0) console.log(`Skipped: ${skipped} files`)

  // --- Upsert modules ---
  console.log('\nUpserting modules...')

  // Supabase upsert has a batch limit; send in chunks of 50
  const BATCH_SIZE = 50
  let moduleErrors = 0

  for (let i = 0; i < allModules.length; i += BATCH_SIZE) {
    const batch = allModules.slice(i, i + BATCH_SIZE)
    const { error } = await supabase
      .from('modules')
      .upsert(
        batch.map(m => ({
          id: m.id,
          pathway: m.pathway,
          difficulty: m.difficulty,
          sequence_number: m.sequence_number,
          title: m.title,
          content_md: m.content_md,
          jurisdiction: m.jurisdiction,
          standards: m.standards,
          work_areas: m.work_areas,
          description: m.description,
          updated_at: new Date().toISOString(),
        })),
        { onConflict: 'id' }
      )

    if (error) {
      console.error(`  Error upserting modules batch ${i / BATCH_SIZE + 1}:`, error.message)
      moduleErrors++
    }
  }

  if (moduleErrors === 0) {
    console.log(`  ✓ ${allModules.length} modules upserted successfully`)
  }

  // --- Upsert questions ---
  // Questions don't have a stable primary key, so we delete existing
  // questions for each module first, then insert fresh ones.
  console.log('\nInserting questions...')

  // Group questions by module_id
  const questionsByModule = new Map<string, ParsedQuestion[]>()
  for (const q of allQuestions) {
    const existing = questionsByModule.get(q.module_id) || []
    existing.push(q)
    questionsByModule.set(q.module_id, existing)
  }

  let questionErrors = 0
  let totalInserted = 0

  for (const [moduleId, questions] of questionsByModule) {
    // Delete existing questions for this module
    const { error: deleteError } = await supabase
      .from('questions')
      .delete()
      .eq('module_id', moduleId)

    if (deleteError) {
      console.error(`  Error deleting questions for ${moduleId}:`, deleteError.message)
      questionErrors++
      continue
    }

    // Insert new questions in batches
    for (let i = 0; i < questions.length; i += BATCH_SIZE) {
      const batch = questions.slice(i, i + BATCH_SIZE)
      const { error: insertError } = await supabase
        .from('questions')
        .insert(
          batch.map(q => ({
            module_id: q.module_id,
            question_text: q.question_text,
            question_type: q.question_type,
            options: q.options,
            correct_answer: q.correct_answer,
            explanation: q.explanation,
            sequence_number: q.sequence_number,
          }))
        )

      if (insertError) {
        console.error(`  Error inserting questions for ${moduleId}:`, insertError.message)
        questionErrors++
      } else {
        totalInserted += batch.length
      }
    }
  }

  if (questionErrors === 0) {
    console.log(`  ✓ ${totalInserted} questions inserted across ${questionsByModule.size} modules`)
  } else {
    console.log(`  ${totalInserted} questions inserted, ${questionErrors} errors`)
  }

  // --- Summary ---
  console.log('\n=== Migration Summary ===')
  console.log(`Modules:   ${allModules.length} parsed, ${moduleErrors} errors`)
  console.log(`Questions: ${allQuestions.length} parsed, ${totalInserted} inserted, ${questionErrors} errors`)

  // Breakdown by pathway
  const cashModules = allModules.filter(m => m.pathway === 'cash-basis')
  const accrualModules = allModules.filter(m => m.pathway === 'accrual')
  const sigModules = allModules.filter(m => m.jurisdiction === 'SIG')

  console.log(`\nBreakdown:`)
  console.log(`  Cash-basis:  ${cashModules.length} modules`)
  console.log(`  Accrual:     ${accrualModules.length} modules`)
  console.log(`    Beginner:    ${accrualModules.filter(m => m.difficulty === 'beginner').length}`)
  console.log(`    Intermediate: ${accrualModules.filter(m => m.difficulty === 'intermediate').length}`)
  console.log(`    Advanced:    ${accrualModules.filter(m => m.difficulty === 'advanced').length}`)
  console.log(`    Overview:    ${accrualModules.filter(m => !m.difficulty).length}`)
  console.log(`  SIG overlay: ${sigModules.length} modules`)

  const fcCount = allQuestions.filter(q => q.question_type === 'flashcard').length
  const mcqCount = allQuestions.filter(q => q.question_type === 'mcq').length
  console.log(`\n  Flash cards: ${fcCount}`)
  console.log(`  MCQs:        ${mcqCount}`)

  if (moduleErrors > 0 || questionErrors > 0) {
    console.log('\n⚠ Some errors occurred — review the output above.')
    process.exit(1)
  }

  console.log('\n✓ Migration complete!')
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
