import type { SentenceData } from "@/lib/types"

/**
 * 学習用に例文を1つ選ぶ。
 * 1. preferredSentenceId があればそれを優先（弱点復習）
 * 2. clearedSentenceIds があれば未クリア例文を優先
 * 3. なければランダム
 */
export function pickStudySentence(
  candidates: SentenceData[],
  preferredSentenceId?: string | null,
  clearedSentenceIds?: string[] | null
): SentenceData | null {
  if (!candidates.length) return null

  if (preferredSentenceId) {
    const preferred = candidates.find((s) => s.id === preferredSentenceId)
    if (preferred) return preferred
  }

  const cleared = new Set(clearedSentenceIds ?? [])
  const uncleared = candidates.filter((s) => !cleared.has(s.id))
  const pool = uncleared.length > 0 ? uncleared : candidates

  return pool[Math.floor(Math.random() * pool.length)] ?? null
}
