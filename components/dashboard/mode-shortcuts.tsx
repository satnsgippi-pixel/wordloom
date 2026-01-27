"use client"

import Link from "next/link"
import { AiWritingCard } from "@/components/dashboard/ai-writing-card"

interface ModeShortcutsProps {
  weakWords: number
  // 既存のpropsが残っていても壊れないように残す（未使用）
  dailyPrompt?: string
  dailyDraft?: string

  // もし既に dashboard 側で challenge の有効/無効を渡しているならここを使う
  challengeEnabled?: boolean
}

export function ModeShortcuts({
  weakWords,
  challengeEnabled = false,
}: ModeShortcutsProps) {
  const hasWeakWords = weakWords > 0

  return (
    <div className="space-y-3">
      {/* Top row: 弱点復習 / 腕試し */}
      <div className="grid grid-cols-2 gap-3">
        {hasWeakWords ? (
          <Link
            href="/weakness"
            className="relative h-11 bg-white border border-[#E5E7EB] rounded-lg flex items-center justify-center text-sm font-medium text-[#111827] hover:bg-[#EFF6FF] active:bg-[#DBEAFE] transition-colors focus:outline-none focus:ring-2 focus:ring-[#93C5FD]"
          >
            弱点復習
            <span className="absolute top-1 right-1 bg-[#EFF6FF] text-[#2563EB] text-xs font-medium px-1.5 py-0.5 rounded">
              {weakWords}
            </span>
          </Link>
        ) : (
          <button
            disabled
            className="h-11 bg-white border border-[#E5E7EB] rounded-lg flex items-center justify-center text-sm font-medium text-[#111827] opacity-55 cursor-not-allowed"
          >
            弱点復習
          </button>
        )}

        {challengeEnabled ? (
          <Link
            href="/challenge"
            className="h-11 bg-white border border-[#E5E7EB] rounded-lg flex items-center justify-center text-sm font-medium text-[#111827] hover:bg-[#EFF6FF] active:bg-[#DBEAFE] transition-colors focus:outline-none focus:ring-2 focus:ring-[#93C5FD]"
          >
            腕試し
          </Link>
        ) : (
          <button
            disabled
            className="h-11 bg-white border border-[#E5E7EB] rounded-lg flex items-center justify-center text-sm font-medium text-[#111827] opacity-55 cursor-not-allowed"
          >
            腕試し
          </button>
        )}
      </div>

      {/* Bottom row: AI添削（日替わりランダム） */}
      <AiWritingCard />
    </div>
  )
}
