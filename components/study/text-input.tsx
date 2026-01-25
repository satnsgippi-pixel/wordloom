"use client"

import { useState, useEffect } from "react"
import { playCorrect, playWrong } from "@/lib/sfx"

interface TextInputProps {
  placeholder?: string
  onSubmit: (answer: string, isCorrect: boolean) => void
  correctAnswer: string
  disabled?: boolean
}

export function TextInput({ placeholder = "Type your answer", onSubmit, correctAnswer, disabled }: TextInputProps) {
  const [value, setValue] = useState("")
  const [revealed, setRevealed] = useState(false)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)

  // 次の問題に切り替わったら（correctAnswerが変わったら）状態をリセット
  useEffect(() => {
    setValue("")
    setRevealed(false)
    setIsCorrect(null)
  }, [correctAnswer])

  const normalizeAnswer = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, "")
  }

  const handleSubmit = () => {
    // 連打防止：回答済みまたはdisabledの場合は処理しない
    if (!value.trim() || disabled || revealed) return

    const correct = normalizeAnswer(value) === normalizeAnswer(correctAnswer)
    
    // 状態を更新
    setRevealed(true)
    setIsCorrect(correct)

    // 効果音を再生
    if (correct) {
      playCorrect()
    } else {
      playWrong()
    }

    // 親コンポーネントに通知
    onSubmit(value, correct)
  }

  // 入力欄のスタイルを決定
  let borderColor = "border-[#E5E7EB]"
  let bgColor = "bg-white"

  if (revealed) {
    if (isCorrect) {
      borderColor = "border-[#86EFAC]"
      bgColor = "bg-white"
    } else {
      borderColor = "border-[#FDA4AF]"
      bgColor = "bg-white"
    }
  }

  return (
    <div className="mt-6 space-y-3">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        disabled={disabled || revealed}
        className={`w-full px-4 py-3 text-base text-[#111827] ${bgColor} border ${borderColor} rounded-lg min-h-[48px] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#93C5FD] focus:border-transparent transition-colors ${
          disabled || revealed ? "opacity-60 cursor-not-allowed" : ""
        }`}
      />
      <button
        onClick={handleSubmit}
        disabled={disabled || !value.trim() || revealed}
        className={`w-full py-3 text-base font-medium rounded-lg min-h-[48px] transition-colors ${
          disabled || !value.trim() || revealed
            ? "bg-[#E5E7EB] text-[#9CA3AF] cursor-not-allowed"
            : "bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
        } focus:outline-none focus:ring-2 focus:ring-[#93C5FD] focus:ring-offset-2`}
      >
        Check
      </button>
    </div>
  )
}
