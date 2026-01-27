// lib/daily-writing.ts
import type { WordData } from "@/lib/types"

// ===== Keys =====
const STATE_KEY = "wordloom.dailyWriting.v1"
const DRAFT_KEY_PREFIX = "wordloom.dailyWriting.draft."
const AI_DONE_KEY_PREFIX = "wordloom.aiWriting.done."

// ===== Types =====
type DailyWritingState = {
  version: 1
  dateKey: string // YYYY-MM-DD (local)
  targetId: string | null
  excludeWeakness: boolean
  updatedAt: number
}

export type EnsureTodayWritingOptions = {
  excludeWeakness?: boolean
}

export type EnsureTodayWritingResult = {
  dateKey: string
  targetId: string | null
}

// ===== Utils =====
function getLocalDateKey(): string {
  // "sv-SE" は YYYY-MM-DD 形式で返る（端末ローカル時間）
  return new Date().toLocaleDateString("sv-SE")
}

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function pickRandomId(words: WordData[], excludeWeakness: boolean): string | null {
  let pool = words
  if (excludeWeakness) {
    pool = pool.filter((w) => !w.weakness)
  }
  if (pool.length === 0) return null
  const idx = Math.floor(Math.random() * pool.length)
  return pool[idx]?.id ?? null
}

function loadState(): DailyWritingState | null {
  return safeParse<DailyWritingState>(localStorage.getItem(STATE_KEY))
}

function saveState(state: DailyWritingState) {
  localStorage.setItem(STATE_KEY, JSON.stringify(state))
}

// ===== Public API =====

/**
 * 今日のAI添削ターゲットを確定する（なければ抽選して保存）
 * - words が0件なら targetId=null
 * - 既存stateが「今日」で、かつ targetId が現存していれば維持
 * - それ以外は再抽選
 */
export function ensureTodayWriting(
  words: WordData[],
  options: EnsureTodayWritingOptions = {}
): EnsureTodayWritingResult {
  const dateKey = getLocalDateKey()
  const excludeWeakness = options.excludeWeakness ?? false

  // 単語がない
  if (!Array.isArray(words) || words.length === 0) {
    const next: DailyWritingState = {
      version: 1,
      dateKey,
      targetId: null,
      excludeWeakness,
      updatedAt: Date.now(),
    }
    saveState(next)
    return { dateKey, targetId: null }
  }

  const existing = loadState()

  // 今日のstateがあり、targetIdがまだ存在しているなら維持
  if (existing?.version === 1 && existing.dateKey === dateKey) {
    const stillExists =
      existing.targetId && words.some((w) => w.id === existing.targetId)

    // excludeWeakness 条件が変わっていない＆存在しているならそのまま
    if (stillExists && existing.excludeWeakness === excludeWeakness) {
      return { dateKey, targetId: existing.targetId }
    }

    // 条件が変わった場合：weakness除外のときに weakness を引いていたら引き直す
    if (stillExists && excludeWeakness) {
      const t = words.find((w) => w.id === existing.targetId)
      if (t && !t.weakness) {
        // ちゃんと除外条件を満たしているなら維持
        const next: DailyWritingState = {
          ...existing,
          excludeWeakness,
          updatedAt: Date.now(),
        }
        saveState(next)
        return { dateKey, targetId: existing.targetId }
      }
    }
  }

  // 新規/引き直し
  const targetId = pickRandomId(words, excludeWeakness)
  const next: DailyWritingState = {
    version: 1,
    dateKey,
    targetId,
    excludeWeakness,
    updatedAt: Date.now(),
  }
  saveState(next)
  return { dateKey, targetId }
}

/** 今日の下書き（ローカル保存） */
export function getTodayDraft(): string {
  const key = `${DRAFT_KEY_PREFIX}${getLocalDateKey()}`
  return localStorage.getItem(key) ?? ""
}

/** 今日の下書きを保存 */
export function setTodayDraft(draft: string) {
  const key = `${DRAFT_KEY_PREFIX}${getLocalDateKey()}`
  localStorage.setItem(key, draft ?? "")
}

/** （②）AI添削を「今日やった」ことを記録（Open GPT 押下などで呼ぶ） */
export function markTodayAiWritingDone() {
  const key = `${AI_DONE_KEY_PREFIX}${getLocalDateKey()}`
  localStorage.setItem(key, "1")
}

/** （②）今日すでにAI添削をやったか */
export function isTodayAiWritingDone(): boolean {
  const key = `${AI_DONE_KEY_PREFIX}${getLocalDateKey()}`
  return localStorage.getItem(key) === "1"
}

// 今日の AI 添削ターゲットを強制的に引き直す
export function reshuffleTodayWriting(words: { id: string }[]) {
  if (words.length === 0) return null

  const today = new Date().toISOString().slice(0, 10)
  const key = `wordloom.aiWriting.${today}`

  const picked = words[Math.floor(Math.random() * words.length)]
  const state = { date: today, targetId: picked.id }

  localStorage.setItem(key, JSON.stringify(state))
  return state
}
