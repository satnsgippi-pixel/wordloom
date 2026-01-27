// lib/export-import.ts
import type { WordData } from "@/lib/types"

const WORDS_KEY = "wordloom.words.v1"

export function exportWords(): string {
  const raw = localStorage.getItem(WORDS_KEY)
  const words: WordData[] = raw ? JSON.parse(raw) : []

  const payload = {
    version: 1,
    exportedAt: Date.now(),
    words,
  }

  return JSON.stringify(payload, null, 2)
}

export function importWords(json: string): { ok: true } | { ok: false; error: string } {
  try {
    const parsed = JSON.parse(json)

    if (parsed.version !== 1 || !Array.isArray(parsed.words)) {
      return { ok: false, error: "Invalid file format" }
    }

    // 軽い validation（最低限）
    for (const w of parsed.words) {
      if (typeof w.id !== "string" || typeof w.word !== "string") {
        return { ok: false, error: "Invalid word data" }
      }
    }

    localStorage.setItem(WORDS_KEY, JSON.stringify(parsed.words))
    window.dispatchEvent(new Event("wordloom:words-changed"))

    return { ok: true }
  } catch {
    return { ok: false, error: "Failed to parse JSON" }
  }
}
