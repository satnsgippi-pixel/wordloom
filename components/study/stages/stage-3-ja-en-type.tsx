"use client"

import { useState, useEffect, useMemo } from "react"
import { TextInput } from "../text-input"
import type { WordData } from "@/lib/types"

interface Stage3Props {
  wordData: WordData
  onAnswer: (answer: string, isCorrect: boolean) => void
  disabled?: boolean
}

export function Stage3JaEnType({ wordData, onAnswer, disabled }: Stage3Props) {
  const correct = wordData.word
  const [showHint, setShowHint] = useState(false)

  useEffect(() => {
    setShowHint(false)
  }, [wordData.id])

  const hintText = useMemo(() => {
    if (!correct) return ""
    return correct.split(' ').map(word => {
      let firstAlnumFound = false;
      let res = "";
      for (let i = 0; i < word.length; i++) {
          const char = word[i];
          if (/[a-zA-Z0-9]/.test(char)) {
              if (!firstAlnumFound) {
                  res += char;
                  firstAlnumFound = true;
              } else {
                  res += " _";
              }
          } else {
              res += char;
          }
      }
      return res;
    }).join('   ');
  }, [correct])

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

      <div className="mt-4 mb-4 min-h-[44px]">
        {!showHint ? (
          <button
            onClick={() => setShowHint(true)}
            disabled={disabled}
            className="flex items-center justify-center gap-1.5 px-4 min-h-[44px] text-sm font-medium text-amber-600 bg-amber-50 rounded-lg border border-amber-200 hover:bg-amber-100 transition-colors"
          >
            💡 Hint
          </button>
        ) : (
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-[#111827] font-mono whitespace-pre-wrap tracking-wider text-base">
            {hintText}
          </div>
        )}
      </div>

      <TextInput
        placeholder="Type your answer"
        onSubmit={handleSubmit}
        correctAnswer={correct}
        disabled={disabled}
      />
    </div>
  )
}
