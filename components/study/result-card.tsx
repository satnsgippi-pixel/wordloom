"use client"

import { useEffect, useMemo, useState } from "react"
import { CheckCircle2, XCircle } from "lucide-react"
import { AudioButton } from "./audio-button"
import type { WordData, SentenceData } from "@/lib/types"
import { playCorrect, playWrong } from "@/lib/sfx"
import { QAPanel } from "@/components/shared/qa-panel"

const WORD_QA_GPT_URL =
  "https://chatgpt.com/g/g-6978a7ff1f948191a23d1fe42441feee-ying-yu-huresushen-jue-ri-q-a"

interface ResultCardProps {
  isCorrect: boolean
  correctAnswer: string
  wordData: WordData
  onNext: () => void
  isLastQuestion?: boolean
}

export function ResultCard({
  isCorrect,
  correctAnswer,
  wordData,
  onNext,
  isLastQuestion = false,
}: ResultCardProps) {
  const [activeTab, setActiveTab] = useState<"examples" | "qa">("examples")

  useEffect(() => {
    if (isCorrect === true) playCorrect()
    if (isCorrect === false) playWrong()
  }, [isCorrect])

  // 問題が切り替わったらタブを戻す（地味に重要）
  useEffect(() => {
    setActiveTab("examples")
  }, [wordData.id])

  const sentences: SentenceData[] = useMemo(
    () => (wordData.sentences ?? []).slice(0, 2),
    [wordData]
  )

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
          <AudioButton
            size="small"
            label={`Play ${correctAnswer}`}
            text={correctAnswer}
            lang="en-US"
          />
        </div>

        <p className="mt-1 text-sm text-[#6B7280]">{wordData.meaning}</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#E5E7EB] mb-4">
        <div className="flex gap-6">
          {(["examples", "qa"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2 text-sm font-medium capitalize transition-colors ${
                activeTab === tab
                  ? "text-[#2563EB] border-b-2 border-[#2563EB]"
                  : "text-[#6B7280] hover:text-[#111827]"
              }`}
            >
              {tab === "qa" ? "Q&A" : "Examples"}
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
                <div
                  key={s.id ?? index}
                  className="p-3 rounded-lg bg-white border border-[#E5E7EB]"
                >
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

        {activeTab === "qa" && (
          <QAPanel
            wordId={wordData.id}
            word={wordData.word}
            meaning={wordData.meaning}
            gptUrl={WORD_QA_GPT_URL}
          />
        )}
      </div>

      {/* Action buttons */}
      <div className="mt-6 space-y-3">
        <button
          onClick={onNext}
          className="w-full py-3 text-base font-medium text-white bg-[#2563EB] rounded-lg hover:bg-[#1D4ED8] transition-colors min-h-[48px] focus:outline-none focus:ring-2 focus:ring-[#93C5FD] focus:ring-offset-2"
        >
          {isLastQuestion ? "Finish" : "Next"}
        </button>

        {!isLastQuestion && (
          <a
            href="/"
            className="block text-sm text-[#6B7280] hover:text-[#2563EB] underline text-center transition-colors"
          >
            Back to Home
          </a>
        )}
      </div>
    </div>
  )
}
