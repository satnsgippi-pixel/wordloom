// lib/storage.ts
import type { WordData } from "./types";

export const STORAGE_KEY = "wordloom.words.v1";

// SSR対策：ブラウザでのみlocalStorageを使う
function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function loadWords(): WordData[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    return data as WordData[];
  } catch {
    return [];
  }
}

export function saveWords(words: WordData[]): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
}

export function upsertWord(word: WordData): void {
  const words = loadWords();
  const idx = words.findIndex((w) => w.id === word.id);
  if (idx >= 0) {
    words[idx] = word;
  } else {
    words.unshift(word);
  }
  saveWords(words);
}

export function deleteWord(id: string): void {
  const words = loadWords().filter((w) => w.id !== id);
  saveWords(words);
}
