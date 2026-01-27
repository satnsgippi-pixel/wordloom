"use client"

import { useEffect, useState } from "react"
import { AudioButton } from "../audio-button"
import { MultipleChoice } from "../multiple-choice"
import type { WordData } from "@/lib/types"
import { getWords, generateWordChoices } from "@/lib/words-store"

interface Stage4Props {
  wordData: WordData
  onAnswer: (answer: string, isCorrect: boolean) => void
  disabled?: boolean
}

type Choice = { label: string; isCorrect: boolean }

export function Stage4Definition({ wordData, onAnswer, disabled }: Stage4Props) {
  const [choices, setChoices] = useState<Choice[]>([])

  useEffect(() => {
    const pool = getWords()

    // Definitionを見て、英単語/フレーズを4択にする
    const generated = generateWordChoices(wordData, pool)

    // 登録語が少なくて選択肢が不足するケースの保険
    if (generated.length === 0) {
      setChoices([{ label: wordData.word, isCorrect: true }])
    } else {
      setChoices(generated)
    }
  }, [wordData.id])

  return (
    <div>
      <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide mb-2">
        Definition → EN
      </p>

      <div className="p-4 bg-[#F8FAFC] rounded-lg border border-[#E5E7EB] mb-3">
        <div className="flex items-start gap-3">
          <AudioButton size="medium" label="Play definition" text={wordData.definition} lang="en-US" />
          <p className="text-base text-[#111827] leading-relaxed flex-1 pt-2">
            {wordData.definition}
          </p>
        </div>
      </div>

      <p className="text-sm text-[#6B7280] mt-1">
        Select the English word/phrase that matches this definition
      </p>

      <MultipleChoice options={choices} onSelect={onAnswer} disabled={disabled} />
    </div>
  )
}
