"use client"

import { exportWords, importWords, getExportPayload } from "@/lib/export-import"
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

  const handleCloudSave = async () => {
    setMessage(null)
    setLoading(true)
    try {
      const payload = await getExportPayload()
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`)
      }
      setMessage("クラウドに保存しました")
    } catch (e) {
      setMessage(`クラウドに保存失敗: ${String(e)}`)
    } finally {
      setLoading(false)
    }
  }

  const handleCloudFetch = async () => {
    setMessage(null)
    setLoading(true)
    try {
      const res = await fetch("/api/sync")
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("クラウドにデータが見つかりません")
        }
        throw new Error(`Server returned ${res.status}`)
      }
      const data = await res.json()
      const jsonString = JSON.stringify(data)
      const result = await importWords(jsonString)
      if (result.ok) {
        setMessage(`クラウドから取得完了（${result.importedWords}件の単語、${result.importedProgress}件の進捗）→ リロードします`)
      } else {
        setMessage(`クラウドから取得失敗: ${result.error}`)
      }
    } catch (e) {
      setMessage(`クラウドから取得失敗: ${String(e)}`)
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
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
        <p className="text-sm font-medium text-blue-900">クラウド同期 (Vercel KV)</p>
        <div className="flex gap-2">
          <button
            onClick={handleCloudSave}
            disabled={loading}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg disabled:opacity-60 hover:bg-blue-700"
          >
            クラウドに保存
          </button>
          <button
            onClick={handleCloudFetch}
            disabled={loading}
            className="flex-1 px-4 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-200 rounded-lg disabled:opacity-60 hover:bg-blue-50"
          >
            クラウドから取得
          </button>
        </div>
      </div>

      <hr className="border-[#E5E7EB] my-4" />

      <button
        onClick={handleExport}
        disabled={loading}
        className="w-full px-4 py-2 text-sm font-medium text-white bg-[#4B5563] rounded-lg disabled:opacity-60 hover:bg-[#374151]"
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
