"use client"
// FlashcardDeck — browse and print flashcards for a module.
//
// Screen view: one card at a time with reveal toggle and prev/next navigation.
// Print view: all cards as cut-out index cards (Q top half / A bottom half,
//             fold along centre line so Q faces front and A faces back).

import { useState } from "react"

interface Flashcard {
  id: string
  question_text: string
  correct_answer: string
  explanation: string | null
  sequence_number: number
}

interface Props {
  flashcards: Flashcard[]
}

export default function FlashcardDeck({ flashcards }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)

  if (flashcards.length === 0) {
    return (
      <div className="rounded-lg border border-ppf-sky/20 bg-white p-10 text-center text-slate-400">
        No flashcards found for this module.
      </div>
    )
  }

  const card = flashcards[currentIndex]
  const total = flashcards.length

  function goNext() {
    setCurrentIndex(i => i + 1)
    setRevealed(false)
  }

  function goPrev() {
    setCurrentIndex(i => i - 1)
    setRevealed(false)
  }

  return (
    <>
      {/* ------------------------------------------------------------------ */}
      {/* Print styles — injected as a <style> tag so they stay co-located  */}
      {/* ------------------------------------------------------------------ */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          /* Hide everything on the page except our print container */
          body * { visibility: hidden !important; }
          #flashcard-print-container,
          #flashcard-print-container * { visibility: visible !important; }

          #flashcard-print-container {
            display: block !important;
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
          }

          @page {
            size: 8.5in 11in portrait;
            margin: 0.5in;
          }

          .print-card {
            width: 4in;
            height: 6in;
            border: 2px dashed #94a3b8;
            margin: 0 auto 0.5in;
            display: flex;
            flex-direction: column;
            font-family: Georgia, serif;
            page-break-after: always;
            break-after: page;
          }

          .print-card:last-child {
            page-break-after: avoid;
            break-after: avoid;
          }

          .print-card-q {
            flex: 1;
            padding: 0.4in 0.4in 0.2in;
            display: flex;
            flex-direction: column;
            justify-content: center;
            border-bottom: 2px dashed #94a3b8;
          }

          .print-card-a {
            flex: 1;
            padding: 0.2in 0.4in 0.4in;
            display: flex;
            flex-direction: column;
            justify-content: center;
            background: #f8fafc;
          }

          .print-card-label {
            font-size: 9pt;
            font-weight: bold;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            color: #64748b;
            margin-bottom: 8pt;
          }

          .print-card-text {
            font-size: 12pt;
            line-height: 1.5;
            color: #1e293b;
          }

          .print-card-explanation {
            font-size: 9pt;
            color: #64748b;
            margin-top: 6pt;
            line-height: 1.4;
          }

          .print-instructions {
            font-size: 7pt;
            color: #94a3b8;
            text-align: center;
            padding: 4pt 0;
            letter-spacing: 0.05em;
          }
        }
      `}} />

      {/* ------------------------------------------------------------------ */}
      {/* Screen view                                                          */}
      {/* ------------------------------------------------------------------ */}
      <div className="print:hidden">
        {/* Counter + print button */}
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm text-slate-400">
            Card {currentIndex + 1} of {total}
          </span>
          <button
            onClick={() => window.print()}
            className="rounded-md border border-ppf-sky px-4 py-1.5 text-sm font-medium text-ppf-sky transition-colors hover:bg-ppf-pale"
          >
            Print all cards
          </button>
        </div>

        {/* Progress bar */}
        <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-ppf-sky transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / total) * 100}%` }}
          />
        </div>

        {/* Card */}
        <div className="rounded-lg border border-ppf-sky/20 bg-white p-6 shadow-sm">
          <span className="mb-4 inline-block rounded-full bg-ppf-pale px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-ppf-sky">
            Flash card
          </span>

          {/* Question */}
          <p className="mb-6 text-base font-medium text-ppf-navy leading-relaxed whitespace-pre-wrap">
            {card.question_text}
          </p>

          {/* Reveal toggle */}
          {!revealed ? (
            <button
              onClick={() => setRevealed(true)}
              className="w-full rounded-md border-2 border-dashed border-ppf-sky/40 py-8 text-sm font-medium text-ppf-sky transition-colors hover:border-ppf-sky hover:bg-ppf-pale"
            >
              Click to reveal answer
            </button>
          ) : (
            <div>
              <div className="rounded-md border border-ppf-sky/20 bg-ppf-pale px-5 py-4 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {card.correct_answer}
              </div>
              {card.explanation && (
                <p className="mt-3 text-xs text-slate-500 leading-relaxed whitespace-pre-wrap">
                  {card.explanation}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="mt-5 flex gap-3">
          <button
            onClick={goPrev}
            disabled={currentIndex === 0}
            className="flex-1 rounded-md border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:border-ppf-sky hover:text-ppf-sky disabled:cursor-not-allowed disabled:opacity-40"
          >
            ← Previous
          </button>
          <button
            onClick={goNext}
            disabled={currentIndex === total - 1}
            className="flex-1 rounded-md bg-ppf-sky py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ppf-blue disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Print view — hidden on screen, visible only when printing           */}
      {/* ------------------------------------------------------------------ */}
      <div id="flashcard-print-container" style={{ display: "none" }}>
        {flashcards.map((fc) => (
          <div key={fc.id} className="print-card">
            <div className="print-instructions">
              Cut along outer border · Fold along centre line · Q faces front, A faces back
            </div>
            <div className="print-card-q">
              <div className="print-card-label">Q</div>
              <div className="print-card-text">{fc.question_text}</div>
            </div>
            <div className="print-card-a">
              <div className="print-card-label">A</div>
              <div className="print-card-text">{fc.correct_answer}</div>
              {fc.explanation && (
                <div className="print-card-explanation">{fc.explanation}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
