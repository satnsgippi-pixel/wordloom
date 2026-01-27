"use client"

import { exportWords, importWords } from "@/lib/export-import"
import { useState } from "react"

export function DataTools() {
  const [json, setJson] = useState("")
  const [message, setMessage] = useState<string | null>(null)

  const handleExport = () => {
    const data = exportWords()
    setJson(data)
  }

  const handleImport = () => {
    const result = importWords(json)
    setMessage(result.ok ? "Import successful" : result.error)
  }

  return (
    <div className="space-y-3">
      <button
        onClick={handleExport}
        className="w-full px-4 py-2 text-sm font-medium text-white bg-[#2563EB] rounded-lg"
      >
        Export JSON
      </button>

      <textarea
        value={json}
        onChange={(e) => setJson(e.target.value)}
        className="w-full h-40 border border-[#E5E7EB] rounded-lg p-2 text-sm"
        placeholder="Paste JSON here to import"
      />

      <button
        onClick={handleImport}
        className="w-full px-4 py-2 text-sm font-medium text-white bg-[#2563EB] rounded-lg"
      >
        Import JSON
      </button>

      {message && <p className="text-sm text-[#6B7280]">{message}</p>}
    </div>
  )
}
