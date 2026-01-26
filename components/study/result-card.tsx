"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, XCircle } from "lucide-react"
import { AudioButton } from "./audio-button"
import type { WordData, SentenceData } from "@/lib/types"
import { playCorrect, playWrong } from "@/lib/sfx"

interface ResultCardProps {
  isCorrect: boolean
  correctAnswer: string
  wordData: WordData
  onNext: () => void
  isLastQuestion?: boolean

  // ✅ Normal Study: "+10 more" 用（任意）
  onMore?: () => void
  canMore?: boolean
}

export function ResultCard({
  isCorrect,
  correctAnswer,
  wordData,
  onNext,
  isLastQuestion = false,
  onMore,
  canMore = false,
}: ResultCardProps) {
  const [activeTab, setActiveTab] = useState<"examples" | "notes" | "qa">("examples")
  const [notes, setNotes] = useState("")

  useEffect(() => {
    if (isCorrect === true) playCorrect()
    if (isCorrect === false) playWrong()
  }, [isCorrect])

  const sentences: SentenceData[] = wordData.sentences ?? []

  return (
    <div className="mt-4 bg-white rounded-xl border border-[#E5E7EB] p-4 md:p-5 shadow-sm">
      {/* Result header */}
      <div className="mb-4">
        <div className="flex items-center gap-2">
          {isCorrect ? (
            <CheckCircle2 className="w-4 h-4 text-[#6B7280]" />
          ) : (
            <XCircle className="w-4 h-4 text-[#6B7280]" />
          )}
          <p className="text-base font-medium text-[#111827]">
            {isCorrect ? "Correct" : "Incorrect"}
          </p>
        </div>

        <div className="mt-2 flex items-center gap-2">
          <span className="text-lg font-semibold text-[#111827]">{correctAnswer}</span>
          <AudioButton size="small" label={`Play ${correctAnswer}`} text={correctAnswer} lang="en-US" />
        </div>

        <p className="mt-1 text-sm text-[#6B7280]">{wordData.meaning}</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#E5E7EB] mb-4">
        <div className="flex gap-6">
          {(["examples", "notes", "qa"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2 text-sm font-medium capitalize transition-colors ${
                activeTab === tab
                  ? "text-[#2563EB] border-b-2 border-[#2563EB]"
                  : "text-[#6B7280] hover:text-[#111827]"
              }`}
            >
              {tab === "qa" ? "Q&A" : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="min-h-[160px]">
        {activeTab === "examples" && (
          <div className="space-y-3">
            {sentences.length === 0 ? (
              <div className="p-3 rounded-lg bg-white border border-[#E5E7EB]">
                <p className="text-sm text-[#6B7280]">例文がありません。</p>
              </div>
            ) : (
              sentences.map((s, index) => (
                <div key={s.id ?? index} className="p-3 rounded-lg bg-white border border-[#E5E7EB]">
                  <div className="flex items-start gap-3">
                    <AudioButton
                      size="medium"
                      label={`Play sentence ${index + 1}`}
                      text={s.en}
                      lang="en-US"
                    />
                    <div className="flex-1 pt-2">
                      <p className="text-sm text-[#111827] leading-relaxed">{s.en}</p>
                      <p className="text-xs text-[#6B7280] mt-1">{s.ja}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "notes" && (
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add your notes here..."
            className="w-full h-32 p-3 text-sm text-[#111827] bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#93C5FD] focus:border-transparent placeholder:text-[#9CA3AF]"
          />
        )}

        {activeTab === "qa" && (
          <div className="text-center py-6">
            <p className="text-sm text-[#6B7280] mb-3">No questions yet</p>
            <button className="px-4 py-2 text-sm font-medium text-[#2563EB] bg-[#EFF6FF] rounded-lg hover:bg-[#DBEAFE] transition-colors min-h-[44px]">
              Add question
            </button>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="mt-6 space-y-3">
        {/* ✅ last question: Finish / +10 more */}
        {isLastQuestion ? (
          <>
            <button
              onClick={onNext}
              className="w-full py-3 text-base font-medium text-white bg-[#2563EB] rounded-lg hover:bg-[#1D4ED8] transition-colors min-h-[48px] focus:outline-none focus:ring-2 focus:ring-[#93C5FD] focus:ring-offset-2"
            >
              Finish
            </button>

            {onMore && (
              <button
                onClick={onMore}
                disabled={!canMore}
                className={`w-full py-3 text-base font-medium rounded-lg transition-colors min-h-[48px] focus:outline-none focus:ring-2 focus:ring-[#93C5FD] focus:ring-offset-2 ${
                  canMore
                    ? "text-[#111827] bg-white border border-[#E5E7EB] hover:bg-[#EFF6FF] active:bg-[#DBEAFE]"
                    : "text-[#111827] bg-white border border-[#E5E7EB] opacity-55 cursor-not-allowed"
                }`}
              >
                +10 more
              </button>
            )}

            <a
              href="/"
              className="block text-sm text-[#6B7280] hover:text-[#2563EB] underline text-center transition-colors"
            >
              Back to Home
            </a>
          </>
        ) : (
          <>
            <button
              onClick={onNext}
              className="w-full py-3 text-base font-medium text-white bg-[#2563EB] rounded-lg hover:bg-[#1D4ED8] transition-colors min-h-[48px] focus:outline-none focus:ring-2 focus:ring-[#93C5FD] focus:ring-offset-2"
            >
              Next
            </button>

            <a
              href="/"
              className="block text-sm text-[#6B7280] hover:text-[#2563EB] underline text-center transition-colors"
            >
              Back to Home
            </a>
          </>
        )}
      </div>
    </div>
  )
}
