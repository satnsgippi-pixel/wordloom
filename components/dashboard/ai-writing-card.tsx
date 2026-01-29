"use client"

import { useEffect, useMemo, useState } from "react"
import { getWords, subscribeWords } from "@/lib/words-store"
import type { WordData } from "@/lib/types"
import { copyToClipboard } from "@/lib/clipboard"
import { WORDLOOM_WRITING_GPT_URL } from "@/lib/ai-prompts"
import {
  ensureTodayWriting,
  markTodayAiWritingDone,
  isTodayAiWritingDone,
  reshuffleTodayWriting,
} from "@/lib/daily-writing"
import { RefreshCw } from "lucide-react"

export function AiWritingCard() {
  const [words, setWords] = useState<WordData[]>([])
  const [targetId, setTargetId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [done, setDone] = useState(false)

  // 単語購読
  useEffect(() => {
    const refresh = () => setWords(getWords())
    refresh()
    const unsub = subscribeWords(refresh)
    return unsub
  }, [])

  // 今日のターゲット確定
  useEffect(() => {
    const state = ensureTodayWriting(words, { excludeWeakness: false })
    setTargetId(state.targetId)
    setDone(isTodayAiWritingDone())
  }, [words])

  const target: WordData | null = useMemo(() => {
    if (!targetId) return null
    return words.find((w) => w.id === targetId) ?? null
  }, [words, targetId])

  // 🔄 シャッフル
  const handleShuffle = () => {
    const state = reshuffleTodayWriting(words)
    if (state?.targetId) {
      setTargetId(state.targetId)
      setDone(false)
    }
  }

  // コピー用（英語 + 日本語）
  const copyText = useMemo(() => {
    if (!target) return ""
    return `${target.word}\n${target.meaning}`
  }, [target])

  const handleCopy = async () => {
    if (!copyText) return
    const ok = await copyToClipboard(copyText)
    setCopied(ok)
    setTimeout(() => setCopied(false), 900)
  }

  const handleOpenGpt = () => {
    markTodayAiWritingDone()
    setDone(true)
    window.open(WORDLOOM_WRITING_GPT_URL, "_blank", "noopener,noreferrer")
  }

  return (
    <div className="block bg-white border border-[#E5E7EB] rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-[#111827]">
          AI添削
          {done && <span className="ml-2 text-xs text-[#16A34A]">✔ done</span>}
        </h3>
        <span className="text-xs text-[#6B7280]">Today</span>
      </div>
  
      {!target ? (
        <p className="text-sm text-[#6B7280]">
          単語がありません。先に単語を登録してください。
        </p>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          {/* 単語表示 */}
          <div className="min-w-0 flex-1">
            <div className="min-w-0 flex flex-col gap-1">
              <p className="text-sm text-[#111827] whitespace-normal break-words">
                今日の単語:{" "}
                <span className="font-semibold">{target.word}</span>
              </p>
              <p className="text-xs text-[#6B7280] whitespace-normal break-words">
                {target.meaning}
              </p>
            </div>
          </div>
  
          {/* 右側：操作（モバイルでは下段、sm以上は右側） */}
          <div className="flex items-center gap-2 shrink-0">
            {/* 🔄 シャッフル */}
            <button
              onClick={handleShuffle}
              title="別の単語にする"
              className="h-8 w-8 flex items-center justify-center rounded-lg border border-[#E5E7EB] text-[#6B7280] hover:bg-[#EFF6FF] hover:text-[#2563EB] transition-colors"
            >
              <RefreshCw size={14} />
            </button>
  
            <button
              onClick={handleCopy}
              disabled={!copyText}
              className="h-9 px-3 text-sm font-medium text-[#2563EB] bg-[#EFF6FF] rounded-lg hover:bg-[#DBEAFE] transition-colors focus:outline-none focus:ring-2 focus:ring-[#93C5FD] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {copied ? "Copied" : "Copy"}
            </button>
  
            <button
              onClick={handleOpenGpt}
              className="h-9 px-3 bg-white border border-[#E5E7EB] rounded-lg flex items-center justify-center text-sm font-medium text-[#111827] hover:bg-[#EFF6FF] active:bg-[#DBEAFE] transition-colors focus:outline-none focus:ring-2 focus:ring-[#93C5FD]"
            >
              Open GPT
            </button>
          </div>
        </div>
      )}
    </div>
  )
}   