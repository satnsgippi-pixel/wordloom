// lib/words-store.ts
import type { WordData } from "@/lib/types";
import { getWordById, getAllWords, upsertWord } from "@/lib/storage";

/**
 * 旧 Study UI 互換レイヤー（暫定）
 * - 実データは storage.ts を使用
 */

const WEAKNESS_CLEAR_STREAK = 2;

/** 腕試しモード出題条件: stability がこの値以上なら「十分習得済み」とみなす（1〜20の範囲、SRS_TABLE最大11の先） */
export const CHALLENGE_MIN_STABILITY = 12;

// ===== Normal Study: stage進行ルール =====
function requiredStreak(stage: number) {
  // Stage0〜3: 2連続正解。Stage4〜7は例文クリア方式のため未使用。
  // Stage8+: 旧仕様に合わせ 5 連続。
  return stage >= 8 ? 5 : 2
}

function usesSentenceClearProgress(stage: number) {
  return stage >= 4 && stage <= 7
}

/**
 * Stage4〜7 で「出題可能な候補例文」の ID 一覧（各 Stage のフィルタと揃える）
 */
function getStageCandidateSentenceIds(word: WordData, stage: number): string[] {
  const sentences = word.sentences ?? []

  if (stage === 4) {
    const minCount = word.entryType === "phrase" ? 2 : 1
    return sentences
      .filter((s) => {
        const idxs = s?.s5?.targetTokenIndexes ?? []
        return (s?.tokens?.length ?? 0) > 0 && idxs.length >= minCount
      })
      .map((s) => s.id)
  }

  if (stage === 5) {
    return sentences
      .filter((s) => {
        const len = s?.s5?.targetTokenIndexes?.length ?? 0
        if (word.entryType === "word") return len === 1
        if (word.entryType === "phrase") return len >= 2
        return false
      })
      .map((s) => s.id)
  }

  if (stage === 6) {
    return sentences
      .filter((s) => {
        const idxs = s?.s6?.blankTokenIndexes ?? []
        return (
          Array.isArray(idxs) &&
          idxs.length >= 2 &&
          (s.tokens?.length ?? 0) > 0
        )
      })
      .map((s) => s.id)
  }

  if (stage === 7) {
    return sentences
      .filter(
        (s) =>
          (s?.ja ?? "").trim().length > 0 && (s?.en ?? "").trim().length > 0
      )
      .map((s) => s.id)
  }

  return []
}

// ===== SRS utilities =====

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

// stability → 間隔（日）テーブル（復習負荷軽減のため全体を約2倍に拡張）
const SRS_TABLE: { min: number; days: number }[] = [
  { min: 1,  days: 1 },     // 0.5→1日
  { min: 2,  days: 2 },     // 1→2日
  { min: 3,  days: 4 },     // 2→4日
  { min: 4,  days: 8 },     // 4→8日
  { min: 5,  days: 14 },    // 7→14日
  { min: 6,  days: 28 },    // 14→28日
  { min: 7,  days: 56 },    // 28→56日
  { min: 8,  days: 90 },    // 60→90日
  { min: 9,  days: 150 },   // 120→150日
  { min: 10, days: 270 },   // 240→270日
  { min: 11, days: 360 },   // 360→360日（最大は据え置き）
]

const STABILITY_MIN = 1
const STABILITY_MAX = 11

function intervalDaysFromStability(stability: number) {
  const s = clamp(Math.round(stability), STABILITY_MIN, STABILITY_MAX)

  let days = 1
  for (const row of SRS_TABLE) {
    if (s >= row.min) {
      days = row.days
    } else {
      break
    }
  }
  return days
}

function computeNextDueAt(
  now: number,
  stability: number,
  correct: boolean
) {
  if (!correct) {
    // ❌不正解：最短10分
    return now + 10 * 60 * 1000
  }

  // ✅正解：stability に応じた間隔
  const days = intervalDaysFromStability(stability)
  return now + days * 24 * 60 * 60 * 1000
}

/**
 * Normal Study: 正解を記録
 * - Stage0〜3: stageStreak++、規定回数で currentStage++
 * - Stage4〜7: 候補例文を全て正解して初めて currentStage++
 * - stageは下げない
 */
export async function markNormalCorrect(
  wordId: string,
  sentenceId?: string
) {
  const target = await getWordById(wordId);
  if (!target) return

  const now = Date.now()

  const prevStability =
    typeof target.stability === "number" && Number.isFinite(target.stability)
      ? target.stability
      : 1

  // 正解で微増
  const nextStability = clamp(prevStability + 1, STABILITY_MIN, STABILITY_MAX)

  const currentStage = target.currentStage ?? 0
  let nextStage = currentStage
  let finalStreak = target.stageStreak ?? 0
  let nextCleared = [...(target.stageClearedSentenceIds ?? [])]

  if (usesSentenceClearProgress(currentStage)) {
    // Stage4〜7: 例文クリア方式
    if (sentenceId) {
      if (!nextCleared.includes(sentenceId)) {
        nextCleared.push(sentenceId)
      }
    }

    const candidates = getStageCandidateSentenceIds(target, currentStage)
    // 候補に無い ID は無視（編集で消えた例文など）
    nextCleared = nextCleared.filter((id) => candidates.includes(id))

    const allCleared =
      candidates.length > 0 &&
      candidates.every((id) => nextCleared.includes(id))

    if (allCleared) {
      nextStage = currentStage + 1
      finalStreak = 0
      nextCleared = []
    }
  } else {
    // Stage0〜3（および 8+）: 連続正解ストリーク
    const nextStreak = finalStreak + 1
    const need = requiredStreak(currentStage)
    finalStreak = nextStreak

    if (nextStreak >= need) {
      nextStage = currentStage + 1
      finalStreak = 0
      nextCleared = [] // ステージ変更時にリセット
    }
  }

  const updated: WordData = {
    ...target,
    currentStage: nextStage,
    stageStreak: finalStreak,
    stageClearedSentenceIds: nextCleared,
    stability: nextStability,
    dueAt: computeNextDueAt(now, nextStability, true),
    updatedAt: now,
    lastReviewedAt: now,
  }

  await upsertWord(updated)
  notifyWordsChanged()
}

/**
 * Normal Study: 不正解を記録
 * - stageStreak = 0
 * - weakness を付与（既存仕様に寄せる）
 * - stageは下げない
 * - sentenceId があれば弱点復習用に保存し、Stage4〜7では cleared から除外
 */
export async function markNormalWrong(
  wordId: string,
  stage: number,
  sentenceId?: string
) {
  const target = await getWordById(wordId);
  if (!target) return

  const now = Date.now()

  const prevStability =
    typeof target.stability === "number" && Number.isFinite(target.stability)
      ? target.stability
      : 1

  // 不正解で減（最低1）
  const nextStability = clamp(prevStability - 0.25, STABILITY_MIN, STABILITY_MAX)

  const resolvedSentenceId =
    sentenceId ?? target.weakness?.sentenceId

  let nextCleared = [...(target.stageClearedSentenceIds ?? [])]
  if (usesSentenceClearProgress(stage) && sentenceId) {
    nextCleared = nextCleared.filter((id) => id !== sentenceId)
  }

  const updated: WordData = {
    ...target,
    stageStreak: 0,
    stageClearedSentenceIds: nextCleared,
    stability: nextStability,
    dueAt: computeNextDueAt(now, nextStability, false),
    weakness: {
      stage,
      streak: 0,
      updatedAt: now,
      ...(resolvedSentenceId ? { sentenceId: resolvedSentenceId } : {}),
    },
    updatedAt: now,
    lastReviewedAt: now,
  }

  await upsertWord(updated)
  notifyWordsChanged()
}

// StudyScreen が要求する：単語一覧を取得
export async function getWords(): Promise<WordData[]> {
  return await getAllWords();
}

/**
 * Weakness: 不正解を記録（wordloom仕様）
 * - stage / stability / dueAt は変更しない
 * - weakness は { stage, streak, updatedAt, sentenceId? } を維持
 */
export async function markWeaknessWrong(
  wordId: string,
  stage: number,
  sentenceId?: string
) {
  const target = await getWordById(wordId);
  if (!target) return;

  const now = Date.now();
  const resolvedSentenceId =
    sentenceId ?? target.weakness?.sentenceId

  const updated: WordData = {
    ...target,
    weakness: {
      stage,
      streak: 0,
      updatedAt: now,
      ...(resolvedSentenceId ? { sentenceId: resolvedSentenceId } : {}),
    },
    updatedAt: now,
    lastReviewedAt: now,
  };

  await upsertWord(updated);
  notifyWordsChanged();
}

/**
 * Weakness: 正解を記録
 * - streak++ し、2連続で weakness を解除
 * - stage / stability / dueAt は変更しない
 */
export async function markWeaknessCorrect(wordId: string) {
  const target = await getWordById(wordId);
  if (!target) return;

  const current = target.weakness;
  if (!current) return; // weakness対象でなければ何もしない

  const now = Date.now();

  const nextStreak = (current.streak ?? 0) + 1;
  const shouldClear = nextStreak >= WEAKNESS_CLEAR_STREAK;

  const updated: WordData = {
    ...target,
    weakness: shouldClear
      ? undefined
      : {
          ...current,
          streak: nextStreak,
          updatedAt: now,
        },
    updatedAt: now,
    lastReviewedAt: now,
  };

  await upsertWord(updated);
  notifyWordsChanged();
}

/**
 * Normal Study / 共通: 間違いを記録（互換）
 * 旧コードが wordText を渡してくる前提のため残す。
 *
 * ✅ 推奨: 今後は markNormalWrong(wordId, stage) / markWeaknessWrong(wordId, stage) を呼ぶ
 */
export async function markWrong(wordText: string, stage: number) {
  const words = await getAllWords();
  const target = words.find((w) => w.word === wordText);
  if (!target) return;

  // 旧挙動は「弱点復習用の間違い記録」だったので weakness に寄せる
  await markWeaknessWrong(target.id, stage);
}

/**
 * Stage0 用：4択の選択肢を作る
 */
export function getChallengeChoicePool(words: WordData[]): WordData[] {
  return words;
}

/**
 * 旧関数（後方互換のため残す）
 * @deprecated generateMeaningChoices を使用してください
 */
export function generateChallengeChoices(word: WordData, pool: WordData[]) {
  return generateMeaningChoices(word, pool);
}

/**
 * meaning（日本語訳）の4択を生成
 * Stage0（EN→JA）で使用
 */
export function generateMeaningChoices(word: WordData, pool: WordData[]) {
  const correct = { label: word.meaning, isCorrect: true };

  const wrongs = pool
    .filter((w) => w.id !== word.id) // ✅ idで除外（同表記対策）
    .slice(0, 3)
    .map((w) => ({ label: w.meaning, isCorrect: false }));

  return shuffle([correct, ...wrongs]);
}

/**
 * word（英単語/フレーズ）の4択を生成
 * Stage1（JA→EN）で使用
 */
export function generateWordChoices(word: WordData, pool: WordData[]) {
  const correct = { label: word.word, isCorrect: true };

  const wrongs = pool
    .filter((w) => w.id !== word.id) // ✅ idで除外（同表記対策）
    .slice(0, 3)
    .map((w) => ({ label: w.word, isCorrect: false }));

  return shuffle([correct, ...wrongs]);
}

// util
function shuffle<T>(array: T[]): T[] {
  return [...array].sort(() => Math.random() - 0.5);
}

// ===== Dashboard support =====

export function getTotalWordsCount(words: WordData[]): number {
  return words.length;
}

export function getWeakWordsCount(words: WordData[]): number {
  return words.filter((w) => !!w.weakness).length;
}

const WORDS_CHANGED_EVENT = "wordloom:words-changed";

// ===== Challenge support =====
export function getChallengeReadyCount(words: WordData[], minStability: number = CHALLENGE_MIN_STABILITY): number {
  return words.filter((w) => (w.stability ?? 0) >= minStability && !w.weakness).length
}

export function subscribeWords(onChange: () => void) {
  if (typeof window === "undefined") return () => {};

  const onCustom = () => onChange();
  const onStorage = (_e: StorageEvent) => {
    // key を絞りたいなら次の行を有効化：
    // if (_e.key !== "wordloom.words.v1") return
    onChange();
  };

  window.addEventListener(WORDS_CHANGED_EVENT, onCustom);
  window.addEventListener("storage", onStorage);

  return () => {
    window.removeEventListener(WORDS_CHANGED_EVENT, onCustom);
    window.removeEventListener("storage", onStorage);
  };
}

export function resetWordsStorage() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem("wordloom.words.v1");
  notifyWordsChanged();
}
// ===== Dashboard (real stats) =====

const DAY_MS = 24 * 60 * 60 * 1000

function getDueAtSafe(w: any): number {
  const v = w?.dueAt
  if (typeof v === "number" && Number.isFinite(v)) return v
  return 0
}

/**
 * dueNow / overdue の定義
 * - dueNow: dueAt <= now かつ、過去24h以内（= 今日ぶんの遅れ）
 * - overdue: dueAt < now - 24h（= 期限超過が長い）
 *
 * ※あとで定義変更したくなったらここだけ触ればOK
 */
export function getDueNowCount(words: WordData[], now = Date.now()): number {
  return words.filter((w) => {
    const dueAt = getDueAtSafe(w)
    return dueAt <= now && dueAt >= now - DAY_MS
  }).length
}

export function getOverdueCount(words: WordData[], now = Date.now()): number {
  return words.filter((w) => getDueAtSafe(w) < now - DAY_MS).length
}

export function getNextNDaysCount(words: WordData[], days: number, now = Date.now()): number {
  const upper = now + days * DAY_MS
  return words.filter((w) => {
    const dueAt = getDueAtSafe(w)
    return dueAt > now && dueAt <= upper
  }).length
}

/**
 * learnedL6Plus の定義
 * - currentStage >= 6 を「だいぶ固い」とみなす（L6+）
 */
export function getLearnedL6PlusCount(words: WordData[]): number {
  return words.filter((w) => (w.currentStage ?? 0) >= 6).length
}

export function getInProgressCount(words: WordData[]): number {
  const total = getTotalWordsCount(words)
  const learned = getLearnedL6PlusCount(words)
  return Math.max(0, total - learned)
}

export async function setQaMemo(wordId: string, qaMemo: string) {
  const target = await getWordById(wordId);
  if (!target) return;

  const updated: WordData = {
    ...target,
    qaMemo,
    updatedAt: Date.now(),
  }

  await upsertWord(updated)

  // Dashboard等に反映させる（既にあるならそれを使う）
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("wordloom:words-changed"))
  }
}

// どこからでも通知したいとき用（任意）
export function notifyWordsChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(WORDS_CHANGED_EVENT));
}
