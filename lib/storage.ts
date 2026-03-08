import { db } from "./db";
import type { WordData } from "./types";

// SSR対策：ブラウザの有無は呼び出し元で不要になる（Dexie側でフックできるが安全のためチェック可）

export async function upsertWord(word: WordData): Promise<void> {
  await db.words.put(word);
}

export async function deleteWord(id: string): Promise<void> {
  await db.words.delete(id);
}

export async function getWordById(id: string): Promise<WordData | undefined> {
  return await db.words.get(id);
}

export async function getAllWords(): Promise<WordData[]> {
  return await db.words.toArray();
}

/**
 * 腕試しモード用: stability インデックスを利用して効率的に候補単語を取得。
 * minStability は words-store の CHALLENGE_MIN_STABILITY と合わせること。
 */
export async function getChallengeReadyWords(
  minStability: number,
  now: number = Date.now()
): Promise<WordData[]> {
  return db.words
    .where("stability")
    .aboveOrEqual(minStability)
    .filter((w) => !w.weakness && (w.dueAt ?? 0) > now)
    .toArray();
}
