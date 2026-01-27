"use client"

import { useEffect, useMemo, useState } from "react"
import type { WordData, SentenceData } from "@/lib/types"

interface Stage7Props {
  wordData: WordData
  onAnswer: (answer: string, isCorrect: boolean) => void
  disabled?: boolean
}

export function Stage7SelfJudge({ wordData, onAnswer, disabled }: Stage7Props) {
  // ✅ 日本語・英語が揃っている例文から1つ選ぶ（1問中は固定）
  const sentence: SentenceData | null = useMemo(() => {
    const list = (wordData.sentences ?? []).filter(
      (s) => (s?.ja ?? "").trim().length > 0 && (s?.en ?? "").trim().length > 0
    )
    if (list.length === 0) return null
    return list[Math.floor(Math.random() * list.length)]
  }, [wordData.id])

  const [revealed, setRevealed] = useState(false)

  // 単語が変わったらリセット
  useEffect(() => {
    setRevealed(false)
  }, [wordData.id])

  if (!sentence) {
    return (
      <div>
        <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide mb-2">
          JA SENTENCE → EN (SELF JUDGE)
        </p>
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800 mb-1">日本語訳つきの例文がありません</p>
          <p className="text-xs text-yellow-700">登録・編集画面で例文（EN/JA）を追加してください</p>
        </div>
      </div>
    )
  }

  const handleOk = () => {
    if (disabled) return
    onAnswer("OK", true)
  }

  const handleNg = () => {
    if (disabled) return
    onAnswer("NG", false)
  }

  return (
    <div>
      <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide mb-2">
        JA SENTENCE → EN (SELF JUDGE)
      </p>

      <div className="p-4 bg-white rounded-lg border border-[#E5E7EB]">
        <p className="text-base text-[#111827] leading-relaxed">{sentence.ja}</p>

        <p className="text-sm text-[#6B7280] mt-2">
          声に出して英訳してから、答えを表示してください。
        </p>

        <button
          type="button"
          onClick={() => setRevealed((v) => !v)}
          className="text-xs text-[#2563EB] underline mt-3"
          disabled={disabled}
        >
          {revealed ? "答えを隠す" : "答えを表示"}
        </button>

        {revealed && (
          <div className="mt-3 p-3 bg-[#F8FAFC] rounded-lg border border-[#E5E7EB]">
            <p className="text-xs text-[#6B7280] mb-1">MODEL ANSWER</p>
            <p className="text-base text-[#111827] leading-relaxed">{sentence.en}</p>
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          onClick={handleOk}
          disabled={disabled}
          className={`w-full py-3 text-base font-medium rounded-lg min-h-[48px] transition-colors ${
            disabled
              ? "bg-[#E5E7EB] text-[#9CA3AF] cursor-not-allowed"
              : "bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
          } focus:outline-none focus:ring-2 focus:ring-[#93C5FD] focus:ring-offset-2`}
        >
          OK
        </button>

        <button
          onClick={handleNg}
          disabled={disabled}
          className={`w-full py-3 text-base font-medium rounded-lg min-h-[48px] transition-colors ${
            disabled
              ? "bg-[#E5E7EB] text-[#9CA3AF] cursor-not-allowed"
              : "bg-white border border-[#E5E7EB] text-[#111827] hover:bg-[#F9FAFB]"
          } focus:outline-none focus:ring-2 focus:ring-[#93C5FD] focus:ring-offset-2`}
        >
          NG
        </button>
      </div>
    </div>
  )
}
