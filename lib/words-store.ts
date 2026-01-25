// lib/words-store.ts
import type { WordData } from "@/lib/types";
import { loadWords, upsertWord } from "@/lib/storage";

/**
 * 旧 Study UI 互換レイヤー（暫定）
 * - 実データは storage.ts を使用
 */

// StudyScreen が要求する：単語一覧を取得
export function getWords(): WordData[] {
  return loadWords();
}

// StudyScreen が要求する：間違いを記録（弱点復習用）
export function markWrong(wordText: string, stage: number) {
  const words = loadWords();
  const target = words.find((w) => w.word === wordText);
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
    .filter((w) => w.word !== word.word)
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
    .filter((w) => w.word !== word.word)
    .slice(0, 3)
    .map((w) => ({ label: w.word, isCorrect: false }));

  return shuffle([correct, ...wrongs]);
}

// util
function shuffle<T>(array: T[]): T[] {
  return [...array].sort(() => Math.random() - 0.5);
}

