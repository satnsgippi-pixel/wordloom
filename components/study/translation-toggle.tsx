"use client"

import { useState } from "react"

interface TranslationToggleProps {
  translation: string
}

export function TranslationToggle({ translation }: TranslationToggleProps) {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <div className="mt-4">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="text-sm font-medium text-[#2563EB] hover:text-[#1D4ED8] transition-colors min-h-[44px] px-1"
      >
        {isVisible ? "Hide translation" : "Show translation"}
      </button>
      {isVisible && (
        <div className="mt-2 p-3 bg-[#EFF6FF] rounded-lg">
          <p className="text-sm text-[#111827] leading-relaxed">{translation}</p>
        </div>
      )}
    </div>
  )
}
