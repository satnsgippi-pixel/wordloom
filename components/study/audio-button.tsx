"use client"

import { Volume2 } from "lucide-react"
import { useState } from "react"
import { speak } from "@/lib/tts"

interface AudioButtonProps {
  size?: "small" | "medium" | "large"
  label?: string
  text?: string
  lang?: "en-US" | "ja-JP"
}

export function AudioButton({
  size = "medium",
  label = "Play audio",
  text,
  lang = "en-US",
}: AudioButtonProps) {
  const [isPressed, setIsPressed] = useState(false)

  const sizeClasses = {
    small: "w-8 h-8",
    medium: "w-10 h-10",
    large: "w-12 h-12",
  }

  const iconSizes = {
    small: 14,
    medium: 18,
    large: 22,
  }

  return (
    <button
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      onClick={() => {
        if (!text) return
        speak(text, lang)
      }}
      aria-label={label}
      className={`${sizeClasses[size]} flex items-center justify-center rounded-full border border-[#E5E7EB] transition-colors ${
        isPressed ? "bg-[#DBEAFE]" : "bg-white hover:bg-[#F8FAFC]"
      } focus:outline-none focus:ring-2 focus:ring-[#93C5FD]`}
    >
      <Volume2 size={iconSizes[size]} className="text-[#2563EB]" strokeWidth={1.5} />
    </button>
  )
}
