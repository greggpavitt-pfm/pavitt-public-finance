// SuperMemo 2 (SM-2) spaced repetition scheduler.
//
// User grades a flashcard 0-5:
//   0-2 = "did not know it" — restart
//   3-5 = "knew it" — extend interval
//
// Reference: https://www.supermemo.com/en/blog/application-of-a-computer-to-improve-the-results-obtained-in-working-with-the-supermemo-method
//
// We deviate from textbook SM-2 in only one way: ease_factor floor of 1.30
// (matches Anki's tweak — prevents leeches from compounding into permanent failure).

export interface ReviewState {
  ease_factor: number   // typical range 1.30 - 2.50+
  interval_days: number // days until next review
  repetitions: number   // consecutive successful reviews
}

const MIN_EASE = 1.30
const INITIAL_EASE = 2.50

export function gradeReview(state: ReviewState, grade: number): ReviewState {
  if (grade < 0 || grade > 5) throw new Error("grade must be 0-5")

  // Failure (0-2): reset repetitions, short interval, lower ease
  if (grade < 3) {
    return {
      ease_factor: Math.max(MIN_EASE, state.ease_factor - 0.20),
      interval_days: 1,
      repetitions: 0,
    }
  }

  // Success (3-5): extend interval based on repetitions
  const newReps = state.repetitions + 1
  let newInterval: number
  if (newReps === 1) {
    newInterval = 1
  } else if (newReps === 2) {
    newInterval = 6
  } else {
    newInterval = Math.round(state.interval_days * state.ease_factor)
  }

  // Adjust ease: SM-2 standard formula
  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  const q = grade
  const newEase = Math.max(
    MIN_EASE,
    state.ease_factor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  )

  return {
    ease_factor: Number(newEase.toFixed(2)),
    interval_days: newInterval,
    repetitions: newReps,
  }
}

export function initialState(): ReviewState {
  return {
    ease_factor: INITIAL_EASE,
    interval_days: 1,
    repetitions: 0,
  }
}
