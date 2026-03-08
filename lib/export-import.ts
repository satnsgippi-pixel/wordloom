// lib/export-import.ts
// IndexedDB (Dexie) ベースのエクスポート/インポート
import { db } from "@/lib/db"
import type { WordData } from "@/lib/types"
import type { DailyProgress } from "@/lib/db"

const EXPORT_VERSION = 2

export interface ExportPayload {
  version: number
  exportedAt: number
  words: WordData[]
  dailyProgress: DailyProgress[]
}

/** IndexedDB から全データを取得し、JSON ファイルとしてダウンロード */
export async function exportWords(): Promise<void> {
  const words = await db.words.toArray()
  const dailyProgress = await db.dailyProgress.toArray()

  const payload: ExportPayload = {
    version: EXPORT_VERSION,
    exportedAt: Date.now(),
    words,
    dailyProgress,
  }

  const json = JSON.stringify(payload, null, 2)
  const blob = new Blob([json], { type: "application/json" })
  const url = URL.createObjectURL(blob)

  const dateStr = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  const filename = `wordloom-backup-${dateStr}.json`

  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export type ImportResult = { ok: true; importedWords: number; importedProgress: number } | { ok: false; error: string }

/** JSON からデータを読み取り、IndexedDB に bulkPut（上書き/追加） */
export async function importWords(json: string): Promise<ImportResult> {
  try {
    const parsed = JSON.parse(json) as ExportPayload | { version: 1; words: WordData[] }

    if (parsed.version === 1) {
      // 旧形式: words のみ
      if (!Array.isArray(parsed.words)) {
        return { ok: false, error: "Invalid file format (v1)" }
      }
      for (const w of parsed.words) {
        if (typeof w.id !== "string" || typeof w.word !== "string") {
          return { ok: false, error: "Invalid word data" }
        }
      }
      await db.words.bulkPut(parsed.words)
      window.location.reload()
      return { ok: true, importedWords: parsed.words.length, importedProgress: 0 }
    }

    if (parsed.version === EXPORT_VERSION) {
      const words = Array.isArray(parsed.words) ? parsed.words : []
      const dailyProgress = Array.isArray(parsed.dailyProgress) ? parsed.dailyProgress : []

      for (const w of words) {
        if (typeof w.id !== "string" || typeof w.word !== "string") {
          return { ok: false, error: "Invalid word data" }
        }
      }
      for (const p of dailyProgress) {
        if (typeof p.date !== "string" || typeof p.count !== "number") {
          return { ok: false, error: "Invalid dailyProgress data" }
        }
      }

      await db.words.bulkPut(words)
      if (dailyProgress.length > 0) {
        await db.dailyProgress.bulkPut(dailyProgress)
      }

      window.location.reload()
      return { ok: true, importedWords: words.length, importedProgress: dailyProgress.length }
    }

    return { ok: false, error: "Unknown or unsupported export version" }
  } catch {
    return { ok: false, error: "Failed to parse JSON" }
  }
}
