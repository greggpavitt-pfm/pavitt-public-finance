/**
 * Content validator — runs the same parsing logic as seed-content.ts but
 * does not write to the database. Surfaces:
 *   - Files with no parseable FCs / MCQs / TFs
 *   - Files where individual questions failed to parse
 *   - Files below the per-module question target (defaults: 12 FC, 9 MCQ)
 *   - Frontmatter validation issues
 *
 * Output: a markdown report at database/CONTENT-VALIDATION.md plus a
 * non-zero exit code if any module is malformed.
 *
 * Usage:
 *   npx tsx database/validate-content.ts
 *   npx tsx database/validate-content.ts --target-fc 32 --target-mcq 32
 *   npx tsx database/validate-content.ts --json    # machine-readable
 */

import fs from "fs"
import path from "path"
import matter from "gray-matter"

const CONTENT_DIR = path.resolve(__dirname, "../../../../ipsas-advisor/content")
const REPORT_PATH = path.resolve(__dirname, "CONTENT-VALIDATION.md")

interface CliFlags {
  targetFc: number
  targetMcq: number
  json: boolean
}

function parseFlags(argv: string[]): CliFlags {
  const flags: CliFlags = { targetFc: 12, targetMcq: 9, json: false }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === "--target-fc") flags.targetFc = Number(argv[++i]) || flags.targetFc
    else if (a === "--target-mcq") flags.targetMcq = Number(argv[++i]) || flags.targetMcq
    else if (a === "--json") flags.json = true
  }
  return flags
}

interface FileReport {
  path: string
  moduleId: string
  pathway: string | null
  audience: string | null
  level: string | null
  fcCount: number
  fcSkipped: number
  mcqCount: number
  mcqSkipped: number
  tfCount: number
  warnings: string[]
  errors: string[]
}

function findMd(dir: string): string[] {
  const out: string[] = []
  function walk(p: string) {
    if (!fs.existsSync(p)) return
    for (const e of fs.readdirSync(p, { withFileTypes: true })) {
      const full = path.join(p, e.name)
      if (e.isDirectory()) walk(full)
      else if (e.name.endsWith(".md")) out.push(full)
    }
  }
  walk(dir)
  return out
}

function levelFromPath(filePath: string): string | null {
  const parts = filePath.split(path.sep)
  for (const seg of parts) {
    if (seg === "beginner" || seg === "intermediate" || seg === "advanced") return seg
  }
  return null
}

function moduleIdFromPath(filePath: string): string {
  return path.basename(filePath, ".md")
}

function validate(filePath: string): FileReport {
  const moduleId = moduleIdFromPath(filePath)
  const report: FileReport = {
    path: filePath,
    moduleId,
    pathway: null,
    audience: null,
    level: levelFromPath(filePath),
    fcCount: 0,
    fcSkipped: 0,
    mcqCount: 0,
    mcqSkipped: 0,
    tfCount: 0,
    warnings: [],
    errors: [],
  }

  const raw = fs.readFileSync(filePath, "utf-8")
  let data: Record<string, unknown>
  let content: string
  try {
    const fm = matter(raw)
    data = fm.data as Record<string, unknown>
    content = fm.content
  } catch (err) {
    report.errors.push(`Frontmatter parse failed: ${(err as Error).message}`)
    return report
  }

  report.pathway = (data.pathway as string) || null
  report.audience = (data.audience as string) || null

  if (!data.pathway) report.errors.push("Missing pathway in frontmatter")
  if (!data.title) report.errors.push("Missing title in frontmatter")

  // Skip non-question files (overview, structure)
  const audience = (data.audience as string) || ""
  if (audience !== "student" && audience !== "practitioner") {
    return report
  }

  // Flash Cards
  const fcSection = content.match(/## Flash Cards\s*\n([\s\S]*?)(?=\n## (?!Flash Cards)|$)/)
  if (fcSection) {
    const blocks = fcSection[1].split(/### (?:\[[^\]]+\]\s+)?FC-\d+/).slice(1)
    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i].trim()
      if (!b) continue
      const front = b.match(/Front:\s*([\s\S]*?)(?=\nBack:)/i)
      const back = b.match(/Back:\s*([\s\S]*?)(?=\n---|\n### |$)/i)
      if (!front || !back) {
        report.fcSkipped++
        report.warnings.push(`FC-${String(i + 1).padStart(2, "0")} missing Front/Back`)
      } else {
        report.fcCount++
      }
    }
  } else if (audience === "student") {
    report.warnings.push("No '## Flash Cards' section")
  }

  // MCQs
  const mcqSection = content.match(
    /## Multiple Choice Questions?\s*\n([\s\S]*?)(?=\n## True\/False Questions|\n## [A-Z]|$)/
  )
  if (mcqSection) {
    const blocks = mcqSection[1].split(/### (?:\[[^\]]+\]\s+)?MCQ-\d+/).slice(1)
    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i].trim()
      if (!b) continue
      const correct = b.match(
        /\*\*Correct(?:\s+answer)?:\s*([A-Da-d])(?:\)?\s*[^*]*)?\*\*/i
      )
      if (!correct) {
        report.mcqSkipped++
        report.warnings.push(`MCQ-${String(i + 1).padStart(2, "0")} missing **Correct: X**`)
        continue
      }
      const before = b.slice(0, b.indexOf(correct[0]))
      if (!/^[-\s]*([A-Da-d])[\.\)]\s/m.test(before)) {
        report.mcqSkipped++
        report.warnings.push(`MCQ-${String(i + 1).padStart(2, "0")} no options found before **Correct**`)
        continue
      }
      report.mcqCount++
    }
  } else if (audience === "student") {
    report.warnings.push("No '## Multiple Choice Questions' section")
  }

  // True/False (count only, parser may not enforce strict format)
  const tfMatches = content.match(/### (?:\[[^\]]+\]\s+)?TF-\d+/g)
  report.tfCount = tfMatches ? tfMatches.length : 0

  return report
}

function main() {
  const flags = parseFlags(process.argv.slice(2))

  if (!fs.existsSync(CONTENT_DIR)) {
    console.error(`Content directory not found: ${CONTENT_DIR}`)
    process.exit(1)
  }

  const files = findMd(CONTENT_DIR).sort()
  console.log(`Validating ${files.length} markdown files...`)
  console.log()

  const reports = files.map(validate)

  // Filter to student modules only for the gap-target analysis
  const studentReports = reports.filter((r) => r.audience === "student")
  const filesWithErrors = reports.filter((r) => r.errors.length > 0)
  const filesWithWarnings = reports.filter((r) => r.warnings.length > 0)
  const belowFcTarget = studentReports.filter((r) => r.fcCount < flags.targetFc)
  const belowMcqTarget = studentReports.filter((r) => r.mcqCount < flags.targetMcq)

  // Print to console
  for (const r of reports) {
    if (r.errors.length === 0 && r.warnings.length === 0 && r.audience !== "student") continue
    const rel = path.relative(CONTENT_DIR, r.path)
    if (r.errors.length > 0) {
      console.log(`❌ ${rel}`)
      r.errors.forEach((e) => console.log(`     ERROR: ${e}`))
    } else if (r.audience === "student") {
      const fcMark = r.fcCount < flags.targetFc ? "⚠️ " : "✅"
      const mcqMark = r.mcqCount < flags.targetMcq ? "⚠️ " : "✅"
      console.log(
        `${fcMark === "✅" && mcqMark === "✅" && r.warnings.length === 0 ? "✅" : "·"}  ${rel.padEnd(70)}` +
        `  FC=${String(r.fcCount).padStart(2)}${fcMark}  MCQ=${String(r.mcqCount).padStart(2)}${mcqMark}  TF=${r.tfCount}`
      )
      r.warnings.forEach((w) => console.log(`     ${w}`))
    }
  }

  // Summary
  console.log()
  console.log("─".repeat(60))
  console.log(`  Files scanned:      ${reports.length}`)
  console.log(`  Student modules:    ${studentReports.length}`)
  console.log(`  With errors:        ${filesWithErrors.length}`)
  console.log(`  With warnings:      ${filesWithWarnings.length}`)
  console.log(`  Below FC target:    ${belowFcTarget.length}/${studentReports.length}  (target ${flags.targetFc})`)
  console.log(`  Below MCQ target:   ${belowMcqTarget.length}/${studentReports.length}  (target ${flags.targetMcq})`)
  console.log("─".repeat(60))

  // Markdown report
  const lines: string[] = [
    "# Content Validation Report",
    "",
    `Generated: ${new Date().toISOString()}`,
    `Targets: ${flags.targetFc} flash cards, ${flags.targetMcq} MCQs per student module`,
    "",
    "## Summary",
    "",
    `- Files scanned: **${reports.length}**`,
    `- Student modules: **${studentReports.length}**`,
    `- Files with errors: **${filesWithErrors.length}**`,
    `- Below FC target: **${belowFcTarget.length}/${studentReports.length}**`,
    `- Below MCQ target: **${belowMcqTarget.length}/${studentReports.length}**`,
    "",
  ]

  if (filesWithErrors.length > 0) {
    lines.push("## Files with errors")
    lines.push("")
    for (const r of filesWithErrors) {
      lines.push(`### ${path.relative(CONTENT_DIR, r.path)}`)
      r.errors.forEach((e) => lines.push(`- ❌ ${e}`))
      lines.push("")
    }
  }

  lines.push("## Student modules — question counts")
  lines.push("")
  lines.push("| File | FC | MCQ | TF | Issues |")
  lines.push("|------|----:|----:|----:|--------|")
  for (const r of studentReports) {
    const rel = path.relative(CONTENT_DIR, r.path)
    const fcMark = r.fcCount < flags.targetFc ? `⚠️ ${r.fcCount}` : `${r.fcCount}`
    const mcqMark = r.mcqCount < flags.targetMcq ? `⚠️ ${r.mcqCount}` : `${r.mcqCount}`
    const issues = r.warnings.length > 0 ? `${r.warnings.length} warnings` : ""
    lines.push(`| ${rel} | ${fcMark} | ${mcqMark} | ${r.tfCount} | ${issues} |`)
  }

  lines.push("")
  lines.push("## Files with parser warnings")
  lines.push("")
  for (const r of filesWithWarnings) {
    if (r.warnings.length === 0) continue
    lines.push(`### ${path.relative(CONTENT_DIR, r.path)}`)
    r.warnings.forEach((w) => lines.push(`- ${w}`))
    lines.push("")
  }

  fs.writeFileSync(REPORT_PATH, lines.join("\n"), "utf-8")
  console.log(`Report written: ${REPORT_PATH}`)

  if (flags.json) {
    console.log()
    console.log(JSON.stringify(reports, null, 2))
  }

  process.exit(filesWithErrors.length > 0 ? 1 : 0)
}

main()
