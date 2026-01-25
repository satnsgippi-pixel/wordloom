"use client"

import { useState } from "react"
import { playCorrect, playWrong } from "@/lib/sfx"

interface MultipleChoiceProps {
  options: { label: string; isCorrect: boolean }[]
  onSelect: (answer: string, isCorrect: boolean) => void
  disabled?: boolean
}

export function MultipleChoice({ options, onSelect, disabled }: MultipleChoiceProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const [revealed, setRevealed] = useState(false)

  const handleSelect = (option: { label: string; isCorrect: boolean }) => {
    // 連打防止：回答済みまたはdisabledの場合は処理しない
    if (revealed || disabled) return

    setSelected(option.label)
    setRevealed(true)

    // 効果音を再生
    if (option.isCorrect) {
      playCorrect()
    } else {
      playWrong()
    }

    // 親コンポーネントに通知
    onSelect(option.label, option.isCorrect)
  }

  return (
    <div className="space-y-3 mt-6">
      {options.map((option, index) => {
        // スタイル判定
        let borderColor = "border-[#E5E7EB]"
        let bgColor = "bg-white"
        let hoverClass = revealed ? "" : "hover:bg-[#F8FAFC]"

        if (revealed) {
          // 回答済み：正誤フィードバックを表示
          if (option.isCorrect) {
            // 正解の選択肢は緑
            borderColor = "border-[#86EFAC]"
            bgColor = "bg-[#F0FDF4]"
          } else if (selected === option.label && !option.isCorrect) {
            // 選択した不正解は赤
            borderColor = "border-[#FDA4AF]"
            bgColor = "bg-[#FFF1F2]"
          }
        } else if (selected === option.label) {
          // 選択中（まだrevealedでない場合、通常は発生しないが念のため）
          borderColor = "border-[#93C5FD]"
          bgColor = "bg-[#DBEAFE]"
        }

        return (
          <button
            key={index}
            onClick={() => handleSelect(option)}
            disabled={disabled || revealed}
            className={`w-full py-3 px-4 text-left text-base rounded-lg border transition-colors min-h-[52px] ${borderColor} ${bgColor} text-[#111827] ${hoverClass} ${
              disabled || revealed ? "opacity-60 cursor-not-allowed" : ""
            } focus:outline-none focus:ring-2 focus:ring-[#93C5FD]`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
