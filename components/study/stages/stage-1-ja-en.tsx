"use client"

import { useEffect, useState } from "react"
import { MultipleChoice } from "../multiple-choice"
import type { WordData } from "../study-screen"
import { getWords, generateWordChoices } from "@/lib/words-store"

interface Stage1Props {
  wordData: WordData
  onAnswer: (answer: string, isCorrect: boolean) => void
  disabled?: boolean
}

type Choice = { label: string; isCorrect: boolean }

export function Stage1JaEn({ wordData, onAnswer, disabled }: Stage1Props) {
  const [choices, setChoices] = useState<Choice[]>([])

  useEffect(() => {
    const pool = getWords()

    const generated = generateWordChoices(wordData, pool)
    setChoices(generated)
  }, [wordData.id])

  // 4択が揃ってない場合の表示（登録語が少ない初期に起こる）
  if (choices.length < 2) {
    return (
      <div>
        <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide mb-2">JA → EN</p>
        <h2 className="text-2xl font-semibold text-[#111827]">{wordData.meaning}</h2>
        <p className="text-sm text-[#6B7280] mt-2">
          選択肢が足りません。単語をもう少し登録すると4択が作れます。
        </p>
      </div>
    )
  }

  return (
    <div>
      <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide mb-2">JA → EN</p>
      <h2 className="text-2xl font-semibold text-[#111827]">{wordData.meaning}</h2>
      <p className="text-sm text-[#6B7280] mt-1">Select the correct English word</p>
      <MultipleChoice
        options={choices}
        onSelect={(answer, isCorrect) => onAnswer(answer, isCorrect)}
        disabled={disabled}
      />
    </div>
  )
}
