// DrillTopicCard — a single tile in the 15-topic browse grid.
// No pathway filtering — drill topics are cross-pathway.

import Link from "next/link"

interface DrillTopicCardProps {
  code: string
  name: string
  standards: string[] | null
  questionCount: number
  href: string
}

export default function DrillTopicCard({
  code,
  name,
  standards,
  questionCount,
  href,
}: DrillTopicCardProps) {
  const hasQuestions = questionCount > 0

  const cardContent = (
    <div
      className={`group flex h-full flex-col rounded-lg border p-4 transition-shadow ${
        hasQuestions
          ? "border-ppf-sky/20 bg-white hover:shadow-md hover:border-ppf-sky/40 cursor-pointer"
          : "border-slate-100 bg-slate-50 opacity-60"
      }`}
    >
      {/* Code badge + count */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="rounded-full bg-ppf-pale px-2.5 py-0.5 text-xs font-bold text-ppf-sky">
          {code}
        </span>
        {hasQuestions ? (
          <span className="text-xs text-slate-400">
            {questionCount} {questionCount === 1 ? "question" : "questions"}
          </span>
        ) : (
          <span className="text-xs text-slate-300">No questions</span>
        )}
      </div>

      {/* Topic name */}
      <p className={`flex-1 text-sm font-semibold leading-snug ${
        hasQuestions
          ? "text-ppf-navy group-hover:text-ppf-sky transition-colors"
          : "text-slate-400"
      }`}>
        {name}
      </p>

      {/* Standards pills */}
      {standards && standards.length > 0 && hasQuestions && (
        <div className="mt-3 flex flex-wrap gap-1">
          {standards.slice(0, 3).map((s) => (
            <span
              key={s}
              className="rounded bg-ppf-pale/60 px-1.5 py-0.5 text-xs text-ppf-sky/70"
            >
              {s.replace("IPSAS-", "IPSAS ")}
            </span>
          ))}
          {standards.length > 3 && (
            <span className="rounded bg-ppf-pale/60 px-1.5 py-0.5 text-xs text-slate-400">
              +{standards.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  )

  if (!hasQuestions) return <div>{cardContent}</div>
  return <Link href={href}>{cardContent}</Link>
}
