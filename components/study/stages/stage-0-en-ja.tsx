"use client"

import { useEffect, useMemo, useState } from "react"
import { AudioButton } from "../audio-button"
import { MultipleChoice } from "../multiple-choice"
import type { WordData } from "../study-screen"
import { getWords, generateMeaningChoices } from "@/lib/words-store"

interface Stage0Props {
  wordData: WordData
  onAnswer: (answer: string, isCorrect: boolean) => void
  disabled?: boolean
  mode?: "normal" | "weakness" | "quiz" | "challenge"
}

export function Stage0EnJa({
  wordData,
  onAnswer,
  disabled,
  mode = "normal",
}: Stage0Props) {
  const [choices, setChoices] = useState<
    { label: string; isCorrect: boolean }[]
  >([])

  // 表示する例文をランダムに1つ選ぶ（1問中は固定）
const sentence = useMemo(() => {
  const list = wordData.sentences ?? []
  if (list.length === 0) return null

  const index = Math.floor(Math.random() * list.length)
  return list[index]
}, [wordData.id])

  // 選択肢生成
  useEffect(() => {
    const pool = getWords()

    const generated = generateMeaningChoices(wordData, pool)
    setChoices(generated)
  }, [wordData])

  return (
    <div>
      <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide mb-2">
        EN → JA
      </p>

      <div className="flex items-center gap-3">
        <h2 className="text-3xl font-semibold text-[#111827]">
          {wordData.word}
        </h2>
        <AudioButton size="small" label={`Play ${wordData.word}`} text={wordData.word} lang="en-US" />
      </div>

      {/* 例文 */}
      {sentence && (
        <div className="mt-4 p-4 bg-white rounded-lg border border-[#E5E7EB]">
          <div className="flex items-start gap-3">
            <AudioButton size="medium" label="Play sentence" text={sentence.en} lang="en-US" />
            <p className="text-base text-[#111827] leading-relaxed flex-1 pt-2">
              {sentence.en}
            </p>
          </div>
        </div>
      )}

      <p className="text-sm text-[#6B7280] mt-4">
        In this sentence, what does{" "}
        <strong>{wordData.word}</strong> mean?
      </p>

      <MultipleChoice
        options={choices}
        onSelect={onAnswer}
        disabled={disabled}
      />
    </div>
  )
}
