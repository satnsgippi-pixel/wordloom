import type { SentenceData } from "@/lib/types"

/**
 * 学習用に例文を1つ選ぶ。
 * preferredSentenceId があれば候補内でそれを優先し、なければランダム。
 */
export function pickStudySentence(
  candidates: SentenceData[],
  preferredSentenceId?: string | null
): SentenceData | null {
  if (!candidates.length) return null

  if (preferredSentenceId) {
    const preferred = candidates.find((s) => s.id === preferredSentenceId)
    if (preferred) return preferred
  }

  return candidates[Math.floor(Math.random() * candidates.length)] ?? null
}
