"use client"

import Link from "next/link"

interface ModeShortcutsProps {
  weakWords: number
  challengeReady: number
  dailyPrompt?: string
  dailyDraft?: string
}

export function ModeShortcuts({
  weakWords,
  challengeReady,
  dailyPrompt,
  dailyDraft,
}: ModeShortcutsProps) {
  const hasWeakWords = weakWords > 0
  const isChallengeEnabled = challengeReady > 0

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
            title="弱点復習できる単語がありません"
          >
            弱点復習
          </button>
        )}

        {isChallengeEnabled ? (
          <Link
            href="/challenge"
            className="relative h-11 bg-white border border-[#E5E7EB] rounded-lg flex items-center justify-center text-sm font-medium text-[#111827] hover:bg-[#EFF6FF] active:bg-[#DBEAFE] transition-colors focus:outline-none focus:ring-2 focus:ring-[#93C5FD]"
          >
            腕試し
            <span className="absolute top-1 right-1 bg-[#EFF6FF] text-[#2563EB] text-xs font-medium px-1.5 py-0.5 rounded">
              {challengeReady}
            </span>
          </Link>
        ) : (
          <button
            disabled
            className="h-11 bg-white border border-[#E5E7EB] rounded-lg flex items-center justify-center text-sm font-medium text-[#111827] opacity-55 cursor-not-allowed"
            title="腕試しできる単語がまだありません（stability ≥ 12 が必要）"
          >
            腕試し
          </button>
        )}
      </div>

      {/* Bottom row: AI添削 preview card */}
      <Link
        href="/ai"
        className="block bg-white border border-[#E5E7EB] rounded-lg p-4 hover:bg-[#EFF6FF] active:bg-[#DBEAFE] transition-colors focus:outline-none focus:ring-2 focus:ring-[#93C5FD]"
      >
        {/* Title row */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-[#111827]">AI添削</h3>
          <span className="text-xs text-[#6B7280]">Today</span>
        </div>

        {/* Prompt */}
        {dailyPrompt && (
          <p className="text-sm text-[#111827] mb-3 line-clamp-1">{dailyPrompt}</p>
        )}

        {/* Draft preview */}
        <div>
          {dailyDraft ? (
            <p className="text-sm text-[#6B7280] line-clamp-2">{dailyDraft}</p>
          ) : (
            <p className="text-sm text-[#6B7280] italic">Write 1 sentence…</p>
          )}
        </div>
      </Link>
    </div>
  )
}
