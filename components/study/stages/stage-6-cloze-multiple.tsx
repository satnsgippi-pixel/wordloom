"use client"

import { useEffect, useMemo, useState } from "react"
import type { WordData } from "../study-screen"
import type { SentenceData } from "@/lib/types"

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

function pickStage6Sentence(wordData: WordData): SentenceData | null {
  const list = wordData.sentences ?? []
  if (list.length === 0) return null

  // ✅ word: 3つ必須 / phrase: 2つ以上
  const need = wordData.entryType === "phrase" ? 2 : 3

  const candidates = list.filter((s) => {
    const idxs = s?.s6?.blankTokenIndexes ?? []
    return Array.isArray(idxs) && idxs.length >= need && (s.tokens?.length ?? 0) > 0
  })

  if (candidates.length === 0) return null
  return candidates[Math.floor(Math.random() * candidates.length)]
}

export function Stage6ClozeMultiple({ wordData, onAnswer, disabled }: Stage6Props) {
  const [answers, setAnswers] = useState<Record<number, string>>({ 1: "", 2: "", 3: "" })
  const [showJa, setShowJa] = useState(false)

  // ✅ 1問中固定の例文
  const currentSentence: SentenceData | null = useMemo(() => {
    return pickStage6Sentence(wordData)
  }, [wordData.id])

  // wordData.id が変わったら初期化
  useEffect(() => {
    setShowJa(false)
    setAnswers({ 1: "", 2: "", 3: "" })
  }, [wordData.id])

  const need = wordData.entryType === "phrase" ? 2 : 3
  const blankIdxs = (currentSentence?.s6?.blankTokenIndexes ?? []).slice(0, need)

  const correctAnswers = useMemo(() => {
    if (!currentSentence) return []
    if (!Array.isArray(blankIdxs) || blankIdxs.length < need) return []
    return blankIdxs.map((i) => currentSentence.tokens?.[i] ?? "")
  }, [currentSentence, need, blankIdxs])

  const clozeSentence = useMemo(() => {
    if (!currentSentence) return null
    if (correctAnswers.length < need) return null

    const markers = ["____¹", "____²", "____³"]
    const markerMap = new Map<number, string>()
    blankIdxs.forEach((idx, order) => markerMap.set(idx, markers[order] ?? "____"))

    // tokensを表示しつつ、対象だけmarkerに差し替え
    const rendered = (currentSentence.tokens ?? []).map((t, i) =>
      markerMap.has(i) ? markerMap.get(i)! : t
    )

    // tokenizeの方針的に空白を入れても崩れにくい（簡易join）
    return rendered.join(" ")
  }, [currentSentence, blankIdxs, correctAnswers, need])

  const handleChange = (index: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [index]: value }))
  }

  const isSubmitDisabled =
    disabled ||
    (need >= 1 && !answers[1]?.trim()) ||
    (need >= 2 && !answers[2]?.trim()) ||
    (need >= 3 && !answers[3]?.trim())

  const handleSubmit = () => {
    if (isSubmitDisabled) return

    const user = [answers[1], answers[2], answers[3]].slice(0, need)
    const ok =
      user.length === correctAnswers.length &&
      user.every((a, i) => normalizeAnswer(a) === normalizeAnswer(correctAnswers[i] ?? ""))

    onAnswer(user.join(", "), ok)
  }

  if (!currentSentence || !clozeSentence || correctAnswers.length < need || correctAnswers.some((x) => !x)) {
    return (
      <div>
        <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide mb-2">
          Cloze (Multiple Blanks)
        </p>
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800 mb-2">この例文は穴埋め未設定です</p>
          <p className="text-xs text-yellow-600">編集画面で Stage6 を設定してください</p>
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
        {[1, 2, 3].slice(0, need).map((index) => (
          <div key={index}>
            <label className="text-sm font-medium text-[#6B7280] mb-1 block">({index})</label>
            <input
              type="text"
              value={answers[index] ?? ""}
              onChange={(e) => handleChange(index, e.target.value)}
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
