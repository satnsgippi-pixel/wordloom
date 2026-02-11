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

function normalizeAnswer(text: string): string {
  return (text ?? "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s’'-]/g, "") // 軽めに記号無視
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

  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [showJa, setShowJa] = useState(false)

  useEffect(() => {
    setShowJa(false)
    setAnswers({})
  }, [wordData.id])

  const correctAnswers = useMemo(() => {
    if (!currentSentence || need < MIN_STAGE6_BLANKS) return []
    return blankIdxs.map((i) => currentSentence.tokens?.[i] ?? "")
  }, [currentSentence, need, blankIdxs])

  const clozeSentence = useMemo(() => {
    if (!currentSentence || need < MIN_STAGE6_BLANKS) return null
    const markers = blankMarkers(need)
    const markerMap = new Map<number, string>()
    blankIdxs.forEach((idx, order) => markerMap.set(idx, markers[order] ?? "____"))
    const rendered = (currentSentence.tokens ?? []).map((t, i) =>
      markerMap.has(i) ? markerMap.get(i)! : t
    )
    return rendered.join(" ")
  }, [currentSentence, blankIdxs, need])

  const handleChange = (order: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [order]: value }))
  }

  const isSubmitDisabled =
    disabled ||
    need < MIN_STAGE6_BLANKS ||
    correctAnswers.some((_, i) => !(answers[i + 1] ?? "").trim())

  const handleSubmit = () => {
    if (isSubmitDisabled) return
    const user = Array.from({ length: need }, (_, i) => answers[i + 1] ?? "")
    const ok =
      user.length === correctAnswers.length &&
      user.every((a, i) => normalizeAnswer(a) === normalizeAnswer(correctAnswers[i] ?? ""))
    onAnswer(user.join(", "), ok)
  }

  if (
    !currentSentence ||
    need < MIN_STAGE6_BLANKS ||
    !clozeSentence ||
    correctAnswers.some((x) => !x)
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

      <div className="mb-2">
        <p className="text-lg text-[#111827] leading-relaxed">{clozeSentence}</p>

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

      <div className="mt-6 space-y-4">
        {Array.from({ length: need }, (_, i) => i + 1).map((order) => (
          <div key={order}>
            <label className="text-sm font-medium text-[#6B7280] mb-1 block">({order})</label>
            <input
              type="text"
              value={answers[order] ?? ""}
              onChange={(e) => handleChange(order, e.target.value)}
              placeholder="Type your answer"
              disabled={disabled}
              className={`w-full px-4 py-3 text-base text-[#111827] bg-white border border-[#E5E7EB] rounded-lg min-h-[48px] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#93C5FD] focus:border-transparent ${
                disabled ? "opacity-60 cursor-not-allowed bg-[#F8FAFC]" : ""
              }`}
            />
          </div>
        ))}
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
