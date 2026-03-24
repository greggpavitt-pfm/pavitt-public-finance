/**
 * Dry-run version of the migration script — parses all files and reports
 * what would be inserted, without touching Supabase.
 *
 * Usage:
 *   npx tsx database/seed-content-dry-run.ts
 */

import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const CONTENT_DIR = path.resolve(__dirname, '../../../../ipsas-advisor/content')

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ParsedModule {
  id: string
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
// File discovery
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
// Slug generation
// ---------------------------------------------------------------------------

function generateSlug(
  filePath: string,
  frontmatter: Record<string, unknown>
): string {
  const pathway = frontmatter.pathway as string
  const moduleNum = String(frontmatter.module).padStart(2, '0')
  const topic = (frontmatter.topic as string) || 'untitled'

  if (filePath.includes('Solomon-Island-Government')) {
    return `sig-${topic}`
  }

  const difficulty = getDifficultyFromPath(filePath, frontmatter)

  if (pathway === 'accrual' && difficulty) {
    return `accrual-${difficulty}-${moduleNum}-${topic}`
  }

  if (pathway === 'cash-basis') {
    return `cash-${moduleNum}-${topic}`
  }

  return `${pathway}-${moduleNum}-${topic}`
}

// ---------------------------------------------------------------------------
// Difficulty from path
// ---------------------------------------------------------------------------

function getDifficultyFromPath(
  filePath: string,
  frontmatter: Record<string, unknown>
): string | null {
  const normalised = filePath.replace(/\\/g, '/')

  if (normalised.includes('/beginner/')) return 'beginner'
  if (normalised.includes('/intermediate/')) return 'intermediate'
  if (normalised.includes('/advanced/')) return 'advanced'

  if ((frontmatter.pathway as string) === 'cash-basis') return null

  return null
}

// ---------------------------------------------------------------------------
// Jurisdiction from path
// ---------------------------------------------------------------------------

function getJurisdiction(filePath: string): string | null {
  const normalised = filePath.replace(/\\/g, '/')
  if (normalised.includes('Solomon-Island-Government')) return 'SIG'
  return null
}

// ---------------------------------------------------------------------------
// Parse flash cards
// ---------------------------------------------------------------------------

function parseFlashCards(content: string, moduleId: string): ParsedQuestion[] {
  const questions: ParsedQuestion[] = []

  const fcSectionMatch = content.match(/## Flash Cards\s*\n([\s\S]*?)(?=\n## (?!Flash Cards)|$)/)
  if (!fcSectionMatch) return questions

  const fcSection = fcSectionMatch[1]
  const cardBlocks = fcSection.split(/### FC-\d+/).slice(1)

  for (let i = 0; i < cardBlocks.length; i++) {
    const block = cardBlocks[i].trim()
    if (!block) continue

    const frontMatch = block.match(/Front:\s*([\s\S]*?)(?=\nBack:)/i)
    const backMatch = block.match(/Back:\s*([\s\S]*?)(?=\n---|\n### |$)/i)

    if (!frontMatch || !backMatch) {
      console.warn(`  ⚠ Could not parse FC-${String(i + 1).padStart(2, '0')} in ${moduleId}`)
      continue
    }

    questions.push({
      module_id: moduleId,
      question_text: frontMatch[1].trim(),
      question_type: 'flashcard',
      options: null,
      correct_answer: backMatch[1].trim(),
      explanation: null,
      sequence_number: i + 1,
    })
  }

  return questions
}

// ---------------------------------------------------------------------------
// Parse MCQs
// ---------------------------------------------------------------------------

function parseMCQs(content: string, moduleId: string): ParsedQuestion[] {
  const questions: ParsedQuestion[] = []

  const mcqSectionMatch = content.match(
    /## Multiple Choice Questions?\s*\n([\s\S]*?)$/
  )
  if (!mcqSectionMatch) return questions

  const mcqSection = mcqSectionMatch[1]
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
      console.warn(`  ⚠ No correct answer in MCQ-${String(i + 1).padStart(2, '0')} in ${moduleId}`)
      continue
    }

    const correctAnswer = correctMatch[1].toUpperCase()
    const correctLineIndex = block.indexOf(correctMatch[0])

    // Only look for options BEFORE the **Correct...** line
    const beforeCorrect = block.slice(0, correctLineIndex)

    // Match options in three formats: "A. text", "A) text", "a) text", "- A) text"
    // Each option is on its own line (possibly multi-line for long options)
    const optionPattern = /^[-\s]*([A-Da-d])[\.\)]\s/m
    const firstOptionIndex = beforeCorrect.search(optionPattern)

    if (firstOptionIndex === -1) {
      console.warn(`  ⚠ No options in MCQ-${String(i + 1).padStart(2, '0')} in ${moduleId}`)
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
// Parse a single file
// ---------------------------------------------------------------------------

function parseFile(
  filePath: string
): { module: ParsedModule; questions: ParsedQuestion[] } | null {
  const raw = fs.readFileSync(filePath, 'utf-8')
  const { data: fm, content } = matter(raw)

  if (!fm.pathway || !fm.title) {
    console.warn(`Skipping ${filePath} — missing pathway or title`)
    return null
  }

  const slug = generateSlug(filePath, fm)
  const difficulty = getDifficultyFromPath(filePath, fm)
  const jurisdiction = getJurisdiction(filePath)

  // Difficulty comes from the folder path, not the frontmatter number.
  // Overview files (00, 01) at the root of student/ have no difficulty.
  const difficultyText = difficulty

  const standards = Array.isArray(fm.standards)
    ? fm.standards.map(String)
    : typeof fm.standards === 'string'
      ? [fm.standards]
      : []

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
    content_md: content,
    jurisdiction,
    standards,
    work_areas: workAreas,
    description: (fm.description as string) || '',
  }

  const flashCards = parseFlashCards(content, slug)
  const mcqs = parseMCQs(content, slug)

  return {
    module: moduleData,
    questions: [...flashCards, ...mcqs],
  }
}

// ---------------------------------------------------------------------------
// Main — dry run
// ---------------------------------------------------------------------------

function main() {
  console.log('=== IPSAS Content Migration — DRY RUN ===\n')
  console.log(`Content directory: ${CONTENT_DIR}\n`)

  if (!fs.existsSync(CONTENT_DIR)) {
    console.error(`Content directory not found: ${CONTENT_DIR}`)
    process.exit(1)
  }

  const files = findMarkdownFiles(CONTENT_DIR)
  console.log(`Found ${files.length} markdown files\n`)

  const allModules: ParsedModule[] = []
  const allQuestions: ParsedQuestion[] = []
  let skipped = 0
  const warnings: string[] = []

  for (const filePath of files) {
    const relativePath = path.relative(CONTENT_DIR, filePath)
    const result = parseFile(filePath)

    if (!result) {
      skipped++
      continue
    }

    const fcCount = result.questions.filter(q => q.question_type === 'flashcard').length
    const mcqCount = result.questions.filter(q => q.question_type === 'mcq').length

    console.log(
      `  ✓ ${relativePath}` +
      `\n    → slug: ${result.module.id}` +
      `\n    → pathway: ${result.module.pathway}, difficulty: ${result.module.difficulty || 'none'}` +
      `\n    → ${fcCount} flash cards, ${mcqCount} MCQs`
    )

    // Check for potential issues
    if (fcCount === 0 && mcqCount === 0 && !filePath.includes('Solomon-Island-Government') && !filePath.includes('00-')) {
      warnings.push(`${relativePath}: No questions found`)
    }

    // Verify MCQ options have 4 choices
    for (const q of result.questions) {
      if (q.question_type === 'mcq' && q.options && q.options.length !== 4) {
        warnings.push(
          `${relativePath}: MCQ-${String(q.sequence_number).padStart(2, '0')} ` +
          `has ${q.options.length} options (expected 4)`
        )
      }
    }

    allModules.push(result.module)
    allQuestions.push(...result.questions)
  }

  // Check for duplicate slugs
  const slugs = allModules.map(m => m.id)
  const duplicates = slugs.filter((s, i) => slugs.indexOf(s) !== i)
  if (duplicates.length > 0) {
    console.error(`\n❌ DUPLICATE SLUGS FOUND:`)
    for (const dup of [...new Set(duplicates)]) {
      console.error(`  ${dup}`)
    }
  }

  // Summary
  console.log(`\n=== DRY RUN SUMMARY ===`)
  console.log(`Files found:     ${files.length}`)
  console.log(`Files parsed:    ${allModules.length}`)
  console.log(`Files skipped:   ${skipped}`)
  console.log(`Total questions: ${allQuestions.length}`)

  const cashModules = allModules.filter(m => m.pathway === 'cash-basis')
  const accrualModules = allModules.filter(m => m.pathway === 'accrual')
  const sigModules = allModules.filter(m => m.jurisdiction === 'SIG')

  console.log(`\nBreakdown:`)
  console.log(`  Cash-basis:    ${cashModules.length} modules`)
  console.log(`  Accrual:       ${accrualModules.length} modules`)
  console.log(`    Beginner:      ${accrualModules.filter(m => m.difficulty === 'beginner').length}`)
  console.log(`    Intermediate:  ${accrualModules.filter(m => m.difficulty === 'intermediate').length}`)
  console.log(`    Advanced:      ${accrualModules.filter(m => m.difficulty === 'advanced').length}`)
  console.log(`    Overview:      ${accrualModules.filter(m => !m.difficulty).length}`)
  console.log(`  SIG overlay:   ${sigModules.length} modules`)

  const fcCount = allQuestions.filter(q => q.question_type === 'flashcard').length
  const mcqCount = allQuestions.filter(q => q.question_type === 'mcq').length
  console.log(`\n  Flash cards:   ${fcCount}`)
  console.log(`  MCQs:          ${mcqCount}`)

  if (warnings.length > 0) {
    console.log(`\n⚠ WARNINGS (${warnings.length}):`)
    for (const w of warnings) {
      console.log(`  ${w}`)
    }
  }

  if (duplicates.length > 0) {
    process.exit(1)
  }

  console.log('\n✓ Dry run complete — no data was written.')
}

main()
