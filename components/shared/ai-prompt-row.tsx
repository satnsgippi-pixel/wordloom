"use client"

import { useMemo, useState } from "react"
import type { WordData } from "@/lib/types"

type Props = {
  word: Pick<WordData, "id" | "word" | "meaning">
  gptUrl: string
}

export function AIPromptRow({ word, gptUrl }: Props) {
  const [copied, setCopied] = useState(false)

  const payload = useMemo(() => {
    // ここが「一度でコピーしやすい形」
    // 必要ならフォーマットはここだけ変えればOK
    return `${word.word}\n${word.meaning}`
  }, [word.word, word.meaning])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(payload)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 900)
    } catch {
      // clipboardが使えない環境の保険（iOS古い等）
      const ta = document.createElement("textarea")
      ta.value = payload
      document.body.appendChild(ta)
      ta.select()
      document.execCommand("copy")
      document.body.removeChild(ta)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 900)
    }
  }

  return (
    <div className="flex items-center gap-3">
      {/* 左：その日の単語 */}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2 min-w-0">
          <div className="font-semibold text-[#111827] truncate">{word.word}</div>
          <div className="text-xs text-[#6B7280] truncate">{word.meaning}</div>
        </div>
      </div>

      {/* 右：ボタン（横並び、縦幅を取らない） */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={copy}
          className="h-9 px-3 text-sm font-medium text-[#2563EB] bg-[#EFF6FF] rounded-lg hover:bg-[#DBEAFE] transition-colors focus:outline-none focus:ring-2 focus:ring-[#93C5FD]"
        >
          {copied ? "Copied" : "Copy"}
        </button>

        <a
          href={gptUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="h-9 px-3 text-sm font-medium text-[#111827] bg-white border border-[#E5E7EB] rounded-lg hover:bg-[#F3F4F6] transition-colors focus:outline-none focus:ring-2 focus:ring-[#93C5FD]"
        >
          Open GPT
        </a>
      </div>
    </div>
  )
}
