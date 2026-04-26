// Card-based renderer for the structured advisor response.
//
// Replaces the old single-bubble markdown rendering for any message that has
// a populated `structured_response` payload. Layout follows the IFRS Copilot
// reference (Interface-samples/practitioner-response-page.pdf):
//
//   - Applicable Standard card (with Also-relevant sub-line + complexity)
//   - Recognition / Measurement two-column card
//   - Journal Entries card (real <table>, not markdown)
//   - Practical Notes / Common Errors / Key Judgments grid
//   - Citations / Sources block
//   - Disclaimer strip
//
// Server messages older than this component (no structured_response) fall
// back to the markdown renderer in AssistantMessage.tsx.
//
// All sub-cards are presentational — no client-side state needed, so this
// can stay a server component.
//
// Pure presentational module — only React imports, no DB/server access.

import type {
  QuickTreatmentResponse,
  JournalEntryBlock,
  Citation,
} from "@/app/advisor/actions"

// ---------------------------------------------------------------------------
// Top-level renderer
// ---------------------------------------------------------------------------

interface TreatmentCardsProps {
  treatment: QuickTreatmentResponse
}

export default function TreatmentCards({ treatment }: TreatmentCardsProps) {
  return (
    <div className="space-y-4">
      <ApplicableStandardCard
        standards={treatment.applicable_standards}
        alsoRelevant={treatment.also_relevant_standards}
        whyApplies={treatment.why_applies}
        complexity={treatment.complexity}
        keyReferences={treatment.citations}
      />

      <RecognitionMeasurementCard
        recognition={treatment.recognition_criteria}
        measurement={treatment.measurement_guidance}
        disclosure={treatment.disclosure_requirements}
      />

      {treatment.journal_entries && treatment.journal_entries.length > 0 ? (
        <JournalEntriesCard entries={treatment.journal_entries} />
      ) : treatment.journal_entry ? (
        // Legacy free-text journal entry — render as preformatted block
        <LegacyJournalEntryCard text={treatment.journal_entry} />
      ) : null}

      {(treatment.practical_notes?.length ||
        treatment.common_errors?.length ||
        treatment.key_judgments?.length) && (
        <NotesGrid
          practicalNotes={treatment.practical_notes}
          commonErrors={treatment.common_errors}
          keyJudgments={treatment.key_judgments}
        />
      )}

      <DisclaimerStrip />

      {treatment.citations && treatment.citations.length > 0 && (
        <CitationsCard citations={treatment.citations} />
      )}

      {treatment.related_topics && treatment.related_topics.length > 0 && (
        <RelatedTopicsRow topics={treatment.related_topics} />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Applicable Standard card
// ---------------------------------------------------------------------------

interface ApplicableStandardCardProps {
  standards: QuickTreatmentResponse["applicable_standards"]
  alsoRelevant?: QuickTreatmentResponse["also_relevant_standards"]
  whyApplies: string
  complexity: QuickTreatmentResponse["complexity"]
  keyReferences?: Citation[]
}

function ApplicableStandardCard({
  standards,
  alsoRelevant,
  whyApplies,
  complexity,
  keyReferences,
}: ApplicableStandardCardProps) {
  const primary = standards[0]
  const additionalPrimary = standards.slice(1)

  // First 3 citations rendered as a compact "Key references" inline pill row.
  // Full citations still appear in the Sources card lower down.
  const inlineRefs = (keyReferences ?? []).slice(0, 3)

  return (
    <Card>
      <CardHeader icon="📌" title="Applicable Standard" />

      {primary && (
        <div className="mt-2">
          <span className="inline-block rounded bg-ppf-navy px-3 py-1 text-sm font-semibold text-white">
            {primary.standard_id} — {primary.title}
          </span>
        </div>
      )}

      {additionalPrimary.length > 0 && (
        <p className="mt-2 text-sm text-gray-700">
          <span className="font-semibold">Also primary: </span>
          {additionalPrimary.map((s) => `${s.standard_id} — ${s.title}`).join("; ")}
        </p>
      )}

      {alsoRelevant && alsoRelevant.length > 0 && (
        <p className="mt-2 text-sm text-gray-700">
          <span className="font-semibold">Also relevant: </span>
          {alsoRelevant.map((s) => `${s.standard_id} — ${s.title}`).join("; ")}
        </p>
      )}

      <p className="mt-3 text-sm text-gray-800">
        <span className="font-semibold">Why: </span>
        {whyApplies}
      </p>

      {inlineRefs.length > 0 && (
        <div className="mt-3 rounded bg-purple-50 px-3 py-2 text-xs text-purple-900">
          <span className="font-semibold">🔑 Key references: </span>
          {inlineRefs
            .map((c) => `${c.standard} ${c.paragraph}`.trim())
            .join(" · ")}
        </div>
      )}

      <p className="mt-3 text-sm">
        <span className="font-semibold">Complexity: </span>
        <ComplexityPill level={complexity} />
      </p>
    </Card>
  )
}

function ComplexityPill({ level }: { level: QuickTreatmentResponse["complexity"] }) {
  const color =
    level === "Straightforward"
      ? "text-green-700"
      : level === "Moderate"
        ? "text-yellow-700"
        : "text-red-700"
  return <span className={`font-semibold ${color}`}>{level}</span>
}

// ---------------------------------------------------------------------------
// Recognition / Measurement two-column card
// ---------------------------------------------------------------------------

interface RecognitionMeasurementCardProps {
  recognition: string
  measurement: string
  disclosure: string
}

function RecognitionMeasurementCard({
  recognition,
  measurement,
  disclosure,
}: RecognitionMeasurementCardProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader icon="✅" title="Recognition" />
        <RichText text={recognition} />
      </Card>

      <Card>
        <CardHeader icon="📏" title="Measurement" />
        <RichText text={measurement} />
      </Card>

      {disclosure && (
        <div className="md:col-span-2">
          <Card>
            <CardHeader icon="📋" title="Disclosure" />
            <RichText text={disclosure} />
          </Card>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Journal Entries (structured table)
// ---------------------------------------------------------------------------

function JournalEntriesCard({ entries }: { entries: JournalEntryBlock[] }) {
  return (
    <Card>
      <CardHeader icon="📒" title="Journal Entries" />
      <div className="mt-3 space-y-5">
        {entries.map((block, i) => (
          <div key={i}>
            <p className="mb-2 text-sm font-semibold text-gray-800">
              {block.heading}
            </p>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-ppf-navy text-white">
                  <th className="px-3 py-2 text-left font-semibold">Account</th>
                  <th className="px-3 py-2 text-right font-semibold">Debit</th>
                  <th className="px-3 py-2 text-right font-semibold">Credit</th>
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, j) => (
                  <tr key={j} className="border-b border-gray-200">
                    <td className="px-3 py-2 text-gray-800">{row.account}</td>
                    <td className="px-3 py-2 text-right text-gray-800">
                      {row.debit ?? ""}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-800">
                      {row.credit ?? ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </Card>
  )
}

function LegacyJournalEntryCard({ text }: { text: string }) {
  return (
    <Card>
      <CardHeader icon="📒" title="Journal Entry" />
      <pre className="mt-3 whitespace-pre-wrap rounded bg-gray-50 p-3 text-sm text-gray-800">
        {text}
      </pre>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Notes / Errors / Judgments grid
// ---------------------------------------------------------------------------

interface NotesGridProps {
  practicalNotes?: string[]
  commonErrors?: string[]
  keyJudgments?: string[]
}

function NotesGrid({ practicalNotes, commonErrors, keyJudgments }: NotesGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {practicalNotes && practicalNotes.length > 0 && (
        <Card>
          <CardHeader icon="⚠️" title="Practical Notes" />
          <ul className="mt-2 space-y-1 text-sm text-gray-800">
            {practicalNotes.map((n, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-gray-400">•</span>
                <span>{n}</span>
              </li>
            ))}
          </ul>
          {commonErrors && commonErrors.length > 0 && (
            <>
              <p className="mt-4 mb-2 text-sm font-semibold text-gray-800">
                Common errors
              </p>
              <ul className="space-y-1 text-sm text-gray-800">
                {commonErrors.map((e, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-red-600">●</span>
                    <span>{e}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
      )}

      {keyJudgments && keyJudgments.length > 0 && (
        <Card>
          <CardHeader icon="🔍" title="Key Judgments" />
          <ul className="mt-2 space-y-1 text-sm text-gray-800">
            {keyJudgments.map((j, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-gray-400">•</span>
                <span>{j}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Disclaimer strip — legal cover for AI-generated accounting guidance
// ---------------------------------------------------------------------------

function DisclaimerStrip() {
  return (
    <div className="rounded border-l-4 border-yellow-500 bg-yellow-50 px-4 py-3 text-xs text-yellow-900">
      <span className="font-semibold">⚠ Important Disclaimer: </span>
      This is AI-generated indicative guidance based on IPSAS standards as
      issued by the IPSASB. It is not a substitute for professional accounting
      advice. Actual treatment may vary based on specific facts, circumstances,
      and jurisdictional requirements. Always consult your auditor or technical
      accounting team before finalising treatment. Verify all IPSAS paragraph
      references against the current standards on the IPSASB website.
    </div>
  )
}

// ---------------------------------------------------------------------------
// Full Citations card (Sources)
// ---------------------------------------------------------------------------

function CitationsCard({ citations }: { citations: Citation[] }) {
  return (
    <Card>
      <CardHeader icon="📚" title="Sources" />
      <ul className="mt-2 space-y-2 text-sm text-gray-700">
        {citations.map((c, i) => (
          <li key={i}>
            <span className="font-semibold">
              {c.standard} {c.paragraph}
            </span>
            {c.text ? (
              <>
                : <span className="italic">{truncate(c.text, 160)}</span>
              </>
            ) : null}
          </li>
        ))}
      </ul>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Related Topics row
// ---------------------------------------------------------------------------

function RelatedTopicsRow({ topics }: { topics: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      <span className="text-xs font-semibold text-gray-600">Related:</span>
      {topics.map((t, i) => (
        <span
          key={i}
          className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700"
        >
          {t}
        </span>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      {children}
    </div>
  )
}

function CardHeader({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-base">{icon}</span>
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
    </div>
  )
}

// Renders text with **bold** segments and \n line breaks. Avoids pulling in a
// markdown library for what is mostly plain text from the LLM.
//
// Consecutive `- ` lines are grouped into a single <ul> so the markup is
// valid HTML and screen readers announce the items as a list.
function RichText({ text }: { text: string }) {
  // Walk lines and emit a flat array of nodes: <p> for prose, <ul> for any
  // run of one-or-more bullet lines.
  const nodes: React.ReactNode[] = []
  let bulletBuffer: string[] = []

  const flushBullets = () => {
    if (bulletBuffer.length === 0) return
    const items = bulletBuffer
    nodes.push(
      <ul key={`ul-${nodes.length}`} className="ml-4 list-disc space-y-1">
        {items.map((b, j) => (
          <li key={j}>{renderBold(b)}</li>
        ))}
      </ul>
    )
    bulletBuffer = []
  }

  text.split("\n").forEach((line, i) => {
    const trimmed = line.trim()
    if (!trimmed) {
      flushBullets()
      return
    }
    if (trimmed.startsWith("- ")) {
      bulletBuffer.push(trimmed.slice(2))
      return
    }
    flushBullets()
    nodes.push(<p key={`p-${i}`}>{renderBold(line)}</p>)
  })
  flushBullets()

  return <div className="mt-2 space-y-2 text-sm text-gray-800">{nodes}</div>
}

function renderBold(line: string): React.ReactNode {
  const parts = line.split("**")
  return parts.map((part, j) =>
    j % 2 === 0 ? part : <strong key={j}>{part}</strong>
  )
}

function truncate(s: string, n: number): string {
  return s.length <= n ? s : `${s.slice(0, n)}…`
}
