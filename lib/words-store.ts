// lib/words-store.ts
import type { WordData } from "@/lib/types";
import { loadWords, upsertWord } from "@/lib/storage";

/**
 * 旧 Study UI 互換レイヤー（暫定）
 * - 実データは storage.ts を使用
 */

const WEAKNESS_CLEAR_STREAK = 2;

// ===== Normal Study: stage進行ルール =====
function requiredStreak(stage: number) {
  // stage0-4: 2連続 / stage5-7: 5連続
  return stage >= 5 ? 5 : 2;
}

// ===== SRS utilities =====

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

// stability → 間隔（日）テーブル
const SRS_TABLE: { min: number; days: number }[] = [
  { min: 1,  days: 0.5 },   // 12h
  { min: 2,  days: 1 },     // 1d
  { min: 4,  days: 2 },
  { min: 6,  days: 4 },
  { min: 8,  days: 7 },
  { min: 10, days: 14 },
  { min: 12, days: 28 },
  { min: 14, days: 60 },    // ★追加
  { min: 16, days: 120 },
  { min: 18, days: 240 },
  { min: 20, days: 360 },
]

const STABILITY_MIN = 1
const STABILITY_MAX = 20

function intervalDaysFromStability(stability: number) {
  const s = clamp(Math.round(stability), STABILITY_MIN, STABILITY_MAX)

  let days = 0.5
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
 * - stageStreak++
 * - 規定回数で currentStage++ & stageStreak=0
 * - stageは下げない
 * - stability/dueAt更新は次ステップで入れる（現時点では触らない）
 */
export function markNormalCorrect(wordId: string) {
  const words = loadWords()
  const target = words.find((w) => w.id === wordId)
  if (!target) return

  const now = Date.now()

  const prevStability =
    typeof target.stability === "number" && Number.isFinite(target.stability)
      ? target.stability
      : 1

  // 正解で微増
  const nextStability = clamp(prevStability + 0.15, STABILITY_MIN, STABILITY_MAX)

  // stage進行
  const nextStreak = (target.stageStreak ?? 0) + 1
  const need = requiredStreak(target.currentStage ?? 0)

  let nextStage = target.currentStage ?? 0
  let finalStreak = nextStreak

  if (nextStreak >= need) {
    nextStage = nextStage + 1
    finalStreak = 0
  }

  const updated: WordData = {
    ...target,
    currentStage: nextStage,
    stageStreak: finalStreak,
    stability: nextStability,
    dueAt: computeNextDueAt(now, nextStability, true),
    updatedAt: now,
  }

  upsertWord(updated)
  notifyWordsChanged()
}

/**
 * Normal Study: 不正解を記録
 * - stageStreak = 0
 * - weakness を付与（既存仕様に寄せる）
 * - stageは下げない
 * - stability/dueAt更新は次ステップで入れる（現時点では触らない）
 */
export function markNormalWrong(wordId: string, stage: number) {
  const words = loadWords()
  const target = words.find((w) => w.id === wordId)
  if (!target) return

  const now = Date.now()

  const prevStability =
    typeof target.stability === "number" && Number.isFinite(target.stability)
      ? target.stability
      : 1

  // 不正解で減（最低1）
  const nextStability = clamp(prevStability - 0.25, STABILITY_MIN, STABILITY_MAX)

  const updated: WordData = {
    ...target,
    stageStreak: 0,
    stability: nextStability,
    dueAt: computeNextDueAt(now, nextStability, false),
    weakness: {
      stage,
      streak: 0,
      updatedAt: now,
    },
    updatedAt: now,
  }

  upsertWord(updated)
  notifyWordsChanged()
}

// StudyScreen が要求する：単語一覧を取得
export function getWords(): WordData[] {
  return loadWords();
}

/**
 * Weakness: 不正解を記録（wordloom仕様）
 * - stage / stability / dueAt は変更しない
 * - weakness は { stage, streak, updatedAt } を維持
 */
export function markWeaknessWrong(wordId: string, stage: number) {
  const words = loadWords();
  const target = words.find((w) => w.id === wordId);
  if (!target) return;

  const updated: WordData = {
    ...target,
    weakness: {
      stage,
      streak: 0,
      updatedAt: Date.now(),
    },
  };

  upsertWord(updated);
  notifyWordsChanged();
}

/**
 * Weakness: 正解を記録
 * - streak++ し、2連続で weakness を解除
 * - stage / stability / dueAt は変更しない
 */
export function markWeaknessCorrect(wordId: string) {
  const words = loadWords();
  const target = words.find((w) => w.id === wordId);
  if (!target) return;

  const current = target.weakness;
  if (!current) return; // weakness対象でなければ何もしない

  const nextStreak = (current.streak ?? 0) + 1;
  const shouldClear = nextStreak >= WEAKNESS_CLEAR_STREAK;

  const updated: WordData = {
    ...target,
    weakness: shouldClear
      ? undefined
      : {
          ...current,
          streak: nextStreak,
          updatedAt: Date.now(),
        },
  };

  upsertWord(updated);
  notifyWordsChanged();
}

/**
 * Normal Study / 共通: 間違いを記録（互換）
 * 旧コードが wordText を渡してくる前提のため残す。
 *
 * ✅ 推奨: 今後は markNormalWrong(wordId, stage) / markWeaknessWrong(wordId, stage) を呼ぶ
 */
export function markWrong(wordText: string, stage: number) {
  const words = loadWords();
  const target = words.find((w) => w.word === wordText);
  if (!target) return;

  // 旧挙動は「弱点復習用の間違い記録」だったので weakness に寄せる
  markWeaknessWrong(target.id, stage);
}

/**
 * Stage0 用：4択の選択肢を作る（暫定）
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
 * Stage1（JA→EN）、Stage4（Definition→EN）で使用
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

export function getTotalWordsCount(): number {
  return loadWords().length;
}

export function getWeakWordsCount(): number {
  return loadWords().filter((w) => !!w.weakness).length;
}

const WORDS_CHANGED_EVENT = "wordloom:words-changed";

// ===== Challenge support =====
export function getChallengeReadyCount(minStability: number = 12): number {
  const words = loadWords()
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
  localStorage.removeItem("wordloom.words.v1");
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
export function getDueNowCount(now = Date.now()): number {
  const words = loadWords()
  return words.filter((w) => {
    const dueAt = getDueAtSafe(w)
    return dueAt <= now && dueAt >= now - DAY_MS
  }).length
}

export function getOverdueCount(now = Date.now()): number {
  const words = loadWords()
  return words.filter((w) => getDueAtSafe(w) < now - DAY_MS).length
}

export function getNextNDaysCount(days: number, now = Date.now()): number {
  const words = loadWords()
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
export function getLearnedL6PlusCount(): number {
  const words = loadWords()
  return words.filter((w) => (w.currentStage ?? 0) >= 6).length
}

export function getInProgressCount(): number {
  const total = getTotalWordsCount()
  const learned = getLearnedL6PlusCount()
  return Math.max(0, total - learned)
}

export function setQaMemo(wordId: string, qaMemo: string) {
  const words = loadWords()
  const target = words.find((w) => w.id === wordId)
  if (!target) return

  const updated: WordData = {
    ...target,
    qaMemo,
    updatedAt: Date.now(),
  }

  upsertWord(updated)

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
