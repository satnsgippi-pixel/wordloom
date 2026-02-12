"use client"

import { useEffect, useMemo, useState } from "react"
import type { WordData, SentenceData } from "@/lib/types"
import Link from "next/link"

interface Stage5Props {
  wordData: WordData
  onAnswer: (answer: string, isCorrect: boolean) => void
  disabled?: boolean
  mode?: "normal" | "weakness" | "quiz" | "challenge"
}

function normalize(text: string): string {
  return (text ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[.,!?;:]+/g, "")
}

export function Stage5ClozeSingle({ wordData, onAnswer, disabled }: Stage5Props) {

  // ✅ s5が設定されている例文だけから選ぶ
  const sentence: SentenceData | null = useMemo(() => {
    const list = (wordData.sentences ?? []).filter((s) => {
      const len = s?.s5?.targetTokenIndexes?.length ?? 0

      if (wordData.entryType === "word") {
        return len === 1
      }

      if (wordData.entryType === "phrase") {
        return len >= 2
      }

      return false
    })

    if (list.length === 0) return null
    const i = Math.floor(Math.random() * list.length)
    return list[i]
  }, [wordData.id, wordData.entryType])

  const targetIndexes = sentence?.s5?.targetTokenIndexes ?? []

  const [input, setInput] = useState("")
  const [showJa, setShowJa] = useState(false)

  useEffect(() => {
    setShowJa(false)
    setInput("")
  }, [wordData.id])

  if (!sentence || targetIndexes.length === 0) {
    return (
      <div>
        <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide mb-2">
          Cloze (Input)
        </p>

        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800 mb-2">
            Stage5 の cloze が未設定です
          </p>

          <p className="text-sm text-[#111827] font-semibold">
            {wordData.word}
          </p>

          {wordData.meaning && (
            <p className="text-xs text-[#6B7280] mt-1">
              {wordData.meaning}
            </p>
          )}

          <p className="text-xs text-yellow-700 mt-2">
            編集画面で Stage5 の穴埋め（
            {wordData.entryType === "word" ? "1つ" : "2つ以上"}
            ）を設定してください。
          </p>

          <div className="mt-3">
            <Link
              href={`/words/${wordData.id}/edit?from=study`}
              className="h-9 px-3 inline-flex items-center justify-center rounded-lg bg-white border border-yellow-200 text-sm font-medium text-yellow-900 hover:bg-yellow-100 transition-colors"
            >
              この単語を編集する
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const correctRaw = targetIndexes
    .map((i) => sentence.tokens[i])
    .filter(Boolean)
    .join(" ")

  const correct = normalize(correctRaw)

  const handleSubmit = () => {
    const answer = input.trim()
    const isCorrect = normalize(answer) === correct
    onAnswer(answer, isCorrect)
  }

  return (
    <div>
      <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide mb-2">
        Cloze (Input)
      </p>

      {/* 例文表示 */}
      <div className="mt-4 p-4 bg-white rounded-lg border border-[#E5E7EB]">
        <div className="text-base leading-relaxed flex flex-wrap gap-1">
          {sentence.tokens.map((token, index) =>
            targetIndexes.includes(index) ? (
              <span
                key={index}
                className="inline-block min-w-[80px] border-b-2 border-[#2563EB] text-center"
              >
                _____
              </span>
            ) : (
              <span key={index}>{token}</span>
            )
          )}
        </div>

        {showJa && (
          <p className="text-sm text-[#6B7280] leading-relaxed mt-2">
            {sentence.ja}
          </p>
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
          placeholder="Type the missing phrase"
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
