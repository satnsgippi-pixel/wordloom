"use client"

import { TextInput } from "../text-input"
import type { WordData } from "../study-screen"

interface Stage3Props {
  wordData: WordData
  onAnswer: (answer: string, isCorrect: boolean) => void
  disabled?: boolean
}

export function Stage3JaEnType({ wordData, onAnswer, disabled }: Stage3Props) {
  const correct = wordData.word

  const handleSubmit = (answer: string) => {
    // 方針：前後スペースのみ無視。それ以外（大小文字、句読点、アポストロフィ等）は厳密一致
    const isCorrect = answer.trim() === correct
    onAnswer(answer, isCorrect)
  }

  return (
    <div>
      <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide mb-2">
        JA → EN (Type)
      </p>

      <h2 className="text-2xl font-semibold text-[#111827]">{wordData.meaning}</h2>

      <p className="text-sm text-[#6B7280] mt-1">Type the English word</p>

      <TextInput
        placeholder="Type your answer"
        onSubmit={handleSubmit}
        correctAnswer={correct}
        disabled={disabled}
      />
    </div>
  )
}
