"use client"

import { useEffect, useMemo, useState } from "react"
import type { WordData } from "../study-screen"
import type { SentenceData } from "@/lib/types"

interface Stage5Props {
  wordData: WordData
  onAnswer: (answer: string, isCorrect: boolean) => void
  disabled?: boolean
  mode?: "normal" | "weakness" | "quiz" | "challenge"
}

function normalize(text: string): string {
  return (text ?? "").trim().toLowerCase()
}

export function Stage5ClozeSingle({ wordData, onAnswer, disabled }: Stage5Props) {
  // ✅ s5が設定されている例文だけからランダムに選ぶ（1問中は固定）
  const sentence: SentenceData | null = useMemo(() => {
    const list = (wordData.sentences ?? []).filter(
      (s) => s?.tokens?.length > 0 && s?.s5?.targetTokenIndexes?.length === 1
    )
    if (list.length === 0) return null
    const i = Math.floor(Math.random() * list.length)
    return list[i]
  }, [wordData.id])

  const targetIndex = sentence?.s5?.targetTokenIndexes?.[0]

  const [input, setInput] = useState("")
  const [showJa, setShowJa] = useState(false)

  // wordData.id が変わったら初期化
  useEffect(() => {
    setShowJa(false)
    setInput("")
  }, [wordData.id])

  if (!sentence || targetIndex == null) {
    return <p className="text-sm text-zinc-500">Cloze が設定されていません。</p>
  }

  const correctToken = sentence.tokens[targetIndex] ?? ""

  const handleSubmit = () => {
    const answer = input.trim()
    const isCorrect = normalize(answer) === normalize(correctToken)
    onAnswer(answer, isCorrect)
  }

  return (
    <div>
      <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide mb-2">
        Cloze (Single)
      </p>

      {/* トークン表示 */}
      <div className="mt-4 p-4 bg-white rounded-lg border border-[#E5E7EB]">
        <div className="text-base leading-relaxed flex flex-wrap gap-1">
          {sentence.tokens.map((token, index) =>
            index === targetIndex ? (
              <span
                key={index}
                className="inline-block min-w-[80px] border-b-2 border-[#2563EB] text-center"
              >
                {input || " "}
              </span>
            ) : (
              <span key={index}>{token}</span>
            )
          )}
        </div>

        {showJa && (
          <p className="text-sm text-[#6B7280] leading-relaxed mt-2">{sentence.ja}</p>
        )}

        <button
          type="button"
          onClick={() => setShowJa((v) => !v)}
          className="text-xs text-[#2563EB] underline mt-2"
        >
          {showJa ? "日本語訳を隠す" : "日本語訳を表示"}
        </button>
      </div>

      {/* 入力欄 */}
      <div className="mt-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={disabled}
          placeholder="Type the missing word"
          className="w-full px-4 py-3 text-base border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#93C5FD]"
        />
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={disabled || input.trim().length === 0}
        className="mt-4 w-full py-3 text-base font-medium text-white bg-[#2563EB] rounded-lg hover:bg-[#1D4ED8] disabled:bg-[#E5E7EB]"
      >
        Check
      </button>
    </div>
  )
}
