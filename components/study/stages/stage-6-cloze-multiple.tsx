"use client"

import { useEffect, useMemo, useState } from "react"
import type { WordData, SentenceData } from "@/lib/types"
import Link from "next/link"

interface Stage6Props {
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

const MIN_STAGE6_BLANKS = 2

function pickStage6Sentence(wordData: WordData): SentenceData | null {
  const list = wordData.sentences ?? []
  if (list.length === 0) return null

  const candidates = list.filter((s) => {
    const idxs = s?.s6?.blankTokenIndexes ?? []
    return Array.isArray(idxs) && idxs.length >= MIN_STAGE6_BLANKS && (s.tokens?.length ?? 0) > 0
  })

  if (candidates.length === 0) return null
  return candidates[Math.floor(Math.random() * candidates.length)]
}

function blankMarkers(n: number): string[] {
  const labels = ["¹", "²", "³", "⁴", "⁵", "⁶", "⁷", "⁸", "⁹", "⁺"]
  return Array.from({ length: n }, (_, i) => `____${labels[i] ?? String(i + 1)}`)
}

export function Stage6ClozeMultiple({ wordData, onAnswer, disabled }: Stage6Props) {
  const currentSentence: SentenceData | null = useMemo(
    () => pickStage6Sentence(wordData),
    [wordData.id]
  )

  const blankIdxs = useMemo(
    () => (currentSentence?.s6?.blankTokenIndexes ?? []).filter(
      (i) => typeof i === "number" && Number.isFinite(i)
    ),
    [currentSentence]
  )
  const need = blankIdxs.length

  const [answer, setAnswer] = useState("")
  const [showJa, setShowJa] = useState(false)

  useEffect(() => {
    setShowJa(false)
    setAnswer("")
  }, [wordData.id])

  const correctRaw = useMemo(() => {
    if (!currentSentence || need < MIN_STAGE6_BLANKS) return ""
    return blankIdxs
      .map((i) => currentSentence.tokens?.[i])
      .filter(Boolean)
      .join(" ")
  }, [currentSentence, need, blankIdxs])

  const correct = normalize(correctRaw)

  const isSubmitDisabled = disabled || need < MIN_STAGE6_BLANKS || answer.trim().length === 0

  const handleSubmit = () => {
    if (isSubmitDisabled) return
    const trimmed = answer.trim()
    const isCorrect = normalize(trimmed) === correct
    onAnswer(trimmed, isCorrect)
  }

  if (
    !currentSentence ||
    need < MIN_STAGE6_BLANKS ||
    !correctRaw
  ) {
    return (
      <div>
        <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide mb-2">
          Cloze (Multiple Blanks)
        </p>
  
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800 mb-2">Cloze が未設定です</p>
  
          {/* どの単語か分かるように */}
          <p className="text-sm text-[#111827] font-semibold">
            {wordData.word}
          </p>
          {wordData.meaning && (
            <p className="text-xs text-[#6B7280] mt-1">{wordData.meaning}</p>
          )}
  
          <p className="text-xs text-yellow-700 mt-2">
            編集画面で Stage6 の穴埋め（2つ以上）を設定してください。
          </p>
  
          <div className="mt-3 flex gap-2">
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

  return (
    <div>
      <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide mb-2">
        Cloze (Multiple Blanks)
      </p>

      <div className="mt-4 p-4 bg-white rounded-lg border border-[#E5E7EB]">
        <div className="text-base leading-relaxed flex flex-wrap gap-1">
          {currentSentence.tokens.map((token, index) =>
            blankIdxs.includes(index) ? (
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
          <p className="text-sm text-[#6B7280] leading-relaxed mt-2">{currentSentence.ja}</p>
        )}

        <button
          type="button"
          onClick={() => setShowJa((v) => !v)}
          className="text-xs text-[#2563EB] underline mt-2"
        >
          {showJa ? "日本語訳を隠す" : "日本語訳を表示"}
        </button>
      </div>

      <div className="mt-4">
        <input
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          disabled={disabled}
          placeholder="Type the missing phrase"
          className="w-full px-4 py-3 text-base border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#93C5FD]"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={isSubmitDisabled}
        className={`w-full mt-4 py-3 text-base font-medium rounded-lg min-h-[48px] transition-colors ${
          isSubmitDisabled
            ? "bg-[#E5E7EB] text-[#9CA3AF] cursor-not-allowed"
            : "bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
        } focus:outline-none focus:ring-2 focus:ring-[#93C5FD] focus:ring-offset-2`}
      >
        Check
      </button>
    </div>
  )
}
