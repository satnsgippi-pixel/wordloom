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
