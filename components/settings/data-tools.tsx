"use client"

import { exportWords, importWords } from "@/lib/export-import"
import { useState, useRef } from "react"

export function DataTools() {
  const [json, setJson] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = async () => {
    setMessage(null)
    setLoading(true)
    try {
      await exportWords()
      setMessage("エクスポート完了（ファイルがダウンロードされました）")
    } catch (e) {
      setMessage(`エクスポート失敗: ${String(e)}`)
    } finally {
      setLoading(false)
    }
  }

  const handleImportFromPaste = async () => {
    if (!json.trim()) {
      setMessage("インポートする JSON を入力してください")
      return
    }
    setMessage(null)
    setLoading(true)
    try {
      const result = await importWords(json)
      if (result.ok) {
        setMessage(`インポート完了（${result.importedWords}件の単語、${result.importedProgress}件の進捗）→ リロードします`)
      } else {
        setMessage(`インポート失敗: ${result.error}`)
      }
    } catch (e) {
      setMessage(`インポート失敗: ${String(e)}`)
    } finally {
      setLoading(false)
    }
  }

  const handleImportFromFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setMessage(null)
    setLoading(true)
    try {
      const content = await file.text()
      const result = await importWords(content)
      if (result.ok) {
        setMessage(`インポート完了（${result.importedWords}件の単語、${result.importedProgress}件の進捗）→ リロードします`)
      } else {
        setMessage(`インポート失敗: ${result.error}`)
      }
    } catch (err) {
      setMessage(`インポート失敗: ${String(err)}`)
    } finally {
      setLoading(false)
      e.target.value = ""
    }
  }

  return (
    <div className="space-y-3">
      <button
        onClick={handleExport}
        disabled={loading}
        className="w-full px-4 py-2 text-sm font-medium text-white bg-[#2563EB] rounded-lg disabled:opacity-60"
      >
        {loading ? "処理中..." : "エクスポート（IndexedDB → JSON ファイル）"}
      </button>

      <hr className="border-[#E5E7EB]" />

      <p className="text-xs text-[#6B7280]">インポート（既存データは上書きまたは追加）</p>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleImportFromFile}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={loading}
        className="w-full px-4 py-2 text-sm font-medium text-[#2563EB] bg-[#EFF6FF] rounded-lg hover:bg-[#DBEAFE] disabled:opacity-60"
      >
        ファイルを選択してインポート
      </button>

      <textarea
        value={json}
        onChange={(e) => setJson(e.target.value)}
        className="w-full h-32 border border-[#E5E7EB] rounded-lg p-2 text-sm"
        placeholder="または JSON を貼り付けてインポート"
      />

      <button
        onClick={handleImportFromPaste}
        disabled={loading || !json.trim()}
        className="w-full px-4 py-2 text-sm font-medium text-white bg-[#2563EB] rounded-lg disabled:opacity-60"
      >
        貼り付け内容をインポート
      </button>

      {message && <p className="text-sm text-[#6B7280]">{message}</p>}
    </div>
  )
}
